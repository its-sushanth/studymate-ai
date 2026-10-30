import os
import re
import math
import json
import time
import threading
from typing import List, Dict, Any, Optional, Tuple

try:
    import faiss
    import numpy as np
except (ImportError, OSError) as error:
    faiss = None
    np = None
    FAISS_IMPORT_ERROR = error
else:
    FAISS_IMPORT_ERROR = None

try:
    from sentence_transformers import SentenceTransformer
except ImportError as error:
    SentenceTransformer = None
    SENTENCE_TRANSFORMERS_IMPORT_ERROR = error
else:
    SENTENCE_TRANSFORMERS_IMPORT_ERROR = None

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

try:
    import fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False

try:
    from google import genai
    from google.genai import types as genai_types
    GOOGLE_GENAI_AVAILABLE = True
except ImportError:
    GOOGLE_GENAI_AVAILABLE = False

AI_PROVIDER = os.environ.get("AI_PROVIDER", "openrouter").strip().lower()
AI_MODEL = os.environ.get("AI_MODEL", "openai/gpt-4o-mini").strip()
EMBEDDING_MODEL = os.environ.get(
    "EMBEDDING_MODEL",
    "sentence-transformers/all-MiniLM-L6-v2"
).strip()
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
AI_REQUEST_TIMEOUT_SECONDS = 180
AI_MAX_OUTPUT_TOKENS = 16_384
AI_LONG_FORM_MAX_OUTPUT_TOKENS = 16_384
DETAILED_SUMMARY_SEGMENT_CHARS = 24_000
AI_TRANSIENT_RETRIES = 2
EMBEDDING_CHUNK_MAX_WORDS = 160
EMBEDDING_CHUNK_OVERLAP_WORDS = 25

_embedding_model = None
_embedding_model_lock = threading.RLock()


class AIConfigurationError(RuntimeError):
    pass


class IncompleteAIResponseError(RuntimeError):
    pass


class EmbeddingConfigurationError(RuntimeError):
    pass


class EmbeddingGenerationError(RuntimeError):
    pass


def _require_api_key() -> str:
    api_key = os.environ.get("API_KEY", "").strip()
    if not api_key:
        raise AIConfigurationError(
            "API_KEY is not configured in backend/.env. Add your provider key to enable AI requests."
        )
    if AI_PROVIDER not in {"openrouter", "gemini"}:
        raise AIConfigurationError(
            f"Unsupported AI_PROVIDER '{AI_PROVIDER}'. Set AI_PROVIDER to 'openrouter' or 'gemini'."
        )
    if not AI_MODEL:
        raise AIConfigurationError("AI_MODEL is empty. Configure a model in backend/.env.")
    return api_key


class DocumentChunk:
    def __init__(
        self,
        chunk_id: str,
        doc_id: str,
        doc_name: str,
        page_number: int,
        text: str,
        section_title: Optional[str] = None
    ):
        self.chunk_id = chunk_id
        self.doc_id = doc_id
        self.doc_name = doc_name
        self.page_number = page_number
        self.text = text
        self.section_title = section_title or ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "chunk_id": self.chunk_id,
            "doc_id": self.doc_id,
            "doc_name": self.doc_name,
            "page_number": self.page_number,
            "text": self.text,
            "section_title": self.section_title
        }


