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
        <div className="col-header">
          <span
            style={{
              fontFamily: "var(--font-poppins)",
              fontSize: "16px",
              letterSpacing: "0.04em",
              fontWeight: 600,
              color: "#ede8dd",
            }}
          >
            tailr
          </span>
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
                  fontFamily: "var(--font-poppins)",
                  fontSize: "clamp(2.6rem, 4vw, 3.8rem)",
                  fontWeight: 500,
                  lineHeight: 1.08,
                  letterSpacing: "-0.03em",
                  marginBottom: "1.1rem",
                  color: "#ede8dd",
                }}
              >
                Surface what<br />
                <span style={{ color: "#5fa8f0", fontWeight: 600 }}>employers want.</span>
              </h1>
              <p
                style={{
                  color: "#8a8aa8",
                  maxWidth: "26rem",
                  lineHeight: 1.7,
                  fontSize: "15px",
                  fontWeight: 400,
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
                borderTop: "1px solid #1e1e2a",
                paddingTop: "40px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#1e1e2a", flexShrink: 0 }} />
              <p
                style={{
                  fontFamily: "var(--font-poppins)",
                  fontSize: "11px",
                  letterSpacing: "0",
                  textTransform: "uppercase",
                  color: "#32324a",
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
        <div className="col-header" style={{ borderBottom: "none", paddingBottom: "8px" }}>
          <span
            style={{
              fontFamily: "var(--font-poppins)",
              fontSize: "22px",
              letterSpacing: "-0.02em",
              fontWeight: 600,
              color: "#ede8dd",
            }}
          >
            Resume Score
          </span>
        </div>

        <div style={{ padding: "12px 24px 24px" }}>
          {keywords ? (
            <ResumeScorer keywords={keywords} />
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#1e1e2a", flexShrink: 0 }} />
              <p
                style={{
                  fontFamily: "var(--font-poppins)",
                  fontSize: "11px",
                  letterSpacing: "0",
                  textTransform: "uppercase",
                  color: "#32324a",
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
