import { describe, expect, it } from 'vitest'
import { scanEpic } from '../electron/scanners/epic'

describe('platform scanner stubs', () => {
  it.each([['epic', scanEpic, 'Epic scanner not implemented yet']] as const)(
    'returns placeholder result for %s',
    async (platform, scanner, message) => {
      const result = await scanner()

      expect(result).toEqual({
        platform,
        games: [],
        errors: [message],
      })
    },
  )
})
