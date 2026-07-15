import { API_URL, apiFetch, normalizeJobs, toDetail, writeError, type RemoteOkJob, type JobDetailResult } from "../helpers.js"

export interface DetailOpts {
  id: string
  format: "json" | "plain"
}

function normalizeId(input: string): string | null {
  const trimmed = input.trim()
  if (/^\d+$/.test(trimmed)) return trimmed
  const m = trimmed.match(/remoteok\.com.*[?&]id[=/](\d+)/i) || trimmed.match(/remoteok\.com.*[?&]remoteok[=/](\d+)/i) || trimmed.match(/(\d{4,})/)
  return m ? m[1] : null
}

function renderPlain(job: JobDetailResult): string {
  const lines = [job.title, `${job.company ?? "—"} · ${job.location ?? "—"}`]

  const field = (label: string, value: string | null) => {
    if (value) lines.push(`${label}: ${value}`)
  }
  field("Posted", job.date && job.date.slice(0, 10))
  field("Salary", job.salary)
  field("Tags", job.tags.length ? job.tags.join(", ") : null)

  lines.push("", job.description ?? "(no description)", "", `URL: ${job.url}`, `id: ${job.id}`)
  return lines.join("\n")
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  const id = normalizeId(opts.id)
  if (!id) {
    writeError(`could not parse a RemoteOK job ID from "${opts.id}"`, "BAD_ID")
    return 1
  }

  try {
    const raw = await apiFetch<Record<string, unknown>[]>(API_URL)
    const jobs = Array.isArray(raw) ? normalizeJobs(raw) : []
    const job = jobs.find((j) => j.id === id)
    if (!job) {
      writeError(`job with id "${id}" not found`, "NOT_FOUND")
      return 1
    }

    const detail = toDetail(job)

    if (opts.format === "plain") {
      process.stdout.write(renderPlain(detail) + "\n")
    } else {
      process.stdout.write(JSON.stringify(detail, null, 2) + "\n")
    }
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "DETAIL_FAILED")
    return 1
  }
}
