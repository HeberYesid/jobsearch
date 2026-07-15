import { apiFetch, toResult, writeError, API_BASE_URL, type RemotiveJob, type JobResult } from "../helpers.js"

export interface SearchOpts {
  query?: string
  jobage?: number
  limit?: number
  format: "json" | "table" | "plain"
  category?: string
}

interface RemotiveResponse {
  jobs: RemotiveJob[]
  "job-count"?: number
}

function shortDate(date: string | null): string {
  return date ? date.slice(0, 10) : "—"
}

function filterByQuery(jobs: RemotiveJob[], query: string): RemotiveJob[] {
  const q = query.toLowerCase()
  return jobs.filter(
    (j) =>
      j.title.toLowerCase().includes(q) ||
      (j.company_name && j.company_name.toLowerCase().includes(q)),
  )
}

function filterByJobage(jobs: RemotiveJob[], days: number): RemotiveJob[] {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  return jobs.filter((j) => {
    if (!j.publication_date) return true
    return new Date(j.publication_date) >= cutoff
  })
}

interface Column {
  header: string
  width: number
  cell: (r: JobResult) => string
}

function renderTable(rows: JobResult[]): string {
  if (rows.length === 0) return "No results."
  const columns: Column[] = [
    { header: "ID", width: Math.max(2, ...rows.map((r) => String(r.id).length)), cell: (r) => String(r.id) },
    { header: "TITLE", width: 38, cell: (r) => r.title },
    { header: "COMPANY", width: 22, cell: (r) => r.company ?? "—" },
    { header: "LOCATION", width: 20, cell: (r) => r.location ?? "—" },
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
      `  id: ${r.id}`,
      `  ${r.url}`,
    ].join("\n")
  return rows.map(block).join("\n\n")
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const category = opts.category || "software-dev"
    const url = `${API_BASE_URL}?category=${encodeURIComponent(category)}`
    const body = await apiFetch<RemotiveResponse>(url)
    const jobs = body?.jobs ?? []

    let filtered = jobs
    if (opts.query) {
      filtered = filterByQuery(filtered, opts.query)
    }
    if (opts.jobage !== undefined && opts.jobage > 0) {
      filtered = filterByJobage(filtered, opts.jobage)
    }

    const total = filtered.length
    const limited = opts.limit ? filtered.slice(0, opts.limit) : filtered
    const rows = limited.map(toResult)

    if (opts.format === "table") {
      process.stdout.write(renderTable(rows) + "\n")
    } else if (opts.format === "plain") {
      process.stdout.write(renderPlain(rows) + "\n")
    } else {
      process.stdout.write(
        JSON.stringify(
          { meta: { count: rows.length, total }, results: rows },
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
