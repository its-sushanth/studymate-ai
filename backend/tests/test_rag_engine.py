import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import rag_engine as rag_engine_module  # noqa: E402
from rag_engine import (  # noqa: E402
    EmbeddingConfigurationError,
    EmbeddingGenerationError,
    RAGEngine,
)


class RAGEngineVectorSearchTests(unittest.TestCase):
    def setUp(self):
        self.engine = RAGEngine()

    def add_text_document(self, doc_id, text, name=None):
        return self.engine.add_document(
            doc_id,
            name or f"{doc_id}.txt",
            text.encode("utf-8")
        )

    def test_upload_creates_faiss_index_with_chunk_metadata(self):
        result = self.add_text_document(
            "cats",
            "Domestic cats are small carnivorous mammals often kept as household companions."
        )

        self.assertEqual(result["status"], "ready")
        self.assertGreater(result["chunk_count"], 0)
        self.assertEqual(self.engine.document_indexes["cats"].ntotal, result["chunk_count"])
        chunk = self.engine.documents["cats"]["chunks"][0]
        self.assertEqual(chunk.doc_id, "cats")
        self.assertEqual(chunk.page_number, 1)
        self.assertEqual(chunk.doc_name, "cats.txt")

    def test_fastapi_upload_endpoint_builds_document_index(self):
        from fastapi.testclient import TestClient
        from main import app, rag_engine

        with TestClient(app) as client:
            with patch.dict(os.environ, {"API_KEY": "health-test-secret"}):
                health_response = client.get("/healthz")
            self.assertEqual(health_response.status_code, 200)
            self.assertTrue(health_response.json()["api_configured"])
            self.assertNotIn("health-test-secret", health_response.text)

            response = client.post(
                "/api/upload",
                files={
                    "file": (
                        "uploaded.txt",
                        b"Neural networks learn patterns from labeled training examples.",
                        "text/plain"
                    )
                }
            )

        self.assertEqual(response.status_code, 200, response.text)
        doc_id = response.json()["id"]
        self.assertIn(doc_id, rag_engine.document_indexes)
        self.assertGreater(rag_engine.document_indexes[doc_id].ntotal, 0)

    def test_cors_is_restricted_to_explicit_and_local_origins(self):
        from fastapi.middleware.cors import CORSMiddleware
        from main import app

        cors = next(middleware for middleware in app.user_middleware if middleware.cls is CORSMiddleware)
        allowed_origins = cors.kwargs["allow_origins"]

        self.assertIn("http://localhost:5173", allowed_origins)
        self.assertIn("http://127.0.0.1:5173", allowed_origins)
        self.assertNotIn("*", allowed_origins)

    def test_vector_retrieval_handles_paraphrased_queries(self):
        self.add_text_document(
            "cats",
            "Domestic cats are small carnivorous mammals often kept as household companions."
        )
        self.add_text_document(
            "sorting",
            "Bubble sort repeatedly compares adjacent values and swaps them into order."
        )

        results = self.engine.retrieve("feline pets kept at home", top_k=2)

        self.assertTrue(results)
        self.assertEqual(results[0][0].doc_id, "cats")

    def test_document_filter_prevents_cross_document_results(self):
        self.add_text_document(
            "physics",
            "Quantum entanglement correlates measurement outcomes between distant particles."
        )
        self.add_text_document(
            "biology",
            "Domestic cats are small carnivorous mammals kept as household companions."
        )

        results = self.engine.retrieve("feline companions", doc_id="physics", top_k=5)

        self.assertTrue(results)
        self.assertTrue(all(chunk.doc_id == "physics" for chunk, _ in results))
        self.assertEqual(self.engine.retrieve("feline companions", doc_id="missing"), [])

    def test_program_two_retrieval_uses_ordinal_and_section_boundaries(self):
        self.add_text_document(
            "programs",
            "Program 1: Bubble Sort\n"
            "This program orders values by repeatedly comparing adjacent items.\n\n"
            "Program 2: Dijkstra Shortest Path\n"
            "This program computes the shortest paths from a source vertex in a weighted graph."
        )

        results = self.engine.retrieve(
            "Explain the second program line by line",
            doc_id="programs",
            top_k=3
        )

        self.assertTrue(results)
        self.assertTrue(all(
            self.engine._chunk_program_number(chunk) == 2
            for chunk, _ in results
        ))

    def test_chat_uses_program_two_context_and_preserves_citation(self):
        self.add_text_document(
            "programs",
            "Program 1: Bubble Sort\n"
            "def bubble_sort(values):\n    return sorted(values)\n\n"
            "Program 2: Dijkstra Shortest Path\n"
            "def dijkstra(graph, start):\n    distances = {start: 0}\n    return distances"
        )

        with patch.dict(os.environ, {"API_KEY": "test-key"}):
            with patch.object(
                self.engine,
                "_generate_ai_text",
                return_value="Program 2 explanation"
            ) as generate:
                response = self.engine.generate_chat_response(
                    "Explain the second program line by line",
                    doc_id="programs"
                )

        self.assertEqual(response["answer"], "Program 2 explanation")
        self.assertEqual(response["citations"][0]["section"], "Program 2: Dijkstra Shortest Path")
        prompt = generate.call_args.args[1]
        self.assertIn("def dijkstra", prompt)
        self.assertNotIn("def bubble_sort", prompt)

    def test_summary_workflow_uses_uploaded_document_text(self):
        self.add_text_document(
            "summary",
            "Photosynthesis converts light energy into chemical energy in plants."
        )

        with patch.dict(os.environ, {"API_KEY": "test-key"}):
            with patch.object(
                self.engine,
                "_generate_ai_text",
                return_value="Detailed summary of photosynthesis"
            ) as generate:
                response = self.engine.generate_summary("summary", length="detailed")

        self.assertIn("Detailed summary of photosynthesis", response["summary_text"])
        self.assertIn("Photosynthesis converts light energy", generate.call_args.args[1])

    def test_removing_document_removes_its_index_and_chunks(self):
        self.add_text_document("keep", "Neural networks learn patterns from training data.")
        self.add_text_document("remove", "Ocean currents transport heat through the climate system.")

        self.assertTrue(self.engine.remove_document("remove"))

        self.assertNotIn("remove", self.engine.document_indexes)
        self.assertNotIn("remove", self.engine.documents)
        self.assertTrue(all(chunk.doc_id != "remove" for chunk in self.engine.all_chunks))
        self.assertEqual(self.engine.document_indexes["keep"].ntotal, len(self.engine.documents["keep"]["chunks"]))

    def test_failed_embedding_does_not_add_partial_document(self):
        with patch.object(
            self.engine,
            "_build_document_index",
            side_effect=EmbeddingGenerationError("embedding failed")
        ):
            with self.assertRaises(EmbeddingGenerationError):
                self.add_text_document("failed", "This document cannot be indexed.")

        self.assertNotIn("failed", self.engine.documents)
        self.assertNotIn("failed", self.engine.document_indexes)

    def test_missing_faiss_dependency_has_clear_error(self):
        with patch.object(rag_engine_module, "faiss", None):
            with self.assertRaisesRegex(EmbeddingConfigurationError, "FAISS and NumPy"):
                self.engine.add_document(
                    "unavailable",
                    "unavailable.txt",
                    b"Vector dependencies must be installed."
                )

        self.assertNotIn("unavailable", self.engine.documents)

    def test_empty_document_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "empty"):
            self.engine.add_document("empty", "empty.txt", b" \n\t")


if __name__ == "__main__":
    unittest.main()
