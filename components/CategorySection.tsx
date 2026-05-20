"use client"

import { useState } from "react"
import KeywordChip from "./KeywordChip"
import type { CategoryColors } from "./ResultsPanel"

interface CategorySectionProps {
  title: string
  keywords: string[]
  colors: CategoryColors
  animDelay: number
  fullWidth?: boolean
}

export default function CategorySection({
  title,
  keywords,
  colors,
  animDelay,
  fullWidth,
}: CategorySectionProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyCategory = () => {
    navigator.clipboard.writeText(keywords.join(", ")).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div
      className="anim-category"
      style={{
        animationDelay: `${animDelay}ms`,
        gridColumn: fullWidth ? "1 / -1" : undefined,
        backgroundColor: "#0d0d11",
        border: "1px solid #22222e",
        borderLeft: `3px solid ${colors.accent}`,
        borderRadius: "10px",
        overflow: "hidden",
      }}
    >
      {/* Card header */}
      <div
        className="flex items-center justify-between"
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #22222e",
        }}
      >
        <div className="flex items-center gap-2.5">
          <h3
            style={{
              fontFamily: "var(--font-plex-mono)",
              fontSize: "11px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontWeight: 500,
              color: colors.accent,
            }}
          >
            {title}
          </h3>
          <span
            style={{
              fontFamily: "var(--font-plex-mono)",
              fontSize: "11px",
              color: "#62627a",
            }}
          >
            {keywords.length}
          </span>
        </div>

        {keywords.length > 0 && (
          <button
            onClick={handleCopyCategory}
            style={{
              fontFamily: "var(--font-plex-mono)",
              fontSize: "10px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: copied ? "#50c07a" : "#62627a",
              cursor: "pointer",
              background: "none",
              border: "none",
              transition: "color 0.15s ease",
              padding: "2px 0",
            }}
            onMouseEnter={(e) => {
              if (!copied) (e.currentTarget as HTMLButtonElement).style.color = "#e8e3d8"
            }}
            onMouseLeave={(e) => {
              if (!copied) (e.currentTarget as HTMLButtonElement).style.color = "#62627a"
            }}
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
        )}
      </div>

      {/* Chips */}
      <div style={{ padding: "14px 16px" }}>
        {keywords.length > 0 ? (
          <div className="flex flex-wrap" style={{ gap: "6px" }}>
            {keywords.map((kw, idx) => (
              <KeywordChip
                key={kw}
                keyword={kw}
                colors={colors}
                animDelay={animDelay + idx * 28}
              />
            ))}
          </div>
        ) : (
          <p
            style={{
              fontFamily: "var(--font-plex-mono)",
              fontSize: "11px",
              color: "#4a4a62",
              fontStyle: "italic",
            }}
          >
            None found
          </p>
        )}
      </div>
    </div>
  )
}
