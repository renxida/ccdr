// Normalize corpus drill text to ASCII the keyboard can actually emit.
// Pure notation (π→pi, ×→x, 10⁻⁷→10^-7, em-dash→-): preserves meaning, so the
// factual review still holds. Run after gen-corpus. Touches depth[].text only.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'

const SUP = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-', '⁺': '+' }
const MAP = { 'π': 'pi', 'β': 'beta', 'λ': 'lambda', '×': 'x', '÷': '/', '≈': '~', '≥': '>=', '≤': '<=', '−': '-', '—': '-', '–': '-', '→': '->', '∞': 'inf', '∑': 'sum', '√': 'sqrt', '°': ' deg', '“': '"', '”': '"', '‘': "'", '’': "'", '…': '...' }

export function toAscii(s) {
  // group consecutive superscripts into ^<exp>
  let out = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+/g, (m) => '^' + [...m].map((c) => SUP[c]).join(''))
  out = [...out].map((c) => (c in MAP ? MAP[c] : c)).join('')
  return out.replace(/ {2,}/g, ' ')
}

const dir = 'src/corpus'
for (const f of readdirSync(dir).filter((f) => f.endsWith('.json') && !f.endsWith('.sources.json'))) {
  const path = `${dir}/${f}`
  const corpus = JSON.parse(readFileSync(path, 'utf8'))
  let changed = 0
  for (const c of corpus.concepts)
    for (const d of c.depth) {
      const next = toAscii(d.text)
      if (next !== d.text) {
        d.text = next
        changed++
      }
    }
  writeFileSync(path, JSON.stringify(corpus, null, 2) + '\n')
  // verify clean
  const remaining = new Set()
  for (const c of corpus.concepts) for (const d of c.depth) for (const ch of d.text) if (ch.codePointAt(0) > 126) remaining.add(ch)
  console.log(`${f}: normalized ${changed} entries; remaining non-ASCII: ${[...remaining].join('') || 'none'}`)
}
