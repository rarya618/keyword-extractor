import Anthropic from "@anthropic-ai/sdk"
import * as cheerio from "cheerio"
import { NextRequest, NextResponse } from "next/server"

const anthropic = new Anthropic()

const SYSTEM_PROMPT = `You are a resume-tailoring assistant. Extract and categorize keywords from job listings so candidates can mirror the employer's language in their resumes.

Rules:
- Extract ONLY keywords present or strongly implied in the listing. Do not add extras.
- Keep wording close to the original. Preserve acronyms (CI/CD, REST APIs).
- Normalize minor variations: "React.js" and "ReactJS" → "React".
- Hard skills → technicalSkills. Interpersonal/behavioral traits → softSkills.
- Use the listing's own signals ("required", "must have", "preferred", "bonus") to separate required vs. nice-to-have.
- industryDomain: vertical, compliance frameworks, business model (e.g. "FinTech", "HIPAA", "B2B SaaS").
- Return ONLY valid JSON with these exact keys. No markdown, no explanation.

Schema:
{
  "technicalSkills": ["string"],
  "softSkills": ["string"],
  "requiredQualifications": ["string"],
  "niceToHave": ["string"],
  "industryDomain": ["string"]
}

If a category has no relevant keywords, return an empty array for that key. Do not omit keys.`

async function fetchJobTextFromUrl(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; KeywordExtractor/1.0)",
      "Accept": "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(10000),
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch URL: ${res.status} ${res.statusText}`)
  }

  const contentType = res.headers.get("content-type") ?? ""
  if (!contentType.includes("text/html")) {
    throw new Error("URL does not point to an HTML page")
  }

  const html = await res.text()
  const $ = cheerio.load(html)

  // Remove non-content elements
  $("script, style, nav, header, footer, aside, [role='banner'], [role='navigation'], [role='complementary']").remove()

  // Try to find the main job content area first
  const contentSelectors = [
    "[data-testid='job-description']",
    ".job-description",
    ".jobDescriptionContent",
    "#job-description",
    "main",
    "article",
    ".content",
    "#content",
  ]

  let text = ""
  for (const sel of contentSelectors) {
    const el = $(sel).first()
    if (el.length) {
      text = el.text()
      break
    }
  }

  if (!text) {
    text = $("body").text()
  }

  // Collapse whitespace
  return text.replace(/\s+/g, " ").trim()
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { jobListing, url } = body as { jobListing?: unknown; url?: unknown }

  let text: string

  if (url) {
    if (typeof url !== "string") {
      return NextResponse.json({ error: "url must be a string" }, { status: 400 })
    }
    try {
      new URL(url) // validate URL format
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
    }
    try {
      text = await fetchJobTextFromUrl(url)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not fetch the URL"
      return NextResponse.json({ error: msg }, { status: 400 })
    }
  } else if (jobListing) {
    if (typeof jobListing !== "string") {
      return NextResponse.json({ error: "jobListing must be a string" }, { status: 400 })
    }
    text = jobListing.trim()
  } else {
    return NextResponse.json({ error: "Provide either a job listing or a URL" }, { status: 400 })
  }

  if (text.length < 50) {
    return NextResponse.json({ error: "Job listing is too short to extract keywords from" }, { status: 400 })
  }

  const capped = text.slice(0, 15000)

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Extract keywords from this job listing:\n\n<job_listing>\n${capped}\n</job_listing>`,
        },
      ],
    })

    const raw = message.content[0].type === "text" ? message.content[0].text : ""
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim()
    const keywords = JSON.parse(cleaned)

    return NextResponse.json({ keywords })
  } catch (e) {
    console.error("Extraction error:", e)
    return NextResponse.json({ error: "Failed to extract keywords. Please try again." }, { status: 500 })
  }
}
