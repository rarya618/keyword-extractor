"use client"

import { useEffect, useRef, useState } from "react"
import { KeywordResult } from "./ResultsPanel"

export interface CategoryScore {
  matched: string[]
  missing: string[]
  score: number
}

export interface ResumeScore {
  overallScore: number
  categories: {
    technicalSkills: CategoryScore
    softSkills: CategoryScore
    requiredQualifications: CategoryScore
    niceToHave: CategoryScore
    industryDomain: CategoryScore
  }
  suggestions: string[]
  summary: string
}

interface ResumeScorerProps {
  keywords: KeywordResult
}

const CATEGORY_META: { key: keyof KeywordResult; label: string; accent: string }[] = [
  { key: "requiredQualifications", label: "Required", accent: "#e86868" },
  { key: "technicalSkills", label: "Technical Skills", accent: "#5fa8f0" },
  { key: "softSkills", label: "Soft Skills", accent: "#b090f0" },
  { key: "niceToHave", label: "Nice to Have", accent: "#52c87e" },
  { key: "industryDomain", label: "Industry / Domain", accent: "#e89050" },
]

function scoreColor(score: number): string {
  if (score >= 75) return "#52c87e"
  if (score >= 50) return "#e89050"
  return "#e86868"
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ResumeScorer({ keywords }: ResumeScorerProps) {
  const [file, setFile] = useState<File | null>(null)
  const [score, setScore] = useState<ResumeScore | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setFile(null)
    setScore(null)
    setError(null)
  }, [keywords])

  const handleFile = (f: File) => {
    if (f.size > 5 * 1024 * 1024) {
      setError("File must be under 5 MB.")
      return
    }
    const name = f.name.toLowerCase()
    if (!name.endsWith(".pdf") && !name.endsWith(".docx")) {
      setError("Only PDF and DOCX files are supported.")
      return
    }
    setError(null)
    setFile(f)
    setScore(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleScore = async () => {
    if (!file) return
    setLoading(true)
    setError(null)

    const fd = new FormData()
    fd.append("resume", file)
    fd.append("keywords", JSON.stringify(keywords))

    try {
      const res = await fetch("/api/score-resume", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.")
      } else {
        setScore(data.score)
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setFile(null)
    setScore(null)
    setError(null)
  }

  return (
    <div>
      {/* Error */}
      {error && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "6px",
            border: "1px solid rgba(232, 104, 104, 0.3)",
            backgroundColor: "rgba(232, 104, 104, 0.07)",
            fontFamily: "var(--font-poppins)",
            fontSize: "13px",
            color: "#f4a8a8",
            marginBottom: "16px",
          }}
        >
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            padding: "24px",
            borderRadius: "10px",
            backgroundColor: "#0c0c10",
            border: "1px solid #1e1e2a",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#5fa8f0"
            strokeWidth="2"
            strokeLinecap="round"
            style={{ animation: "spin 0.9s linear infinite", flexShrink: 0 }}
          >
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" />
          </svg>
          <span
            style={{
              fontFamily: "var(--font-poppins)",
              fontSize: "14px",
              color: "#8a8aa8",
            }}
          >
            Analyzing your resume...
          </span>
        </div>
      )}

      {/* Upload zone */}
      {!loading && !score && (
        <div>
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !file && inputRef.current?.click()}
            style={{
              border: isDragging ? "2px dashed #5fa8f0" : file ? "1px solid #2a2a3a" : "1.5px dashed #2a2a3a",
              borderRadius: "10px",
              backgroundColor: isDragging ? "rgba(95, 168, 240, 0.05)" : "#0c0c10",
              padding: file ? "16px 20px" : "40px 20px",
              cursor: file ? "default" : "pointer",
              transition: "border-color 0.15s ease, background-color 0.15s ease",
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx"
              style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />

            {file ? (
              <>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#5fa8f0" strokeWidth="1.5" style={{ flexShrink: 0 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: "var(--font-poppins)",
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#ede8dd",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {file.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-poppins)",
                      fontSize: "11px",
                      color: "#55556e",
                      marginTop: "2px",
                    }}
                  >
                    {formatBytes(file.size)}
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); reset() }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#55556e",
                    padding: "4px",
                    display: "flex",
                    flexShrink: 0,
                  }}
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </>
            ) : (
              <div style={{ textAlign: "center", width: "100%" }}>
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#2a2a3a" strokeWidth="1.5" style={{ margin: "0 auto 12px" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <div style={{ fontFamily: "var(--font-poppins)", fontSize: "15px", fontWeight: 500, color: "#8a8aa8" }}>
                  Drop your resume here or{" "}
                  <span style={{ color: "#5fa8f0" }}>browse</span>
                </div>
                <div style={{ fontFamily: "var(--font-poppins)", fontSize: "11px", color: "#32324a", marginTop: "6px" }}>
                  PDF or DOCX · max 5 MB
                </div>
              </div>
            )}
          </div>

          {file && (
            <button
              onClick={handleScore}
              style={{
                marginTop: "12px",
                width: "100%",
                padding: "11px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#5fa8f0",
                fontFamily: "var(--font-poppins)",
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0",
                color: "#07070a",
                cursor: "pointer",
                transition: "background-color 0.15s ease",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#78bcff" }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#5fa8f0" }}
            >
              SCORE MY RESUME
            </button>
          )}
        </div>
      )}

      {/* Score display */}
      {!loading && score && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Overall score card */}
          <div
            style={{
              padding: "32px 24px",
              borderRadius: "10px",
              backgroundColor: "#0c0c10",
              border: "1px solid #1e1e2a",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span
              className="anim-score"
              style={{
                fontFamily: "var(--font-poppins)",
                fontSize: "4.5rem",
                fontWeight: 700,
                letterSpacing: "-0.05em",
                color: scoreColor(score.overallScore),
                lineHeight: 1,
              }}
            >
              {score.overallScore}
            </span>
            <span
              style={{
                fontFamily: "var(--font-poppins)",
                fontSize: "10px",
                fontWeight: 500,
                letterSpacing: "0",
                textTransform: "uppercase",
                color: "#55556e",
              }}
            >
              Overall Match
            </span>
            <p
              style={{
                fontFamily: "var(--font-poppins)",
                fontSize: "14px",
                color: "#8a8aa8",
                textAlign: "center",
                marginTop: "4px",
                lineHeight: 1.5,
              }}
            >
              {score.summary}
            </p>
          </div>

          {/* Per-category breakdown */}
          <div
            style={{
              padding: "20px",
              borderRadius: "10px",
              backgroundColor: "#0c0c10",
              border: "1px solid #1e1e2a",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
            }}
          >
            {CATEGORY_META.map(({ key, label, accent }) => {
              const cat = score.categories[key]
              if (!cat) return null
              const total = cat.matched.length + cat.missing.length
              return (
                <div key={key}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-poppins)",
                        fontSize: "10px",
                        fontWeight: 600,
                        letterSpacing: "0",
                        textTransform: "uppercase",
                        color: accent,
                      }}
                    >
                      {label}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-poppins)",
                        fontSize: "11px",
                        fontWeight: 500,
                        color: scoreColor(cat.score),
                      }}
                    >
                      {cat.matched.length}/{total}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div
                    style={{
                      height: "4px",
                      borderRadius: "3px",
                      backgroundColor: "#16161f",
                      marginBottom: "12px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${total === 0 ? 100 : cat.score}%`,
                        backgroundColor: scoreColor(cat.score),
                        borderRadius: "3px",
                        transition: "width 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                      }}
                    />
                  </div>

                  {/* Keyword chips */}
                  {(cat.matched.length > 0 || cat.missing.length > 0) && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {cat.matched.map((kw) => (
                        <span
                          key={kw}
                          style={{
                            padding: "4px 10px",
                            borderRadius: "5px",
                            backgroundColor: "rgba(82, 200, 126, 0.12)",
                            border: "1px solid rgba(82, 200, 126, 0.28)",
                            fontFamily: "var(--font-poppins)",
                            fontSize: "11px",
                            color: "#84e4a8",
                          }}
                        >
                          {kw}
                        </span>
                      ))}
                      {cat.missing.map((kw) => (
                        <span
                          key={kw}
                          style={{
                            padding: "4px 10px",
                            borderRadius: "5px",
                            backgroundColor: "rgba(232, 104, 104, 0.12)",
                            border: "1px solid rgba(232, 104, 104, 0.28)",
                            fontFamily: "var(--font-poppins)",
                            fontSize: "11px",
                            color: "#f4a8a8",
                          }}
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Suggestions */}
          {score.suggestions.length > 0 && (
            <div
              style={{
                padding: "20px",
                borderRadius: "10px",
                backgroundColor: "#0c0c10",
                border: "1px solid #1e1e2a",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-poppins)",
                  fontSize: "10px",
                  fontWeight: 500,
                  letterSpacing: "0",
                  textTransform: "uppercase",
                  color: "#55556e",
                  display: "block",
                  marginBottom: "14px",
                }}
              >
                Suggestions
              </span>
              <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
                {score.suggestions.map((s, i) => (
                  <li
                    key={i}
                    style={{
                      display: "flex",
                      gap: "12px",
                      alignItems: "flex-start",
                      padding: "10px 14px",
                      borderRadius: "6px",
                      border: "1px solid #1e1e2a",
                      backgroundColor: "#07070a",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-poppins)",
                        fontSize: "10px",
                        fontWeight: 600,
                        color: "#e89050",
                        flexShrink: 0,
                        marginTop: "2px",
                      }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-poppins)",
                        fontSize: "13px",
                        color: "#8a8aa8",
                        lineHeight: 1.55,
                      }}
                    >
                      {s}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Reset */}
          <button
            onClick={reset}
            style={{
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #2a2a3a",
              backgroundColor: "transparent",
              fontFamily: "var(--font-poppins)",
              fontSize: "11px",
              letterSpacing: "0",
              color: "#55556e",
              cursor: "pointer",
              transition: "color 0.15s ease, border-color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.color = "#ede8dd"
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = "#3a3a50"
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.color = "#55556e"
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = "#2a2a3a"
            }}
          >
            UPLOAD A DIFFERENT RESUME
          </button>
        </div>
      )}
    </div>
  )
}
