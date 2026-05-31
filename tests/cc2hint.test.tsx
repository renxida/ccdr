import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { CC2Hint } from '../src/components/CC2Hint'
import { mappingFor } from '../src/engine/layout'

describe('CC2Hint', () => {
  it('exposes the correct switch + direction for the target char (matches layout)', () => {
    const { getByTestId } = render(<CC2Hint targetChar="e" />)
    const svg = getByTestId('cc2-hint')
    expect(svg.getAttribute('data-hand')).toBe('left')
    expect(svg.getAttribute('data-finger')).toBe('index')
    expect(svg.getAttribute('data-direction')).toBe('south')
  })

  it('agrees with mappingFor across several letters', () => {
    for (const ch of ['a', 't', 's', 'c', 'i', 'z']) {
      const m = mappingFor(ch)!
      const { getByTestId, unmount } = render(<CC2Hint targetChar={ch} />)
      const svg = getByTestId('cc2-hint')
      expect(svg.getAttribute('data-hand'), ch).toBe(m.hand)
      expect(svg.getAttribute('data-finger'), ch).toBe(m.finger)
      expect(svg.getAttribute('data-direction'), ch).toBe(m.direction)
      unmount()
    }
  })

  it('has an accessible label describing the actuation', () => {
    const { getByTestId } = render(<CC2Hint targetChar="t" />)
    expect(getByTestId('cc2-hint').getAttribute('aria-label')).toBe(
      'Type t: right index south',
    )
  })

  it('renders without a target switch for non-layout chars', () => {
    const { getByTestId } = render(<CC2Hint targetChar=" " />)
    expect(getByTestId('cc2-hint').getAttribute('data-hand')).toBeNull()
  })
})
