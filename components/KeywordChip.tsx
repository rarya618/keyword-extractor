"use client"

import { useState } from "react"
import type { CategoryColors } from "./ResultsPanel"

interface KeywordChipProps {
  keyword: string
  colors: CategoryColors
  animDelay: number
}

export default function KeywordChip({ keyword, colors, animDelay }: KeywordChipProps) {
  const [copied, setCopied] = useState(false)

  const handleClick = () => {
    navigator.clipboard.writeText(keyword).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    })
  }

  return (
    <button
      onClick={handleClick}
      className="anim-chip"
      onMouseEnter={(e) => {
        if (!copied) {
          const el = e.currentTarget as HTMLButtonElement
          el.style.backgroundColor = colors.chipBg.replace("0.12", "0.22")
          el.style.borderColor = colors.accent + "80"
        }
      }}
      onMouseLeave={(e) => {
        if (!copied) {
          const el = e.currentTarget as HTMLButtonElement
          el.style.backgroundColor = colors.chipBg
          el.style.borderColor = colors.chipBorder
        }
      }}
      style={{
        animationDelay: `${animDelay}ms`,
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "5px 12px",
        borderRadius: "5px",
        fontSize: "12px",
        fontFamily: "var(--font-poppins)",
        fontWeight: 500,
        cursor: "pointer",
        transition: "background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, transform 0.1s ease",
        backgroundColor: copied ? colors.accent : colors.chipBg,
        border: `1px solid ${copied ? colors.accent : colors.chipBorder}`,
        color: copied ? "#07070a" : colors.chipText,
        transform: copied ? "scale(0.96)" : "scale(1)",
        userSelect: "none",
      }}
    >
      {copied ? (
        <>
          <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Copied
        </>
      ) : (
        keyword
      )}
    </button>
  )
}
