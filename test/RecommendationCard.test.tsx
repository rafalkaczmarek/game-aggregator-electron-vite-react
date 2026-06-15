import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import RecommendationCard from '@src/components/recommendations/ui/RecommendationCard'

describe('RecommendationCard', () => {
  it('renders title, reason, cover and platform badge', () => {
    render(
      <RecommendationCard
        recommendation={{
          title: 'Cyberpunk 2077',
          reason: 'Pasuje do Twojego gustu.',
          source: 'owned',
          platform: 'gog',
          coverUrl: 'https://example.com/cover.jpg',
        }}
      />,
    )

    expect(screen.getByText('Cyberpunk 2077')).toBeInTheDocument()
    expect(screen.getByText('Pasuje do Twojego gustu.')).toBeInTheDocument()
    expect(screen.getByText('GOG')).toBeInTheDocument()
    const cover = document.querySelector('img')
    expect(cover).toHaveAttribute('src', 'https://example.com/cover.jpg')
  })

  it('shows placeholder when cover is missing', () => {
    render(
      <RecommendationCard
        recommendation={{
          title: 'Hades',
          reason: 'Szybka rozgrywka.',
          source: 'discover',
        }}
      />,
    )

    expect(screen.getByText('Brak okładki')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})
