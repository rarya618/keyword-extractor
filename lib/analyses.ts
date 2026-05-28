import { db } from "./firebase"
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore"
import type { KeywordResult } from "@/components/ResultsPanel"

export interface Analysis {
  id: string
  createdAt: Date
  snippet: string
  source: "paste" | "url"
  keywords: KeywordResult
  company: string | null
  jobTitle: string | null
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
): Promise<void> {
  const ref = collection(db, "analyses", uid, "results")
  await addDoc(ref, { ...data, createdAt: serverTimestamp() })
}

export async function loadAnalyses(uid: string): Promise<Analysis[]> {
  const ref = collection(db, "analyses", uid, "results")
  const q = query(ref, orderBy("createdAt", "desc"), limit(20))
  const snap = await getDocs(q)
  return snap.docs.map((doc) => ({
    id: doc.id,
    createdAt: (doc.data().createdAt?.toDate() as Date | undefined) ?? new Date(),
    snippet: doc.data().snippet as string,
    source: doc.data().source as "paste" | "url",
    keywords: doc.data().keywords as KeywordResult,
    company: (doc.data().company as string | null) ?? null,
    jobTitle: (doc.data().jobTitle as string | null) ?? null,
  }))
}
