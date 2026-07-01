import { useState, useRef, useEffect } from "react"
import { Toast, useToast } from "./Toast"
import axios from "axios"

const API = "https://shivanshkutlehria-ai-research-analyst.hf.space"

function SkeletonMessage() {
  return (
    <div style={{ display: "flex", justifyContent: "flex-start" }}>
      <div style={{
        background: "#fff", border: "1px solid #e8e8e8",
        borderRadius: "4px 16px 16px 16px", padding: "12px 16px",
        width: 340
      }}>
        <div style={{
          height: 12, borderRadius: 6, background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
          backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite",
          marginBottom: 8, width: "90%"
        }} />
        <div style={{
          height: 12, borderRadius: 6, background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
          backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite",
          marginBottom: 8, width: "75%"
        }} />
        <div style={{
          height: 12, borderRadius: 6, background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
          backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite",
          width: "55%"
        }} />
      </div>
    </div>
  )
}

function EmptyNoPaper() {
  return (
    <div style={{ textAlign: "center", marginTop: 80, padding: "0 2rem" }}>
      <div style={{
        width: 64, height: 64, borderRadius: "50%", background: "#f0f0ff",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 16px", fontSize: 28
      }}>📚</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1a2e", marginBottom: 6 }}>
        No paper selected
      </div>
      <div style={{ fontSize: 13, color: "#888", lineHeight: 1.6 }}>
        Upload a PDF from the sidebar<br />or select an already ingested paper
      </div>
      <div style={{
        marginTop: 20, display: "inline-flex", alignItems: "center", gap: 6,
        background: "#eeecff", color: "#4f46e5", borderRadius: 99,
        padding: "6px 14px", fontSize: 12, fontWeight: 500
      }}>
        ← drag a PDF into the sidebar
      </div>
    </div>
  )
}

function EmptyPaperReady({ paperName }) {
  const suggestions = [
    "What methodology did the authors use?",
    "What are the key findings of this paper?",
    "What limitations did the authors acknowledge?",
    "What dataset was used for experiments?",
  ]
  return (
    <div style={{ textAlign: "center", marginTop: 60, padding: "0 2rem" }}>
      <div style={{
        width: 64, height: 64, borderRadius: "50%", background: "#f0fdf4",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 16px", fontSize: 28
      }}>🔍</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1a2e", marginBottom: 4 }}>
        Ready to answer questions
      </div>
      <div style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>
        Searching inside <span style={{ fontWeight: 600, color: "#4f46e5" }}>{paperName}</span>
      </div>
      <div style={{ fontSize: 12, color: "#aaa", marginBottom: 10, fontWeight: 500 }}>
        Try asking:
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
        {suggestions.map((s, i) => (
          <SuggestionChip key={i} text={s} />
        ))}
      </div>
    </div>
  )
}

function SuggestionChip({ text, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={() => onClick && onClick(text)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "#eeecff" : "#fafafa",
        border: `1px solid ${hovered ? "#c7c3ff" : "#e8e8e8"}`,
        borderRadius: 99, padding: "6px 16px", fontSize: 12,
        color: hovered ? "#4f46e5" : "#555",
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.15s", maxWidth: 340
      }}>
      {text}
    </div>
  )
}

