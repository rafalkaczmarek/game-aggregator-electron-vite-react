import { describe, expect, it } from 'vitest'
import { settingsUpdateFactory } from '@src/components/settings/lib/settingsUpdateFactory'

describe('settingsUpdateFactory', () => {
  describe('steam', () => {
    it('returns update for trimmed key', () => {
      expect(settingsUpdateFactory({ section: 'steam', draftKey: '  my-key  ' })).toEqual({
        kind: 'update',
        update: { steamApiKey: 'my-key' },
      })
    })

    it('rejects whitespace-only key', () => {
      expect(settingsUpdateFactory({ section: 'steam', draftKey: '   ' })).toEqual({
        kind: 'message',
        message: 'Steam API key cannot be empty. Use Clear key to remove it.',
      })
    })

    it('reports no changes for empty draft', () => {
      expect(settingsUpdateFactory({ section: 'steam', draftKey: '' })).toEqual({
        kind: 'message',
        message: 'No changes to save.',
      })
    })
  })

  describe('github', () => {
    it('returns update for trimmed pat', () => {
      expect(settingsUpdateFactory({ section: 'github', draftPat: '  ghp_token  ' })).toEqual({
        kind: 'update',
        update: { githubPat: 'ghp_token' },
      })
    })

    it('rejects whitespace-only pat', () => {
      expect(settingsUpdateFactory({ section: 'github', draftPat: '   ' })).toEqual({
        kind: 'message',
        message: 'Token GitHub nie może być pusty. Użyj „Usuń token”, aby go skasować.',
      })
    })
  })

  describe('psn', () => {
    it('returns update for npsso and online id changes', () => {
      expect(
        settingsUpdateFactory({
          section: 'psn',
          draftNpsso: ' token ',
          draftOnlineId: ' player ',
          state: { steamApiKeySet: false, githubPatSet: false, psnNpssoSet: false },
        }),
      ).toEqual({
        kind: 'update',
        update: { psnNpsso: 'token', psnOnlineId: 'player' },
      })
    })

    it('updates only online id when npsso is empty', () => {
      expect(
        settingsUpdateFactory({
          section: 'psn',
          draftNpsso: '',
          draftOnlineId: 'player',
          state: { steamApiKeySet: false, githubPatSet: false, psnNpssoSet: false, psnOnlineId: '' },
        }),
      ).toEqual({
        kind: 'update',
        update: { psnOnlineId: 'player' },
      })
    })

    it('rejects whitespace-only npsso', () => {
      expect(
        settingsUpdateFactory({
          section: 'psn',
          draftNpsso: '   ',
          draftOnlineId: '',
          state: null,
        }),
      ).toEqual({
        kind: 'message',
        message: 'PSN NPSSO token cannot be empty. Use Clear token to remove it.',
      })
    })

    it('reports no changes when drafts match saved state', () => {
      expect(
        settingsUpdateFactory({
          section: 'psn',
          draftNpsso: '',
          draftOnlineId: 'player',
          state: { steamApiKeySet: false, githubPatSet: false, psnNpssoSet: true, psnOnlineId: 'player' },
        }),
      ).toEqual({
        kind: 'message',
        message: 'No changes to save.',
      })
    })
  })
})
