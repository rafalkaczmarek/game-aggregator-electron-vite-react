import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import GameGridView from '@src/components/game-library/GameGridView'
import GameListView from '@src/components/game-library/GameListView'
import ViewToggle from '@src/components/game-library/ViewToggle'
import { sampleGames } from './fixtures/games'

describe('game library views', () => {
  it('renders list view with titles, playtime, and platform badges', () => {
    render(<GameListView games={sampleGames} />)

    const list = screen.getByTestId('game-library-list')
    expect(within(list).getAllByRole('listitem')).toHaveLength(3)
    expect(within(list).getByText('Dota 2')).toBeInTheDocument()
    expect(within(list).getByText('2.1 hrs')).toBeInTheDocument()
    expect(within(list).getAllByText('Steam')).toHaveLength(1)
    expect(within(list).getAllByText('Installed')).toHaveLength(2)
  })

  it('renders grid view with titles and installed badges', () => {
    render(<GameGridView games={sampleGames} />)

    const grid = screen.getByTestId('game-library-grid')
    expect(within(grid).getAllByRole('listitem')).toHaveLength(3)
    expect(within(grid).getByText('Alan Wake')).toBeInTheDocument()
    expect(within(grid).getAllByText('Installed')).toHaveLength(2)
    expect(within(grid).getByText('45 min')).toBeInTheDocument()
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
