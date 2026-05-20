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
        backgroundColor: "#0c0c10",
        border: "1px solid #1e1e2a",
        borderRadius: "10px",
        overflow: "hidden",
      }}
    >
      {/* Top color bar */}
      <div
        style={{
          height: "3px",
          background: `linear-gradient(90deg, ${colors.accent} 0%, ${colors.accent}88 100%)`,
        }}
      />

      {/* Card header */}
      <div
        className="flex items-center justify-between"
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #1e1e2a",
          backgroundColor: colors.chipBg,
        }}
      >
        <div className="flex items-center gap-2.5">
          <h3
            style={{
              fontFamily: "var(--font-poppins)",
              fontSize: "11px",
              letterSpacing: "0",
              textTransform: "uppercase",
              fontWeight: 600,
              color: colors.accent,
            }}
          >
            {title}
          </h3>
          <span
            style={{
              fontFamily: "var(--font-poppins)",
              fontSize: "10px",
              fontWeight: 500,
              color: colors.chipText,
              backgroundColor: colors.chipBg,
              border: `1px solid ${colors.chipBorder}`,
              borderRadius: "4px",
              padding: "1px 6px",
              lineHeight: "16px",
            }}
          >
            {keywords.length}
          </span>
        </div>

        {keywords.length > 0 && (
          <button
            onClick={handleCopyCategory}
            style={{
              fontFamily: "var(--font-poppins)",
              fontSize: "10px",
              letterSpacing: "0",
              textTransform: "uppercase",
              fontWeight: 500,
              color: copied ? "#84e4a8" : "#55556e",
              cursor: "pointer",
              background: "none",
              border: "none",
              transition: "color 0.15s ease",
              padding: "2px 0",
            }}
            onMouseEnter={(e) => {
              if (!copied) (e.currentTarget as HTMLButtonElement).style.color = "#ede8dd"
            }}
            onMouseLeave={(e) => {
              if (!copied) (e.currentTarget as HTMLButtonElement).style.color = "#55556e"
            }}
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
        )}
      </div>

      {/* Chips */}
      <div style={{ padding: "16px" }}>
        {keywords.length > 0 ? (
          <div className="flex flex-wrap" style={{ gap: "8px" }}>
            {keywords.map((kw, idx) => (
              <KeywordChip
                key={kw}
                keyword={kw}
                colors={colors}
                animDelay={animDelay + idx * 20}
              />
            ))}
          </div>
        ) : (
          <p
            style={{
              fontFamily: "var(--font-poppins)",
              fontSize: "11px",
              color: "#32324a",
            }}
          >
            None found
          </p>
        )}
      </div>
    </div>
  )
}
