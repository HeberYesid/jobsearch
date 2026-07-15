export const SEARCH_URL = "https://arc.dev/remote-jobs"
export const DETAIL_BASE = "https://arc.dev/remote-jobs"

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

export async function htmlFetch(url: string): Promise<string> {
  const maxRetries = 6
  let delay = 500
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    })
    if (response.status === 429 || response.status >= 500) {
      if (attempt === maxRetries) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`)
      }
      const jitter = Math.floor(Math.random() * 500)
      await new Promise((r) => setTimeout(r, delay + jitter))
      delay = Math.min(delay * 2, 8000)
      continue
    }
    if (response.status === 404) return ""
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`)
    }
    return response.text()
  }
  throw new Error("Request failed after max retries")
}

export interface ArcJob {
  id: string
  title: string
  company: string | null
  location: string | null
  date: string | null
  url: string
  tags: string[]
  salary: string | null
  description: string | null
  timezone: string | null
}

export type JobResult = ArcJob

export interface JobDetailResult extends ArcJob {
  description: string | null
  timezone: string | null
  salary: string | null
  applyUrl: string | null
  type: string | null
  seniority: string | null
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

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

export function cleanHtml(html: string): string {
  return decodeHtmlEntities(stripTags(html))
}

export function toResult(job: ArcJob): JobResult {
  return job
}

export function toDetail(job: JobDetailResult): JobDetailResult {
  return job
}

export function parseJobCards(html: string): ArcJob[] {
  const results: ArcJob[] = []

  const nextData = extractNextData(html)
  if (nextData) {
    const jobs = extractJobsFromNextData(nextData)
    if (jobs.length > 0) return jobs
  }

  const scriptMatches = html.matchAll(
    /<script[^>]*id="__NEXT_DATA__"[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/gi,
  )
  for (const script of scriptMatches) {
    try {
      const data = JSON.parse(script[1])
      const jobs = extractJobsFromNextData(data)
      if (jobs.length > 0) return jobs
    } catch {
      continue
    }
  }

  const jobCards = extractJobCardsFromDOM(html)
  if (jobCards.length > 0) return jobCards

  return results
}

export function parseJobDetail(html: string, id: string): JobDetailResult {
  const nextData = extractNextData(html)
  if (nextData) {
    const detail = extractDetailFromNextData(nextData, id)
    if (detail) return detail
  }

  const scriptMatches = html.matchAll(
    /<script[^>]*id="__NEXT_DATA__"[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/gi,
  )
  for (const script of scriptMatches) {
    try {
      const data = JSON.parse(script[1])
      const detail = extractDetailFromNextData(data, id)
      if (detail) return detail
    } catch {
      continue
    }
  }

  return parseDetailFromDOM(html, id)
}

function extractNextData(html: string): unknown | null {
  const m = html.match(
    /<script[^>]*id="__NEXT_DATA__"[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/i,
  )
  if (!m) return null
  try {
    return JSON.parse(m[1])
  } catch {
    return null
  }
}

function extractJobsFromNextData(data: unknown): ArcJob[] {
  const results: ArcJob[] = []
  try {
    const d = data as Record<string, unknown>
    const props = d.props as Record<string, unknown> | undefined
    if (!props) return results

    const pageProps = props.pageProps as Record<string, unknown> | undefined
    if (!pageProps) return results

    const jobSources = [pageProps.arcJobs, pageProps.externalJobs, pageProps.jobs, pageProps.listings, pageProps.postings]
    for (const src of jobSources) {
      if (!Array.isArray(src)) continue
      for (const j of src as Array<Record<string, unknown>>) {
        const urlStr = String(j.urlString ?? j.slug ?? j.id ?? "")
        if (!urlStr) continue
        const slug = urlStr.replace(/^\/remote-jobs\//, "").replace(/^\/jobs\//, "").split("?")[0]
        const rawTags: unknown = j.categories ?? j.tags ?? j.skills ?? j.technologies
        const tags = Array.isArray(rawTags)
          ? rawTags.map((t: unknown) => typeof t === "string" ? t : String((t as Record<string, unknown>)?.name ?? t))
          : []
        const salary =
          j.minAnnualSalary != null && j.maxAnnualSalary != null
            ? `$${Number(j.minAnnualSalary).toLocaleString("en-US")} – $${Number(j.maxAnnualSalary).toLocaleString("en-US")}`
            : j.minHourlyRate != null && j.maxHourlyRate != null
              ? `$${Number(j.minHourlyRate).toFixed(0)}/hr – $${Number(j.maxHourlyRate).toFixed(0)}/hr`
              : j.salary
                ? String(j.salary)
                : null
        const companyVal = j.company
          ? typeof j.company === "string"
            ? j.company
            : String((j.company as Record<string, unknown>)?.name ?? "")
          : null
        results.push({
          id: slug,
          title: String(j.title ?? j.position ?? ""),
          company: companyVal || null,
          location: null,
          date: String(j.postedAt ?? j.publishedAt ?? j.date ?? ""),
          url: `https://arc.dev/remote-jobs/${slug}`,
          tags,
          salary,
          description: null,
          timezone: j.timeZone ? String(j.timeZone) : null,
        })
      }
      if (results.length > 0) break
    }
  } catch {
    return results
  }
  return results
}

function extractDetailFromNextData(data: unknown, _id: string): JobDetailResult | null {
  try {
    const d = data as Record<string, unknown>
    const props = d.props as Record<string, unknown> | undefined
    if (!props) return null

    const pageProps = props.pageProps as Record<string, unknown> | undefined
    if (!pageProps) return null

    const job = pageProps.job ?? pageProps.posting ?? null
    if (!job) return null

    const j = job as Record<string, unknown>
    const slug = String(j.slug ?? "")
    const rawTags: unknown = j.tags ?? j.skills ?? j.technologies
    const tags = Array.isArray(rawTags) ? rawTags.map(String) : []
    const applyUrl = j.applyUrl ?? null
    return {
      id: slug || _id,
      title: String(j.title ?? j.position ?? ""),
      company: j.company ? (typeof j.company === "string" ? j.company : String((j.company as Record<string, unknown>)?.name ?? "")) : null,
      location: j.location ? (typeof j.location === "string" ? j.location : String((j.location as Record<string, unknown>)?.name ?? j.location)) : null,
      date: String(j.publishedAt ?? j.postedAt ?? j.date ?? ""),
      url: `https://arc.dev/jobs/${slug || _id}`,
      tags,
      salary: j.salary ? String(j.salary) : null,
      description: j.description ? cleanHtml(String(j.description)) : null,
      timezone: j.timezone ? String(j.timezone) : null,
      applyUrl: applyUrl ? String(applyUrl) : null,
      type: j.type ? String(j.type) : null,
      seniority: j.seniority ? String(j.seniority) : null,
    }
  } catch {
    return null
  }
}

function extractJobCardsFromDOM(html: string): ArcJob[] {
  const results: ArcJob[] = []
  const articleRe = /<article[\s\S]*?<\/article>/gi
  let m: RegExpExecArray | null
  while ((m = articleRe.exec(html)) !== null) {
    const article = m[0]

    const linkMatch = article.match(/href="\/jobs\/([^"]+)"/i)
    if (!linkMatch) continue
    const slug = linkMatch[1].split("?")[0]
    const id = slug

    const titleMatch = article.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i) ||
      article.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i)
    if (!titleMatch) continue
    const title = cleanHtml(titleMatch[1])
    if (!title) continue

    let company: string | null = null
    const compMatch = article.match(/class="[^"]*company[^"]*"[^>]*>([\s\S]*?)<\//i) ||
      article.match(/<p[^>]*class="[^"]*(?:company|organization)[^"]*"[^>]*>([\s\S]*?)<\//i)
    if (compMatch) company = cleanHtml(compMatch[1])

    let location: string | null = null
    const locMatch = article.match(/class="[^"]*location[^"]*"[^>]*>([\s\S]*?)<\//i) ||
      article.match(/<span[^>]*class="[^"]*(?:location|place)[^"]*"[^>]*>([\s\S]*?)<\//i)
    if (locMatch) location = cleanHtml(locMatch[1])

    let date: string | null = null
    const dateMatch = article.match(/datetime="([^"]+)"/i) ||
      article.match(/class="[^"]*date[^"]*"[^>]*>([\s\S]*?)<\//i)
    if (dateMatch) date = dateMatch[1] ? cleanHtml(dateMatch[1]) : null

    const tags: string[] = []
    const tagRe = /class="[^"]*(?:tag|skill|badge)[^"]*"[^>]*>([\s\S]*?)<\//gi
    let tagM: RegExpExecArray | null
    while ((tagM = tagRe.exec(article)) !== null) {
      const t = cleanHtml(tagM[1])
      if (t) tags.push(t)
    }

    let salary: string | null = null
    const salMatch = article.match(/\$[0-9KkMm.,\s\-+]+/i)
    if (salMatch) salary = salMatch[0].trim()

    results.push({
      id,
      title,
      company,
      location,
      date,
      url: `https://arc.dev/jobs/${id}`,
      tags,
      salary,
      description: null,
      timezone: null,
    })
  }
  return results
}

function parseDetailFromDOM(html: string, id: string): JobDetailResult {
  let title: string | null = null
  const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  if (titleMatch) title = cleanHtml(titleMatch[1])

  let company: string | null = null
  const compMatch = html.match(/class="[^"]*(?:company|organization)[^"]*"[^>]*>([\s\S]*?)<\//i)
  if (compMatch) company = cleanHtml(compMatch[1])

  let location: string | null = null
  const locMatch = html.match(/class="[^"]*location[^"]*"[^>]*>([\s\S]*?)<\//i)
  if (locMatch) location = cleanHtml(locMatch[1])

  const tags: string[] = []
  const tagRe = /class="[^"]*(?:tag|skill|badge)[^"]*"[^>]*>([\s\S]*?)<\//gi
  let tagM: RegExpExecArray | null
  while ((tagM = tagRe.exec(html)) !== null) {
    const t = cleanHtml(tagM[1])
    if (t) tags.push(t)
  }

  let salary: string | null = null
  const salMatch = html.match(/\$[0-9KkMm.,\s\-+]+/i)
  if (salMatch) salary = salMatch[0].trim()

  let description: string | null = null
  const desc = html.match(
    /class="[^"]*(?:description|content|job-body)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
  )
  if (desc) {
    const withBreaks = desc[1]
      .replace(/<\s*br\s*\/?>/gi, "\n")
      .replace(/<\/(p|li|ul|ol|div|h\d)>/gi, "\n")
    description = cleanHtml(withBreaks).replace(/\n{3,}/g, "\n\n").trim() || null
  }

  let timezone: string | null = null
  const tzMatch = html.match(/timezone[\s\S]{0,50}?(?:overlap|overlap with|time zone)[^.]*\./i)
  if (tzMatch) timezone = cleanHtml(tzMatch[0])

  let type: string | null = null
  const typeMatch = html.match(/class="[^"]*(?:type|employment)[^"]*"[^>]*>([\s\S]*?)<\//i)
  if (typeMatch) type = cleanHtml(typeMatch[1])

  let seniority: string | null = null
  const snrMatch = html.match(/class="[^"]*(?:seniority|level)[^"]*"[^>]*>([\s\S]*?)<\//i)
  if (snrMatch) seniority = cleanHtml(snrMatch[1])

  let applyUrl: string | null = null
  const applyMatch = html.match(/href="(https:\/\/arc\.dev\/jobs\/[^"]+\/apply[^"]*)"/i) ||
    html.match(/class="[^"]*(?:apply|cta)[^"]*"[^>]*href="([^"]+)"/i)
  if (applyMatch) applyUrl = decodeHtmlEntities(applyMatch[1])

  return {
    id,
    title: title || "(untitled)",
    company,
    location,
    date: null,
    url: `https://arc.dev/jobs/${id}`,
    tags,
    salary,
    description,
    timezone,
    applyUrl,
    type,
    seniority,
  }
}
