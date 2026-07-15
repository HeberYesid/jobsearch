export const SEARCH_URL =
  "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search"
export const DETAIL_URL =
  "https://www.linkedin.com/jobs-guest/jobs/api/jobPosting"

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
        "X-Requested-With": "XMLHttpRequest",
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

export interface JobCard {
  id: string
  title: string
  company: string | null
  companyUrl: string | null
  location: string | null
  date: string | null
  url: string
}

export interface JobDetail extends JobCard {
  description: string | null
  seniority: string | null
  employmentType: string | null
  jobFunction: string | null
  industries: string | null
  applyUrl: string | null
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

function clean(html: string): string {
  return decodeHtmlEntities(stripTags(html))
}

export function parseJobCards(html: string): JobCard[] {
  const results: JobCard[] = []
  const chunks = html.split(/data-entity-urn="urn:li:jobPosting:/).slice(1)

  for (const chunk of chunks) {
    const idMatch = chunk.match(/^(\d+)/)
    if (!idMatch) continue
    const id = idMatch[1]

    const linkMatch = chunk.match(/class="base-card__full-link[^"]*"[^>]*href="([^"]+)"/i)
    const url = linkMatch ? decodeHtmlEntities(linkMatch[1]).split("?")[0] : ""

    let title: string | null = null
    const h3 = chunk.match(/class="base-search-card__title"[^>]*>([\s\S]*?)<\/h3>/i)
    if (h3) title = clean(h3[1])
    if (!title) {
      const sr = chunk.match(/class="sr-only"[^>]*>([\s\S]*?)<\/span>/i)
      if (sr) title = clean(sr[1])
    }
    if (!title) continue

    let company: string | null = null
    let companyUrl: string | null = null
    const sub = chunk.match(/class="base-search-card__subtitle"[^>]*>([\s\S]*?)<\/h4>/i)
    if (sub) {
      const a = sub[1].match(/href="([^"]+)"/i)
      if (a) companyUrl = decodeHtmlEntities(a[1]).split("?")[0]
      company = clean(sub[1]) || null
    }

    const loc = chunk.match(/class="job-search-card__location"[^>]*>([\s\S]*?)<\/span>/i)
    const location = loc ? clean(loc[1]) || null : null
    const dt = chunk.match(/class="job-search-card__listdate[^"]*"[^>]*datetime="([^"]+)"/i)
    const date = dt ? dt[1] : null

    results.push({
      id,
      title,
      company,
      companyUrl,
      location,
      date,
      url: url || `https://www.linkedin.com/jobs/view/${id}`,
    })
  }

  return results
}

export function parseJobDetail(html: string, id: string): JobDetail {
  const title = html.match(
    /class="(?:top-card-layout__title|topcard__title)[^"]*"[^>]*>([\s\S]*?)<\/h[12]>/i,
  )?.[1]
  const orgMatch = html.match(
    /class="topcard__org-name-link[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i,
  )
  const company = orgMatch ? clean(orgMatch[2]) || null : null
  const companyUrl = orgMatch ? decodeHtmlEntities(orgMatch[1]).split("?")[0] : null

  const locMatch = html.match(
    /class="topcard__flavor topcard__flavor--bullet"[^>]*>([\s\S]*?)<\/span>/i,
  )
  const location = locMatch ? clean(locMatch[1]) || null : null

  let description: string | null = null
  const desc = html.match(
    /class="(?:show-more-less-html__markup|description__text[^"]*)"[^>]*>([\s\S]*?)<\/div>/i,
  )
  if (desc) {
    const withBreaks = desc[1]
      .replace(/<\s*br\s*\/?>/gi, "\n")
      .replace(/<\/(p|li|ul|ol|div|h\d)>/gi, "\n")
    description = decodeHtmlEntities(stripTags(withBreaks)).replace(/\n{3,}/g, "\n\n").trim() || null
  }

  const criteria: Record<string, string> = {}
  const itemRe =
    /class="description__job-criteria-subheader"[^>]*>([\s\S]*?)<\/h3>[\s\S]*?class="description__job-criteria-text[^"]*"[^>]*>([\s\S]*?)<\/span>/gi
  let cm: RegExpExecArray | null
  while ((cm = itemRe.exec(html)) !== null) {
    criteria[clean(cm[1]).toLowerCase()] = clean(cm[2])
  }

  const applyMatch = html.match(/class="topcard__link[^"]*"[^>]*href="([^"]+)"/i)
  const applyUrl = applyMatch ? decodeHtmlEntities(applyMatch[1]).split("?")[0] : null

  return {
    id,
    title: title ? clean(title) : "(untitled)",
    company,
    companyUrl,
    location,
    date: null,
    url: `https://www.linkedin.com/jobs/view/${id}`,
    description,
    seniority: criteria["seniority level"] ?? null,
    employmentType: criteria["employment type"] ?? null,
    jobFunction: criteria["job function"] ?? null,
    industries: criteria["industries"] ?? null,
    applyUrl,
  }
}

export function jobageToTPR(days: number): string | null {
  if (!days || days <= 0 || days >= 9999) return null
  return `r${days * 86400}`
}

export function workTypeFlag(mode: string | undefined): string | null {
  switch ((mode || "").toLowerCase()) {
    case "remote":
      return "2"
    case "hybrid":
      return "3"
    case "onsite":
    case "on-site":
      return "1"
    default:
      return null
  }
}
