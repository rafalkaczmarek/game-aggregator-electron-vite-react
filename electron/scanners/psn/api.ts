import {
  getProfileFromUserName,
  getPurchasedGames,
  getUserPlayedGames,
  getUserTitles,
  type AuthorizationPayload,
  type PurchasedGame,
  type TrophyTitle,
  type UserPlayedGamesResponse,
} from 'psn-api'
import { getE2ePsnFixture } from './e2e'

const PURCHASED_PAGE_SIZE = 100
const TROPHY_PAGE_SIZE = 800
const PLAYED_PAGE_SIZE = 100

export async function resolveAccountId(
  authorization: AuthorizationPayload,
  onlineId: string,
): Promise<string> {
  if (onlineId === 'me') return 'me'

  const fixture = getE2ePsnFixture()
  if (fixture) {
    return fixture.accountId ?? 'e2e-account-id'
  }

  const profile = await getProfileFromUserName(authorization, onlineId)
  return profile.profile.accountId
}

export async function fetchAllPurchasedGames(
  authorization: AuthorizationPayload,
): Promise<PurchasedGame[]> {
  const fixture = getE2ePsnFixture()
  if (fixture?.purchasedGames) {
    return fixture.purchasedGames
  }
  const games: PurchasedGame[] = []
  let start = 0

  while (true) {
    const response = await getPurchasedGames(authorization, {
      platform: ['ps4', 'ps5'],
      size: PURCHASED_PAGE_SIZE,
      start,
      sortBy: 'ACTIVE_DATE',
      sortDirection: 'desc',
    })

    const batch = response.data.purchasedTitlesRetrieve.games
    games.push(...batch)

    if (batch.length === 0 || batch.length < PURCHASED_PAGE_SIZE) {
      break
    }

    start += PURCHASED_PAGE_SIZE
  }

  return games
}

export async function fetchAllUserPlayedGames(
  authorization: AuthorizationPayload,
  accountId: string,
): Promise<UserPlayedGamesResponse['titles']> {
  const fixture = getE2ePsnFixture()
  if (fixture?.playedGames) {
    return fixture.playedGames
  }

  const titles: UserPlayedGamesResponse['titles'] = []
  let offset = 0

  while (true) {
    const response = await getUserPlayedGames(authorization, accountId, {
      categories: 'ps4_game,ps5_native_game,pspc_game,unknown',
      limit: PLAYED_PAGE_SIZE,
      offset,
    })

    titles.push(...response.titles)

    if (response.titles.length === 0 || titles.length >= response.totalItemCount) {
      break
    }

    offset += PLAYED_PAGE_SIZE
  }

  return titles
}

export async function fetchAllUserTitles(
  authorization: AuthorizationPayload,
  accountId: string,
): Promise<TrophyTitle[]> {
  const fixture = getE2ePsnFixture()
  if (fixture?.userTitles) {
    return fixture.userTitles
  }

  const titles: TrophyTitle[] = []
  let offset = 0

  while (true) {
    const response = await getUserTitles(authorization, accountId, {
      limit: TROPHY_PAGE_SIZE,
      offset,
    })

    titles.push(...response.trophyTitles)

    if (
      response.trophyTitles.length === 0 ||
      titles.length >= response.totalItemCount
    ) {
      break
    }

    offset += TROPHY_PAGE_SIZE
  }

  return titles
}
