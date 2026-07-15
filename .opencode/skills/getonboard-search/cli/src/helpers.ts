export const API_BASE = "https://www.getonbrd.com/api/v0"

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

const UA = "getonboard-search-skill/1.0 (+https://getonbrd.com)"

export async function apiFetch<T>(path: string): Promise<T | null> {
  const url = `${API_BASE}${path}`
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
        `could not reach the GetOnBoard API at ${API_BASE} (${e instanceof Error ? e.message : String(e)})`,
      )
    }

    if (response.status === 429 || response.status >= 500) {
      if (attempt === maxRetries) {
        throw new Error(`GetOnBoard API request failed: ${response.status} ${response.statusText}`)
      }
      await sleep(delay + Math.floor(Math.random() * 500))
      delay = Math.min(delay * 2, 8000)
      continue
    }
    if (response.status === 404) return null

    const body = await response.json().catch(() => null) as T | null
    if (!response.ok) {
      throw new Error(`GetOnBoard API request failed: ${response.status} ${response.statusText}`)
    }
    if (!body) throw new Error("GetOnBoard API returned an unparseable response body")
    return body
  }
  throw new Error("GetOnBoard API request failed after retries")
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

export interface GetOnBoardJob {
  id: string
  type: string
  attributes: {
    title: string
    description: string | null
    description_headline: string | null
    remote: boolean
    remote_modality: string | null
    remote_zone: string | null
    countries: string[]
    category_name: string | null
    perks: string[]
    min_salary: number | null
    max_salary: number | null
    published_at: number | null
    applications_count: number
    lang: string
    company: { data: { id: number; type: string } }
    modality: { data: { id: number; type: string } | null }
    seniority: { data: { id: number; type: string } | null }
    tags: { data: Array<{ id: number; type: string }> }
  }
  links: {
    public_url: string
  }
}

export interface CompanyResponse {
  data: {
    id: string
    type: string
    attributes: {
      name: string
    }
  }
}

export interface SearchResponse {
  data: GetOnBoardJob[]
  meta: {
    page: number
    per_page: number
    total_pages: number
  }
}

export interface JobResult {
  id: string
  title: string
  company: string | null
  location: string | null
  date: string | null
  url: string
  salary: string | null
  category: string | null
  modality: string | null
  remote: boolean
}

export interface JobDetailResult extends JobResult {
  description: string | null
  description_headline: string | null
  perks: string[]
  seniority_id: number | null
  tags: number[]
  countries: string[]
  applications_count: number
}

function modalityLabel(job: GetOnBoardJob["attributes"]): string | null {
  if (job.remote_modality) return job.remote_modality.replace(/_/g, " ")
  return null
}

const COMPANY_CACHE = new Map<number, string | null>()

async function fetchCompanyName(id: number): Promise<string | null> {
  if (COMPANY_CACHE.has(id)) return COMPANY_CACHE.get(id)!
  try {
    const data = await apiFetch<CompanyResponse>(`/companies/${id}`)
    const name = data?.data?.attributes?.name ?? null
    COMPANY_CACHE.set(id, name)
    return name
  } catch {
    COMPANY_CACHE.set(id, null)
    return null
  }
}

export async function fetchCompanyNames(companies: Array<{ id: number }>): Promise<Map<number, string | null>> {
  const unique = [...new Set(companies.map((c) => c.id))]
  const results = await Promise.allSettled(unique.map((id) => fetchCompanyName(id)))
  const map = new Map<number, string | null>()
  for (let i = 0; i < unique.length; i++) {
    const r = results[i]
    map.set(unique[i], r.status === "fulfilled" ? r.value : null)
  }
  return map
}

function formatSalary(min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null
  if (min != null && max != null) return `$${min}–$${max} USD`
  return `$${min ?? max} USD`
}

export function toResult(job: GetOnBoardJob, companyName: string | null): JobResult {
  const a = job.attributes
  return {
    id: job.id,
    title: a.title || "(untitled)",
    company: companyName,
    location: a.countries.length > 0 ? a.countries.join(", ") : null,
    date: a.published_at ? new Date(a.published_at * 1000).toISOString() : null,
    url: job.links.public_url,
    salary: formatSalary(a.min_salary, a.max_salary),
    category: a.category_name,
    modality: modalityLabel(a),
    remote: a.remote,
  }
}

export function toDetail(job: GetOnBoardJob, companyName: string | null): JobDetailResult {
  const a = job.attributes
  return {
    ...toResult(job, companyName),
    description: cleanHtml(a.description),
    description_headline: a.description_headline,
    perks: a.perks,
    seniority_id: a.seniority?.data?.id ?? null,
    tags: a.tags.data.map((t) => t.id),
    countries: a.countries,
    applications_count: a.applications_count,
  }
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