export default function App() {
  const { toast, showToast, hideToast } = useToast()
  const [papers, setPapers] = useState([])
  const [selectedPaper, setSelectedPaper] = useState(null)
  const [messages, setMessages] = useState([])
  const [question, setQuestion] = useState("")
  const [uploading, setUploading] = useState(false)
  const [asking, setAsking] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [loadingPapers, setLoadingPapers] = useState(true)
  const fileRef = useRef()
  const bottomRef = useRef()

  useEffect(() => { fetchPapers() }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, asking])

  async function fetchPapers() {
    setLoadingPapers(true)
    try {
      const res = await axios.get(`${API}/papers`)
      setPapers(res.data.papers)
    } catch (e) { }
    setLoadingPapers(false)
  }

  /*async function uploadPaper(file) {
    if (!file || !file.name.endsWith(".pdf")) {
      showToast(`"${res.data.filename}" ingested successfully!`, "success")
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
        text: `✓ "${res.data.filename}" ingested successfully.`
      }])
    } catch (e) {
      showToast("Upload failed. Make sure the backend is running.", "error")
    }
    setUploading(false)
  }*/

    async function uploadPaper(file) {
      if (!file || !file.name.endsWith(".pdf")) {
        showToast("Please upload a PDF file.", "error")
        return
      }
      setUploading(true)
      const form = new FormData()
      form.append("file", file)
      try {
        const res = await axios.post(`${API}/ingest`, form, {
          headers: { "Content-Type": "multipart/form-data" }
        })
        await fetchPapers()
        setSelectedPaper(res.data.paper_id)
        showToast(`"${res.data.filename}" ingested successfully!`, "success")
        setMessages([{
          role: "system",
          text: `✓ "${res.data.filename}" ingested. Start asking questions.`
        }])
      } catch (e) {
        console.error("Upload error:", e)
        showToast(e?.response?.data?.detail || "Upload failed.", "error")
      }
      setUploading(false)
    }

  async function sendQuestion(q) {
    const text = (q || question).trim()
    if (!text || !selectedPaper || asking) return
    setQuestion("")
    setMessages(prev => [...prev, { role: "user", text }])
    setAsking(true)
    try {
      const res = await axios.post(`${API}/ask`, {
        question: text,
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
    uploadPaper(e.dataTransfer.files[0])
  }

  return (
    <>
      <style>{`
        @keyframes slideUp {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .msg-animate { animation: fadeIn 0.2s ease; }
        textarea:focus { outline: none; border-color: #a5a0ff !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e0e0e0; border-radius: 99px; }
      `}</style>

      <div style={{
        display: "flex", height: "100vh", fontFamily: "Inter, sans-serif",
        background: "#f8f9fa", color: "#1a1a2e"
      }}>

        {/* ── SIDEBAR ── */}
        <div style={{
          width: 260, background: "#fff", borderRight: "1px solid #e8e8e8",
          display: "flex", flexDirection: "column", padding: "1.5rem 1rem"
        }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
            Research Analyst
          </div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 24 }}>
            AI-powered paper Q&A
          </div>

          {/* Upload */}
          <div
            onClick={() => !uploading && fileRef.current.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragOver ? "#4f46e5" : uploading ? "#a5a0ff" : "#d0d0d0"}`,
              borderRadius: 10, padding: "1.25rem 1rem", textAlign: "center",
              cursor: uploading ? "not-allowed" : "pointer", marginBottom: 20,
              transition: "all 0.2s", background: dragOver ? "#f0f0ff" : "#fafafa"
            }}>
            {uploading ? (
              <>
                <div style={{ fontSize: 22, marginBottom: 6 }}>⏳</div>
                <div style={{ fontSize: 12, color: "#4f46e5", fontWeight: 500 }}>
                  Ingesting paper...
                </div>
                <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>
                  This may take a moment
                </div>
              </>
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
          <div style={{
            fontSize: 11, fontWeight: 600, color: "#aaa",
            letterSpacing: 1, marginBottom: 8, textTransform: "uppercase"
          }}>
            Papers ({papers.length})
          </div>

          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
            {loadingPapers ? (
              [1, 2, 3].map(i => (
                <div key={i} style={{
                  height: 36, borderRadius: 8,
                  background: "linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)",
                  backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite"
                }} />
              ))
            ) : papers.length === 0 ? (
              <div style={{ fontSize: 12, color: "#bbb", textAlign: "center", marginTop: 16 }}>
                No papers yet
              </div>
            ) : (
              papers.map(p => (
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
              ))
            )}
          </div>
        </div>

        {/* ── MAIN ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

          {/* Header */}
          <div style={{
            padding: "1rem 1.5rem", background: "#fff",
            borderBottom: "1px solid #e8e8e8",
            display: "flex", alignItems: "center", justifyContent: "space-between"
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>
                {selectedPaper ? `📄 ${selectedPaper}` : "Select a paper"}
              </div>
              <div style={{ fontSize: 12, color: "#888" }}>
                {selectedPaper
                  ? "Answers grounded strictly in the paper — with page citations"
                  : "Upload a PDF or pick an existing paper from the sidebar"}
              </div>
            </div>
            {selectedPaper && messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                style={{
                  fontSize: 12, color: "#888", background: "none",
                  border: "1px solid #e8e8e8", borderRadius: 8,
                  padding: "5px 12px", cursor: "pointer"
                }}>
                Clear chat
              </button>
            )}
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "1.5rem",
            display: "flex", flexDirection: "column", gap: 16
          }}>
            {messages.length === 0 && !selectedPaper && <EmptyNoPaper />}
            {messages.length === 0 && selectedPaper && (
              <EmptyPaperReady
                paperName={selectedPaper}
                onClick={text => sendQuestion(text)}
              />
            )}

            {messages.map((msg, i) => (
              <div key={i} className="msg-animate" style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start"
              }}>
                {msg.role === "system" && (
                  <div style={{
                    background: "#f0fdf4", border: "1px solid #bbf7d0",
                    borderRadius: 10, padding: "10px 14px",
                    fontSize: 13, color: "#166534", maxWidth: 480
                  }}>
                    {msg.text}
                  </div>
                )}
                {msg.role === "user" && (
                  <div style={{
                    background: "#4f46e5", color: "#fff",
                    borderRadius: "16px 16px 4px 16px",
                    padding: "10px 16px", fontSize: 14,
                    maxWidth: 480, lineHeight: 1.5
                  }}>
                    {msg.text}
                  </div>
                )}
                {msg.role === "agent" && (
                  <div style={{ maxWidth: 600 }}>
                    <div style={{
                      background: "#fff", border: "1px solid #e8e8e8",
                      borderRadius: "4px 16px 16px 16px",
                      padding: "12px 16px", fontSize: 14,
                      lineHeight: 1.7, color: "#1a1a2e"
                    }}>
                      {msg.text}
                    </div>
                    {msg.pages?.length > 0 && (
                      <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap", alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: "#aaa" }}>Pages:</span>
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

            {asking && <SkeletonMessage />}
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
                flex: 1, padding: "10px 14px", borderRadius: 10,
                resize: "none", border: "1px solid #e0e0e0",
                fontSize: 14, fontFamily: "inherit", lineHeight: 1.5,
                background: selectedPaper ? "#fff" : "#fafafa",
                color: "#1a1a2e", transition: "border-color 0.15s"
              }}
            />
            <button
              onClick={() => sendQuestion()}
              disabled={!selectedPaper || asking || !question.trim()}
              style={{
                padding: "10px 20px", borderRadius: 10, border: "none",
                background: (!selectedPaper || asking || !question.trim()) ? "#e0e0e0" : "#4f46e5",
                color: (!selectedPaper || asking || !question.trim()) ? "#aaa" : "#fff",
                fontWeight: 600, fontSize: 14, cursor: "pointer", transition: "all 0.2s"
              }}>
              {asking ? "..." : "Ask"}
            </button>
          </div>
        </div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </>
  )
}