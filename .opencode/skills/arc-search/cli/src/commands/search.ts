import {
  SEARCH_URL,
  htmlFetch,
  parseJobCards,
  writeError,
  type ArcJob,
} from "../helpers.js"

export interface SearchOpts {
  query?: string
  jobage?: number
  skill?: string
  limit?: number
  format: "json" | "table" | "plain"
}

function buildUrl(opts: SearchOpts): string {
  const params = new URLSearchParams()
  if (opts.query) params.set("q", opts.query)
  return `${SEARCH_URL}?${params.toString()}`
}

function jobAgeFilter(date: string | null, maxDays: number): boolean {
  if (!date || maxDays <= 0) return true
  const ts = Date.parse(date)
  if (isNaN(ts)) return true
  return (Date.now() - ts) / 86_400_000 <= maxDays
}

function skillFilter(tags: string[], skill: string | undefined): boolean {
  if (!skill) return true
  const lower = skill.toLowerCase()
  return tags.some((t) => t.toLowerCase().includes(lower))
}

function queryFilter(job: ArcJob, query: string | undefined): boolean {
  if (!query) return true
  const q = query.toLowerCase()
  return (
    job.title.toLowerCase().includes(q) ||
    (job.company ?? "").toLowerCase().includes(q) ||
    job.tags.some((t) => t.toLowerCase().includes(q)) ||
    (job.description ?? "").toLowerCase().includes(q) ||
    (job.location ?? "").toLowerCase().includes(q)
  )
}

function renderTable(cards: ArcJob[]): string {
  if (cards.length === 0) return "No results."
  const rows = cards.map((c) => {
    const title = (c.title || "").slice(0, 42).padEnd(42)
    const company = (c.company || "—").slice(0, 24).padEnd(24)
    const loc = (c.location || "—").slice(0, 20).padEnd(20)
    const tags = (c.tags.length > 0 ? c.tags.slice(0, 3).join(", ") : "—").slice(0, 28).padEnd(28)
    return `${c.id.padEnd(34)} ${title} ${company} ${loc} ${tags}`
  })
  const header =
    "ID".padEnd(34) +
    " " +
    "TITLE".padEnd(42) +
    " " +
    "COMPANY".padEnd(24) +
    " " +
    "LOCATION".padEnd(20) +
    " " +
    "TAGS".padEnd(28)
  return [header, "-".repeat(header.length), ...rows].join("\n")
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const html = await htmlFetch(buildUrl(opts))
    let cards = parseJobCards(html)

    cards = cards.filter((c) => queryFilter(c, opts.query))
    cards = cards.filter((c) => skillFilter(c.tags, opts.skill))
    const maxAge = opts.jobage
    if (maxAge !== undefined) {
      cards = cards.filter((c) => jobAgeFilter(c.date, maxAge))
    }
    if (opts.limit !== undefined && opts.limit >= 0) cards = cards.slice(0, opts.limit)

    if (opts.format === "table") {
      process.stdout.write(renderTable(cards) + "\n")
    } else if (opts.format === "plain") {
      process.stdout.write(
        cards
          .map(
            (c) =>
              `${c.title}\n  ${c.company || "—"} · ${c.location || "—"} · ${c.date || "—"}\n  id: ${c.id}\n  tags: ${c.tags.join(", ") || "—"}${c.salary ? `\n  salary: ${c.salary}` : ""}\n  ${c.url}`,
          )
          .join("\n\n") + "\n",
      )
    } else {
      process.stdout.write(
        JSON.stringify(
          { meta: { count: cards.length }, results: cards },
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
