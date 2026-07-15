import { apiFetch, fetchCompanyNames, toDetail, writeError, type GetOnBoardJob, type JobDetailResult, type SearchResponse } from "../helpers.js"

export interface DetailOpts {
  id: string
  format: "json" | "plain"
}

function normalizeId(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const m = trimmed.match(/\/jobs\/([^/?#]+)/)
  if (m) return m[1]
  if (/^[a-z0-9][a-z0-9-]*$/i.test(trimmed)) return trimmed
  return null
}

function renderPlain(job: JobDetailResult): string {
  const lines = [job.title, `${job.company ?? "—"} · ${job.location ?? "—"}`]

  const field = (label: string, value: string | null | undefined) => {
    if (value) lines.push(`${label}: ${value}`)
  }
  field("Posted", job.date && job.date.slice(0, 10))
  field("Salary", job.salary)
  field("Category", job.category)
  field("Modality", job.modality)
  field("Country", job.countries.length ? job.countries.join(", ") : null)
  field("Applications", job.applications_count != null ? String(job.applications_count) : null)

  if (job.description_headline) lines.push("", job.description_headline)
  lines.push("", job.description ?? "(no description)", "", `URL: ${job.url}`, `id: ${job.id}`)
  return lines.join("\n")
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  const slug = normalizeId(opts.id)
  if (!slug) {
    writeError(`could not parse a job slug from "${opts.id}"`, "BAD_ID")
    return 1
  }
  try {
    const words = slug.split("-").filter((w) => w.length > 1).slice(0, 5).join(" ")
    const query = words || slug.slice(0, 20)
    const response = await apiFetch<SearchResponse>(`/search/jobs?query=${encodeURIComponent(query)}&per_page=120`)
    if (!response) {
      writeError("API request failed", "API_FAILED")
      return 1
    }
    const job = response.data.find((j) => j.id === slug)
    if (!job) {
      writeError(`job "${slug}" not found`, "NOT_FOUND")
      return 1
    }

    const companyMap = await fetchCompanyNames([{ id: job.attributes.company.data.id }])
    const detail = toDetail(job, companyMap.get(job.attributes.company.data.id) ?? null)

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
