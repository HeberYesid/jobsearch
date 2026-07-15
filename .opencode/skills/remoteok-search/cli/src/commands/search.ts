import { API_URL, apiFetch, normalizeJobs, toResult, writeError, type RemoteOkJob, type JobResult } from "../helpers.js"

export interface SearchOpts {
  query?: string
  tags: string[]
  jobage: number
  limit?: number
  format: "json" | "table" | "plain"
}

function shortDate(date: string | null): string {
  return date ? date.slice(0, 10) : "—"
}

function filterJobs(jobs: RemoteOkJob[], opts: SearchOpts): RemoteOkJob[] {
  let filtered = jobs

  if (opts.query) {
    const q = opts.query.toLowerCase()
    filtered = filtered.filter(
      (j) => j.title.toLowerCase().includes(q) || (j.company && j.company.toLowerCase().includes(q)),
    )
  }

  if (opts.tags.length > 0) {
    const lowerTags = opts.tags.map((t) => t.toLowerCase())
    filtered = filtered.filter((j) =>
      j.tags.some((t) => lowerTags.includes(t.toLowerCase())),
    )
  }

  if (opts.jobage > 0 && opts.jobage < 9999) {
    const cutoff = Date.now() - opts.jobage * 86400 * 1000
    filtered = filtered.filter((j) => {
      if (!j.date) return false
      const d = new Date(j.date).getTime()
      return !isNaN(d) && d >= cutoff
    })
  }

  return filtered
}

interface Column {
  header: string
  width: number
  cell: (r: JobResult) => string
}

function renderTable(rows: JobResult[]): string {
  if (rows.length === 0) return "No results."
  const columns: Column[] = [
    { header: "ID", width: Math.max(2, ...rows.map((r) => r.id.length)), cell: (r) => r.id },
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
      `  tags: ${r.tags.join(", ") || "—"}`,
      r.salary ? `  salary: ${r.salary}` : "",
      `  ${r.url}`,
    ].filter((l) => l !== "")
      .join("\n")
  return rows.map(block).join("\n\n")
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const raw = await apiFetch<Record<string, unknown>[]>(API_URL)
    const jobs = Array.isArray(raw) ? normalizeJobs(raw) : []
    const matched = filterJobs(jobs, opts)
    const rows = matched.slice(0, opts.limit ?? matched.length).map(toResult)

    if (opts.format === "table") {
      process.stdout.write(renderTable(rows) + "\n")
    } else if (opts.format === "plain") {
      process.stdout.write(renderPlain(rows) + "\n")
    } else {
      process.stdout.write(
        JSON.stringify(
          { meta: { count: rows.length, total: matched.length }, results: rows },
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
