/**
 * gen-corpus — add a fact-checked corpus topic without a full Claude Code session.
 *
 *   ANTHROPIC_API_KEY=... npm run gen-corpus -- --topic "tpu pod topology" [--slug tpu-pod] [--concepts 5]
 *
 * Generates `src/corpus/<slug>.json` + `<slug>.sources.json`, grounded with the
 * Anthropic API's server-side web search so every numeric claim is cited. After
 * running, ALWAYS run the strict factual-review pass (SPEC §6/§7) before shipping —
 * this script grounds claims but does not replace the adversarial review.
 */
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Anthropic from '@anthropic-ai/sdk'

const MODEL = 'claude-opus-4-8'

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag)
  return i >= 0 ? process.argv[i + 1] : undefined
}
function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const topic = arg('--topic')
if (!topic) {
  console.error('Usage: npm run gen-corpus -- --topic "<topic>" [--slug <slug>] [--concepts <n>]')
  process.exit(1)
}
const apiKey = process.env.ANTHROPIC_API_KEY
if (!apiKey) {
  console.error('ANTHROPIC_API_KEY is not set.')
  process.exit(1)
}
const slug = arg('--slug') ?? slugify(topic)
const nConcepts = Number(arg('--concepts') ?? '5')
const outDir = resolve(process.cwd(), 'src/corpus')

const SCHEMA = `Each corpus file is:
{ "topic": "<slug>", "title": "<human title>",
  "concepts": [ { "id": "<kebab-id>", "token": "<lowercase a-z word>",
    "depth": [
      { "tier": 0, "text": "<the token, lowercase letters only>" },
      { "tier": 1, "text": "<short TRUE phrase>", "source": "<url>" },
      { "tier": 2, "text": "<ONE true cited sentence>", "source": "<url>" },
      { "tier": 3, "text": "<paragraph: 2-3 connected true claims incl a comparison/delta or perf-math point>", "source": "<url>" } ] } ] }
The sources ledger is:
{ "topic": "<slug>", "citations": [ { "conceptId": "<id>", "tier": <n>, "claim": "<claim>", "value": "<number+unit>", "source": "<url>", "note": "<what in the source supports it>" } ] }`

const SYSTEM = `You generate fact-checked typing-drill corpora about accelerator / distributed-systems hardware. The user LEARNS these facts by typing them, so a wrong number trains a wrong fact. Accuracy is paramount.

Rules:
- Use web search to VERIFY every numeric/spec claim against an authoritative source (official docs, datasheets, papers). Never invent or approximate a number; omit any claim you cannot verify.
- tier-0 text is the token: lowercase a-z letters only (a muscle-memory drill).
- depth[] is ordered by increasing knowledge depth: placement in hierarchy → key specs → comparison/inter-gen delta → perf/roofline math. tier rises 0→3.
- Every tier carrying a number needs a "source" URL, and a matching entry in the sources ledger.
- Output EXACTLY ONE \`\`\`json code block containing {"corpus": <corpus>, "sources": <ledger>} and nothing else.

${SCHEMA}`

const client = new Anthropic({ apiKey })

const res = await client.messages.create({
  model: MODEL,
  max_tokens: 8000,
  system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
  tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 12 }],
  messages: [
    {
      role: 'user',
      content: `Topic: "${topic}". Slug: "${slug}". Produce ${nConcepts} concepts. Verify every numeric claim with web search and cite it. Output the single json block as specified.`,
    },
  ],
})

const text = res.content
  .filter((b): b is Anthropic.TextBlock => b.type === 'text')
  .map((b) => b.text)
  .join('\n')
const match = text.match(/```json\s*([\s\S]*?)```/)
if (!match) {
  console.error('No json block in model output. Raw:\n', text.slice(0, 2000))
  process.exit(1)
}
const parsed = JSON.parse(match[1]) as { corpus: unknown; sources: unknown }

writeFileSync(resolve(outDir, `${slug}.json`), JSON.stringify(parsed.corpus, null, 2) + '\n')
writeFileSync(resolve(outDir, `${slug}.sources.json`), JSON.stringify(parsed.sources, null, 2) + '\n')
console.log(`Wrote src/corpus/${slug}.json + ${slug}.sources.json`)
console.log('NEXT: run the strict factual-review pass before shipping (SPEC §6/§7).')
