/** Corpus schema (SPEC §6). One file per topic + a {topic}.sources.json ledger. */

export interface DepthEntry {
  /** Axis-A complexity tier (0=word, 1=phrase, 2=sentence, 3=paragraph). */
  tier: number
  /** The drill text. Tier 0 is the bare token; deeper tiers add true claims. */
  text: string
  /** Authoritative URL backing any numeric/spec claim in `text`. */
  source?: string
}

export interface Concept {
  id: string
  /** Lowercase a–z token used for the T0 repetition drill. */
  token: string
  /** Ordered chain of increasing knowledge depth (Axis B). */
  depth: DepthEntry[]
}

export interface Corpus {
  topic: string
  title: string
  concepts: Concept[]
}

/** One audited numeric claim, cross-checked by the factual-review subagent. */
export interface Citation {
  conceptId: string
  tier: number
  claim: string
  value?: string
  source: string
  note?: string
}
export interface SourcesLedger {
  topic: string
  citations: Citation[]
}
