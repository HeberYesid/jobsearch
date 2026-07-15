import { apiFetch, toDetail, writeError, API_BASE_URL, type RemotiveJob, type JobDetailResult } from "../helpers.js"

export interface DetailOpts {
  id: string
  format: "json" | "plain"
}

interface RemotiveResponse {
  jobs: RemotiveJob[]
  "job-count"?: number
}

function normalizeNumericId(input: string): number | null {
  const trimmed = input.trim()
  const num = parseInt(trimmed, 10)
  if (isNaN(num) || String(num) !== trimmed) return null
  return num
}

function renderPlain(job: JobDetailResult): string {
  const lines = [job.title, `${job.company ?? "—"} · ${job.location ?? "—"}`]

  const field = (label: string, value: string | null) => {
    if (value) lines.push(`${label}: ${value}`)
  }
  field("Posted", job.date && job.date.slice(0, 10))
  field("Category", job.category)
  field("Salary", job.salary)
  field("Tags", job.tags.length ? job.tags.join(", ") : null)

  lines.push("", job.description ?? "(no description)", "", `URL: ${job.url}`, `id: ${job.id}`)
  return lines.join("\n")
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  const numId = normalizeNumericId(opts.id)
  if (numId === null) {
    writeError(`invalid job id "${opts.id}" — must be a numeric ID`, "BAD_ID")
    return 1
  }

  try {
    const url = `${API_BASE_URL}?category=software-dev`
    const body = await apiFetch<RemotiveResponse>(url)
    const jobs = body?.jobs ?? []
    const job = jobs.find((j) => j.id === numId)

    if (!job) {
      writeError(`job with id ${numId} not found`, "NOT_FOUND")
      return 1
    }

    const detail = toDetail(job)

    if (opts.format === "plain") {
      const lines = [
        detail.title,
        `${detail.company || "—"} · ${detail.location || "—"}`,
        detail.date ? `Posted: ${detail.date.slice(0, 10)}` : "",
        detail.category ? `Category: ${detail.category}` : "",
        detail.salary ? `Salary: ${detail.salary}` : "",
        detail.tags.length ? `Tags: ${detail.tags.join(", ")}` : "",
        "",
        detail.description || "(no description)",
        "",
        `URL: ${detail.url}`,
        `id: ${detail.id}`,
      ].filter((l) => l !== "")
      process.stdout.write(lines.join("\n") + "\n")
    } else {
      process.stdout.write(JSON.stringify(detail, null, 2) + "\n")
    }
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "DETAIL_FAILED")
    return 1
  }
}