class RAGEngine:
    def __init__(self):
        # In-memory document storage: doc_id -> metadata, extracted text, chunks, and vector index.
        self.documents: Dict[str, Dict[str, Any]] = {}
        # Flat metadata view used by existing document and search workflows.
        self.all_chunks: List[DocumentChunk] = []
        self.document_indexes: Dict[str, Any] = {}
        self._index_lock = threading.RLock()

    def extract_text(self, file_bytes: bytes, filename: str) -> Tuple[List[Dict[str, Any]], str, bool]:
        """
        Extract text page by page from PDF or TXT.
        Returns: (pages_list, combined_text, is_scanned_pdf)
        """
        ext = filename.split(".")[-1].lower() if "." in filename else ""
        pages = []
        combined_text = ""
        is_scanned = False

        if ext == "pdf":
            if not PYMUPDF_AVAILABLE:
                raise RuntimeError("PyMuPDF (fitz) is not installed on the system.")
            
            try:
                doc = fitz.open(stream=file_bytes, filetype="pdf")
                total_chars = 0
                for page_idx in range(len(doc)):
                    page = doc[page_idx]
                    page_text = page.get_text() or ""
                    cleaned = page_text.strip()
                    total_chars += len(cleaned)
                    pages.append({
                        "page_number": page_idx + 1,
                        "text": cleaned
                    })
                    combined_text += f"\n--- Page {page_idx + 1} ---\n" + cleaned

                doc.close()

                # Detect scanned / image-only PDFs
                if len(pages) > 0 and total_chars < 30:
                    is_scanned = True
            except Exception as e:
                raise ValueError(f"Failed to parse PDF file '{filename}': {str(e)}")

        elif ext in ["txt", "md", "csv", "py", "java", "c", "cpp", "json"]:
            try:
                text_content = file_bytes.decode("utf-8")
            except UnicodeDecodeError:
                text_content = file_bytes.decode("latin-1", errors="replace")

            cleaned = text_content.strip()
            pages.append({
                "page_number": 1,
                "text": cleaned
            })
            combined_text = cleaned

        elif ext in ["docx", "doc"]:
            # Fallback text decoding for DOCX XML streams if python-docx isn't present
            try:
                import docx
                import io
                doc = docx.Document(io.BytesIO(file_bytes))
                full_text = "\n".join([p.text for p in doc.paragraphs if p.text])
                pages.append({"page_number": 1, "text": full_text})
                combined_text = full_text
            except Exception:
                # Basic string extraction from docx/plain text
                try:
                    text_content = file_bytes.decode("utf-8", errors="ignore")
                    cleaned = re.sub(r'[^\x20-\x7E\n\r\t]', ' ', text_content)
                    pages.append({"page_number": 1, "text": cleaned[:20000]})
                    combined_text = cleaned[:20000]
                except Exception as e:
                    raise ValueError(f"Could not read DOCX file '{filename}': {str(e)}")
        else:
            raise ValueError(f"Unsupported file format '{ext}'. StudyMate AI supports PDF, TXT, and DOCX.")

        if not combined_text.strip() and not is_scanned:
            raise ValueError(f"Document '{filename}' is empty (0 text extracted).")

        return pages, combined_text, is_scanned

    def chunk_document(self, doc_id: str, doc_name: str, pages: List[Dict[str, Any]]) -> List[DocumentChunk]:
        """
        Creates embedding-sized chunks while preserving document sections and page metadata.
        """
        chunks: List[DocumentChunk] = []
        chunk_idx = 1

        for page in pages:
            page_num = page["page_number"]
            page_text = page["text"]
            if not page_text:
                continue

            # Check if page has structured program/problem markers
            # Matches: "Program 1", "Program 2", "1.", "Problem 2:", "Experiment 2"
            pattern = re.compile(
                r'(?=(?:^|\n)(?:Program\s*\d+|Experiment\s*\d+|Problem\s*\d+|Question\s*\d+|\d+\.\s+[A-Z]))',
                re.IGNORECASE
            )
            splits = pattern.split(page_text)

            sections = splits if len(splits) > 1 else [page_text]
            for section in sections:
                section_text = section.strip()
                if not section_text:
                    continue
                title = section_text.splitlines()[0][:80]
                words = section_text.split()
                start = 0
                while start < len(words):
                    end = min(start + EMBEDDING_CHUNK_MAX_WORDS, len(words))
                    chunks.append(DocumentChunk(
                        chunk_id=f"{doc_id}-chunk-{chunk_idx}",
                        doc_id=doc_id,
                        doc_name=doc_name,
                        page_number=page_num,
                        text=" ".join(words[start:end]),
                        section_title=title
                    ))
                    chunk_idx += 1
                    if end == len(words):
                        break
                    start = end - EMBEDDING_CHUNK_OVERLAP_WORDS

        return chunks

    @staticmethod
    def _get_embedding_model():
        global _embedding_model
        if faiss is None or np is None:
            raise EmbeddingConfigurationError(
                "FAISS and NumPy are required for vector search. Install backend requirements."
            ) from FAISS_IMPORT_ERROR
        if SentenceTransformer is None:
            raise EmbeddingConfigurationError(
                "sentence-transformers is required for vector search. Install backend requirements."
            ) from SENTENCE_TRANSFORMERS_IMPORT_ERROR
        if not EMBEDDING_MODEL:
            raise EmbeddingConfigurationError("EMBEDDING_MODEL is empty.")

        with _embedding_model_lock:
            if _embedding_model is None:
                try:
                    _embedding_model = SentenceTransformer(EMBEDDING_MODEL, device="cpu")
                except Exception as error:
                    raise EmbeddingConfigurationError(
                        f"Could not load embedding model '{EMBEDDING_MODEL}'. "
                        "Check the model name, network access, and local model cache."
                    ) from error
            return _embedding_model

    def _encode_texts(self, texts: List[str]):
        if not texts:
            raise EmbeddingGenerationError("Cannot generate embeddings for empty text.")

        model = self._get_embedding_model()
        try:
            with _embedding_model_lock:
                vectors = model.encode(
                    texts,
                    batch_size=32,
                    convert_to_numpy=True,
                    normalize_embeddings=True,
                    show_progress_bar=False
                )
            vectors = np.asarray(vectors, dtype=np.float32)
            if vectors.ndim == 1:
                vectors = vectors.reshape(1, -1)
            if (
                vectors.shape[0] != len(texts)
                or vectors.shape[1] == 0
                or not np.isfinite(vectors).all()
            ):
                raise ValueError("The embedding model returned invalid vector dimensions or values.")
            return np.ascontiguousarray(vectors, dtype=np.float32)
        except Exception as error:
            raise EmbeddingGenerationError(
                "Embedding generation failed; the document was not added to the index."
            ) from error

    def _build_document_index(self, chunks: List[DocumentChunk]):
        if not chunks:
            return None

        vectors = self._encode_texts([chunk.text for chunk in chunks])
        index = faiss.IndexFlatIP(vectors.shape[1])
        index.add(vectors)
        if index.ntotal != len(chunks):
            raise EmbeddingGenerationError(
                "FAISS indexed a different number of chunks than were embedded."
            )
        return index

    def add_document(self, doc_id: str, doc_name: str, file_bytes: bytes) -> Dict[str, Any]:
        """
        Process, extract, embed, and index a new document in FAISS.
        """
        pages, combined_text, is_scanned = self.extract_text(file_bytes, doc_name)
        chunks = self.chunk_document(doc_id, doc_name, pages)
        vector_index = self._build_document_index(chunks)

        words_count = len(combined_text.split())
        doc_entry = {
            "id": doc_id,
            "name": doc_name,
            "page_count": len(pages),
            "word_count": words_count,
            "is_scanned": is_scanned,
            "status": "ready" if not is_scanned else "scanned_limitation",
            "pages": pages,
            "combined_text": combined_text,
            "chunks": chunks,
            "vector_index": vector_index
        }

        # Commit document content and its matching index together only after embedding succeeds.
        with self._index_lock:
            self.documents[doc_id] = doc_entry
            self.rebuild_index()

        return {
            "id": doc_id,
            "name": doc_name,
            "page_count": len(pages),
            "word_count": words_count,
            "chunk_count": len(chunks),
            "is_scanned": is_scanned,
            "status": "ready" if not is_scanned else "scanned_limitation"
        }

    def remove_document(self, doc_id: str) -> bool:
        with self._index_lock:
            if doc_id in self.documents:
                del self.documents[doc_id]
                self.rebuild_index()
                return True
            return False

    def rebuild_index(self):
        with self._index_lock:
            self.all_chunks = []
            self.document_indexes = {}
            for doc_id, doc in self.documents.items():
                self.all_chunks.extend(doc["chunks"])
                if doc["vector_index"] is not None:
                    self.document_indexes[doc_id] = doc["vector_index"]

    def retrieve(self, query: str, doc_id: Optional[str] = None, top_k: int = 4) -> List[Tuple[DocumentChunk, float]]:
        """
        FAISS cosine-similarity retrieval with lexical and ordinal-aware ranking.
        """
        if not query or not query.strip() or top_k <= 0:
            return []

        with self._index_lock:
            if doc_id and doc_id != "ALL":
                if doc_id not in self.documents:
                    return []
                candidate_doc_ids = [doc_id]
            else:
                candidate_doc_ids = list(self.documents)
            candidate_indexes = [
                (
                    self.document_indexes.get(candidate_id),
                    self.documents[candidate_id]["chunks"]
                )
                for candidate_id in candidate_doc_ids
                if self.document_indexes.get(candidate_id) is not None
            ]

        if not candidate_indexes:
            return []

        query_vector = self._encode_texts([query.strip()])
        q_lower = query.lower()
        target_number = self._requested_program_number(query)

        query_terms = set(re.findall(r'\w+', q_lower))
        stop_words = {"what", "is", "the", "in", "a", "an", "and", "or", "of", "to", "for", "my", "me", "explain", "describe", "show"}
        clean_terms = [t for t in query_terms if t not in stop_words and len(t) > 1]

        scored_chunks: List[Tuple[DocumentChunk, float]] = []

        for index, chunks in candidate_indexes:
            similarities, chunk_indices = index.search(query_vector, index.ntotal)

            matching_program_indices = set()
            if target_number is not None:
                matching_program_indices = {
                    chunk_index
                    for chunk_index, chunk in enumerate(chunks)
                    if self._chunk_program_number(chunk) == target_number
                }

            for similarity, chunk_index in zip(similarities[0], chunk_indices[0]):
                if chunk_index < 0:
                    continue
                if matching_program_indices and int(chunk_index) not in matching_program_indices:
                    continue

                chunk = chunks[int(chunk_index)]
                chunk_lower = chunk.text.lower()
                lexical_score = 0.0
                for term in clean_terms:
                    count = chunk_lower.count(term)
                    if count > 0:
                        lexical_score += 1.0 + math.log(count)
                    if chunk.section_title and term in chunk.section_title.lower():
                        lexical_score += 3.0

                lexical_relevance = min(
                    1.0,
                    lexical_score / max(1.0, len(clean_terms) * 2.0)
                )
                score = (
                    0.8 * max(0.0, min(1.0, float(similarity)))
                    + 0.2 * lexical_relevance
                )
                if target_number is not None and int(chunk_index) in matching_program_indices:
                    score = max(score, 1.0)
                scored_chunks.append((chunk, score))

        scored_chunks.sort(key=lambda x: x[1], reverse=True)
        return scored_chunks[:top_k]

    @staticmethod
    def _chunk_program_number(chunk: DocumentChunk) -> Optional[int]:
        match = re.match(
            r"^\s*(?:program|experiment|problem|question)\s*(\d+)\b",
            chunk.section_title,
            re.IGNORECASE
        )
        return int(match.group(1)) if match else None

    def generate_chat_response(
        self,
        query: str,
        doc_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Retrieves grounded context and generates a response with the configured AI provider.
        """
        api_key = _require_api_key()
        retrieved = self.retrieve(query, doc_id=doc_id, top_k=3)
        
        citations = []
        for chunk, score in retrieved:
            citations.append({
                "doc_name": chunk.doc_name,
                "page": f"Page {chunk.page_number}",
                "section": chunk.section_title or "General Excerpt",
                "score": round(score, 2)
            })

        is_program_explanation = bool(re.search(
            r'\b(?:program|source code|code|implementation|line[\s-]*by[\s-]*line)\b',
            query,
            re.IGNORECASE
        ))
        program_number = self._requested_program_number(query) if is_program_explanation else None
        document = self.documents.get(doc_id) if doc_id and doc_id != "ALL" else None
        program_section = (
            self._extract_program_section(document, program_number)
            if document and program_number is not None
            else None
        )

        if program_section:
            program_text, program_title, program_pages = program_section
            combined_context = (
                f"[Source: {document['name']}, Pages "
                f"{', '.join(str(page) for page in program_pages)}, Section: {program_title}]\n"
                f"{program_text}"
            )
            citations = [
                {
                    "doc_name": document["name"],
                    "page": f"Page {page}",
                    "section": program_title,
                    "score": round(retrieved[0][1], 2)
                }
                for page in program_pages
            ]
        else:
            context_chunks = retrieved[:1] if is_program_explanation else retrieved
            combined_context = "\n\n---\n\n".join([
                f"[Source: {c.doc_name}, Page {c.page_number}, Section: {c.section_title}]\n{c.text}"
                for c, _ in context_chunks
            ])

        # Check if query is completely unrelated to course documents
        # (e.g. asking for unrelated recipes, movies, etc.)
        if not retrieved or max([s for _, s in retrieved], default=0) < 0.2:
            return {
                "answer": "The requested topic was not found in your uploaded course materials. Please upload the relevant document or specify which document to reference.",
                "citations": [],
                "grounded": False
            }

        system_instruction = (
            "You are StudyMate AI, an expert academic tutor. "
            "Use strictly the provided Context from the student's uploaded course documents to answer the question. "
            "When explaining a specific program, use the matching complete program section only. If source code is present, reproduce its original code exactly in a fenced code block, then explain every nonblank source line in order, including its syntax, purpose, and effect. Do not invent, rewrite, omit, or substitute source lines. If the document contains only a prose description and no source code, say so explicitly and explain the available steps in order instead. Finish with the program's overall logic and execution flow. "
            "Cite the document name and page number. "
            "If the answer cannot be determined from the provided context, state clearly: "
            "'The requested information could not be found in the uploaded document.'"
        )
        prompt = (
            f"Context from the selected document (complete matching program section when applicable):\n"
            f"{combined_context}\n\nStudent Question:\n{query}"
        )
        answer_text = self._generate_ai_text(
            api_key,
            prompt,
            system_instruction=system_instruction,
            temperature=0.2,
            max_output_tokens=(
                AI_LONG_FORM_MAX_OUTPUT_TOKENS
                if is_program_explanation
                else AI_MAX_OUTPUT_TOKENS
            )
        )
        return {
            "answer": answer_text,
            "citations": citations,
            "grounded": True
        }

    def generate_summary(
        self,
        doc_id: str,
        length: str = "medium"
    ) -> Dict[str, Any]:
        """
        Summarizes the selected uploaded document using real text content.
        """
        api_key = _require_api_key()
        if doc_id not in self.documents:
            raise ValueError(f"Document ID '{doc_id}' not found.")

        doc = self.documents[doc_id]
        if doc["is_scanned"]:
            raise ValueError("Cannot summarize scanned image-only PDF without OCR processing.")

        text = doc["combined_text"]
        if not text.strip():
            raise ValueError("Document has no readable text content.")

        if length == "detailed":
            return self._generate_detailed_summary(doc, api_key)

        prompt = (
            f"Generate a {length} academic summary for the following text from document '{doc['name']}':\n\n"
            f"{text[:12000]}\n\n"
            "Format with: Executive Summary, Key Concepts & Definitions, and High-Yield Exam Checklist."
        )
        summary_text = self._generate_ai_text(
            api_key,
            prompt,
            max_output_tokens=AI_MAX_OUTPUT_TOKENS
        )
        return {
            "doc_id": doc_id,
            "doc_name": doc["name"],
            "summary_text": summary_text,
            "word_count": doc["word_count"]
        }

    def _generate_detailed_summary(self, doc: Dict[str, Any], api_key: str) -> Dict[str, Any]:
        source_sections = [
            f"[Page {page['page_number']}]\n{page['text']}"
            for page in doc["pages"]
            if page["text"].strip()
        ]
        segments = []
        current = ""
        for section in source_sections:
            if len(section) > DETAILED_SUMMARY_SEGMENT_CHARS:
                lines = section.splitlines(keepends=True)
            else:
                lines = [section]
            for paragraph in lines:
                if len(current) + len(paragraph) > DETAILED_SUMMARY_SEGMENT_CHARS and current:
                    segments.append(current)
                    current = ""
                while len(paragraph) > DETAILED_SUMMARY_SEGMENT_CHARS:
                    if current:
                        segments.append(current)
                        current = ""
                    segments.append(paragraph[:DETAILED_SUMMARY_SEGMENT_CHARS])
                    paragraph = paragraph[DETAILED_SUMMARY_SEGMENT_CHARS:]
                current += paragraph
            if current and not current.endswith("\n\n"):
                current += "\n\n"
        if current.strip():
            segments.append(current)

        detailed_sections = []
        for index, segment in enumerate(segments, start=1):
            prompt = (
                f"Write a comprehensive, detailed study summary of section {index} of "
                f"{len(segments)} from the actual uploaded document '{doc['name']}'. "
                "Cover all important headings and subheadings, concepts, definitions, "
                "explanations, examples, procedures, formulas, results, and relationships "
                "present in this source. Explain technical terms using the document's own "
                "context. Preserve named items and meaningful details. Use clear headings "
                "and substantive explanations rather than brief generic bullets. Do not add "
                "unsupported facts. Identify the source page numbers shown in the text.\n\n"
                f"Document text:\n{segment}"
            )
            section_summary = self._generate_ai_text(
                api_key,
                prompt,
                temperature=0.2,
                max_output_tokens=AI_LONG_FORM_MAX_OUTPUT_TOKENS
            )
            detailed_sections.append(
                f"## Detailed coverage: source section {index} of {len(segments)}\n\n"
                f"{section_summary}"
            )

        if not detailed_sections:
            raise RuntimeError("No readable document sections were available for summarization.")

        return {
            "doc_id": doc["id"],
            "doc_name": doc["name"],
            "length": "detailed",
            "summary_text": "\n\n".join(detailed_sections),
            "word_count": doc["word_count"]
        }

    @staticmethod
    def _generate_ai_text(
        api_key: str,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.2,
        max_output_tokens: int = AI_MAX_OUTPUT_TOKENS,
        json_response: bool = False
    ) -> str:
        if AI_PROVIDER == "openrouter":
            if not OPENAI_AVAILABLE:
                raise AIConfigurationError(
                    "The OpenAI-compatible client is not installed. Install backend requirements."
                )
            client = OpenAI(
                api_key=api_key,
                base_url=OPENROUTER_BASE_URL,
                timeout=AI_REQUEST_TIMEOUT_SECONDS
            )
            messages = []
            if system_instruction:
                messages.append({"role": "system", "content": system_instruction})
            messages.append({"role": "user", "content": prompt})
            request_options: Dict[str, Any] = {
                "model": AI_MODEL,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_output_tokens
            }
            if json_response:
                request_options["response_format"] = {"type": "json_object"}
            try:
                for attempt in range(AI_TRANSIENT_RETRIES + 1):
                    try:
                        response = client.chat.completions.create(**request_options)
                        break
                    except Exception as error:
                        status = getattr(error, "status_code", None)
                        if status not in {500, 502, 503} or attempt == AI_TRANSIENT_RETRIES:
                            raise
                        time.sleep(attempt + 1)
            finally:
                client.close()

            if not response or not response.choices:
                raise RuntimeError("OpenRouter returned no answer choices.")
            choice = response.choices[0]
            finish_reason = choice.finish_reason or ""
            if finish_reason.lower() == "length":
                raise IncompleteAIResponseError(
                    "The AI provider reached its output-token limit before completing the response."
                )
            if finish_reason.lower() != "stop":
                raise RuntimeError(
                    f"The AI provider did not complete generation ({finish_reason or 'unknown reason'})."
                )
            answer = choice.message.content or ""
        elif AI_PROVIDER == "gemini":
            if not GOOGLE_GENAI_AVAILABLE:
                raise AIConfigurationError("The Gemini SDK is not installed.")
            config_options: Dict[str, Any] = {
                "temperature": temperature,
                "max_output_tokens": max_output_tokens
            }
            if system_instruction:
                config_options["system_instruction"] = system_instruction
            if json_response:
                config_options["response_mime_type"] = "application/json"
            client_options = genai_types.HttpOptions(timeout=AI_REQUEST_TIMEOUT_SECONDS * 1000)
            with genai.Client(api_key=api_key, http_options=client_options) as client:
                for attempt in range(AI_TRANSIENT_RETRIES + 1):
                    try:
                        response = client.models.generate_content(
                            model=AI_MODEL,
                            contents=prompt,
                            config=genai_types.GenerateContentConfig(**config_options)
                        )
                        break
                    except Exception as error:
                        status = getattr(error, "code", None)
                        if status not in {500, 502, 503} or attempt == AI_TRANSIENT_RETRIES:
                            raise
                        time.sleep(attempt + 1)
            if not response or not response.candidates:
                raise RuntimeError("Gemini returned no answer candidates.")
            candidate = response.candidates[0]
            finish_reason = getattr(candidate.finish_reason, "name", "")
            if finish_reason.upper() == "MAX_TOKENS":
                raise IncompleteAIResponseError(
                    "The AI provider reached its output-token limit before completing the response."
                )
            if finish_reason.upper() != "STOP":
                raise RuntimeError(
                    f"The AI provider did not complete generation ({finish_reason or 'unknown reason'})."
                )
            answer = response.text or ""
        else:
            raise AIConfigurationError(f"Unsupported AI_PROVIDER '{AI_PROVIDER}'.")

        if not answer.strip():
            raise RuntimeError("The AI provider returned an empty response.")
        return answer.strip()

    @staticmethod
    def _requested_program_number(query: str) -> Optional[int]:
        explicit_number = re.search(r"\bprogram\s*(\d+)\b", query, re.IGNORECASE)
        if explicit_number:
            return int(explicit_number.group(1))

        ordinal_map = {
            "first": 1, "1st": 1, "second": 2, "2nd": 2, "third": 3, "3rd": 3,
            "fourth": 4, "4th": 4, "fifth": 5, "5th": 5
        }
        for word, number in ordinal_map.items():
            if re.search(rf"\b{word}\s+(?:program|one)\b", query, re.IGNORECASE):
                return number
        return None

    @staticmethod
    def _extract_program_section(
        doc: Dict[str, Any],
        target_number: int
    ) -> Optional[Tuple[str, str, List[int]]]:
        program_heading = re.compile(r"^\s*Program\s*(\d+)\b[^\r\n]*", re.IGNORECASE)
        started = False
        title = ""
        section_lines = []
        page_numbers = []

        for page in doc["pages"]:
            page_number = page["page_number"]
            page_started = False
            page_has_section_text = False
            for line in page["text"].splitlines():
                heading = program_heading.match(line)
                if heading:
                    number = int(heading.group(1))
                    if started and number != target_number:
                        if page_has_section_text and page_number not in page_numbers:
                            page_numbers.append(page_number)
                        section_text = "\n".join(section_lines).strip()
                        if section_text:
                            return section_text, title, page_numbers
                    if number == target_number and not started:
                        started = True
                        title = line.strip()
                        page_started = True
                if started:
                    section_lines.append(line)
                    page_has_section_text = True
            if page_started or (started and page_has_section_text):
                page_numbers.append(page_number)

        section_text = "\n".join(section_lines).strip()
        if not section_text:
            return None
        return section_text, title, page_numbers

    def generate_quiz(
        self,
        subject: str,
        topic: str,
        count: int,
        difficulty: str,
        doc_id: Optional[str] = None
    ) -> Dict[str, Any]:
        api_key = _require_api_key()
        if doc_id and doc_id in self.documents:
            chunks = self.documents[doc_id]["chunks"]
        else:
            chunks = [chunk for chunk, _ in self.retrieve(f"{subject} {topic}", top_k=8)]

        if not chunks:
            raise ValueError(f"No uploaded course material matches {subject}: {topic}.")

        context = "\n\n".join(
            f"[{chunk.doc_name}, {chunk.section_title or 'Section'}]\n{chunk.text}"
            for chunk in chunks
        )
        response_text = self._generate_ai_text(
            api_key,
            (
                f"Create {count} {difficulty} multiple-choice quiz questions for subject "
                f"'{subject}' and topic '{topic}'. Use only the course context below. "
                "Return a JSON object with a 'questions' array; every item must have "
                "'question' (string), 'options' (exactly four strings), 'correctIndex' "
                "(integer 0-3), and 'explanation' (string grounded in the context). "
                "Make questions distinct and ensure the correct answer is actually correct. "
                "Return JSON only.\n\n"
                f"Course context:\n{context}"
            ),
            temperature=0.2,
            max_output_tokens=8_192,
            json_response=True
        )
        try:
            candidate = json.loads(response_text).get("questions", [])
        except (ValueError, TypeError, AttributeError):
            raise RuntimeError("The AI provider returned an invalid quiz response.") from None
        valid_questions = [
            item for item in candidate
            if isinstance(item, dict)
            and isinstance(item.get("question"), str)
            and isinstance(item.get("options"), list)
            and len(item["options"]) == 4
            and isinstance(item.get("correctIndex"), int)
            and 0 <= item["correctIndex"] < 4
            and isinstance(item.get("explanation"), str)
        ]
        if len(valid_questions) < count:
            raise RuntimeError("The AI provider returned fewer valid quiz questions than requested.")
        questions = valid_questions[:count]

        for index, question in enumerate(questions):
            question["id"] = f"q-{index + 1}"
        return {
            "subject": subject,
            "topic": topic,
            "difficulty": difficulty,
            "questions": questions
        }


# Global singleton instance
rag_engine = RAGEngine()
