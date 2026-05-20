"use client"

import { useState } from "react"
import CategorySection from "./CategorySection"

export interface KeywordResult {
  technicalSkills: string[]
  softSkills: string[]
  requiredQualifications: string[]
  niceToHave: string[]
  industryDomain: string[]
}

export interface CategoryColors {
  accent: string
  chipBg: string
  chipBorder: string
  chipText: string
}

interface ResultsPanelProps {
  keywords: KeywordResult
}

const CATEGORIES: {
  key: keyof KeywordResult
  title: string
  colors: CategoryColors
}[] = [
  {
    key: "technicalSkills",
    title: "Technical Skills",
    colors: {
      accent: "#5fa8f0",
      chipBg: "rgba(95, 168, 240, 0.12)",
      chipBorder: "rgba(95, 168, 240, 0.28)",
      chipText: "#98ccff",
    },
  },
  {
    key: "requiredQualifications",
    title: "Required",
    colors: {
      accent: "#e86868",
      chipBg: "rgba(232, 104, 104, 0.12)",
      chipBorder: "rgba(232, 104, 104, 0.28)",
      chipText: "#f4a8a8",
    },
  },
  {
    key: "softSkills",
    title: "Soft Skills",
    colors: {
      accent: "#b090f0",
      chipBg: "rgba(176, 144, 240, 0.12)",
      chipBorder: "rgba(176, 144, 240, 0.28)",
      chipText: "#ccb4ff",
    },
  },
  {
    key: "niceToHave",
    title: "Nice to Have",
    colors: {
      accent: "#52c87e",
      chipBg: "rgba(82, 200, 126, 0.12)",
      chipBorder: "rgba(82, 200, 126, 0.28)",
      chipText: "#84e4a8",
    },
  },
  {
    key: "industryDomain",
    title: "Industry / Domain",
    colors: {
      accent: "#e89050",
      chipBg: "rgba(232, 144, 80, 0.12)",
      chipBorder: "rgba(232, 144, 80, 0.28)",
      chipText: "#f4b880",
    },
  },
]

export default function ResultsPanel({ keywords }: ResultsPanelProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyAll = () => {
    const lines = CATEGORIES.flatMap(({ title, key }) => {
      const kws = keywords[key]
      if (kws.length === 0) return []
      return [`${title}:\n${kws.map((k) => `  • ${k}`).join("\n")}`]
    })
    navigator.clipboard.writeText(lines.join("\n\n")).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const totalCount = Object.values(keywords).flat().length

  return (
    <div className="anim-fade-up" style={{ marginTop: "32px" }}>
      {/* Header */}
      <div className="flex items-end justify-between" style={{ marginBottom: "24px" }}>
        <div>
          <p
            style={{
              fontFamily: "var(--font-poppins)",
              fontSize: "22px",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "#ede8dd",
              marginBottom: "6px",
            }}
          >
            Extracted Keywords
          </p>
          <div className="flex items-baseline gap-3">
            <span
              style={{
                fontFamily: "var(--font-poppins)",
                fontSize: "3rem",
                fontWeight: 600,
                letterSpacing: "-0.04em",
                color: "#ede8dd",
                lineHeight: 1,
              }}
            >
              {totalCount}
            </span>
            <span
              style={{
                fontFamily: "var(--font-poppins)",
                fontSize: "15px",
                fontWeight: 400,
                color: "#55556e",
              }}
            >
              terms identified
            </span>
          </div>
        </div>

        <button
          onClick={handleCopyAll}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            padding: "8px 16px",
            border: "1px solid #2a2a3a",
            borderRadius: "6px",
            backgroundColor: "transparent",
            fontFamily: "var(--font-poppins)",
            fontSize: "10px",
            fontWeight: 500,
            letterSpacing: "0",
            color: copied ? "#84e4a8" : "#55556e",
            cursor: "pointer",
            transition: "color 0.15s ease, border-color 0.15s ease",
          }}
          onMouseEnter={(e) => {
            if (!copied) {
              ;(e.currentTarget as HTMLButtonElement).style.color = "#ede8dd"
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = "#3a3a50"
            }
          }}
          onMouseLeave={(e) => {
            if (!copied) {
              ;(e.currentTarget as HTMLButtonElement).style.color = "#55556e"
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = "#2a2a3a"
            }
          }}
        >
          {copied ? (
            <>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              COPIED
            </>
          ) : (
            <>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              COPY ALL
            </>
          )}
        </button>
      </div>

      {/* Category grid */}
      <div
        className="category-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "16px",
        }}
      >
        {CATEGORIES.map(({ key, title, colors }, idx) => (
          <CategorySection
            key={key}
            title={title}
            keywords={keywords[key]}
            colors={colors}
            animDelay={idx * 70}
            fullWidth={idx === CATEGORIES.length - 1 && CATEGORIES.length % 2 !== 0}
          />
        ))}
      </div>
    </div>
  )
}
