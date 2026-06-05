/** Non-component shared bits for the layout variants. */
import type { TrainerView } from '../../hooks/trainerTypes'

export const TIER_LABEL = ['word', 'phrase', 'sentence', 'paragraph']

export interface LayoutProps {
  view: TrainerView
  resetProgress: () => void
}
