"use client"

import { useState, useEffect, useCallback } from "react"
import { signInAnonymously, onAuthStateChanged } from "firebase/auth"
import { logEvent } from "firebase/analytics"
import { auth, initAnalytics } from "@/lib/firebase"
import { makeSnippet, saveAnalysis, loadAnalyses, type Analysis } from "@/lib/analyses"
import JobInput from "@/components/JobInput"
import ResultsPanel, { type KeywordResult } from "@/components/ResultsPanel"
import AnalysisHistory from "@/components/AnalysisHistory"
import ResumeScorer from "@/components/ResumeScorer"

export default function Home() {
  const [uid, setUid] = useState<string | null>(null)
  const [keywords, setKeywords] = useState<KeywordResult | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [history, setHistory] = useState<Analysis[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Anonymous auth + history load
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid)
        const analyses = await loadAnalyses(user.uid)
        setHistory(analyses)
      } else {
        await signInAnonymously(auth)
      }
    })
    initAnalytics()
    return unsub
  }, [])

  const refreshHistory = useCallback(async (userId: string) => {
    const analyses = await loadAnalyses(userId)
    setHistory(analyses)
  }, [])

  const handleExtract = async (payload: { jobListing?: string; url?: string }) => {
    setLoading(true)
    setError(null)
    setKeywords(null)
    setActiveId(null)

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.")
        return
      }

      const result: KeywordResult = data.keywords
      setKeywords(result)

      // Persist + analytics
      if (uid) {
        const { snippet, source } = makeSnippet(payload)
        const analytics = await initAnalytics()
        if (analytics) {
          logEvent(analytics, "extract_keywords", {
            source,
            keyword_count: Object.values(result).flat().length,
          })
        }
        await saveAnalysis(uid, { snippet, source, keywords: result })
        await refreshHistory(uid)
      }
    } catch {
      setError("Network error. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSelectHistory = (analysis: Analysis) => {
    setKeywords(analysis.keywords)
    setActiveId(analysis.id)
    setError(null)
  }

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="app-sidebar">
        {/* Header */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid #22222e",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-plex-mono)",
              fontSize: "11px",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#7878a0",
            }}
          >
            tailr
          </span>
          <div
            className="amber-pulse"
            style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#c28a28" }}
          />
        </div>

        {/* Input form */}
        <div style={{ padding: "24px" }}>
          <JobInput onSubmit={handleExtract} loading={loading} error={error} />
        </div>

        {/* History */}
        <AnalysisHistory
          analyses={history}
          activeId={activeId}
          onSelect={handleSelectHistory}
        />
      </aside>

      {/* Main content */}
      <main className="app-main">
        <div className={`app-main-inner${keywords ? " app-main-inner--results" : ""}`}>
          {/* Hero — hidden once results are available */}
          {!keywords && (
            <div className="anim-fade-up" style={{ marginBottom: "56px" }}>
              <h1
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "clamp(2.2rem, 4vw, 3.5rem)",
                  fontWeight: 300,
                  lineHeight: 1.08,
                  letterSpacing: "-0.02em",
                  marginBottom: "1.1rem",
                  color: "#e8e3d8",
                }}
              >
                Surface what<br />
                <span style={{ color: "#c28a28" }}>employers want.</span>
              </h1>
              <p
                style={{
                  color: "#9090a8",
                  maxWidth: "22rem",
                  lineHeight: 1.7,
                  fontSize: "14px",
                  fontWeight: 300,
                }}
              >
                Paste a job listing or drop in a URL. Extract the exact language that belongs on your resume.
              </p>
            </div>
          )}

          {/* Results */}
          {keywords && <ResultsPanel keywords={keywords} />}

          {/* Empty state */}
          {!keywords && !loading && (
            <div
              style={{
                borderTop: "1px solid #22222e",
                paddingTop: "40px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#3a3a50", flexShrink: 0 }} />
              <p
                style={{
                  fontFamily: "var(--font-plex-mono)",
                  fontSize: "11px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#3a3a50",
                }}
              >
                Awaiting input
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Resume scorer column */}
      <aside className="app-resume">
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid #22222e",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-plex-mono)",
              fontSize: "11px",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#7878a0",
            }}
          >
            Resume Score
          </span>
        </div>

        <div style={{ padding: "24px" }}>
          {keywords ? (
            <ResumeScorer keywords={keywords} />
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#3a3a50", flexShrink: 0 }} />
              <p
                style={{
                  fontFamily: "var(--font-plex-mono)",
                  fontSize: "11px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#3a3a50",
                }}
              >
                Extract keywords first
              </p>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
