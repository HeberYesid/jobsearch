export const DEFAULT_BASE_URL = "https://freehire.dev"

export function baseUrl(): string {
  const raw = (process.env.FREEHIRE_API_URL ?? "").trim()
  return (raw || DEFAULT_BASE_URL).replace(/\/+$/, "")
}

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

const UA = "freehire-search-skill/1.0 (+https://freehire.dev)"

export interface Envelope<T> {
  data: T
  meta?: { total?: number; limit?: number; offset?: number }
  error?: string
}

export async function apiGet<T>(path: string): Promise<Envelope<T> | null> {
  const url = `${baseUrl()}${path}`
  const maxRetries = 6
  let delay = 500

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let response: Response
    try {
      response = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        redirect: "follow",
      })
    } catch (e) {
      throw new Error(
        `could not reach the freehire API at ${baseUrl()} (${e instanceof Error ? e.message : String(e)})`,
      )
    }

    if (response.status === 429 || response.status >= 500) {
      if (attempt === maxRetries) {
        throw new Error(`freehire API request failed: ${response.status} ${response.statusText}`)
      }
      await sleep(delay + Math.floor(Math.random() * 500))
      delay = Math.min(delay * 2, 8000)
      continue
    }
    if (response.status === 404) return null

    const body = (await response.json().catch(() => null)) as Envelope<T> | null
    if (!response.ok) {
      throw new Error(body?.error || `freehire API request failed: ${response.status} ${response.statusText}`)
    }
    if (!body) throw new Error("freehire API returned an unparseable response body")
    return body
  }
  throw new Error("freehire API request failed after retries")
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

export interface FreehireJob {
  public_slug: string
  source: string
  external_id: string
  url: string
  title: string
  company: string
  company_slug: string
  location: string
  description: string
  skills: string[]
  work_mode?: string
  regions: string[]
  countries: string[]
  cities: string[]
  posted_at: string | null
  created_at: string | null
  enrichment: {
    seniority?: string
    category?: string
    employment_type?: string
    salary_min?: number
    salary_max?: number
    salary_currency?: string
  }
}

export interface JobResult {
  id: string
  title: string
  company: string | null
  company_slug: string | null
  location: string | null
  date: string | null
  url: string
  work_mode: string | null
  regions: string[]
  countries: string[]
  skills: string[]
}

export interface JobDetailResult extends JobResult {
  cities: string[]
  seniority: string | null
  category: string | null
  employment_type: string | null
  salary: string | null
  description: string | null
}

export function toResult(j: FreehireJob): JobResult {
  return {
    id: j.public_slug,
    title: j.title || "(untitled)",
    company: j.company || null,
    company_slug: j.company_slug || null,
    location: j.location || null,
    date: j.posted_at,
    url: j.url,
    work_mode: j.work_mode || null,
    regions: j.regions,
    countries: j.countries,
    skills: j.skills,
  }
}

export function toDetail(j: FreehireJob): JobDetailResult {
  const e = j.enrichment
  return {
    ...toResult(j),
    cities: j.cities,
    seniority: e.seniority || null,
    category: e.category || null,
    employment_type: e.employment_type || null,
    salary: formatSalary(e),
    description: cleanHtml(j.description),
  }
}

function formatSalary(e: FreehireJob["enrichment"]): string | null {
  if (e.salary_min == null && e.salary_max == null) return null
  const cur = e.salary_currency ? `${e.salary_currency} ` : ""
  if (e.salary_min != null && e.salary_max != null) return `${cur}${e.salary_min}–${e.salary_max}`
  return `${cur}${e.salary_min ?? e.salary_max}`
}

function numericEntity(cp: number): string {
  return cp >= 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : ""
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => numericEntity(parseInt(dec, 10)))
    .replace(/&#[xX]([0-9a-fA-F]+);/g, (_, hex) => numericEntity(parseInt(hex, 16)))
    .replace(/&nbsp;/g, " ")
}

export function cleanHtml(html: string | null | undefined): string | null {
  if (!html) return null
  const withBreaks = html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|ul|ol|div|h\d)>/gi, "\n")
  const text = decodeHtmlEntities(withBreaks.replace(/<[^>]+>/g, " "))
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
  return text || null
}

export function normalizeSlug(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const m = trimmed.match(/\/jobs\/([^/?#]+)/)
  if (m) return m[1]
  if (/^[a-z0-9][a-z0-9-]*$/i.test(trimmed)) return trimmed
  return null
}
