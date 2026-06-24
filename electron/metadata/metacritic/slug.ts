/**
 * Best-effort slugification matching Metacritic URL conventions.
 * Examples:
 *   "Elden Ring"                                  -> "elden-ring"
 *   "A Plague Tale: Innocence"                    -> "a-plague-tale-innocence"
 *   "Assassin's Creed Valhalla"                   -> "assassins-creed-valhalla"
 *   "The Legend of Zelda: Tears of the Kingdom"   -> "the-legend-of-zelda-tears-of-the-kingdom"
 */
export function slugifyTitle(title: string): string {
  return title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2122\u00AE\u00A9\u2120]/g, '')
    .toLocaleLowerCase()
    .replace(/['\u2018\u2019`´]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Stable cache key for a (title, platform) pair. */
export function cacheKey(title: string, platform: string): string {
  return `${slugifyTitle(title)}::${platform}`
}
