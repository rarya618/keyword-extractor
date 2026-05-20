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
      accent: "#5a9fe8",
      chipBg: "rgba(90, 159, 232, 0.1)",
      chipBorder: "rgba(90, 159, 232, 0.35)",
      chipText: "#90c4ff",
    },
  },
  {
    key: "requiredQualifications",
    title: "Required",
    colors: {
      accent: "#e06060",
      chipBg: "rgba(224, 96, 96, 0.1)",
      chipBorder: "rgba(224, 96, 96, 0.35)",
      chipText: "#f09898",
    },
  },
  {
    key: "softSkills",
    title: "Soft Skills",
    colors: {
      accent: "#a888e8",
      chipBg: "rgba(168, 136, 232, 0.1)",
      chipBorder: "rgba(168, 136, 232, 0.35)",
      chipText: "#c8aaff",
    },
  },
  {
    key: "niceToHave",
    title: "Nice to Have",
    colors: {
      accent: "#50c07a",
      chipBg: "rgba(80, 192, 122, 0.1)",
      chipBorder: "rgba(80, 192, 122, 0.35)",
      chipText: "#7edad8",
    },
  },
  {
    key: "industryDomain",
    title: "Industry / Domain",
    colors: {
      accent: "#e08844",
      chipBg: "rgba(224, 136, 68, 0.1)",
      chipBorder: "rgba(224, 136, 68, 0.35)",
      chipText: "#f0b070",
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
              fontFamily: "var(--font-plex-mono)",
              fontSize: "10px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#62627a",
              marginBottom: "6px",
            }}
          >
            Extracted Keywords
          </p>
          <div className="flex items-baseline gap-3">
            <span
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "2.4rem",
                fontWeight: 300,
                letterSpacing: "-0.03em",
                color: "#e8e3d8",
                lineHeight: 1,
              }}
            >
              {totalCount}
            </span>
            <span
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "1rem",
                fontWeight: 300,
                color: "#7878a0",
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
            padding: "8px 14px",
            border: "1px solid #2e2e3c",
            borderRadius: "7px",
            backgroundColor: "transparent",
            fontFamily: "var(--font-plex-mono)",
            fontSize: "11px",
            letterSpacing: "0.1em",
            color: copied ? "#50c07a" : "#7878a0",
            cursor: "pointer",
            transition: "color 0.15s ease, border-color 0.15s ease",
          }}
          onMouseEnter={(e) => {
            if (!copied) {
              ;(e.currentTarget as HTMLButtonElement).style.color = "#e8e3d8"
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = "#4a4a62"
            }
          }}
          onMouseLeave={(e) => {
            if (!copied) {
              ;(e.currentTarget as HTMLButtonElement).style.color = "#7878a0"
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = "#2e2e3c"
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
          gap: "14px",
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
