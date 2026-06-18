import { useState, useEffect } from "react"

export function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [])

  const colors = {
    success: { bg: "#f0fdf4", border: "#bbf7d0", color: "#166534" },
    error:   { bg: "#fef2f2", border: "#fecaca", color: "#991b1b" },
    info:    { bg: "#eeecff", border: "#c7c3ff", color: "#4f46e5" }
  }
  const c = colors[type]

  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 999,
      background: c.bg, border: `1px solid ${c.border}`,
      color: c.color, borderRadius: 10, padding: "12px 16px",
      fontSize: 13, fontWeight: 500, fontFamily: "Inter, sans-serif",
      display: "flex", alignItems: "center", gap: 10,
      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      animation: "slideUp 0.2s ease"
    }}>
      <span>{message}</span>
      <span onClick={onClose} style={{ cursor: "pointer", opacity: 0.5 }}>✕</span>
    </div>
  )
}

export function useToast() {
  const [toast, setToast] = useState(null)

  function showToast(message, type = "success") {
    setToast({ message, type })
  }

  function hideToast() {
    setToast(null)
  }

  return { toast, showToast, hideToast }
}