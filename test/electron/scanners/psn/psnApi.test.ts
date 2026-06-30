import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getProfileFromUserName, getPurchasedGames, getUserPlayedGames, getUserTitles } = vi.hoisted(
  () => ({
    getProfileFromUserName: vi.fn(),
    getPurchasedGames: vi.fn(),
    getUserPlayedGames: vi.fn(),
    getUserTitles: vi.fn(),
  }),
)

vi.mock('psn-api', () => ({
  getProfileFromUserName,
  getPurchasedGames,
  getUserPlayedGames,
  getUserTitles,
}))

import {
  fetchAllPurchasedGames,
  fetchAllUserPlayedGames,
  fetchAllUserTitles,
  resolveAccountId,
} from '@electron/scanners/psn/api'

describe('psn api', () => {
  const authorization = { accessToken: 'access-token' }

  beforeEach(() => {
    getProfileFromUserName.mockReset()
    getPurchasedGames.mockReset()
    getUserPlayedGames.mockReset()
    getUserTitles.mockReset()
  })

  it('returns me without calling profile lookup', async () => {
    await expect(resolveAccountId(authorization, 'me')).resolves.toBe('me')
    expect(getProfileFromUserName).not.toHaveBeenCalled()
  })

  it('resolves account id from online id', async () => {
    getProfileFromUserName.mockResolvedValue({ profile: { accountId: 'account-123' } })

    await expect(resolveAccountId(authorization, 'player-one')).resolves.toBe('account-123')
    expect(getProfileFromUserName).toHaveBeenCalledWith(authorization, 'player-one')
  })

  it('pages through purchased games until a short page is returned', async () => {
    const firstPage = Array.from({ length: 100 }, (_, index) => ({ titleId: `PPSA${index}_00` }))

    getPurchasedGames
      .mockResolvedValueOnce({
        data: {
          purchasedTitlesRetrieve: {
            games: firstPage,
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          purchasedTitlesRetrieve: {
            games: [{ titleId: 'PPSA00002_00' }],
          },
        },
      })

    await expect(fetchAllPurchasedGames(authorization)).resolves.toEqual([
      ...firstPage,
      { titleId: 'PPSA00002_00' },
    ])

    expect(getPurchasedGames).toHaveBeenNthCalledWith(1, authorization, {
      platform: ['ps4', 'ps5'],
      size: 100,
      start: 0,
      sortBy: 'ACTIVE_DATE',
      sortDirection: 'desc',
    })
    expect(getPurchasedGames).toHaveBeenNthCalledWith(2, authorization, {
      platform: ['ps4', 'ps5'],
      size: 100,
      start: 100,
      sortBy: 'ACTIVE_DATE',
      sortDirection: 'desc',
    })
  })

  it('pages through played games until all items are fetched', async () => {
    getUserPlayedGames
      .mockResolvedValueOnce({
        titles: [{ titleId: 'PPSA00001_00' }],
        totalItemCount: 2,
        nextOffset: 1,
        previousOffset: 0,
      })
      .mockResolvedValueOnce({
        titles: [{ titleId: 'PPSA00002_00' }],
        totalItemCount: 2,
        nextOffset: 2,
        previousOffset: 1,
      })

    await expect(fetchAllUserPlayedGames(authorization, 'me')).resolves.toEqual([
      { titleId: 'PPSA00001_00' },
      { titleId: 'PPSA00002_00' },
    ])

    expect(getUserPlayedGames).toHaveBeenNthCalledWith(1, authorization, 'me', {
      categories: 'ps4_game,ps5_native_game,pspc_game,unknown',
      limit: 100,
      offset: 0,
    })
    expect(getUserPlayedGames).toHaveBeenNthCalledWith(2, authorization, 'me', {
      categories: 'ps4_game,ps5_native_game,pspc_game,unknown',
      limit: 100,
      offset: 100,
    })
  })

  it('pages through user titles until all items are fetched', async () => {
    getUserTitles
      .mockResolvedValueOnce({
        trophyTitles: [{ npCommunicationId: 'NPWR00001_00' }],
        totalItemCount: 2,
      })
      .mockResolvedValueOnce({
        trophyTitles: [{ npCommunicationId: 'NPWR00002_00' }],
        totalItemCount: 2,
      })

    await expect(fetchAllUserTitles(authorization, 'me')).resolves.toEqual([
      { npCommunicationId: 'NPWR00001_00' },
      { npCommunicationId: 'NPWR00002_00' },
    ])

    expect(getUserTitles).toHaveBeenNthCalledWith(1, authorization, 'me', {
      limit: 800,
      offset: 0,
    })
    expect(getUserTitles).toHaveBeenNthCalledWith(2, authorization, 'me', {
      limit: 800,
      offset: 800,
    })
  })
})
