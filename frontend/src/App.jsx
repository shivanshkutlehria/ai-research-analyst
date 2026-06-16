import { useState, useRef, useEffect } from "react"
import axios from "axios"

const API = "http://localhost:8000"

export default function App() {
  const [papers, setPapers] = useState([])
  const [selectedPaper, setSelectedPaper] = useState(null)
  const [messages, setMessages] = useState([])
  const [question, setQuestion] = useState("")
  const [uploading, setUploading] = useState(false)
  const [asking, setAsking] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef()
  const bottomRef = useRef()

  useEffect(() => {
    fetchPapers()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function fetchPapers() {
    try {
      const res = await axios.get(`${API}/papers`)
      setPapers(res.data.papers)
    } catch (e) {}
  }

  async function uploadPaper(file) {
    if (!file || !file.name.endsWith(".pdf")) {
      alert("Please upload a PDF file.")
      return
    }
    setUploading(true)
    const form = new FormData()
    form.append("file", file)
    try {
      const res = await axios.post(`${API}/ingest`, form)
      await fetchPapers()
      setSelectedPaper(res.data.paper_id)
      setMessages([{
        role: "system",
        text: `✓ "${res.data.filename}" ingested. Start asking questions.`
      }])
    } catch (e) {
      alert("Upload failed. Make sure the backend is running.")
    }
    setUploading(false)
  }

  async function sendQuestion() {
    if (!question.trim() || !selectedPaper || asking) return
    const q = question.trim()
    setQuestion("")
    setMessages(prev => [...prev, { role: "user", text: q }])
    setAsking(true)
    try {
      const res = await axios.post(`${API}/ask`, {
        question: q,
        paper_id: selectedPaper
      })
      setMessages(prev => [...prev, {
        role: "agent",
        text: res.data.answer,
        pages: res.data.pages_searched
      }])
    } catch (e) {
      setMessages(prev => [...prev, {
        role: "agent",
        text: "Something went wrong. Please try again.",
        pages: []
      }])
    }
    setAsking(false)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadPaper(file)
  }

  return (
    <div style={{
      display: "flex", height: "100vh", fontFamily: "Inter, sans-serif",
      background: "#f8f9fa", color: "#1a1a2e"
    }}>

      {/* ── SIDEBAR ── */}
      <div style={{
        width: 260, background: "#fff", borderRight: "1px solid #e8e8e8",
        display: "flex", flexDirection: "column", padding: "1.5rem 1rem"
      }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, color: "#1a1a2e" }}>
          Research Analyst
        </div>
        <div style={{ fontSize: 12, color: "#888", marginBottom: 24 }}>
          AI-powered paper Q&A
        </div>

        {/* Upload area */}
        <div
          onClick={() => fileRef.current.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragOver ? "#4f46e5" : "#d0d0d0"}`,
            borderRadius: 10, padding: "1.25rem 1rem", textAlign: "center",
            cursor: "pointer", marginBottom: 20, transition: "all 0.2s",
            background: dragOver ? "#f0f0ff" : "#fafafa"
          }}>
          {uploading ? (
            <div style={{ fontSize: 13, color: "#4f46e5" }}>Ingesting paper...</div>
          ) : (
            <>
              <div style={{ fontSize: 24, marginBottom: 6 }}>📄</div>
              <div style={{ fontSize: 12, color: "#555", fontWeight: 500 }}>
                Drop PDF here
              </div>
              <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>
                or click to browse
              </div>
            </>
          )}
        </div>
        <input
          ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }}
          onChange={e => uploadPaper(e.target.files[0])}
        />

        {/* Papers list */}
        <div style={{ fontSize: 11, fontWeight: 600, color: "#aaa", letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>
          Papers ({papers.length})
        </div>
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
          {papers.length === 0 && (
            <div style={{ fontSize: 12, color: "#bbb", textAlign: "center", marginTop: 20 }}>
              No papers yet
            </div>
          )}
          {papers.map(p => (
            <div
              key={p}
              onClick={() => { setSelectedPaper(p); setMessages([]) }}
              style={{
                padding: "8px 10px", borderRadius: 8, cursor: "pointer",
                fontSize: 13, fontWeight: selectedPaper === p ? 600 : 400,
                background: selectedPaper === p ? "#eeecff" : "transparent",
                color: selectedPaper === p ? "#4f46e5" : "#444",
                border: selectedPaper === p ? "1px solid #c7c3ff" : "1px solid transparent",
                transition: "all 0.15s", wordBreak: "break-all"
              }}>
              📄 {p}
            </div>
          ))}
        </div>
      </div>

      {/* ── MAIN CHAT AREA ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{
          padding: "1rem 1.5rem", background: "#fff",
          borderBottom: "1px solid #e8e8e8",
          display: "flex", alignItems: "center", gap: 12
        }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>
              {selectedPaper ? `Chatting: ${selectedPaper}` : "Select a paper to begin"}
            </div>
            <div style={{ fontSize: 12, color: "#888" }}>
              {selectedPaper
                ? "Ask anything — the agent searches only within this paper"
                : "Upload a PDF from the sidebar or select an existing paper"}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: 16 }}>

          {messages.length === 0 && selectedPaper && (
            <div style={{ textAlign: "center", marginTop: 60, color: "#aaa" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Ready to answer questions</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Try: "What methodology did they use?" or "What are the limitations?"</div>
            </div>
          )}

          {messages.length === 0 && !selectedPaper && (
            <div style={{ textAlign: "center", marginTop: 60, color: "#aaa" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Upload or select a paper</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Drag a PDF into the sidebar to get started</div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start"
            }}>
              {msg.role === "system" && (
                <div style={{
                  background: "#f0fdf4", border: "1px solid #bbf7d0",
                  borderRadius: 10, padding: "10px 14px", fontSize: 13,
                  color: "#166534", maxWidth: 480
                }}>
                  {msg.text}
                </div>
              )}

              {msg.role === "user" && (
                <div style={{
                  background: "#4f46e5", color: "#fff", borderRadius: "16px 16px 4px 16px",
                  padding: "10px 16px", fontSize: 14, maxWidth: 480, lineHeight: 1.5
                }}>
                  {msg.text}
                </div>
              )}

              {msg.role === "agent" && (
                <div style={{ maxWidth: 600 }}>
                  <div style={{
                    background: "#fff", border: "1px solid #e8e8e8",
                    borderRadius: "4px 16px 16px 16px",
                    padding: "12px 16px", fontSize: 14, lineHeight: 1.7, color: "#1a1a2e"
                  }}>
                    {msg.text}
                  </div>
                  {msg.pages && msg.pages.length > 0 && (
                    <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, color: "#aaa" }}>Pages searched:</span>
                      {msg.pages.map(p => (
                        <span key={p} style={{
                          fontSize: 11, background: "#eeecff", color: "#4f46e5",
                          padding: "1px 7px", borderRadius: 99, fontWeight: 500
                        }}>
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {asking && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div style={{
                background: "#fff", border: "1px solid #e8e8e8",
                borderRadius: "4px 16px 16px 16px", padding: "12px 16px",
                fontSize: 14, color: "#aaa"
              }}>
                Searching paper...
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: "1rem 1.5rem", background: "#fff",
          borderTop: "1px solid #e8e8e8",
          display: "flex", gap: 10, alignItems: "flex-end"
        }}>
          <textarea
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                sendQuestion()
              }
            }}
            placeholder={selectedPaper
              ? "Ask a question about this paper... (Enter to send)"
              : "Select a paper first"}
            disabled={!selectedPaper || asking}
            rows={1}
            style={{
              flex: 1, padding: "10px 14px", borderRadius: 10, resize: "none",
              border: "1px solid #e0e0e0", fontSize: 14, fontFamily: "inherit",
              outline: "none", lineHeight: 1.5,
              background: selectedPaper ? "#fff" : "#fafafa",
              color: "#1a1a2e"
            }}
          />
          <button
            onClick={sendQuestion}
            disabled={!selectedPaper || asking || !question.trim()}
            style={{
              padding: "10px 20px", borderRadius: 10, border: "none",
              background: (!selectedPaper || asking || !question.trim()) ? "#e0e0e0" : "#4f46e5",
              color: (!selectedPaper || asking || !question.trim()) ? "#aaa" : "#fff",
              fontWeight: 600, fontSize: 14, cursor: "pointer",
              transition: "all 0.2s"
            }}>
            Ask
          </button>
        </div>
      </div>
    </div>
  )
}