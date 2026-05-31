/**
 * CC2 hint (SPEC §4). Renders both halves as a flat schematic — each switch is a
 * ring with its four directional characters (N/S/E/W) placed around it, derived by
 * inverting cc2-layout.json. The switch + direction for the *next* target character
 * is highlighted in the accent color; its brightness fades as the learner masters
 * that character (per-char mastery → hintIntensity).
 */
import { useMemo } from 'react'
import { LAYOUT, mappingFor } from '../engine/layout'
import { hintIntensity } from '../engine/charStats'
import type { CharStats, Direction, Finger, Hand, SwitchMapping } from '../engine/types'

const HALF_W = 230
const HALF_H = 260
const GAP = 56
const R = 20 // switch ring radius
const LABEL_R = 34 // distance of a directional label from switch center

// Switch centers in LEFT-half local coordinates. Right half mirrors x.
const FINGER_POS: Record<Exclude<Finger, 'thumb'>, { x: number; y: number }> = {
  pinky: { x: 40, y: 96 },
  ring: { x: 90, y: 66 },
  middle: { x: 140, y: 60 },
  index: { x: 188, y: 90 },
}
const THUMB_POS: { x: number; y: number }[] = [
  { x: 182, y: 180 }, // 0 near/inner
  { x: 144, y: 204 }, // 1 mid
  { x: 106, y: 222 }, // 2 far
]
const DIR_VEC: Record<Direction, { dx: number; dy: number }> = {
  north: { dx: 0, dy: -1 },
  south: { dx: 0, dy: 1 },
  east: { dx: 1, dy: 0 },
  west: { dx: -1, dy: 0 },
  center: { dx: 0, dy: 0 },
}

interface SwitchId {
  hand: Hand
  finger: Finger
  thumbIndex: number | null
}
const switchKey = (s: SwitchId) => `${s.hand}:${s.finger}:${s.thumbIndex ?? '-'}`

/** Local (within-half) center for a switch, plus whether it's the wide pinky. */
function switchCenter(finger: Finger, thumbIndex: number | null) {
  if (finger === 'thumb') return THUMB_POS[thumbIndex ?? 0]
  return FINGER_POS[finger]
}

/** Map switch position → { direction → char } by inverting the layout. */
const SWITCHES: { id: SwitchId; chars: Partial<Record<Direction, string>> }[] = (() => {
  const byKey = new Map<string, { id: SwitchId; chars: Partial<Record<Direction, string>> }>()
  // Seed the canonical 7 switches per half so empty ones (e.g. pinky) still draw.
  for (const hand of ['left', 'right'] as Hand[]) {
    for (const finger of ['pinky', 'ring', 'middle', 'index'] as Finger[]) {
      const id: SwitchId = { hand, finger, thumbIndex: null }
      byKey.set(switchKey(id), { id, chars: {} })
    }
    for (let t = 0; t < 3; t++) {
      const id: SwitchId = { hand, finger: 'thumb', thumbIndex: t }
      byKey.set(switchKey(id), { id, chars: {} })
    }
  }
  for (const m of Object.values(LAYOUT) as SwitchMapping[]) {
    const id: SwitchId = { hand: m.hand, finger: m.finger, thumbIndex: m.thumbIndex }
    const entry = byKey.get(switchKey(id))
    if (entry) entry.chars[m.direction] = m.label
  }
  return [...byKey.values()]
})()

function halfX(hand: Hand, localX: number): number {
  // Left half on the left; right half mirrored and translated right.
  return hand === 'left' ? localX : HALF_W + GAP + (HALF_W - localX)
}

export interface CC2HintProps {
  /** The next character to type. */
  targetChar: string
  /** Per-char stats; drives the proficiency fade. */
  stats?: CharStats
  className?: string
}

export function CC2Hint({ targetChar, stats, className }: CC2HintProps) {
  const target = mappingFor(targetChar)
  const intensity = useMemo(
    () => (target ? hintIntensity(stats?.[target.label]) : 0),
    [target, stats],
  )

  const totalW = HALF_W * 2 + GAP
  return (
    <svg
      role="img"
      aria-label={
        target
          ? `Type ${targetChar}: ${target.hand} ${target.finger} ${target.direction}`
          : `Type ${targetChar}`
      }
      data-testid="cc2-hint"
      data-target={targetChar}
      data-hand={target?.hand}
      data-finger={target?.finger}
      data-direction={target?.direction}
      viewBox={`0 0 ${totalW} ${HALF_H}`}
      className={className}
      width="100%"
    >
      {SWITCHES.map(({ id, chars }) => {
        const c = switchCenter(id.finger, id.thumbIndex)
        const cx = halfX(id.hand, c.x)
        const cy = c.y
        const isTargetSwitch =
          !!target &&
          target.hand === id.hand &&
          target.finger === id.finger &&
          (target.thumbIndex ?? null) === (id.thumbIndex ?? null)
        const wide = id.finger === 'pinky'
        return (
          <g key={switchKey(id)}>
            {/* switch ring */}
            <ellipse
              cx={cx}
              cy={cy}
              rx={wide ? R * 1.25 : R}
              ry={R}
              fill="none"
              stroke={isTargetSwitch ? 'var(--color-accent)' : 'var(--color-faint)'}
              strokeOpacity={isTargetSwitch ? intensity : 0.5}
              strokeWidth={isTargetSwitch ? 2 : 1}
            />
            {/* directional + center labels */}
            {(['north', 'south', 'east', 'west', 'center'] as Direction[]).map((dir) => {
              const ch = chars[dir]
              if (!ch) return null
              const v = DIR_VEC[dir]
              const lx = cx + v.dx * LABEL_R
              const ly = cy + v.dy * LABEL_R + 4
              const isTargetDir = isTargetSwitch && target!.direction === dir
              return (
                <text
                  key={dir}
                  x={lx}
                  y={ly}
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                  fontSize={isTargetDir ? 17 : 11}
                  fontWeight={isTargetDir ? 700 : 400}
                  fill={isTargetDir ? 'var(--color-accent)' : 'var(--color-dim)'}
                  fillOpacity={isTargetDir ? Math.max(0.25, intensity) : 0.55}
                >
                  {ch}
                </text>
              )
            })}
            {/* direction arrow from center toward the target direction */}
            {isTargetSwitch && target!.direction !== 'center' && (
              <line
                x1={cx + DIR_VEC[target!.direction].dx * (R * 0.4)}
                y1={cy + DIR_VEC[target!.direction].dy * (R * 0.4)}
                x2={cx + DIR_VEC[target!.direction].dx * (R + 8)}
                y2={cy + DIR_VEC[target!.direction].dy * (R + 8)}
                stroke="var(--color-accent)"
                strokeOpacity={intensity}
                strokeWidth={2.5}
                strokeLinecap="round"
              />
            )}
          </g>
        )
      })}
      {/* hand labels */}
      <text x={HALF_W / 2} y={HALF_H - 4} textAnchor="middle" fontFamily="var(--font-sans)" fontSize="10" fill="var(--color-faint)">
        left
      </text>
      <text x={HALF_W + GAP + HALF_W / 2} y={HALF_H - 4} textAnchor="middle" fontFamily="var(--font-sans)" fontSize="10" fill="var(--color-faint)">
        right
      </text>
    </svg>
  )
}
