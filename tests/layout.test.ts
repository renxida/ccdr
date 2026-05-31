import { describe, expect, it } from 'vitest'
import { LAYOUT, mappingFor } from '../src/engine/layout'

const DIRECTIONS = ['north', 'south', 'east', 'west', 'center']
const FINGERS = ['pinky', 'ring', 'middle', 'index', 'thumb']

describe('cc2-layout.json', () => {
  it('covers all 26 lowercase letters', () => {
    for (let c = 97; c <= 122; c++) {
      const ch = String.fromCharCode(c)
      expect(LAYOUT[ch], `missing letter ${ch}`).toBeDefined()
    }
    expect(Object.keys(LAYOUT)).toHaveLength(26)
  })

  it('has well-formed entries with consistent thumb indexing', () => {
    for (const [ch, m] of Object.entries(LAYOUT)) {
      expect(['left', 'right']).toContain(m.hand)
      expect(FINGERS).toContain(m.finger)
      expect(DIRECTIONS).toContain(m.direction)
      expect(m.label).toBe(ch)
      if (m.finger === 'thumb') {
        expect(typeof m.thumbIndex, `${ch} thumb needs index`).toBe('number')
      } else {
        expect(m.thumbIndex, `${ch} non-thumb must be null`).toBeNull()
      }
    }
  })

  it('matches the documented CC English layout for high-frequency letters', () => {
    // Hand-verified against docs.charachorder.com CC2 layout graphic.
    expect(mappingFor('e')).toMatchObject({ hand: 'left', finger: 'index', direction: 'south' })
    expect(mappingFor('t')).toMatchObject({ hand: 'right', finger: 'index', direction: 'south' })
    expect(mappingFor('a')).toMatchObject({ hand: 'right', finger: 'index', direction: 'west' })
  })

  it('is case-insensitive via mappingFor', () => {
    expect(mappingFor('E')).toEqual(mappingFor('e'))
    expect(mappingFor(' ')).toBeUndefined()
  })
})
