import {
  exchangeAccessCodeForAuthTokens,
  exchangeNpssoForAccessCode,
  type AuthorizationPayload,
} from 'psn-api'
import { getE2ePsnFixture } from './e2e'

export async function authenticateWithNpsso(npsso: string): Promise<AuthorizationPayload> {
  if (getE2ePsnFixture()) {
    return { accessToken: 'e2e-access-token' }
  }

  const accessCode = await exchangeNpssoForAccessCode(npsso)
  return exchangeAccessCodeForAuthTokens(accessCode)
}
