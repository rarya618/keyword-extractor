"use client"

import type { Analysis } from "@/lib/analyses"

interface AnalysisHistoryProps {
  analyses: Analysis[]
  activeId: string | null
  onSelect: (analysis: Analysis) => void
}

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime()
  const min = Math.floor(diff / 60000)
  const hr = Math.floor(min / 60)
  const day = Math.floor(hr / 24)
  if (min < 1) return "just now"
  if (min < 60) return `${min}m ago`
  if (hr < 24) return `${hr}h ago`
  return `${day}d ago`
}

function formatSnippet(analysis: Analysis): string {
  const heading = [analysis.company, analysis.jobTitle].filter(Boolean).join(" · ")
  if (heading) return heading
  if (analysis.source === "url") {
    try {
      return new URL(analysis.snippet).hostname.replace(/^www\./, "")
    } catch {
      return analysis.snippet
    }
  }
  const text = analysis.snippet.trim()
  return text.length > 52 ? text.slice(0, 52) + "…" : text
}

export default function AnalysisHistory({
  analyses,
  activeId,
  onSelect,
}: AnalysisHistoryProps) {
  if (analyses.length === 0) return null

  return (
    <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: "8px" }}>
      <p
        style={{
          fontFamily: "var(--font-rubik)",
          fontSize: "10px",
          letterSpacing: "0",
          textTransform: "uppercase",
          fontWeight: 500,
          color: "rgba(255,255,255,0.55)",
          padding: "16px 24px 8px",
        }}
      >
        Recent
      </p>

      <div style={{ paddingBottom: "12px" }}>
        {analyses.map((a) => {
          const isActive = a.id === activeId
          const totalCount = Object.values(a.keywords).flat().length

          return (
            <button
              key={a.id}
              onClick={() => onSelect(a)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "9px 24px",
                background: isActive ? "rgba(255,255,255,0.08)" : "none",
                border: "none",
                borderLeft: isActive ? "2px solid rgba(255,255,255,0.6)" : "2px solid transparent",
                cursor: "pointer",
                transition: "background 0.12s ease",
              }}
              onMouseEnter={(e) => {
                if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"
              }}
              onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "none"
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-rubik)",
                  fontSize: "13px",
                  color: isActive ? "#ffffff" : "rgba(255,255,255,0.9)",
                  lineHeight: 1.4,
                  marginBottom: "3px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {formatSnippet(a)}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    fontFamily: "var(--font-rubik)",
                    fontSize: "10px",
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  {relativeTime(a.createdAt)}
                </span>
                <span style={{ width: "2px", height: "2px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.2)", flexShrink: 0 }} />
                <span
                  style={{
                    fontFamily: "var(--font-rubik)",
                    fontSize: "10px",
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  {totalCount} terms
                </span>
                {a.source === "url" && (
                  <>
                    <span style={{ width: "2px", height: "2px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.2)", flexShrink: 0 }} />
                    <span
                      style={{
                        fontFamily: "var(--font-rubik)",
                        fontSize: "9px",
                        fontWeight: 500,
                        color: "rgba(255,255,255,0.5)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: "3px",
                        padding: "0px 5px",
                        letterSpacing: "0",
                      }}
                    >
                      url
                    </span>
                  </>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
