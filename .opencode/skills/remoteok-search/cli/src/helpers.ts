export const API_URL = "https://remoteok.com/api"

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

const UA = "remoteok-search-skill/1.0 (+https://remoteok.com)"

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

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
        `could not reach the RemoteOK API at ${url} (${e instanceof Error ? e.message : String(e)})`,
      )
    }

    if (response.status === 429 || response.status >= 500) {
      if (attempt === maxRetries) {
        throw new Error(`RemoteOK API request failed: ${response.status} ${response.statusText}`)
      }
      await sleep(delay + Math.floor(Math.random() * 500))
      delay = Math.min(delay * 2, 8000)
      continue
    }

    const body = await response.json().catch(() => null)
    if (!response.ok) {
      throw new Error(`RemoteOK API request failed: ${response.status} ${response.statusText}`)
    }
    if (!body) throw new Error("RemoteOK API returned an unparseable response body")
    return body as T
  }

  throw new Error("RemoteOK API request failed after retries")
}

export interface RemoteOkRawJob {
  slug: string
  id: string
  epoch: number
  date: string
  company: string
  company_logo: string
  position: string
  tags: string[]
  description: string
  location: string
  apply_url: string
  salary_min: number | null
  salary_max: number | null
  url: string
}

export interface RemoteOkJob {
  id: string
  title: string
  company: string
  location: string
  date: string
  url: string
  tags: string[]
  salary: string | null
  description: string | null
}

export interface JobResult {
  id: string
  title: string
  company: string | null
  location: string | null
  date: string | null
  url: string
  tags: string[]
  salary: string | null
}

export interface JobDetailResult extends JobResult {
  description: string | null
}

export function normalizeJob(raw: RemoteOkRawJob): RemoteOkJob {
  const salary = [raw.salary_min, raw.salary_max].filter((n): n is number => n != null && n > 0)
  return {
    id: raw.id,
    title: raw.position || "(untitled)",
    company: raw.company || "",
    location: raw.location || "",
    date: raw.date || "",
    url: raw.apply_url || `https://remoteok.com/remote-jobs/${raw.slug}`,
    tags: raw.tags ?? [],
    salary: salary.length > 0 ? salary.map((n) => `$${n.toLocaleString("en-US")}`).join(" – ") : null,
    description: raw.description ? cleanHtml(raw.description) : null,
  }
}

export function normalizeJobs(raw: (RemoteOkRawJob | Record<string, unknown>)[]): RemoteOkJob[] {
  return raw.filter((j): j is RemoteOkRawJob => "slug" in j && "position" in j).map(normalizeJob)
}

export function toResult(j: RemoteOkJob): JobResult {
  return {
    id: j.id,
    title: j.title || "(untitled)",
    company: j.company || null,
    location: j.location || null,
    date: j.date || null,
    url: j.url,
    tags: j.tags ?? [],
    salary: j.salary ?? null,
  }
}

export function toDetail(j: RemoteOkJob): JobDetailResult {
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
