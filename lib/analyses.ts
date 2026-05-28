import { db } from "./firebase"
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  arrayUnion,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore"
import type { KeywordResult } from "@/components/ResultsPanel"
import type { ResumeScore } from "@/components/ResumeScorer"

export interface ScoredResume {
  id: string
  createdAt: string  // ISO string (serverTimestamp can't be used inside arrayUnion)
  score: ResumeScore
}

export interface Analysis {
  id: string
  createdAt: Date
  snippet: string
  source: "paste" | "url"
  keywords: KeywordResult
  company: string | null
  jobTitle: string | null
  resumeScores: ScoredResume[]
}

export function makeSnippet(payload: { jobListing?: string; url?: string }): {
  snippet: string
  source: "paste" | "url"
} {
  if (payload.url) {
    return { snippet: payload.url, source: "url" }
  }
  const text = (payload.jobListing ?? "").trim().replace(/\s+/g, " ")
  return { snippet: text.slice(0, 72), source: "paste" }
}

export async function saveAnalysis(
  uid: string,
  data: { snippet: string; source: "paste" | "url"; keywords: KeywordResult; company: string | null; jobTitle: string | null }
): Promise<string> {
  const ref = collection(db, "analyses", uid, "results")
  const docRef = await addDoc(ref, { ...data, resumeScores: [], createdAt: serverTimestamp() })
  return docRef.id
}

export async function addResumeScore(uid: string, analysisId: string, resumeScore: ResumeScore): Promise<ScoredResume> {
  const entry: ScoredResume = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    score: resumeScore,
  }
  const ref = doc(db, "analyses", uid, "results", analysisId)
  await updateDoc(ref, { resumeScores: arrayUnion(entry) })
  return entry
}

export async function loadAnalyses(uid: string): Promise<Analysis[]> {
  const ref = collection(db, "analyses", uid, "results")
  const q = query(ref, orderBy("createdAt", "desc"), limit(20))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({
    id: d.id,
    createdAt: (d.data().createdAt?.toDate() as Date | undefined) ?? new Date(),
    snippet: d.data().snippet as string,
    source: d.data().source as "paste" | "url",
    keywords: d.data().keywords as KeywordResult,
    company: (d.data().company as string | null) ?? null,
    jobTitle: (d.data().jobTitle as string | null) ?? null,
    resumeScores: (d.data().resumeScores as ScoredResume[] | undefined) ?? [],
  }))
}
