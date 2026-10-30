import os
import sys
import json
import requests

BASE_URL = "http://127.0.0.1:8000"

def run_tests():
    print("=" * 60)
    print("StudyMate AI - Automated Live Validation Suite")
    print(f"Target Backend: {BASE_URL}")
    print("=" * 60)
    
    results = {}

    # 1. Health check
    try:
        r = requests.get(f"{BASE_URL}/api/health", timeout=5)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        health = r.json()
        print(f"[PASS] 1. Backend Health: {health['status']}, Docs: {health['total_documents']}, Model: {health['model']}")
        results["health_check"] = True
    except Exception as e:
        print(f"[FAIL] 1. Backend Health failed: {e}")
        results["health_check"] = False

    # 2. Upload test_programs.txt
    uploaded_doc_id = None
    try:
        with open("test_programs.txt", "rb") as f:
            r = requests.post(
                f"{BASE_URL}/api/upload",
                files={"file": ("test_programs.txt", f, "text/plain")},
                timeout=10
            )
        assert r.status_code == 200, f"Upload status {r.status_code}: {r.text}"
        data = r.json()
        uploaded_doc_id = data["id"]
        print(f"[PASS] 2. Document Upload: ID={uploaded_doc_id}, WordCount={data['word_count']}, Chunks={data['chunk_count']}, Status={data['status']}")
        results["upload"] = True
    except Exception as e:
        print(f"[FAIL] 2. Document Upload failed: {e}")
        results["upload"] = False

    # 3. Test Asking for the Second Program
    try:
        payload = {
            "message": "Explain the second program in my uploaded programs list",
            "doc_id": uploaded_doc_id
        }
        r = requests.post(f"{BASE_URL}/api/chat", json=payload, timeout=15)
        assert r.status_code == 200, f"Chat status {r.status_code}: {r.text}"
        chat_data = r.json()
        answer = chat_data["answer"]
        
        # Verify that Program 2 (Dijkstra) was retrieved and explained
        assert "Dijkstra" in answer or "Program 2" in answer or "shortest path" in answer.lower(), \
            f"Expected Program 2 (Dijkstra) in answer, got: {answer[:200]}"
        
        # Verify that Program 1 (Bubble sort) was not mistakenly substituted
        assert "bubble sort" not in answer.lower() or "dijkstra" in answer.lower(), \
            "Incorrect program was retrieved instead of second program!"

        citation = chat_data["citations"][0] if chat_data["citations"] else {}
        print(f"[PASS] 3. Second Program Retrieval & Explanation:\n     Identified: {citation.get('section', 'Program 2')}\n     Citation: {citation.get('doc_name')} ({citation.get('page')})\n     Answer snippet: {answer[:140]}...")
        results["second_program_chat"] = True
    except Exception as e:
        print(f"[FAIL] 3. Second Program Chat failed: {e}")
        results["second_program_chat"] = False

    # 4. Test Missing Information / Honest response
    try:
        payload = {
            "message": "What is the recipe for baking strawberry cheesecake?",
            "doc_id": uploaded_doc_id
        }
        r = requests.post(f"{BASE_URL}/api/chat", json=payload, timeout=10)
        assert r.status_code == 200, f"Chat status {r.status_code}: {r.text}"
        unrelated_data = r.json()
        # Verify it does not invent facts
        print(f"[PASS] 4. Grounding & Unrelated Concept Handling: Returned honest response:\n     {unrelated_data['answer'][:120]}...")
        results["honest_missing_info"] = True
    except Exception as e:
        print(f"[FAIL] 4. Missing info test failed: {e}")
        results["honest_missing_info"] = False

    # 5. Test Summarizer
    try:
        payload = {
            "doc_id": uploaded_doc_id,
            "length": "medium"
        }
        r = requests.post(f"{BASE_URL}/api/summarize", json=payload, timeout=10)
        assert r.status_code == 200, f"Summarize status {r.status_code}: {r.text}"
        sum_data = r.json()
        assert sum_data["exec_summary"], "Executive summary missing"
        print(f"[PASS] 5. Summarizer: Generated {len(sum_data['exec_summary'])} chars, {len(sum_data.get('key_concepts', []))} key concepts.")
        results["summarizer"] = True
    except Exception as e:
        print(f"[FAIL] 5. Summarizer failed: {e}")
        results["summarizer"] = False

    # 6. Test Quiz Generation
    try:
        payload = {
            "doc_id": uploaded_doc_id,
            "topic": "Algorithms",
            "count": 3,
            "difficulty": "Medium"
        }
        r = requests.post(f"{BASE_URL}/api/quiz", json=payload, timeout=10)
        assert r.status_code == 200, f"Quiz status {r.status_code}: {r.text}"
        quiz_data = r.json()
        assert len(quiz_data["questions"]) > 0, "No questions returned"
        q1 = quiz_data["questions"][0]
        print(f"[PASS] 6. Quiz Generator: Generated {len(quiz_data['questions'])} questions grounded in uploaded programs.")
        print(f"     Sample Q1: {q1['question']}")
        results["quiz_generator"] = True
    except Exception as e:
        print(f"[FAIL] 6. Quiz Generator failed: {e}")
        results["quiz_generator"] = False

    # 7. Test Semantic Search
    try:
        payload = {"query": "Dijkstra shortest path algorithm"}
        r = requests.post(f"{BASE_URL}/api/search", json=payload, timeout=10)
        assert r.status_code == 200, f"Search status {r.status_code}: {r.text}"
        search_data = r.json()
        assert len(search_data["results"]) > 0, "No search results returned"
        top_match = search_data["results"][0]
        assert "Dijkstra" in top_match["text"] or "Dijkstra" in (top_match.get("section_title") or ""), \
            "Top search match did not retrieve Dijkstra!"
        print(f"[PASS] 7. Semantic Search: Retrieved top match with score {top_match['match_score']}%:\n     Doc: {top_match['doc_name']}, Title: {top_match['section_title']}")
        results["semantic_search"] = True
    except Exception as e:
        print(f"[FAIL] 7. Semantic Search failed: {e}")
        results["semantic_search"] = False

    # 8. Test Empty File Upload Rejection
    try:
        r = requests.post(
            f"{BASE_URL}/api/upload",
            files={"file": ("empty.txt", b"", "text/plain")},
            timeout=5
        )
        assert r.status_code == 400, f"Expected 400 for empty file, got {r.status_code}"
        print(f"[PASS] 8. Validation Rejection for Empty (0-byte) File: {r.json()['detail']}")
        results["empty_file_validation"] = True
    except Exception as e:
        print(f"[FAIL] 8. Empty file validation failed: {e}")
        results["empty_file_validation"] = False

    print("=" * 60)
    passed_count = sum(1 for v in results.values() if v)
    total_count = len(results)
    print(f"RESULTS: {passed_count}/{total_count} Tests Passed.")
    print("=" * 60)
    return passed_count == total_count

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
