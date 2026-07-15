export const API_BASE_URL = "https://remotive.com/api/remote-jobs"

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

const UA = "remotive-search-skill/1.0 (https://remotive.com)"

export async function apiFetch<T>(url: string): Promise<T> {
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
        `could not reach the Remotive API (${e instanceof Error ? e.message : String(e)})`,
      )
    }

    if (response.status === 429 || response.status >= 500) {
      if (attempt === maxRetries) {
        throw new Error(`Remotive API request failed: ${response.status} ${response.statusText}`)
      }
      await sleep(delay + Math.floor(Math.random() * 500))
      delay = Math.min(delay * 2, 8000)
      continue
    }

    const body = (await response.json().catch(() => null)) as T | null
    if (!response.ok) {
      throw new Error(`Remotive API request failed: ${response.status} ${response.statusText}`)
    }
    if (!body) throw new Error("Remotive API returned an unparseable response body")
    return body
  }
  throw new Error("Remotive API request failed after retries")
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

export interface RemotiveJob {
  id: number
  url: string
  title: string
  company_name: string
  company_logo?: string
  category: string
  tags: string[]
  job_type?: string
  publication_date: string
  candidate_required_location: string
  salary?: string
  description: string
}

export interface JobResult {
  id: number
  title: string
  company: string | null
  location: string | null
  date: string | null
  url: string
  category: string | null
  tags: string[]
  salary: string | null
}

export interface JobDetailResult extends JobResult {
  description: string | null
}

export function toResult(j: RemotiveJob): JobResult {
  return {
    id: j.id,
    title: j.title || "(untitled)",
    company: j.company_name || null,
    location: j.candidate_required_location || null,
    date: j.publication_date || null,
    url: j.url,
    category: j.category || null,
    tags: j.tags ?? [],
    salary: j.salary || null,
  }
}

export function toDetail(j: RemotiveJob): JobDetailResult {
  return {
    ...toResult(j),
    description: cleanHtml(j.description),
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
