import sys
import os
from dotenv import load_dotenv

load_dotenv()


def cmd_ingest(pdf_path: str):
    """Ingest a PDF paper into the vector database."""
    from core.ingest import ingest_paper
    paper_id = ingest_paper(pdf_path)
    print(f"\nReady. Use paper ID: '{paper_id}' when asking questions.\n")


def cmd_ask(question: str, paper_id: str = None):
    """Ask a single question and exit."""
    from core.agent import ask
    result = ask(question, paper_id=paper_id)

    print(f"\nAnswer: {result['answer']}")
    if result["pages_searched"]:
        print(f"Pages searched: {result['pages_searched']}\n")


def cmd_chat(paper_id: str = None):
    """Interactive multi-turn chat loop."""
    from core.agent import ask
    from core.retriever import list_ingested_papers

    papers = list_ingested_papers()
    if not papers:
        print("No papers ingested yet. Run: python main.py ingest <path/to/paper.pdf>")
        return

    if not paper_id:
        print("Available papers:")
        for i, p in enumerate(papers, 1):
            print(f"  {i}. {p}")
        paper_id = input("\nEnter paper ID (or press Enter to search all): ").strip() or None

    print(f"\nChatting about: {'all papers' if not paper_id else paper_id}")
    print("Type your question. Type 'exit' to quit.\n")

    chat_history = []

    while True:
        question = input("You: ").strip()
        if question.lower() in ("exit", "quit", "q"):
            break
        if not question:
            continue

        result = ask(question, paper_id=paper_id, chat_history=chat_history)
        chat_history = result["chat_history"]

        print(f"\nAgent: {result['answer']}")
        if result["pages_searched"]:
            print(f"[Pages: {result['pages_searched']}]")
        print()


def cmd_list():
    """List all ingested papers."""
    from core.retriever import list_ingested_papers
    papers = list_ingested_papers()
    if not papers:
        print("No papers ingested yet.")
    else:
        print("Ingested papers:")
        for p in papers:
            print(f"  • {p}")


def print_help():
    print("""
Usage:
  python main.py ingest <path/to/paper.pdf>          Ingest a PDF
  python main.py ask "<question>" [paper_id]         Ask a single question
  python main.py chat [paper_id]                     Interactive chat mode
  python main.py list                                List ingested papers
  python main.py help                                Show this message

Examples:
  python main.py ingest papers/attention.pdf
  python main.py ask "What dataset was used?" attention
  python main.py chat attention
""")


if __name__ == "__main__":
    args = sys.argv[1:]

    if not args or args[0] == "help":
        print_help()

    elif args[0] == "ingest":
        if len(args) < 2:
            print("Usage: python main.py ingest <path/to/paper.pdf>")
        else:
            cmd_ingest(args[1])

    elif args[0] == "ask":
        if len(args) < 2:
            print('Usage: python main.py ask "<question>" [paper_id]')
        else:
            question = args[1]
            paper_id = args[2] if len(args) > 2 else None
            cmd_ask(question, paper_id)

    elif args[0] == "chat":
        paper_id = args[1] if len(args) > 1 else None
        cmd_chat(paper_id)

    elif args[0] == "list":
        cmd_list()

    else:
        print(f"Unknown command: {args[0]}")
        print_help()