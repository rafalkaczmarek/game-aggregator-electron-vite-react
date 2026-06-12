import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { GameApi } from '@shared/types/game'
import GameLibrary from '@src/components/GameLibrary'
import { createMockLibrary, createDuplicateTitleLibrary } from './fixtures/games'

describe('GameLibrary', () => {
  const scanAll = vi.fn<GameApi['scanAll']>()
  const getLibrary = vi.fn<GameApi['getLibrary']>()

  beforeEach(() => {
    scanAll.mockReset()
    getLibrary.mockReset()
    getLibrary.mockResolvedValue(null)
    window.gameApi = {
      getLibrary,
      scanAll,
      scanPlatform: vi.fn(),
    }
  })

  it('loads cached library on mount', async () => {
    getLibrary.mockResolvedValue(createMockLibrary())

    render(<GameLibrary />)

    await waitFor(() => {
      expect(screen.getByText('Your games')).toBeInTheDocument()
    })

    expect(getLibrary).toHaveBeenCalledTimes(1)
    expect(scanAll).not.toHaveBeenCalled()
  })

  it('shows sorted games in grid view after scan', async () => {
    scanAll.mockResolvedValue(createMockLibrary())
    const user = userEvent.setup()

    render(<GameLibrary />)
    await user.click(screen.getByRole('button', { name: 'Scan libraries' }))

    await waitFor(() => {
      expect(screen.getByText('Your games')).toBeInTheDocument()
    })

    const grid = screen.getByTestId('game-library-grid')
    const titles = within(grid)
      .getAllByRole('listitem')
      .map((item) => item.textContent)

    expect(titles[0]).toContain('Alan Wake')
    expect(titles[1]).toContain('Cyberpunk 2077')
    expect(titles[2]).toContain('Dota 2')
    expect(screen.queryByTestId('game-library-list')).not.toBeInTheDocument()
  })

  it('switches between grid and list views', async () => {
    scanAll.mockResolvedValue(createMockLibrary())
    const user = userEvent.setup()

    render(<GameLibrary />)
    await user.click(screen.getByRole('button', { name: 'Scan libraries' }))

    await waitFor(() => {
      expect(screen.getByTestId('game-library-grid')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'List view' }))

    expect(screen.getByTestId('game-library-list')).toBeInTheDocument()
    expect(screen.queryByTestId('game-library-grid')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Grid view' }))
    expect(screen.getByTestId('game-library-grid')).toBeInTheDocument()
  })

  it('shows empty state when scan returns no games', async () => {
    scanAll.mockResolvedValue(createMockLibrary([]))
    const user = userEvent.setup()

    render(<GameLibrary />)
    await user.click(screen.getByRole('button', { name: 'Scan libraries' }))

    await waitFor(() => {
      expect(screen.getByText(/No games found/i)).toBeInTheDocument()
    })

    expect(screen.queryByRole('button', { name: 'List view' })).not.toBeInTheDocument()
    expect(screen.getByTestId('platform-summary')).toBeInTheDocument()
  })

  it('merges duplicate titles into one tile with multiple platform badges', async () => {
    scanAll.mockResolvedValue(createDuplicateTitleLibrary())
    const user = userEvent.setup()

    render(<GameLibrary />)
    await user.click(screen.getByRole('button', { name: 'Scan libraries' }))

    await waitFor(() => {
      expect(screen.getByText('Your games')).toBeInTheDocument()
    })

    const grid = screen.getByTestId('game-library-grid')
    expect(within(grid).getAllByRole('listitem')).toHaveLength(2)
    expect(within(grid).getByText('A Plague Tale: Innocence')).toBeInTheDocument()
    expect(within(grid).getByText('GOG')).toBeInTheDocument()
    expect(within(grid).getByText('Epic')).toBeInTheDocument()
    expect(within(grid).getByText('2.5 hrs')).toBeInTheDocument()
  })

  it('shows deduplicated game count with platform total when titles overlap', async () => {
    scanAll.mockResolvedValue(createDuplicateTitleLibrary())
    const user = userEvent.setup()

    render(<GameLibrary />)
    await user.click(screen.getByRole('button', { name: 'Scan libraries' }))

    await waitFor(() => {
      expect(screen.getByText(/— 2 games/i)).toBeInTheDocument()
    })

    expect(screen.getByText(/\(3 across platforms\)/i)).toBeInTheDocument()
  })
})
