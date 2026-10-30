import logging
import os
import re
import uuid
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv(Path(__file__).with_name(".env"), override=False)

from rag_engine import (
    AIConfigurationError,
    AI_MODEL,
    AI_PROVIDER,
    EMBEDDING_MODEL,
    EmbeddingConfigurationError,
    EmbeddingGenerationError,
    IncompleteAIResponseError,
    rag_engine,
)

app = FastAPI(
    title="StudyMate AI API",
    description="Backend API powering StudyMate AI's RAG pipeline, document extraction, intelligent tutoring, and exam tools.",
    version="2.0.0"
)

logger = logging.getLogger(__name__)

configured_frontend_origins = [
    origin.strip().rstrip("/")
    for origin in os.environ.get("FRONTEND_URL", "").split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        *configured_frontend_origins,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request & Response Models
class ChatRequest(BaseModel):
    message: str
    doc_id: Optional[str] = "ALL"


class SummarizeRequest(BaseModel):
    doc_id: str
    length: Optional[str] = "medium"


class QuizRequest(BaseModel):
    doc_id: Optional[str] = None
    subject: Optional[str] = "Computer Science"
    topic: Optional[str] = "Operating Systems"
    count: Optional[int] = 3
    difficulty: Optional[str] = "Medium"


class SearchRequest(BaseModel):
    query: str


# Preload initial demo documents if not present
def initialize_default_documents():
    if not rag_engine.documents:
        os_text = """
Program 1: Virtual Memory Address Translation Simulation
This program simulates how a virtual page number is translated into a physical frame number using a page table and Translation Lookaside Buffer (TLB). It handles page hits in hardware and triggers software interrupts on TLB misses.

Program 2: Page Fault Handler and LRU Page Replacement
This program implements an Operating System kernel Page Fault exception handler. When a virtual address reference results in valid bit 0, this program traps the exception, allocates a free physical RAM frame from the memory pool, and implements Least Recently Used (LRU) victim frame eviction when physical RAM is exhausted. It tracks frame timestamps and loads 4KB page chunks from disk swap space into physical memory.

Program 3: Working Set Model and Thrashing Detection
This program monitors memory page fault frequencies across active concurrent processes. If the aggregate working set size exceeds available physical frames, it detects Thrashing and suspends low-priority processes to restore CPU throughput.
        """
        rag_engine.add_document(
            doc_id="doc-1",
            doc_name="Operating Systems - Programs & Memory Management.txt",
            file_bytes=os_text.strip().encode("utf-8")
        )

        ml_text = """
Program 1: Batch Gradient Descent for Linear Regression
Implements first-order deterministic gradient descent by accumulating partial derivatives over the full training dataset. Computes mean squared error and adjusts weights along the steepest descent direction.

Program 2: Stochastic Gradient Descent (SGD) with Momentum
Implements stochastic gradient descent updating parameters using a single random training sample per iteration. Includes exponential velocity momentum (gamma = 0.9) to accelerate along ravines and dampen high-variance orthogonal oscillations.

Program 3: Mini-batch Gradient Descent with Learning Rate Decay
Partitions training instances into mini-batches of size 64 for parallel matrix execution, applying cosine annealing learning rate schedules.
        """
        rag_engine.add_document(
            doc_id="doc-2",
            doc_name="Machine Learning - Optimization Programs.txt",
            file_bytes=ml_text.strip().encode("utf-8")
        )


initialize_default_documents()


@app.get("/healthz")
@app.get("/api/health")
def health_check():
    api_key = os.environ.get("API_KEY")
    return {
        "status": "healthy",
        "api_configured": bool(api_key and len(api_key.strip()) > 10),
        "total_documents": len(rag_engine.documents),
        "total_chunks": len(rag_engine.all_chunks),
        "provider": AI_PROVIDER,
        "model": AI_MODEL,
        "embedding_model": EMBEDDING_MODEL,
        "vector_index_ready": bool(rag_engine.document_indexes),
    }


@app.post("/api/upload")
async def upload_document(file: UploadFile = File(...)):
    # 1. Validation: file presence
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded.")

    # 2. Extension validation
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if ext not in ["pdf", "txt", "docx", "doc", "md", "csv", "py", "java", "c", "cpp"]:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Please upload a PDF, TXT, or DOCX document."
        )

    # 3. Read bytes & check size
    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="The uploaded file is empty (0 bytes).")
    
    if len(file_bytes) > 25 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File exceeds maximum allowed size of 25MB.")

    # 4. Process and index into RAG engine
    try:
        doc_id = "doc-" + str(uuid.uuid4())[:8]
        result = rag_engine.add_document(doc_id, file.filename, file_bytes)

        if result.get("is_scanned"):
            return {
                **result,
                "warning": "Scanned image-only PDF detected. Text extraction is limited without OCR."
            }

        return result
    except EmbeddingConfigurationError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except EmbeddingGenerationError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Processing failed: {str(e)}")


@app.get("/api/documents")
def list_documents():
    docs = []
    for doc_id, doc in rag_engine.documents.items():
        docs.append({
            "id": doc_id,
            "name": doc["name"],
            "page_count": doc["page_count"],
            "word_count": doc["word_count"],
            "chunk_count": len(doc["chunks"]),
            "status": doc["status"]
        })
    return docs


