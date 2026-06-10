import os
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
from dotenv import load_dotenv

load_dotenv()

DB_DIR = "./db"


def get_vectorstore() -> Chroma:
    embeddings = GoogleGenerativeAIEmbeddings(
        model="gemini-embedding-001",
        task_type="RETRIEVAL_QUERY",
    )
    return Chroma(
        collection_name="papers",
        embedding_function=embeddings,
        persist_directory=DB_DIR
    )


def retrieve_chunks(question: str, paper_id: str = None, k: int = 5) -> list:
    """
    Retrieve top-k relevant chunks for a question.
    Optionally filter by paper_id to search only one paper.
    """
    vectorstore = get_vectorstore()

    search_kwargs = {"k": k}
    if paper_id:
        search_kwargs["filter"] = {"paper_id": paper_id}

    retriever = vectorstore.as_retriever(search_kwargs=search_kwargs)
    chunks = retriever.invoke(question)

    return chunks


def format_context(chunks: list) -> tuple[str, list[int]]:
    """
    Format chunks into a single context string for the LLM.
    Returns (context_text, list_of_page_numbers).
    """
    context_parts = []
    pages = []

    for chunk in chunks:
        page = chunk.metadata.get("page", "?")
        pages.append(page)
        context_parts.append(f"[Page {page}]\n{chunk.page_content}")

    context = "\n\n---\n\n".join(context_parts)
    return context, sorted(set(pages))


def list_ingested_papers() -> list[str]:
    """Return all unique paper_ids stored in the vector DB."""
    vectorstore = get_vectorstore()
    all_docs = vectorstore.get()
    
    paper_ids = set()
    for meta in all_docs["metadatas"]:
        if meta and "paper_id" in meta:
            paper_ids.add(meta["paper_id"])
    
    return sorted(list(paper_ids))