import { beforeEach, describe, expect, it, vi } from 'vitest'

const sendMock = vi.fn()

vi.mock('electron', () => ({
  BrowserWindow: {
    getAllWindows: () => [
      { webContents: { send: sendMock } },
      { webContents: { send: vi.fn() } },
    ],
  },
}))

const { broadcastToRenderers } = await import('@electron/main/ipc/broadcast')

describe('broadcastToRenderers', () => {
  beforeEach(() => {
    sendMock.mockReset()
  })

  it('sends payloads to every open window', () => {
    broadcastToRenderers('games:library-updated', { games: [] })

    expect(sendMock).toHaveBeenCalledWith('games:library-updated', { games: [] })
  })
})
