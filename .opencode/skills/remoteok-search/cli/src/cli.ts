#!/usr/bin/env bun
import { runSearch, type SearchOpts } from "./commands/search.js"
import { runDetail, type DetailOpts } from "./commands/detail.js"

interface Flags {
  _: string[]
  [k: string]: string | boolean | string[]
}

const ALIAS: Record<string, string> = { q: "query", n: "limit" }

function parseFlags(argv: string[]): Flags {
  const flags: Flags = { _: [] }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (!a.startsWith("-")) {
      ;(flags._ as string[]).push(a)
      continue
    }
    const name = a.replace(/^-+/, "")
    const key = ALIAS[name] ?? name
    const next = argv[i + 1]
    let value: string | boolean = true
    if (next !== undefined && !next.startsWith("-")) {
      value = next
      i++
    }
    if (key === "tag") {
      const acc = Array.isArray(flags.tag) ? flags.tag : []
      if (typeof value === "string") acc.push(value)
      flags.tag = acc
    } else {
      flags[key] = value
    }
  }
  return flags
}

const HELP = `remoteok-cli — search remote tech jobs via RemoteOK's public API

USAGE
  bun run src/cli.ts search [flags]
  bun run src/cli.ts detail <id> [--format json|plain]

SEARCH FLAGS
  --query, -q <text>    Keywords (matches title, company). Optional.
  --tag <name>          Filter by skill tag (e.g. react, go, rust). Repeatable.
  --jobage <days>       Posted within N days (client-side filter).
  --limit, -n <n>       Cap results emitted (client-side).
  --format <fmt>        json (default) | table | plain.

DETAIL
  <id>                  Numeric job ID from a search result.

EXAMPLES
  bun run src/cli.ts search -q "react" --format table
  bun run src/cli.ts search --tag go --limit 10 --format table
  bun run src/cli.ts search --jobage 7 --format table
  bun run src/cli.ts detail 123456 --format plain

RemoteOK exclusively lists remote jobs. No API key needed.
`

function parseIntFlag(name: string, raw: string | boolean | string[]): number | null {
  const val = parseInt(raw as string, 10)
  if (isNaN(val)) {
    process.stderr.write(JSON.stringify({ error: `--${name} must be a number, got "${raw}"`, code: "BAD_ARG" }) + "\n")
    return null
  }
  return val
}

async function main(): Promise<number> {
  const argv = process.argv.slice(2)
  const flags = parseFlags(argv)
  const cmd = (flags._ as string[])[0]

  if (!cmd || flags.help || flags.h) {
    process.stdout.write(HELP)
    return cmd ? 0 : 1
  }

  if (cmd === "search") {
    const fmt = (flags.format as string) || "json"

    for (const name of ["jobage", "limit"] as const) {
      if (flags[name] !== undefined) {
        const v = parseIntFlag(name, flags[name])
        if (v === null) return 1
        flags[name] = String(v)
      }
    }

    const tags = Array.isArray(flags.tag)
      ? (flags.tag as string[])
      : typeof flags.tag === "string"
        ? [flags.tag]
        : []

    const opts: SearchOpts = {
      query: typeof flags.query === "string" ? flags.query : undefined,
      tags,
      jobage: flags.jobage ? parseInt(flags.jobage as string, 10) : 9999,
      limit: flags.limit ? parseInt(flags.limit as string, 10) : undefined,
      format: (["json", "table", "plain"].includes(fmt) ? fmt : "json") as SearchOpts["format"],
    }
    return runSearch(opts)
  }

  if (cmd === "detail") {
    const id = (flags._ as string[])[1]
    if (!id) {
      process.stderr.write(JSON.stringify({ error: "detail requires an <id>", code: "NO_ID" }) + "\n")
      return 1
    }
    const fmt = (flags.format as string) || "json"
    const opts: DetailOpts = { id, format: fmt === "plain" ? "plain" : "json" }
    return runDetail(opts)
  }

  process.stderr.write(JSON.stringify({ error: `Unknown command "${cmd}"`, code: "BAD_CMD" }) + "\n")
  return 1
}

main().then((code) => process.exit(code))
