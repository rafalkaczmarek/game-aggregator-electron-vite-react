import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import PlayStatusFilter from '@src/components/game-library/ui/PlayStatusFilter'

describe('PlayStatusFilter', () => {
  it('selects a play status filter', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()

    render(<PlayStatusFilter value='all' onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: 'Played' }))

    expect(onChange).toHaveBeenCalledWith('played')
  })

  it('marks the active filter with aria-pressed', () => {
    render(<PlayStatusFilter value='unplayed' onChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Not played' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Played' })).toHaveAttribute('aria-pressed', 'false')
  })
})
