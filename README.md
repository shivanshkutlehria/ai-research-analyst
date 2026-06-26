# Academic Paper Q&A Agent

A stateful AI Research Assistant designed to navigate complex academic literature and extract precise insights. Utilizing a layout-aware Retrieval-Augmented Generation (RAG) pipeline, the agent delivers grounded, hallucination-free answers backed by page-level citations.

## Features

- Layout-Aware PDF Ingestion: Uses PyMuPDF to accurately parse multi-column academic layouts, figures, and tables while preserving reading order.
- Local Vector Storage: Leverages ChromaDB locally to index document chunks, eliminating external cloud database dependencies and latency.
- Stateful Multi-Turn Dialogue: Implements LangGraph to manage conversational state, enabling context-aware follow-up queries.
- Fact-Grounded Guardrails: Configured with custom prompts and confidence checks to prevent hallucinations; explicitly states when information is missing from the document.
- Source Attribution: Automatically extracts and appends page metadata to answers for immediate verification.

## Tech Stack

- Orchestration: LangGraph, LangChain Community
- LLM Engine: Meta Llama 3.3 with Groq cloud
- Embedding Model: Google Text Embeddings (models/embedding-001)
- Vector Store: ChromaDB
- Document Parsing: PyMuPDF (fitz)
- Package Management: uv

## Project Architecture

```text
ai-research-analyst/
├── .env                  # API Credentials
├── main.py               # CLI Entry Point
├── pyproject.toml        # Dependency Specifications
├── core/
│   ├── ingest.py         # PDF parsing, chunking, and vector database generation
│   ├── retriever.py      # Semantic similarity search and chunk retrieval
│   └── agent.py          # LangGraph state management and dialogue engine
└── prompts/
    └── qa_prompt.py      # Grounded custom system prompts
