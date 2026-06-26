from typing import TypedDict, Annotated
from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
from langchain_core.documents import Document
from langchain_core.messages import AIMessage, HumanMessage
from core.retriever import retrieve_chunks, format_context
from prompts.qa_prompt import QA_PROMPT
from dotenv import load_dotenv
import os
import operator

load_dotenv()

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")


# ── State schema ──────────────────────────────────────────────────────────────

class AgentState(TypedDict):
    question: str
    paper_id: str
    retrieved_chunks: list
    context: str
    pages_searched: list[int]
    answer: str
    chat_history: Annotated[list, operator.add]  # accumulates across turns


# ── LLM setup ─────────────────────────────────────────────────────────────────

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0
)


# ── Nodes ─────────────────────────────────────────────────────────────────────

def retrieve_node(state: AgentState) -> AgentState:
    """Fetch relevant chunks from ChromaDB."""
    chunks = retrieve_chunks(
        question=state["question"],
        paper_id=state.get("paper_id"),
        k=5
    )
    context, pages = format_context(chunks)
    return {
        **state,
        "retrieved_chunks": chunks,
        "context": context,
        "pages_searched": pages
    }


def answer_node(state: AgentState) -> AgentState:
    """Generate a grounded answer using retrieved context."""
    # Build prompt
    prompt_text = QA_PROMPT.format(
        context=state["context"],
        question=state["question"]
    )

    # Include chat history for follow-up awareness
    messages = state.get("chat_history", []) + [HumanMessage(content=prompt_text)]
    response = llm.invoke(messages)
    answer = response.content

    # Append this exchange to history
    new_history = [
        HumanMessage(content=state["question"]),
        AIMessage(content=answer)
    ]

    return {
        **state,
        "answer": answer,
        "chat_history": new_history
    }


def confidence_check_node(state: AgentState) -> str:
    """Route: if no chunks retrieved, skip to a safe fallback."""
    if not state.get("retrieved_chunks"):
        return "no_results"
    return "answer"


def fallback_node(state: AgentState) -> AgentState:
    return {
        **state,
        "answer": "Could not find any relevant sections in the paper for your question. Try rephrasing or check that the paper was ingested correctly."
    }


# ── Build graph ────────────────────────────────────────────────────────────────

def build_agent() -> StateGraph:
    graph = StateGraph(AgentState)

    graph.add_node("retrieve", retrieve_node)
    graph.add_node("answer", answer_node)
    graph.add_node("fallback", fallback_node)

    graph.set_entry_point("retrieve")

    graph.add_conditional_edges(
        "retrieve",
        confidence_check_node,
        {
            "answer": "answer",
            "no_results": "fallback"
        }
    )

    graph.add_edge("answer", END)
    graph.add_edge("fallback", END)

    return graph.compile()


# ── Public API ─────────────────────────────────────────────────────────────────

_agent = None

def get_agent():
    global _agent
    if _agent is None:
        _agent = build_agent()
    return _agent


def ask(question: str, paper_id: str = None, chat_history: list = None) -> dict:
    """
    Ask a question about an ingested paper.
    Returns dict with 'answer', 'pages_searched', 'chat_history'.
    """
    agent = get_agent()
    result = agent.invoke({
        "question": question,
        "paper_id": paper_id or "",
        "retrieved_chunks": [],
        "context": "",
        "pages_searched": [],
        "answer": "",
        "chat_history": chat_history or []
    })
    return {
        "answer": result["answer"],
        "pages_searched": result["pages_searched"],
        "chat_history": result["chat_history"]
    }