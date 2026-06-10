import os
import fitz  # pymupdf
from langchain_core.documents import Document  
from langchain_text_splitters import RecursiveCharacterTextSplitter  
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
from dotenv import load_dotenv

load_dotenv()

DB_DIR = "./db"
CHUNK_SIZE = 800
CHUNK_OVERLAP = 100


def extract_text_from_pdf(pdf_path: str) -> list[Document]:
    """Extract text from PDF page by page, keeping page number as metadata."""
    docs = []
    pdf = fitz.open(pdf_path)

    for page_num in range(len(pdf)):
        page = pdf[page_num]
        text = page.get_text("text").strip()

        if not text:  # skip empty pages
            continue

        docs.append(Document(
            page_content=text,
            metadata={
                "page": page_num + 1,
                "source": os.path.basename(pdf_path),
                "paper_id": os.path.splitext(os.path.basename(pdf_path))[0]
            }
        ))

    pdf.close()
    print(f"Extracted {len(docs)} pages from '{os.path.basename(pdf_path)}'")
    return docs


def chunk_documents(docs: list[Document]) -> list[Document]:
    """Split pages into smaller overlapping chunks for better retrieval."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " "]
    )
    chunks = splitter.split_documents(docs)
    print(f"Split into {len(chunks)} chunks")
    return chunks


def ingest_paper(pdf_path: str) -> str:
    """Full pipeline: PDF → chunks → embeddings → ChromaDB. Returns paper_id."""
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF not found: {pdf_path}")

    paper_id = os.path.splitext(os.path.basename(pdf_path))[0]

    # Check if already ingested
    embeddings = GoogleGenerativeAIEmbeddings(
        model="gemini-embedding-001",
        task_type="RETRIEVAL_DOCUMENT",
    )
    vectorstore = Chroma(
        collection_name="papers",
        embedding_function=embeddings,
        persist_directory=DB_DIR
    )

    existing = vectorstore.get(where={"paper_id": paper_id})
    if existing["ids"]:
        print(f"Paper '{paper_id}' already ingested ({len(existing['ids'])} chunks). Skipping.")
        return paper_id

    # Extract, chunk, embed, store
    docs = extract_text_from_pdf(pdf_path)
    chunks = chunk_documents(docs)

    Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        collection_name="papers",
        persist_directory=DB_DIR
    )

    print(f"Ingested '{paper_id}' into ChromaDB successfully.")
    return paper_id