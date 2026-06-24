import type { GamePlatform } from '../../../shared/types/game'

/**
 * Maps our internal `GamePlatform` to one or more Metacritic platform slugs to try, in order.
 * The first slug that returns a hit is used. PSN tries multiple console generations because
 * a title may exist on PS5, PS4, PS3 etc. — Metacritic indexes them as separate pages.
 */
export const METACRITIC_PLATFORM_CANDIDATES: Record<GamePlatform, readonly string[]> = {
  steam: ['pc'],
  gog: ['pc'],
  epic: ['pc'],
  psn: ['playstation-5', 'playstation-4', 'playstation-3'],
}
