import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PlatformBadge, { PlatformBadges } from '@src/components/game-library/ui/PlatformBadge'

describe('PlatformBadge', () => {
  it('renders a single platform label', () => {
    render(<PlatformBadge platform='steam' />)
    expect(screen.getByText('Steam')).toBeInTheDocument()
  })

  it('renders multiple platform badges in order', () => {
    render(<PlatformBadges platforms={['gog', 'epic', 'steam']} />)

    const badges = screen.getAllByText(/^(GOG|Epic|Steam)$/)
    expect(badges).toHaveLength(3)
    expect(badges.map((badge) => badge.textContent)).toEqual(['GOG', 'Epic', 'Steam'])
  })
})
