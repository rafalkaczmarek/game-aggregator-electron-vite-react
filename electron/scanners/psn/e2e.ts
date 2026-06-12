import type { PurchasedGame, TrophyTitle } from 'psn-api'

export interface PsnE2eFixture {
  purchasedGames?: PurchasedGame[]
  userTitles?: TrophyTitle[]
  accountId?: string
}

let e2ePsnFixture: PsnE2eFixture | undefined

export function setE2ePsnFixture(fixture: PsnE2eFixture | null): void {
  if (process.env.E2E_TEST !== '1') {
    throw new Error('PSN fixture override is only available in E2E tests')
  }
  e2ePsnFixture = fixture ?? undefined
}

export function getE2ePsnFixture(): PsnE2eFixture | undefined {
  return e2ePsnFixture
}
