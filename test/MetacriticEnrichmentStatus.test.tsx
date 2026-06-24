import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import MetacriticEnrichmentStatus from '@src/components/game-library/ui/MetacriticEnrichmentStatus'

describe('MetacriticEnrichmentStatus', () => {
  it('renders nothing when idle', () => {
    const { container } = render(<MetacriticEnrichmentStatus state={{ status: 'idle' }} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows running progress', () => {
    render(
      <MetacriticEnrichmentStatus
        state={{ status: 'running', done: 12, total: 40, enriched: 8 }}
      />,
    )

    expect(screen.getByTestId('metacritic-enrichment-status')).toBeInTheDocument()
    expect(screen.getByText('Fetching Metacritic scores…')).toBeInTheDocument()
    expect(screen.getByText('12/40 (30%)')).toBeInTheDocument()
    expect(screen.getByText('8 games rated so far')).toBeInTheDocument()
  })

  it('shows finished summary and dismiss button', async () => {
    const onDismiss = vi.fn()
    const user = userEvent.setup()

    render(
      <MetacriticEnrichmentStatus
        state={{
          status: 'finished',
          done: 40,
          total: 40,
          enriched: 28,
          durationMs: 45_000,
        }}
        onDismiss={onDismiss}
      />,
    )

    expect(screen.getByText(/Metacritic scores updated — 28 games rated in 45s/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('shows failure message', () => {
    render(<MetacriticEnrichmentStatus state={{ status: 'failed' }} />)

    expect(
      screen.getByText(/Metacritic scores could not be loaded/i),
    ).toBeInTheDocument()
  })
})
