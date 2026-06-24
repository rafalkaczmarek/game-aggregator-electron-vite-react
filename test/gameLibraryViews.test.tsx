import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Game } from '@shared/types/game'
import GameGridView from '@src/components/game-library/ui/GameGridView'
import GameListView from '@src/components/game-library/ui/GameListView'
import { groupGamesByTitle } from '@src/components/game-library/lib/format'
import ViewToggle from '@src/components/game-library/ui/ViewToggle'
import { sampleGames } from './fixtures/games'

const groupedSampleGames = groupGamesByTitle(sampleGames)

describe('game library views', () => {
  it('renders list view with titles, playtime, and platform badges', () => {
    render(<GameListView games={groupedSampleGames} />)

    const list = screen.getByTestId('game-library-list')
    expect(within(list).getAllByRole('listitem')).toHaveLength(3)
    expect(within(list).getByText('Dota 2')).toBeInTheDocument()
    expect(within(list).getByText('2.1 hrs')).toBeInTheDocument()
    expect(within(list).getAllByText('Steam')).toHaveLength(1)
    expect(within(list).getAllByText('Installed')).toHaveLength(2)
  })

  it('renders grid view with titles and installed badges', () => {
    render(<GameGridView games={groupedSampleGames} />)

    const grid = screen.getByTestId('game-library-grid')
    expect(within(grid).getAllByRole('article')).toHaveLength(3)
    expect(within(grid).getByText('Alan Wake')).toBeInTheDocument()
    expect(within(grid).getAllByText('Installed')).toHaveLength(2)
    expect(within(grid).getByText('45 min')).toBeInTheDocument()
  })

  it('renders multiple platform badges for duplicate titles in list view', () => {
    const duplicateGames: Game[] = [
      {
        id: 'gog-plague',
        platform: 'gog',
        title: 'A Plague Tale: Innocence',
        installed: false,
        playtimeMinutes: 120,
      },
      {
        id: 'epic-plague',
        platform: 'epic',
        title: 'A Plague Tale: Innocence',
        installed: true,
        playtimeMinutes: 30,
      },
    ]

    render(<GameListView games={groupGamesByTitle(duplicateGames)} />)

    const list = screen.getByTestId('game-library-list')
    expect(within(list).getAllByRole('listitem')).toHaveLength(1)
    expect(within(list).getByText('GOG')).toBeInTheDocument()
    expect(within(list).getByText('Epic')).toBeInTheDocument()
    expect(within(list).getByText('2.5 hrs')).toBeInTheDocument()
  })

  it('renders multiple platform badges for duplicate titles', () => {
    const duplicateGames: Game[] = [
      {
        id: 'gog-plague',
        platform: 'gog',
        title: 'A Plague Tale: Innocence',
        installed: false,
        playtimeMinutes: 120,
      },
      {
        id: 'epic-plague',
        platform: 'epic',
        title: 'A Plague Tale: Innocence',
        installed: true,
        playtimeMinutes: 30,
      },
    ]

    render(<GameGridView games={groupGamesByTitle(duplicateGames)} />)

    const grid = screen.getByTestId('game-library-grid')
    expect(within(grid).getAllByRole('article')).toHaveLength(1)
    expect(within(grid).getByText('GOG')).toBeInTheDocument()
    expect(within(grid).getByText('Epic')).toBeInTheDocument()
    expect(within(grid).getByText('2.5 hrs')).toBeInTheDocument()
    expect(within(grid).getByText('Installed')).toBeInTheDocument()
  })

  it('switches active state in view toggle', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<ViewToggle value='grid' onChange={onChange} />)

    const listButton = screen.getByRole('button', { name: 'List view' })
    const gridButton = screen.getByRole('button', { name: 'Grid view' })

    expect(listButton).toHaveAttribute('aria-pressed', 'false')
    expect(gridButton).toHaveAttribute('aria-pressed', 'true')

    await user.click(listButton)
    expect(onChange).toHaveBeenCalledWith('list')
  })
})
