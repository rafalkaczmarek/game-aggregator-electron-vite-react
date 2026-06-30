import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { GameApi } from '@shared/types/game'
import GameDetail from '@src/components/game-library/GameDetail'
import { createMockLibrary } from '@test/fixtures/games'

function renderGameDetail(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path='/library/:gameKey' element={<GameDetail />} />
        <Route path='/library' element={<div>Library page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('GameDetail', () => {
  const getLibrary = vi.fn<GameApi['getLibrary']>()
  const getGameDescription = vi.fn<GameApi['getGameDescription']>()

  beforeEach(() => {
    getLibrary.mockReset()
    getGameDescription.mockReset()
    getGameDescription.mockResolvedValue({
      text: 'Every day, millions of players worldwide enter battle.',
      source: 'steam',
    })
    window.gameApi = {
      getLibrary,
      scanAll: vi.fn(),
      enrichMetacritic: vi.fn(),
      scanPlatform: vi.fn(),
      getGameDescription,
      getRecommendations: vi.fn(),
    }
  })

  it('shows game details for a known library entry', async () => {
    getLibrary.mockResolvedValue(createMockLibrary())

    renderGameDetail('/library/dota%202')

    await waitFor(() => {
      expect(screen.getByTestId('game-detail-page')).toBeInTheDocument()
    })

    expect(screen.getByRole('heading', { name: 'Dota 2' })).toBeInTheDocument()
    expect(screen.getByText('Total playtime: 2.1 hrs')).toBeInTheDocument()
    expect(screen.getByText('Installed')).toBeInTheDocument()
    expect(getGameDescription).toHaveBeenCalledWith({ platform: 'steam', sourceId: '570' })

    await waitFor(() => {
      expect(
        screen.getByText('Every day, millions of players worldwide enter battle.'),
      ).toBeInTheDocument()
    })
  })

  it('navigates back to the library', async () => {
    getLibrary.mockResolvedValue(createMockLibrary())
    const user = userEvent.setup()

    renderGameDetail('/library/dota%202')

    await waitFor(() => {
      expect(screen.getByTestId('game-detail-page')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: '← Back to library' }))

    expect(screen.getByText('Library page')).toBeInTheDocument()
  })

  it('shows not found when the game key is missing from the library', async () => {
    getLibrary.mockResolvedValue(createMockLibrary())

    renderGameDetail('/library/missing-game')

    await waitFor(() => {
      expect(screen.getByTestId('game-detail-not-found')).toBeInTheDocument()
    })

    expect(getGameDescription).not.toHaveBeenCalled()
  })
})