@app.delete("/api/documents/{doc_id}")
def delete_document(doc_id: str):
    success = rag_engine.remove_document(doc_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found.")
    return {"message": "Document removed successfully.", "doc_id": doc_id}


@app.post("/api/chat")
def chat_study_query(req: ChatRequest):
    if not req.message or not req.message.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    try:
        result = rag_engine.generate_chat_response(
            query=req.message.strip(),
            doc_id=req.doc_id
        )
        return result
    except Exception as e:
        raise _generation_error("Chat", e)


@app.post("/api/summarize")
def summarize_document(req: SummarizeRequest):
    if not req.doc_id:
        raise HTTPException(status_code=400, detail="Target doc_id is required.")

    try:
        summary = rag_engine.generate_summary(
            doc_id=req.doc_id,
            length=req.length or "medium"
        )
        return summary
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise _generation_error("Summary", e)


@app.post("/api/quiz")
def generate_quiz(req: QuizRequest):
    try:
        return rag_engine.generate_quiz(
            subject=(req.subject or "Computer Science").strip(),
            topic=(req.topic or "Course Syllabus").strip(),
            count=max(1, min(req.count or 3, 10)),
            difficulty=req.difficulty or "Medium",
            doc_id=req.doc_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise _generation_error("Quiz", e)


def _generation_error(operation: str, error: Exception) -> HTTPException:
    if isinstance(error, AIConfigurationError):
        return HTTPException(status_code=503, detail=str(error))
    if isinstance(error, EmbeddingConfigurationError):
        return HTTPException(status_code=503, detail=str(error))
    if isinstance(error, EmbeddingGenerationError):
        return HTTPException(status_code=502, detail=str(error))
    if isinstance(error, IncompleteAIResponseError):
        return HTTPException(
            status_code=502,
            detail=f"{operation} was incomplete because the AI provider reached its output limit. No partial result was returned."
        )
    if "timeout" in type(error).__name__.lower():
        return HTTPException(
            status_code=504,
            detail=f"{operation} timed out while waiting for {AI_PROVIDER}. Please retry."
        )

    status = getattr(error, "status_code", None) or getattr(error, "code", None)
    provider_status = getattr(error, "status", None)
    provider_message = _safe_provider_message(error)
    logger.warning(
        "%s request failed: provider=%s model=%s type=%s code=%s status=%s message=%s",
        operation,
        AI_PROVIDER,
        AI_MODEL,
        type(error).__name__,
        status,
        provider_status,
        provider_message or "no provider message",
    )
    if status == 401 or status == 403:
        detail = f"{AI_PROVIDER} rejected API_KEY. Check the key in backend/.env."
    elif status == 404:
        detail = f"Model '{AI_MODEL}' is unavailable from provider '{AI_PROVIDER}'."
    elif status == 429:
        detail = f"{AI_PROVIDER} rate limit or quota error (HTTP 429)."
    elif status == 503:
        detail = f"{AI_PROVIDER} service is unavailable (HTTP 503)."
    elif status == 504:
        detail = f"{AI_PROVIDER} request exceeded the provider deadline (HTTP 504)."
    elif status == 500:
        detail = f"{AI_PROVIDER} reported an internal server error (HTTP 500)."
    elif status == 502:
        detail = f"{AI_PROVIDER} returned an upstream gateway error (HTTP 502)."
    elif status and status >= 500:
        detail = f"{AI_PROVIDER} returned a server error (HTTP {status})."
    else:
        detail = f"{operation} failed with {AI_PROVIDER} ({type(error).__name__}). No partial result was returned."
    if provider_message:
        detail = f"{detail} Provider message: {provider_message}"
    response_status = status if status in {429, 503, 504} else 502
    return HTTPException(status_code=response_status, detail=detail)


def _safe_provider_message(error: Exception) -> str:
    details = getattr(error, "details", None) or getattr(error, "body", None)
    message = None
    if isinstance(details, dict):
        provider_error = details.get("error")
        if isinstance(provider_error, dict):
            message = provider_error.get("message")
        elif isinstance(provider_error, str):
            message = provider_error
        if not message:
            message = details.get("message")
    if not isinstance(message, str) or not message:
        return ""

    api_key = os.environ.get("API_KEY", "")
    if api_key:
        message = message.replace(api_key, "[REDACTED]")
    message = re.sub(r"(?:AIza|sk-or-v1-|sk-)[0-9A-Za-z_-]{20,}", "[REDACTED]", message)
    return " ".join(message.split())[:300]


@app.post("/api/search")
def semantic_search(req: SearchRequest):
    if not req.query or not req.query.strip():
        raise HTTPException(status_code=400, detail="Search query cannot be empty.")

    try:
        results = rag_engine.retrieve(req.query.strip(), top_k=6)
    except (EmbeddingConfigurationError, EmbeddingGenerationError) as e:
        raise _generation_error("Search", e)
    out = []
    for chunk, score in results:
        match_pct = min(99, max(0, int(score * 100)))
        out.append({
            "chunk_id": chunk.chunk_id,
            "doc_id": chunk.doc_id,
            "doc_name": chunk.doc_name,
            "page_number": chunk.page_number,
            "section_title": chunk.section_title,
            "text": chunk.text,
            "match_score": match_pct
        })
    return {"results": out}
