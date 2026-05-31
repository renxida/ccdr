/** Typed accessor over the baked CC2 A1 layout. */
import raw from '../data/cc2-layout.json'
import type { Layout, SwitchMapping } from './types'

export const LAYOUT: Layout = raw as Layout

/** Switch/direction for a character, or undefined if it's not on the A1 layer. */
export function mappingFor(ch: string): SwitchMapping | undefined {
  return LAYOUT[ch.toLowerCase()]
}
