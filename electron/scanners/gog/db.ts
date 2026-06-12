import type { Game, GamePlatform } from '../../../shared/types/game'
import { DatabaseSync } from 'node:sqlite'

const RELEASE_KEY_PREFIX_TO_PLATFORM: Record<string, GamePlatform> = {
  gog_: 'gog',
  steam_: 'steam',
  epic_: 'epic',
}

interface GogRow {
  releaseKey: string
  title: string | null
  playtimeMinutes: number | null
  installed: number
  imagesJson: string | null
  mediaJson: string | null
}

interface ImagesPayload {
  verticalCover?: string
  squareIcon?: string
  background?: string
  artworks?: string[]
  screenshots?: string[]
}

const LIBRARY_QUERY = `
SELECT
  ppd.gameReleaseKey AS releaseKey,
  CASE
    WHEN json_extract(title_gp.value, '$.title') IS NOT NULL
      AND json_extract(title_gp.value, '$.title') != 'null'
    THEN json_extract(title_gp.value, '$.title')
    ELSE json_extract(original_gp.value, '$.title')
  END AS title,
  gt.minutesInGame AS playtimeMinutes,
  MAX(CASE WHEN pt.id IS NOT NULL THEN 1 ELSE 0 END) AS installed,
  images_gp.value AS imagesJson,
  media_gp.value AS mediaJson
FROM ProductPurchaseDates ppd
JOIN GamePieces original_gp ON original_gp.releaseKey = ppd.gameReleaseKey
JOIN GamePieceTypes original_type
  ON original_type.id = original_gp.gamePieceTypeId
  AND original_type.type = 'originalTitle'
LEFT JOIN GamePieces title_gp
  ON title_gp.releaseKey = ppd.gameReleaseKey
  AND title_gp.gamePieceTypeId = (SELECT id FROM GamePieceTypes WHERE type = 'title' LIMIT 1)
LEFT JOIN GameTimes gt ON gt.releaseKey = ppd.gameReleaseKey
LEFT JOIN PlayTasks pt ON pt.gameReleaseKey = ppd.gameReleaseKey
LEFT JOIN GamePieces images_gp
  ON images_gp.releaseKey = ppd.gameReleaseKey
  AND images_gp.gamePieceTypeId = (SELECT id FROM GamePieceTypes WHERE type = 'originalImages' LIMIT 1)
LEFT JOIN GamePieces media_gp
  ON media_gp.releaseKey = ppd.gameReleaseKey
  AND media_gp.gamePieceTypeId = (SELECT id FROM GamePieceTypes WHERE type = 'media' LIMIT 1)
GROUP BY ppd.gameReleaseKey
ORDER BY title COLLATE NOCASE;
`

function resolveGogImageUrl(url: string): string {
  return url.replace('{formatter}.{ext}', '_glx_vertical_cover.webp')
}

function firstImageUrl(urls: string[] | undefined): string | undefined {
  const url = urls?.find((candidate) => candidate.trim().length > 0)
  return url ? resolveGogImageUrl(url) : undefined
}

function parseImages(imagesJson: string | null, mediaJson: string | null): string | undefined {
  if (imagesJson) {
    try {
      const images = JSON.parse(imagesJson) as ImagesPayload
      const cover =
        images.verticalCover ?? images.squareIcon ?? images.background
      if (cover) return cover
    } catch {
      // fall through to media payload
    }
  }

  if (!mediaJson) return undefined

  try {
    const media = JSON.parse(mediaJson) as ImagesPayload
    return firstImageUrl(media.artworks) ?? firstImageUrl(media.screenshots)
  } catch {
    return undefined
  }
}

function releaseKeyToPlatform(releaseKey: string): GamePlatform | null {
  for (const [prefix, platform] of Object.entries(RELEASE_KEY_PREFIX_TO_PLATFORM)) {
    if (releaseKey.startsWith(prefix)) return platform
  }
  return null
}

function toSourceId(releaseKey: string, platform: GamePlatform): string {
  const prefix = Object.entries(RELEASE_KEY_PREFIX_TO_PLATFORM).find(([, p]) => p === platform)?.[0]
  return prefix && releaseKey.startsWith(prefix) ? releaseKey.slice(prefix.length) : releaseKey
}

function toGameId(platform: GamePlatform, releaseKey: string, sourceId: string): string {
  if (platform === 'gog') return `gog-${releaseKey}`
  return `${platform}-${sourceId}`
}

function toGame(row: GogRow): Game | null {
  const platform = releaseKeyToPlatform(row.releaseKey)
  if (!platform) return null

  const title = row.title?.trim()
  if (!title) return null

  const sourceId = toSourceId(row.releaseKey, platform)
  const playtimeMinutes =
    typeof row.playtimeMinutes === 'number' && Number.isFinite(row.playtimeMinutes)
      ? Math.round(row.playtimeMinutes)
      : undefined

  return {
    id: toGameId(platform, row.releaseKey, sourceId),
    platform,
    title,
    coverUrl: parseImages(row.imagesJson, row.mediaJson),
    playtimeMinutes,
    installed: row.installed > 0,
    sourceId,
  }
}

function readGalaxyGames(dbPath: string): Game[] {
  const db = new DatabaseSync(dbPath, { readOnly: true })
  try {
    const rows = db.prepare(LIBRARY_QUERY).all() as unknown as GogRow[]
    return rows.map(toGame).filter((game): game is Game => game !== null)
  } finally {
    db.close()
  }
}

export function readGogGalaxyLibrary(dbPath: string): Partial<Record<GamePlatform, Game[]>> {
  const byPlatform: Partial<Record<GamePlatform, Game[]>> = {}

  for (const game of readGalaxyGames(dbPath)) {
    const games = byPlatform[game.platform] ?? []
    games.push(game)
    byPlatform[game.platform] = games
  }

  return byPlatform
}

export function readGogLibrary(dbPath: string): Game[] {
  return readGogGalaxyLibrary(dbPath).gog ?? []
}
