import { DETAIL_BASE, htmlFetch, parseJobDetail, writeError } from "../helpers.js"

export interface DetailOpts {
  id: string
  format: "json" | "plain"
}

function normalizeId(input: string): string | null {
  const url = input.match(/arc\.dev\/(?:remote-)?jobs\/([^/?]+)/)
  if (url) return url[1]
  const bare = input.match(/^[a-z0-9][a-z0-9-]+[a-z0-9]$/)
  if (bare) return input
  return null
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  const id = normalizeId(opts.id)
  if (!id) {
    writeError(`Could not parse a job ID from "${opts.id}"`, "BAD_ID")
    return 1
  }
  try {
    const html = await htmlFetch(`${DETAIL_BASE}/${id}`)
    if (!html) {
      writeError("Job not found", "NOT_FOUND")
      return 1
    }
    const job = parseJobDetail(html, id)

    if (opts.format === "plain") {
      const lines = [
        job.title,
        `${job.company || "—"} · ${job.location || "—"}`,
        "",
        job.type ? `Type: ${job.type}` : "",
        job.seniority ? `Seniority: ${job.seniority}` : "",
        job.salary ? `Salary: ${job.salary}` : "",
        job.timezone ? `Timezone: ${job.timezone}` : "",
        job.tags.length > 0 ? `Tags: ${job.tags.join(", ")}` : "",
        "",
        job.description || "(no description)",
        "",
        `URL: ${job.url}`,
        job.applyUrl ? `Apply: ${job.applyUrl}` : "",
      ].filter((l) => l !== "")
      process.stdout.write(lines.join("\n") + "\n")
    } else {
      process.stdout.write(JSON.stringify(job, null, 2) + "\n")
    }
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "DETAIL_FAILED")
    return 1
  }
}
