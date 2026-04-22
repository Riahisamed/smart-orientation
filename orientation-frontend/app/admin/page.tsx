"use client"
import { useState } from "react"

export default function AdminUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleUpload = async () => {
    if (!file) return

    setLoading(true)
    setMessage("")

    const formData = new FormData()
    formData.append("file", file)

    try {
      const token = localStorage.getItem("token")

const res = await fetch("http://localhost:3001/filiere/upload-pdf", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`
  },
  body: formData
})
      const data = await res.json()
      setMessage(data.message || "Done ✅")
    } catch (err) {
      setMessage("Error ❌")
    }

    setLoading(false)
  }

  return (
    <div style={styles.container}>
      
      <div style={styles.card}>
        
        <h2 style={styles.title}>📄 Upload Guide</h2>

        <p style={styles.subtitle}>
          Upload PDF to update database
        </p>

        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          style={styles.input}
        />

        <button
          onClick={handleUpload}
          style={{
            ...styles.button,
            backgroundColor: loading ? "#444" : "#1f6feb"
          }}
          disabled={loading}
        >
          {loading ? "Uploading..." : "Upload"}
        </button>

        {file && (
          <p style={styles.fileName}>📁 {file.name}</p>
        )}

        {message && (
          <p style={styles.message}>{message}</p>
        )}

      </div>

    </div>
  )
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#0f1115" // 🔥 black background
  },
  card: {
    background: "#1c1f26", // 🔥 dark gray
    padding: "30px",
    borderRadius: "15px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
    textAlign: "center" as const,
    width: "350px",
    color: "#fff"
  },
  title: {
    marginBottom: "10px",
    color: "#fff"
  },
  subtitle: {
    color: "#aaa",
    fontSize: "14px",
    marginBottom: "20px"
  },
  input: {
    marginBottom: "20px",
    color: "#ccc"
  },
  button: {
    width: "100%",
    padding: "10px",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px"
  },
  fileName: {
    marginTop: "10px",
    fontSize: "14px",
    color: "#ccc"
  },
  message: {
    marginTop: "15px",
    fontWeight: "bold",
    color: "#4ade80" // green success
  }
}