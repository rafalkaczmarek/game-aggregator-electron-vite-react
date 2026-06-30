import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import GameCover from '@src/components/game-library/ui/GameCover'
import { sampleGames } from '@test/fixtures/games'

describe('GameCover', () => {
  it('renders placeholder when cover url is missing', () => {
    const { container } = render(
      <GameCover game={{ ...sampleGames[0], coverUrl: undefined }} className='h-20 w-20' />,
    )

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('falls back to placeholder after image load error', () => {
    const { container } = render(<GameCover game={sampleGames[0]} className='h-20 w-20' />)

    const image = container.querySelector('img')
    expect(image).not.toBeNull()
    fireEvent.error(image!)

    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
