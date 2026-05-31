/**
 * Loads every topic corpus at build time (no runtime fetch). Glob picks up new
 * `src/corpus/*.json` files automatically; `*.sources.json` ledgers are excluded.
 */
import type { Concept, Corpus } from './types'

const modules = import.meta.glob<{ default: Corpus }>('./*.json', { eager: true })

export const CORPORA: Corpus[] = Object.entries(modules)
  .filter(([path]) => !path.endsWith('.sources.json'))
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, mod]) => mod.default)

/** All concepts across every topic, flattened. */
export const CONCEPTS: Concept[] = CORPORA.flatMap((c) => c.concepts)

/** Concepts that have a drill at the given complexity tier. */
export function conceptsAtTier(tier: number): Concept[] {
  return CONCEPTS.filter((c) => c.depth.some((d) => d.tier === tier))
}
