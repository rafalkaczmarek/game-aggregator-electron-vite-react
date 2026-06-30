import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { GameApi } from '@shared/types/game'
import GameLibrary from '@src/components/game-library/GameLibrary'
import { createMockLibrary, createDuplicateTitleLibrary } from '@test/fixtures/games'

async function waitForLibraryShell() {
  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Scan libraries' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Load Metacritic scores' })).toBeInTheDocument()
  })
}

describe('GameLibrary', () => {
  const scanAll = vi.fn<GameApi['scanAll']>()
  const enrichMetacritic = vi.fn<GameApi['enrichMetacritic']>()
  const getLibrary = vi.fn<GameApi['getLibrary']>()

  beforeEach(() => {
    scanAll.mockReset()
    enrichMetacritic.mockReset()
    enrichMetacritic.mockResolvedValue({ started: true })
    getLibrary.mockReset()
    getLibrary.mockResolvedValue(null)
    vi.mocked(window.ipcRenderer.on).mockClear()
    vi.mocked(window.ipcRenderer.off).mockClear()
    window.gameApi = {
      getLibrary,
      scanAll,
      enrichMetacritic,
      scanPlatform: vi.fn(),
      getRecommendations: vi.fn<GameApi['getRecommendations']>().mockResolvedValue({
        owned: [],
        discover: [],
        errors: [],
        basedOnPlayedCount: 0,
      }),
    }
  })

  it('starts metacritic enrichment from a separate button', async () => {
    getLibrary.mockResolvedValue(createMockLibrary())
    const user = userEvent.setup()

    render(<GameLibrary />)
    await waitFor(() => {
      expect(screen.getByText('Your games')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Load Metacritic scores' }))

    expect(enrichMetacritic).toHaveBeenCalledTimes(1)
    expect(scanAll).not.toHaveBeenCalled()
  })

  it('registers incremental metacritic rating updates from ipc', async () => {
    getLibrary.mockResolvedValue(createMockLibrary())
    render(<GameLibrary />)

    await waitFor(() => {
      expect(window.ipcRenderer.on).toHaveBeenCalledWith(
        'games:metacritic-ratings-updated',
        expect.any(Function),
      )
    })
  })

  it('shows metacritic badges as ratings arrive during enrichment', async () => {
    const library = createMockLibrary()
    getLibrary.mockResolvedValue(library)
    render(<GameLibrary />)

    await waitFor(() => {
      expect(screen.getByText('Your games')).toBeInTheDocument()
    })

    const ratingsHandler = vi
      .mocked(window.ipcRenderer.on)
      .mock.calls.filter(([channel]) => channel === 'games:metacritic-ratings-updated')
      .at(-1)?.[1]

    expect(ratingsHandler).toBeTypeOf('function')
    ratingsHandler?.(null, {
      updates: [
        {
          gameId: library.games[0].id,
          rating: { metascore: 90, userScore: 6.8, fetchedAt: '2024-01-01T00:00:00.000Z' },
        },
      ],
    })

    await waitFor(() => {
      expect(screen.getByLabelText('Metascore: 90')).toBeInTheDocument()
    })
  })

  it('applies multiple incremental metacritic updates', async () => {
    const library = createMockLibrary()
    getLibrary.mockResolvedValue(library)
    render(<GameLibrary />)

    await waitFor(() => {
      expect(screen.getByText('Your games')).toBeInTheDocument()
    })

    const ratingsHandler = vi
      .mocked(window.ipcRenderer.on)
      .mock.calls.filter(([channel]) => channel === 'games:metacritic-ratings-updated')
      .at(-1)?.[1]

    ratingsHandler?.(null, {
      updates: [
        {
          gameId: library.games[0].id,
          rating: { metascore: 90, userScore: 6.8, fetchedAt: '2024-01-01T00:00:00.000Z' },
        },
        {
          gameId: library.games[1].id,
          rating: { metascore: 86, userScore: 7.2, fetchedAt: '2024-01-01T00:00:00.000Z' },
        },
      ],
    })

    await waitFor(() => {
      expect(screen.getByLabelText('Metascore: 90')).toBeInTheDocument()
      expect(screen.getByLabelText('Metascore: 86')).toBeInTheDocument()
    })
    expect(screen.queryByLabelText('Metascore: 83')).not.toBeInTheDocument()
  })

  it('shows metacritic enrichment progress from ipc events', async () => {
    getLibrary.mockResolvedValue(createMockLibrary())
    render(<GameLibrary />)

    await waitFor(() => {
      expect(window.ipcRenderer.on).toHaveBeenCalledWith(
        'games:metacritic-enrichment-progress',
        expect.any(Function),
      )
    })

    const progressHandler = vi
      .mocked(window.ipcRenderer.on)
      .mock.calls.filter(([channel]) => channel === 'games:metacritic-enrichment-progress')
      .at(-1)?.[1]

    expect(progressHandler).toBeTypeOf('function')
    progressHandler?.(null, { done: 5, total: 20, enriched: 3 })

    await waitFor(() => {
      expect(screen.getByText('Fetching Metacritic scores…')).toBeInTheDocument()
    })
    expect(screen.getByText('5/20 (25%)')).toBeInTheDocument()
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
    await waitForLibraryShell()
    await user.click(screen.getByRole('button', { name: 'Scan libraries' }))

    await waitFor(() => {
      expect(screen.getByText('Your games')).toBeInTheDocument()
    })

    const grid = screen.getByTestId('game-library-grid')
    const titles = within(grid)
      .getAllByRole('article')
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
    await waitForLibraryShell()
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
    await waitForLibraryShell()
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
    await waitForLibraryShell()
    await user.click(screen.getByRole('button', { name: 'Scan libraries' }))

    await waitFor(() => {
      expect(screen.getByText('Your games')).toBeInTheDocument()
    })

    const grid = screen.getByTestId('game-library-grid')
    expect(within(grid).getAllByRole('article')).toHaveLength(2)
    expect(within(grid).getByText('A Plague Tale: Innocence')).toBeInTheDocument()
    expect(within(grid).getByText('GOG')).toBeInTheDocument()
    expect(within(grid).getByText('Epic')).toBeInTheDocument()
    expect(within(grid).getByText('2.5 hrs')).toBeInTheDocument()
  })

  it('shows deduplicated game count with platform total when titles overlap', async () => {
    scanAll.mockResolvedValue(createDuplicateTitleLibrary())
    const user = userEvent.setup()

    render(<GameLibrary />)
    await waitForLibraryShell()
    await user.click(screen.getByRole('button', { name: 'Scan libraries' }))

    await waitFor(() => {
      expect(screen.getByText(/— 2 games/i)).toBeInTheDocument()
    })

    expect(screen.getByText(/\(3 across platforms\)/i)).toBeInTheDocument()
  })

  it('filters games by selected platforms', async () => {
    scanAll.mockResolvedValue(createMockLibrary())
    const user = userEvent.setup()

    render(<GameLibrary />)
    await waitForLibraryShell()
    await user.click(screen.getByRole('button', { name: 'Scan libraries' }))

    await waitFor(() => {
      expect(screen.getByTestId('game-library-grid')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Steam' }))

    const grid = screen.getByTestId('game-library-grid')
    expect(within(grid).getAllByRole('article')).toHaveLength(1)
    expect(within(grid).getByText('Dota 2')).toBeInTheDocument()
    expect(screen.getByText(/\(filtered\)/i)).toBeInTheDocument()
  })

  it('shows all games when no platforms are selected', async () => {
    scanAll.mockResolvedValue(createMockLibrary())
    const user = userEvent.setup()

    render(<GameLibrary />)
    await waitForLibraryShell()
    await user.click(screen.getByRole('button', { name: 'Scan libraries' }))

    await waitFor(() => {
      expect(screen.getByTestId('game-library-grid')).toBeInTheDocument()
    })

    expect(within(screen.getByTestId('game-library-grid')).getAllByRole('article')).toHaveLength(3)
    expect(screen.queryByText(/\(filtered\)/i)).not.toBeInTheDocument()
  })

  it('shows empty filter state when selected platform has no games', async () => {
    scanAll.mockResolvedValue(createMockLibrary())
    const user = userEvent.setup()

    render(<GameLibrary />)
    await waitForLibraryShell()
    await user.click(screen.getByRole('button', { name: 'Scan libraries' }))

    await waitFor(() => {
      expect(screen.getByTestId('platform-filter')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'PSN' }))

    expect(screen.getByText(/No games match the current filters/i)).toBeInTheDocument()
    expect(screen.queryByTestId('game-library-grid')).not.toBeInTheDocument()
  })

  it('filters games by play status', async () => {
    scanAll.mockResolvedValue(createMockLibrary())
    const user = userEvent.setup()

    render(<GameLibrary />)
    await waitForLibraryShell()
    await user.click(screen.getByRole('button', { name: 'Scan libraries' }))

    await waitFor(() => {
      expect(screen.getByTestId('game-library-grid')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Not played' }))

    const grid = screen.getByTestId('game-library-grid')
    expect(within(grid).getAllByRole('article')).toHaveLength(1)
    expect(within(grid).getByText('Cyberpunk 2077')).toBeInTheDocument()
    expect(screen.getByText(/\(filtered\)/i)).toBeInTheDocument()
  })

  it('shows only played games when Played filter is selected', async () => {
    scanAll.mockResolvedValue(createMockLibrary())
    const user = userEvent.setup()

    render(<GameLibrary />)
    await waitForLibraryShell()
    await user.click(screen.getByRole('button', { name: 'Scan libraries' }))

    await waitFor(() => {
      expect(screen.getByTestId('game-library-grid')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Played' }))

    const grid = screen.getByTestId('game-library-grid')
    expect(within(grid).getAllByRole('article')).toHaveLength(2)
    expect(within(grid).getByText('Alan Wake')).toBeInTheDocument()
    expect(within(grid).getByText('Dota 2')).toBeInTheDocument()
    expect(within(grid).queryByText('Cyberpunk 2077')).not.toBeInTheDocument()
  })
})
