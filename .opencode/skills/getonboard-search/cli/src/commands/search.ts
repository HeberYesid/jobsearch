import { apiFetch, fetchCompanyNames, toResult, writeError, type GetOnBoardJob, type JobResult, type SearchResponse } from "../helpers.js"

export interface SearchOpts {
  query?: string
  jobage: number
  limit: number
  format: "json" | "table" | "plain"
  category?: string
  modality?: string
}

function buildUrl(opts: SearchOpts): string {
  const p = new URLSearchParams()
  p.set("query", opts.query || "a")
  p.set("per_page", String(Math.min(opts.limit, 100)))
  return `/search/jobs?${p.toString()}`
}

function shortDate(date: string | null): string {
  return date ? date.slice(0, 10) : "—"
}

interface Column {
  header: string
  width: number
  cell: (r: JobResult) => string
}

function renderTable(rows: JobResult[]): string {
  if (rows.length === 0) return "No results."
  const columns: Column[] = [
    { header: "TITLE", width: 38, cell: (r) => r.title },
    { header: "COMPANY", width: 22, cell: (r) => r.company ?? "—" },
    { header: "LOCATION", width: 16, cell: (r) => r.location ?? "—" },
    { header: "SALARY", width: 16, cell: (r) => r.salary ?? "—" },
    { header: "CATEGORY", width: 22, cell: (r) => r.category ?? "—" },
    { header: "DATE", width: 10, cell: (r) => shortDate(r.date) },
  ]
  const row = (cells: string[]) => cells.map((c, i) => c.slice(0, columns[i].width).padEnd(columns[i].width)).join("  ")

  const header = row(columns.map((c) => c.header))
  const body = rows.map((r) => row(columns.map((c) => c.cell(r))))
  return [header, "-".repeat(header.length), ...body].join("\n")
}

function renderPlain(rows: JobResult[]): string {
  if (rows.length === 0) return "No results."
  const block = (r: JobResult) =>
    [
      r.title,
      `  ${r.company ?? "—"} · ${r.location ?? "—"} · ${shortDate(r.date)}`,
      r.salary ? `  ${r.salary}` : "",
      r.category ? `  ${r.category}` : "",
      r.modality ? `  ${r.modality}` : "",
      `  ${r.url}`,
    ]
      .filter((l) => l !== "")
      .join("\n")
  return rows.map(block).join("\n\n")
}

function matchesModality(job: GetOnBoardJob["attributes"], modality: string | undefined): boolean {
  if (!modality) return true
  const m = modality.toLowerCase()
  const rm = (job.remote_modality || "").toLowerCase()
  if (m === "remote") return rm.includes("remote") || job.remote === true
  if (m === "hybrid") return rm === "hybrid"
  if (m === "onsite") return rm === "onsite" || (job.remote === false && rm !== "hybrid")
  return true
}

function matchesCategory(job: GetOnBoardJob["attributes"], category: string | undefined): boolean {
  if (!category) return true
  const jc = (job.category_name || "").toLowerCase()
  const c = category.toLowerCase().replace(/-/g, " ")
  return jc.includes(c) || c.includes(jc)
}

function matchesJobage(publishedAt: number | null, maxDays: number): boolean {
  if (maxDays >= 9999) return true
  if (publishedAt == null) return false
  const age = (Date.now() / 1000) - publishedAt
  return age <= maxDays * 86400
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const url = buildUrl(opts)
    const response = await apiFetch<SearchResponse>(url)
    const jobs = response?.data ?? []

    let filtered = jobs.filter((j) => {
      if (!matchesJobage(j.attributes.published_at, opts.jobage)) return false
      if (!matchesCategory(j.attributes, opts.category)) return false
      if (!matchesModality(j.attributes, opts.modality)) return false
      return true
    })

    if (opts.limit > 0) filtered = filtered.slice(0, opts.limit)

    const companyMap = await fetchCompanyNames(
      filtered.map((j) => ({ id: j.attributes.company.data.id })),
    )

    const rows = filtered.map((j) => toResult(j, companyMap.get(j.attributes.company.data.id) ?? null))

    if (opts.format === "table") {
      process.stdout.write(renderTable(rows) + "\n")
    } else if (opts.format === "plain") {
      process.stdout.write(renderPlain(rows) + "\n")
    } else {
      process.stdout.write(
        JSON.stringify(
          {
            meta: {
              count: rows.length,
              total_pages: response?.meta?.total_pages ?? 0,
            },
            results: rows,
          },
          null,
          2,
        ) + "\n",
      )
    }
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "SEARCH_FAILED")
    return 1
  }
}
