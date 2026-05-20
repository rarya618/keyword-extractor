import Anthropic from "@anthropic-ai/sdk"
import mammoth from "mammoth"
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

const anthropic = new Anthropic()

const SCORING_SYSTEM_PROMPT = `You are a resume-to-job-listing matcher. Compare a candidate's resume against extracted job keywords and produce a structured match score.

Matching rules:
- Match case-insensitively and account for synonyms and abbreviations (e.g. "JS" = "JavaScript", "ML" = "Machine Learning", "CI/CD" = "continuous integration").
- A keyword is "matched" if the concept appears anywhere in the resume, even with slightly different phrasing.
- Do NOT invent matches. If the concept is absent, it is missing.
- Weights for overall score: requiredQualifications = 40%, technicalSkills = 30%, softSkills = 15%, niceToHave = 10%, industryDomain = 5%.
- Overall score = weighted sum of per-category scores, rounded to nearest integer.
- Per-category score = (matched count / total count) * 100, or 100 if the category has 0 keywords.

Output ONLY valid JSON matching this exact schema. No markdown, no explanation:

{
  "overallScore": <integer 0-100>,
  "categories": {
    "technicalSkills": { "matched": ["string"], "missing": ["string"], "score": <integer 0-100> },
    "softSkills": { "matched": ["string"], "missing": ["string"], "score": <integer 0-100> },
    "requiredQualifications": { "matched": ["string"], "missing": ["string"], "score": <integer 0-100> },
    "niceToHave": { "matched": ["string"], "missing": ["string"], "score": <integer 0-100> },
    "industryDomain": { "matched": ["string"], "missing": ["string"], "score": <integer 0-100> }
  },
  "suggestions": ["string", "string", "string"],
  "summary": "string"
}

For suggestions: write 3-5 concrete, resume-specific action items (e.g. "Add 'Kubernetes' to your technical skills — it appears as a required qualification"). Address missing required qualifications first, then technical skill gaps.
For summary: one sentence assessing fit (e.g. "Strong technical match with gaps in required qualifications around cloud infrastructure.").`

function isPdf(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
}

function isDocx(file: File): boolean {
  return (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.type === "application/octet-stream" ||
    file.name.toLowerCase().endsWith(".docx")
  )
}

export async function POST(request: NextRequest) {
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "Invalid multipart form data." }, { status: 400 })
  }

  const resumeFile = formData.get("resume") as File | null
  const keywordsRaw = formData.get("keywords") as string | null

  if (!resumeFile || !keywordsRaw) {
    return NextResponse.json({ error: "Missing resume file or keywords." }, { status: 400 })
  }

  if (resumeFile.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Resume must be under 5 MB." }, { status: 400 })
  }

  if (!isPdf(resumeFile) && !isDocx(resumeFile)) {
    return NextResponse.json({ error: "Only PDF and DOCX files are supported." }, { status: 400 })
  }

  let keywords: Record<string, string[]>
  try {
    keywords = JSON.parse(keywordsRaw)
  } catch {
    return NextResponse.json({ error: "Invalid keywords JSON." }, { status: 400 })
  }

  const buffer = Buffer.from(await resumeFile.arrayBuffer())

  let message: Anthropic.Message
  try {
    if (isPdf(resumeFile)) {
      // Send PDF directly to Claude — it natively reads PDFs as base64 documents
      const base64 = buffer.toString("base64")
      message = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        system: [
          {
            type: "text",
            text: SCORING_SYSTEM_PROMPT,
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: "application/pdf",
                  data: base64,
                },
              } as Anthropic.DocumentBlockParam,
              {
                type: "text",
                text: `<job_keywords>\n${JSON.stringify(keywords, null, 2)}\n</job_keywords>\n\nScore the resume (document above) against these job keywords.`,
              },
            ],
          },
        ],
      })
    } else {
      // DOCX: extract text with mammoth, then send as text
      let resumeText: string
      try {
        const result = await mammoth.extractRawText({ buffer })
        resumeText = result.value.slice(0, 12000)
      } catch {
        return NextResponse.json(
          { error: "Could not extract text from the DOCX file. Make sure it is a valid Word document." },
          { status: 422 }
        )
      }

      if (resumeText.trim().length < 50) {
        return NextResponse.json(
          { error: "Could not find enough text in the document. The file may be empty or image-based." },
          { status: 422 }
        )
      }

      message = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        system: [
          {
            type: "text",
            text: SCORING_SYSTEM_PROMPT,
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [
          {
            role: "user",
            content: `<job_keywords>\n${JSON.stringify(keywords, null, 2)}\n</job_keywords>\n\n<resume>\n${resumeText}\n</resume>\n\nScore the resume against these job keywords.`,
          },
        ],
      })
    }
  } catch (err) {
    console.error("Claude API error:", err)
    return NextResponse.json({ error: "Failed to score resume. Please try again." }, { status: 500 })
  }

  const raw = message.content[0].type === "text" ? message.content[0].text : ""
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim()

  let resumeScore: unknown
  try {
    resumeScore = JSON.parse(cleaned)
  } catch {
    return NextResponse.json({ error: "Failed to parse score response." }, { status: 500 })
  }

  const score = resumeScore as Record<string, unknown>
  if (typeof score.overallScore !== "number" || typeof score.categories !== "object") {
    return NextResponse.json({ error: "Unexpected response structure from scoring model." }, { status: 500 })
  }

  return NextResponse.json({ score: resumeScore })
}
