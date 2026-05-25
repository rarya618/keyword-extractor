"use client"

import { useState, useEffect, useCallback } from "react"
import { signInAnonymously, onAuthStateChanged } from "firebase/auth"
import { logEvent } from "firebase/analytics"
import { auth, initAnalytics } from "@/lib/firebase"
import { makeSnippet, saveAnalysis, loadAnalyses, type Analysis } from "@/lib/analyses"
import JobInput from "@/components/JobInput"
import ResultsPanel, { type KeywordResult } from "@/components/ResultsPanel"
import AnalysisHistory from "@/components/AnalysisHistory"
import ResumeScorer, { type ResumeScore } from "@/components/ResumeScorer"

export default function Home() {
  const [uid, setUid] = useState<string | null>(null)
  const [keywords, setKeywords] = useState<KeywordResult | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [history, setHistory] = useState<Analysis[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resumeScore, setResumeScore] = useState<ResumeScore | null>(null)
  const [submittedUrl, setSubmittedUrl] = useState<string | null>(null)
  const [jobMeta, setJobMeta] = useState<{ company: string | null; jobTitle: string | null } | null>(null)

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
    setResumeScore(null)
    setJobMeta(null)
    setSubmittedUrl(payload.url ?? null)

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
      if (data.meta) setJobMeta(data.meta)

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

  const nav = (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 32px",
      }}
    >
      <span
        onClick={() => {
          setKeywords(null)
          setActiveId(null)
          setResumeScore(null)
          setJobMeta(null)
          setSubmittedUrl(null)
          setError(null)
        }}
        style={{
          fontFamily: "var(--font-rubik)",
          fontSize: "22px",
          fontWeight: 700,
          letterSpacing: "-0.04em",
          color: "#ffffff",
          cursor: "pointer",
        }}
      >
        tailr
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {(jobMeta && (jobMeta.jobTitle || jobMeta.company)) && (
          <a
            href={submittedUrl ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontFamily: "var(--font-rubik)",
              fontSize: "13px",
              fontWeight: 500,
              color: "rgba(255,255,255,0.7)",
              textDecoration: "none",
              backgroundColor: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "999px",
              padding: "6px 14px",
              whiteSpace: "nowrap",
              maxWidth: "360px",
              overflow: "hidden",
              transition: "background-color 0.15s ease, color 0.15s ease",
              cursor: submittedUrl ? "pointer" : "default",
            }}
            onMouseEnter={(e) => {
              if (!submittedUrl) return
              const el = e.currentTarget as HTMLAnchorElement
              el.style.color = "#ffffff"
              el.style.backgroundColor = "rgba(255,255,255,0.15)"
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.color = "rgba(255,255,255,0.7)"
              el.style.backgroundColor = "rgba(255,255,255,0.1)"
            }}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
              {[jobMeta.company, jobMeta.jobTitle].filter(Boolean).join(" · ")}
            </span>
            {submittedUrl && (
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0, opacity: 0.6 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            )}
          </a>
        )}
      </div>
    </nav>
  )

  if (!keywords) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 24px",
        }}
      >
        {nav}

        {/* Title + subtitle */}
        <div className="anim-fade-up" style={{ textAlign: "center", marginBottom: "48px" }}>
          <h1
            style={{
              fontFamily: "var(--font-rubik)",
              fontSize: "clamp(2.2rem, 4vw, 3.4rem)",
              whiteSpace: "nowrap",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "#ffffff",
              marginBottom: "6px",
            }}
          >
            Surface what employers want
          </h1>
          <p
            style={{
              fontFamily: "var(--font-rubik)",
              fontSize: "16px",
              fontWeight: 400,
              fontSize: "20px",
              color: "rgba(255,255,255,0.65)",
              lineHeight: 1.6,
            }}
          >
            Paste a job listing or drop in a URL. Extract the exact language that belongs on your resume.
          </p>
        </div>

        {/* Form card */}
        <div
          className="anim-fade-up"
          style={{ width: "100%", maxWidth: "600px" }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              padding: "28px",
            }}
          >
            <JobInput onSubmit={handleExtract} loading={loading} error={error} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {nav}
    <div className="app-layout" style={{ marginTop: "64px" }}>
      {/* Main content */}
      <main className="app-main">
        <div className="app-main-inner app-main-inner--results">
          <ResultsPanel keywords={keywords} resumeScore={resumeScore} />
        </div>
      </main>

      {/* Resume scorer column */}
      <aside className="app-resume">
        <div style={{ padding: "32px 16px 16px" }}>
          <ResumeScorer keywords={keywords} onScore={setResumeScore} />
        </div>
      </aside>
    </div>
    </div>
  )
}
