import os
import shutil
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from core.ingest import ingest_paper
from core.agent import ask
from core.retriever import list_ingested_papers

app = FastAPI(title="AI Research Analyst API")

# Allow frontend to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory chat history store per paper
chat_histories = {}


# ── Request/Response models ────────────────────────────────────────────────

class AskRequest(BaseModel):
    question: str
    paper_id: str
    session_id: Optional[str] = None  # to keep chat history per user

class AskResponse(BaseModel):
    answer: str
    pages_searched: list[int]
    paper_id: str


# ── Routes ─────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "AI Research Analyst API is running"}


@app.post("/ingest")
async def ingest_endpoint(file: UploadFile = File(...)):
    """Upload a PDF and ingest it into the vector database."""

    # Validate file type
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    # Save uploaded file to papers/ folder
    os.makedirs("papers", exist_ok=True)
    save_path = f"papers/{file.filename}"

    with open(save_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Run ingestion pipeline
    try:
        paper_id = ingest_paper(save_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "message": f"Paper ingested successfully.",
        "paper_id": paper_id,
        "filename": file.filename
    }


@app.post("/ask", response_model=AskResponse)
async def ask_endpoint(request: AskRequest):
    """Ask a question about an ingested paper."""

    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    if not request.paper_id.strip():
        raise HTTPException(status_code=400, detail="paper_id is required.")

    # Get existing chat history for this session
    session_key = request.session_id or request.paper_id
    history = chat_histories.get(session_key, [])

    try:
        result = ask(
            question=request.question,
            paper_id=request.paper_id,
            chat_history=history
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Save updated chat history
    chat_histories[session_key] = result["chat_history"]

    return AskResponse(
        answer=result["answer"],
        pages_searched=result["pages_searched"],
        paper_id=request.paper_id
    )


@app.get("/papers")
def list_papers():
    """List all ingested papers."""
    papers = list_ingested_papers()
    return {"papers": papers, "count": len(papers)}


@app.delete("/chat/{session_id}")
def clear_chat(session_id: str):
    """Clear chat history for a session."""
    if session_id in chat_histories:
        del chat_histories[session_id]
    return {"message": "Chat history cleared."}


@app.get("/health")
def health():
    return {"status": "ok"}