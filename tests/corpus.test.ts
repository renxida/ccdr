import { describe, expect, it } from 'vitest'
import { CORPORA, CONCEPTS } from '../src/corpus'
import type { SourcesLedger } from '../src/corpus/types'

const ledgers = import.meta.glob<{ default: SourcesLedger }>('../src/corpus/*.sources.json', {
  eager: true,
})
const TOKEN_RE = /^[a-z0-9]+$/
const URL_RE = /^https?:\/\//

describe('corpus structure', () => {
  it('loads the seed topics', () => {
    expect(CORPORA.length).toBeGreaterThanOrEqual(4)
    for (const c of CORPORA) {
      expect(c.topic, 'topic slug').toBeTruthy()
      expect(c.title, 'title').toBeTruthy()
      expect(c.concepts.length, `${c.topic} concepts`).toBeGreaterThan(0)
    }
  })

  it('has well-formed concepts with an ordered depth chain', () => {
    for (const c of CONCEPTS) {
      expect(c.id, 'concept id').toBeTruthy()
      expect(c.token, `${c.id} token must be lowercase alphanumeric`).toMatch(TOKEN_RE)
      expect(c.depth.length, `${c.id} depth`).toBeGreaterThanOrEqual(2)

      const tiers = c.depth.map((d) => d.tier)
      for (const t of tiers) expect([0, 1, 2, 3]).toContain(t)
      // depth ordered by non-decreasing tier (increasing knowledge depth)
      expect(tiers, `${c.id} tiers ordered`).toEqual([...tiers].sort((a, b) => a - b))

      const t0 = c.depth.find((d) => d.tier === 0)
      expect(t0, `${c.id} needs a tier-0 token drill`).toBeDefined()
      expect(t0!.text.toLowerCase()).toContain(c.token)

      for (const d of c.depth) expect(d.text.trim(), `${c.id} t${d.tier} text`).toBeTruthy()
    }
  })

  it('cites a source for every claim containing a number', () => {
    for (const c of CONCEPTS) {
      for (const d of c.depth) {
        if (d.tier > 0 && /\d/.test(d.text)) {
          expect(d.source, `${c.id} t${d.tier} numeric claim needs a source: "${d.text}"`).toMatch(
            URL_RE,
          )
        }
      }
    }
  })

  it('has unique concept ids within each topic', () => {
    for (const c of CORPORA) {
      const ids = c.concepts.map((x) => x.id)
      expect(new Set(ids).size, `${c.topic} duplicate ids`).toBe(ids.length)
    }
  })

  it('ships a sources ledger per topic', () => {
    const ledgerTopics = new Set(Object.values(ledgers).map((m) => m.default.topic))
    for (const c of CORPORA) {
      expect(ledgerTopics, `${c.topic} missing .sources.json`).toContain(c.topic)
    }
    for (const m of Object.values(ledgers)) {
      for (const cite of m.default.citations) {
        expect(cite.source, 'citation source url').toMatch(URL_RE)
      }
    }
  })
})
