import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import MetacriticBadge from '@src/components/game-library/ui/MetacriticBadge'

const baseRating = {
  url: 'https://www.metacritic.com/game/hades/',
  platform: 'pc',
  fetchedAt: '2024-01-01T00:00:00.000Z',
}

describe('MetacriticBadge', () => {
  it('renders nothing when both scores are missing', () => {
    const { container } = render(<MetacriticBadge rating={baseRating} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders metascore and user score chips', () => {
    render(
      <MetacriticBadge
        rating={{ ...baseRating, metascore: 93, userScore: 9.0 }}
        size='compact'
      />,
    )

    expect(screen.getByTestId('metacritic-badge')).toHaveAttribute(
      'title',
      'Metacritic (pc)',
    )
    expect(screen.getByLabelText('Metascore: 93')).toHaveTextContent('93')
    expect(screen.getByLabelText('User score: 9.0')).toHaveTextContent('9.0')
  })

  it('renders a single score when only one is available', () => {
    render(<MetacriticBadge rating={{ ...baseRating, metascore: 62 }} />)

    expect(screen.getByLabelText('Metascore: 62')).toBeInTheDocument()
    expect(screen.queryByLabelText(/^User score:/)).not.toBeInTheDocument()
  })
})
