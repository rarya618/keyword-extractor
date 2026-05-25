"use client"

import { useState } from "react"

const MAX_CHARS = 15000

const BORDER_DEFAULT = "1px solid #e2e2e6"
const BORDER_FOCUS = "1px solid #3A2525"
const INPUT_BG = "#f7f7f8"

interface JobInputProps {
  onSubmit: (payload: { jobListing?: string; url?: string }) => void
  loading: boolean
  error: string | null
}

export default function JobInput({ onSubmit, loading, error }: JobInputProps) {
  const [mode, setMode] = useState<"paste" | "url">("paste")
  const [jobText, setJobText] = useState("")
  const [url, setUrl] = useState("")
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const canSubmit =
    !loading &&
    (mode === "paste" ? jobText.trim().length >= 50 : url.trim().length > 0)

  const handleSubmit = () => {
    if (mode === "paste") {
      onSubmit({ jobListing: jobText })
    } else {
      onSubmit({ url: url.trim() })
    }
  }

  return (
    <div>
      {/* Mode toggle */}
      <div className="flex mb-5" style={{ gap: "8px", marginBottom: "16px" }}>
        {(["paste", "url"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              padding: "6px 24px",
              fontSize: "15px",
              fontFamily: "var(--font-rubik)",
              fontWeight: mode === m ? 600 : 400,
              backgroundColor: mode === m ? "#3A2525" : "rgba(58,37,37,0.12)",
              color: mode === m ? "#ffffff" : "#3A2525",
              border: mode === m ? "1px solid #3A2525" : "none",
              borderRadius: "999px",
              transition: "background-color 0.15s ease, color 0.15s ease",
              cursor: "pointer",
            }}
          >
            {m === "paste" ? "Paste text" : "From URL"}
          </button>
        ))}
      </div>

      {mode === "paste" ? (
        <>
          <textarea
            rows={5}
            placeholder="Paste the full job listing here: title, responsibilities, requirements..."
            value={jobText}
            onChange={(e) => setJobText(e.target.value.slice(0, MAX_CHARS))}
            disabled={loading}
            onFocus={() => setFocusedField("textarea")}
            onBlur={() => setFocusedField(null)}
            style={{
              width: "100%",
              backgroundColor: INPUT_BG,
              border: focusedField === "textarea" ? BORDER_FOCUS : BORDER_DEFAULT,
              borderRadius: "8px",
              padding: "16px",
              fontSize: "16px",
              fontFamily: "var(--font-rubik)",
              color: "#3A2525",
              lineHeight: 1.7,
              resize: "none",
              outline: "none",
              transition: "border-color 0.15s ease",
              boxShadow: focusedField === "textarea"
                ? "0 0 0 3px rgba(158, 42, 58, 0.1)"
                : "none",
            }}
          />
          <div style={{ marginTop: "10px" }}>
            <span
              style={{
                fontFamily: "var(--font-rubik)",
                fontSize: "11px",
                color: jobText.length >= MAX_CHARS ? "#e86868" : "#3A2525",
                display: "block",
                marginBottom: "12px",
              }}
            >
              {jobText.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
            </span>
            <SubmitButton canSubmit={canSubmit} loading={loading} onClick={handleSubmit} />
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: "32px", alignItems: "flex-start" }}>
            <input
              type="url"
              placeholder="https://boards.greenhouse.io/company/jobs/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              onKeyDown={(e) => e.key === "Enter" && canSubmit && handleSubmit()}
              onFocus={() => setFocusedField("url")}
              onBlur={() => setFocusedField(null)}
              style={{
                width: "100%",
                backgroundColor: INPUT_BG,
                border: focusedField === "url" ? BORDER_FOCUS : BORDER_DEFAULT,
                borderRadius: "8px",
                padding: "12px 16px",
                fontSize: "16px",
                fontFamily: "var(--font-rubik)",
                color: "#3A2525",
                outline: "none",
                transition: "border-color 0.15s ease",
                boxShadow: focusedField === "url"
                  ? "0 0 0 3px rgba(158, 42, 58, 0.1)"
                  : "none",
              }}
            />
            <SubmitButton canSubmit={canSubmit} loading={loading} onClick={handleSubmit} />
          </div>
          <p
            style={{
              marginTop: "10px",
              fontFamily: "var(--font-rubik)",
              fontSize: "11px",
              color: "#3A2525",
            }}
          >
            ↳ Works best with Greenhouse, Lever, Workday, and similar ATS pages
          </p>
        </>
      )}

      {error && (
        <div
          style={{
            marginTop: "16px",
            border: "1px solid rgba(232, 104, 104, 0.3)",
            backgroundColor: "rgba(232, 104, 104, 0.07)",
            borderRadius: "6px",
            padding: "12px 16px",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-rubik)",
              fontSize: "13px",
              color: "#f4a8a8",
            }}
          >
            {error}
          </p>
        </div>
      )}
    </div>
  )
}

function SubmitButton({
  canSubmit,
  loading,
  onClick,
  fullWidth,
}: {
  canSubmit: boolean
  loading: boolean
  onClick: () => void
  fullWidth?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={!canSubmit}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        padding: "10px 40px",
        width: fullWidth ? "100%" : undefined,
        borderRadius: "8px",
        fontSize: "16px",
        fontFamily: "var(--font-rubik)",
        fontWeight: 700,
        letterSpacing: "0",
        whiteSpace: "nowrap",
        transition: "all 0.15s ease",
        cursor: canSubmit ? "pointer" : "not-allowed",
        backgroundColor: canSubmit ? "#3A2525" : "#f0f0f2",
        color: canSubmit ? "#ffffff" : "#3A2525",
        border: "none",
        boxShadow: "none",
      }}
    >
      {loading ? (
        <>
          <span
            className="animate-spin"
            style={{
              width: "13px",
              height: "13px",
              borderRadius: "50%",
              border: "1.5px solid currentColor",
              borderTopColor: "transparent",
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          Extracting…
        </>
      ) : (
        "Get started"
      )}
    </button>
  )
}
