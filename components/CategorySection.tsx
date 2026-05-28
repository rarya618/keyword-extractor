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
  matched?: string[]
  missing?: string[]
}

export default function CategorySection({
  title,
  keywords,
  colors,
  animDelay,
  fullWidth,
  matched,
  missing,
}: CategorySectionProps) {
  const matchedSet = new Set(matched?.map(k => k.toLowerCase()) ?? [])
  const missingSet = new Set(missing?.map(k => k.toLowerCase()) ?? [])

  const sortedKeywords = (matched || missing)
    ? [...keywords].sort((a, b) => {
        const aM = missingSet.has(a.toLowerCase()) ? -1 : matchedSet.has(a.toLowerCase()) ? 1 : 0
        const bM = missingSet.has(b.toLowerCase()) ? -1 : matchedSet.has(b.toLowerCase()) ? 1 : 0
        return aM - bM
      })
    : keywords
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
        backgroundColor: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "10px",
        overflow: "hidden",
      }}
    >

      {/* Card header */}
      <div
        className="category-header flex items-center justify-between"
        style={{
          padding: "16px 24px",
        }}
      >
        <div className="flex items-center gap-2.5">
          <h3
            style={{
              fontFamily: "var(--font-rubik)",
              fontSize: "20px",
              letterSpacing: "0",
              fontWeight: 600,
              color: colors.accent,
            }}
          >
            {title}
          </h3>
          <span
            style={{
              fontFamily: "var(--font-rubik)",
              fontSize: "11px",
              fontWeight: 500,
              color: colors.chipText,
              backgroundColor: colors.chipBg,
              border: `1px solid ${colors.chipBorder}`,
              borderRadius: "50%",
              padding: "0",
              width: "20px",
              height: "20px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
            }}
          >
            {keywords.length}
          </span>
        </div>

        {keywords.length > 0 && (
          <button
            onClick={handleCopyCategory}
            style={{
              color: copied ? "#84e4a8" : colors.accent,
              cursor: "pointer",
              background: "none",
              border: "none",
              transition: "color 0.15s ease",
              padding: "2px",
              display: "flex",
              alignItems: "center",
            }}
            onMouseEnter={(e) => {
              if (!copied) (e.currentTarget as HTMLButtonElement).style.color = "#ede8dd"
            }}
            onMouseLeave={(e) => {
              if (!copied) (e.currentTarget as HTMLButtonElement).style.color = colors.accent
            }}
          >
            {copied ? (
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Chips */}
      <div style={{ padding: "0 24px 20px", marginTop: "-6px" }}>
        {keywords.length > 0 ? (
          <div className="chips-row flex flex-wrap" style={{ gap: "8px" }}>
            {sortedKeywords.map((kw, idx) => (
              <KeywordChip
                key={kw}
                keyword={kw}
                colors={colors}
                animDelay={animDelay + idx * 20}
                matchStatus={matchedSet.has(kw.toLowerCase()) ? "matched" : missingSet.has(kw.toLowerCase()) ? "missing" : null}
              />
            ))}
          </div>
        ) : (
          <p
            style={{
              fontFamily: "var(--font-rubik)",
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
