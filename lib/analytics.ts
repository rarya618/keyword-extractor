import { logEvent } from "firebase/analytics"
import { initAnalytics } from "./firebase"

type AppEvent =
  | { name: "app_open" }
  | { name: "extract_keywords"; source: "paste" | "url"; keyword_count: number }
  | { name: "extract_error"; source: "paste" | "url" }
  | { name: "resume_scored"; overall_score: number; file_type: string }
  | { name: "resume_score_error" }
  | { name: "history_item_selected"; source: "paste" | "url" }

export async function logAppEvent(event: AppEvent): Promise<void> {
  const analytics = await initAnalytics()
  if (!analytics) return
  const { name, ...params } = event
  logEvent(analytics, name, params)
}
