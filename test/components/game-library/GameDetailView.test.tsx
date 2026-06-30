import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { GameDescription } from '@shared/types/game'
import GameDetailView from '@src/components/game-library/ui/GameDetailView'
import { groupGamesByTitle } from '@src/components/game-library/lib/format'
import { createMockLibraryWithMetacritic } from '@test/fixtures/games'

describe('GameDetailView', () => {
  const groupedGame = groupGamesByTitle(createMockLibraryWithMetacritic().games).find(
    (game) => game.title === 'Dota 2',
  )!

  it('renders platform rows and metacritic badge', () => {
    render(
      <GameDetailView
        game={groupedGame}
        description={null}
        descriptionLoading={false}
        onBack={vi.fn()}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Dota 2' })).toBeInTheDocument()
    expect(screen.getByText('Steam')).toBeInTheDocument()
    expect(screen.getByText('Total playtime: 2.1 hrs')).toBeInTheDocument()
    expect(screen.getByTestId('metacritic-badge')).toBeInTheDocument()
  })

  it('shows loading state while description is fetched', () => {
    render(
      <GameDetailView
        game={groupedGame}
        description={null}
        descriptionLoading
        onBack={vi.fn()}
      />,
    )

    expect(screen.getByText('Loading description…')).toBeInTheDocument()
  })

  it('shows description text when available', () => {
    const description: GameDescription = {
      text: 'Every day, millions of players worldwide enter battle.',
      source: 'steam',
    }

    render(
      <GameDetailView
        game={groupedGame}
        description={description}
        descriptionLoading={false}
        onBack={vi.fn()}
      />,
    )

    expect(
      screen.getByText('Every day, millions of players worldwide enter battle.'),
    ).toBeInTheDocument()
  })

  it('shows fallback copy when description is unavailable', () => {
    render(
      <GameDetailView
        game={groupedGame}
        description={null}
        descriptionLoading={false}
        onBack={vi.fn()}
      />,
    )

    expect(screen.getByText('No description available for this game yet.')).toBeInTheDocument()
  })

  it('calls onBack when the back button is clicked', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()

    render(
      <GameDetailView
        game={groupedGame}
        description={null}
        descriptionLoading={false}
        onBack={onBack}
      />,
    )

    await user.click(screen.getByRole('button', { name: '← Back to library' }))

    expect(onBack).toHaveBeenCalledTimes(1)
  })
})
