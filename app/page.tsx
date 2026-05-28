"use client"

import { useState, useEffect, useCallback } from "react"
import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth"
import { auth, googleProvider } from "@/lib/firebase"
import { logAppEvent } from "@/lib/analytics"
import { makeSnippet, saveAnalysis, addResumeScore, loadAnalyses, type Analysis } from "@/lib/analyses"
import JobInput from "@/components/JobInput"
import ResultsPanel, { type KeywordResult } from "@/components/ResultsPanel"
import AnalysisHistory from "@/components/AnalysisHistory"
import ResumeScorer, { type ResumeScore } from "@/components/ResumeScorer"

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [uid, setUid] = useState<string | null>(null)
  const [keywords, setKeywords] = useState<KeywordResult | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [history, setHistory] = useState<Analysis[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resumeScore, setResumeScore] = useState<ResumeScore | null>(null)
  const [submittedUrl, setSubmittedUrl] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [jobMeta, setJobMeta] = useState<{ company: string | null; jobTitle: string | null } | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      setUid(u?.uid ?? null)
      if (u) {
        const analyses = await loadAnalyses(u.uid)
        setHistory(analyses)
      } else {
        setHistory([])
      }
    })
    logAppEvent({ name: "app_open" })
    return unsub
  }, [])

  const refreshHistory = useCallback(async (userId: string) => {
    const analyses = await loadAnalyses(userId)
    setHistory(analyses)
  }, [])

  const handleSignIn = async () => {
    await signInWithPopup(auth, googleProvider)
  }

  const handleSignOut = async () => {
    await signOut(auth)
    setKeywords(null)
    setActiveId(null)
    setResumeScore(null)
    setJobMeta(null)
    setSubmittedUrl(null)
    setError(null)
    setHistory([])
  }

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
        const { source } = makeSnippet(payload)
        logAppEvent({ name: "extract_error", source })
        return
      }

      const result: KeywordResult = data.keywords
      setKeywords(result)
      const meta = data.meta ?? { company: null, jobTitle: null }
      if (data.meta) setJobMeta(data.meta)

      const { source } = makeSnippet(payload)
      logAppEvent({ name: "extract_keywords", source, keyword_count: Object.values(result).flat().length })

      if (uid && user) {
        const { snippet } = makeSnippet(payload)
        const newId = await saveAnalysis(uid, { snippet, source, keywords: result, company: meta.company, jobTitle: meta.jobTitle })
        setActiveId(newId)
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
    setJobMeta({ company: analysis.company, jobTitle: analysis.jobTitle })
    setSubmittedUrl(analysis.source === "url" ? analysis.snippet : null)
    setError(null)
    const latest = analysis.resumeScores.at(-1)
    setResumeScore(latest?.score ?? null)
    logAppEvent({ name: "history_item_selected", source: analysis.source })
  }

  const logoClickHandler = () => {
    setKeywords(null)
    setActiveId(null)
    setResumeScore(null)
    setJobMeta(null)
    setSubmittedUrl(null)
    setError(null)
  }

  const nav = (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 32px",
        flexShrink: 0,
        position: "relative",
        zIndex: 10,
      }}
    >
      {user ? (
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => setSidebarOpen(true)}
            title="Open sidebar"
            className="app-sidebar-toggle"
            style={{
              display: sidebarOpen ? "none" : "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "rgba(255,255,255,0.5)",
              padding: "4px",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#ffffff" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.5)" }}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
          {!sidebarOpen && (
            <span
              onClick={logoClickHandler}
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
          )}
        </div>
      ) : (
        <span
          onClick={logoClickHandler}
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
      )}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginLeft: "auto" }}>
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
            {jobMeta.company && (
              <span className="job-meta-company">
                {jobMeta.company}{jobMeta.jobTitle ? " · " : ""}
              </span>
            )}
            {jobMeta.jobTitle && <span>{jobMeta.jobTitle}</span>}
            {submittedUrl && (
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0, opacity: 0.6 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            )}
          </a>
        )}

        {!user ? (
          <button
            onClick={handleSignIn}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontFamily: "var(--font-rubik)",
              fontSize: "13px",
              fontWeight: 500,
              color: "rgba(255,255,255,0.8)",
              backgroundColor: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "999px",
              padding: "6px 14px",
              cursor: "pointer",
              transition: "background-color 0.15s ease, color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.backgroundColor = "rgba(255,255,255,0.14)"
              el.style.color = "#ffffff"
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.backgroundColor = "rgba(255,255,255,0.08)"
              el.style.color = "rgba(255,255,255,0.8)"
            }}
          >
            Sign in
          </button>
        ) : user && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "999px",
            padding: "6px 10px 6px 14px",
          }}>
{user.displayName && (
              <span style={{
                fontFamily: "var(--font-rubik)",
                fontSize: "13px",
                fontWeight: 500,
                color: "rgba(255,255,255,0.8)",
                whiteSpace: "nowrap",
              }}>
                {user.displayName}
              </span>
            )}
            <button
              onClick={handleSignOut}
              title="Sign out"
              style={{
                display: "flex",
                alignItems: "center",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "2px",
                color: "rgba(255,255,255,0.3)",
                transition: "color 0.15s ease",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)" }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.3)" }}
            >
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </nav>
  )

  const sidebar = user ? (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={() => setSidebarOpen(false)}
        style={{
          display: "none",
          position: "fixed",
          inset: 0,
          zIndex: 199,
          background: "rgba(0,0,0,0.4)",
          opacity: sidebarOpen ? 1 : 0,
          pointerEvents: sidebarOpen ? "auto" : "none",
          transition: "opacity 0.28s ease",
        }}
        className="app-sidebar-backdrop"
      />
      <aside
        className="app-sidebar"
        style={{
          width: sidebarOpen ? "240px" : "0px",
          minWidth: 0,
          borderRight: sidebarOpen ? "1px solid rgba(255,255,255,0.07)" : "none",
          borderLeft: "none",
          overflow: "hidden",
          transition: "width 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div style={{
          width: "240px",
          opacity: sidebarOpen ? 1 : 0,
          transition: "opacity 0.2s ease",
          pointerEvents: sidebarOpen ? "auto" : "none",
        }}>
          <div style={{ padding: "20px 16px 8px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span
              onClick={logoClickHandler}
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
            <button
              onClick={() => setSidebarOpen(false)}
              className="app-sidebar-close"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "rgba(255,255,255,0.5)",
                padding: "4px",
                transition: "color 0.15s ease",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#ffffff" }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.5)" }}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <AnalysisHistory analyses={history} activeId={activeId} onSelect={handleSelectHistory} />
        </div>
      </aside>
    </>
  ) : null

  if (!keywords) {
    return (
      <div className="app-layout">
        {sidebar}
        <div className="app-right">
          {nav}
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px 24px",
            overflow: "auto",
          }}>
            {/* Title + subtitle */}
            <div className="anim-fade-up" style={{ textAlign: "center", marginBottom: "48px" }}>
              <h1
                style={{
                  fontFamily: "var(--font-rubik)",
                  fontSize: "clamp(2.2rem, 4vw, 3.4rem)",
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
            <div className="anim-fade-up" style={{ width: "100%", maxWidth: "600px" }}>
              <div style={{ background: "#ffffff", borderRadius: "14px", padding: "28px" }}>
                <JobInput onSubmit={handleExtract} loading={loading} error={error} />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-layout">
      {sidebar}
      <div className="app-right">
        {nav}
        <div className="app-content-row">
          {/* Main content */}
          <main className="app-main">
            <div className="app-main-inner app-main-inner--results">
              <ResultsPanel keywords={keywords} resumeScore={resumeScore} />
            </div>
          </main>

          {/* Resume scorer column */}
          <aside className="app-resume">
            <div style={{ padding: "32px 16px 16px" }}>
              <ResumeScorer
                keywords={keywords}
                scoreHistory={history.find(a => a.id === activeId)?.resumeScores ?? []}
                onScore={async (score) => {
                  setResumeScore(score)
                  if (uid && user && activeId) {
                    await addResumeScore(uid, activeId, score)
                    await refreshHistory(uid)
                  }
                }}
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
