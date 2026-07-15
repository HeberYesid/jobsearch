import { apiGet, toResult, writeError, type FreehireJob, type JobResult } from "../helpers.js"

export interface SearchOpts {
  query?: string
  jobage: number
  page: number
  limit: number
  format: "json" | "table" | "plain"
  regions: string[]
  countries: string[]
  cities: string[]
  seniority: string[]
  category: string[]
  skills: string[]
  company?: string
  workMode?: string
  facets: Record<string, string[]>
}

function buildQuery(opts: SearchOpts): URLSearchParams {
  const p = new URLSearchParams()
  if (opts.query) p.set("q", opts.query)
  p.set("limit", String(opts.limit))
  p.set("offset", String((opts.page - 1) * opts.limit))
  p.set("semantic_ratio", "0")
  if (opts.jobage > 0 && opts.jobage < 9999) p.set("posted_within_days", String(opts.jobage))
  if (opts.workMode) p.set("work_mode", opts.workMode)
  if (opts.company) p.set("company_slug", opts.company)

  const facets: Array<[string, string[]]> = [
    ["regions", opts.regions],
    ["countries", opts.countries],
    ["cities", opts.cities],
    ["seniority", opts.seniority],
    ["category", opts.category],
    ["skills", opts.skills],
    ...Object.entries(opts.facets),
  ]
  for (const [param, values] of facets) {
    for (const value of values) p.append(param, value)
  }
  return p
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
    { header: "SLUG", width: Math.max(4, ...rows.map((r) => r.id.length)), cell: (r) => r.id },
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
      `  slug: ${r.id}`,
      `  ${r.url}`,
    ].join("\n")
  return rows.map(block).join("\n\n")
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const env = await apiGet<FreehireJob[]>(`/api/v1/jobs/search?${buildQuery(opts).toString()}`)
    const jobs = env?.data ?? []
    const rows = jobs.map(toResult)
    const total = env?.meta?.total ?? rows.length

    if (opts.format === "table") {
      process.stdout.write(renderTable(rows) + "\n")
    } else if (opts.format === "plain") {
      process.stdout.write(renderPlain(rows) + "\n")
    } else {
      process.stdout.write(
        JSON.stringify(
          { meta: { count: rows.length, page: opts.page, total }, results: rows },
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
