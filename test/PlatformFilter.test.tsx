import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import PlatformFilter from '@src/components/game-library/ui/PlatformFilter'

describe('PlatformFilter', () => {
  it('adds a platform in canonical order', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()

    render(<PlatformFilter value={['steam']} onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: 'Epic' }))

    expect(onChange).toHaveBeenCalledWith(['steam', 'epic'])
  })

  it('removes a selected platform', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()

    render(<PlatformFilter value={['steam', 'gog']} onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: 'Steam' }))

    expect(onChange).toHaveBeenCalledWith(['gog'])
  })

  it('marks active platforms with aria-pressed', () => {
    render(<PlatformFilter value={['psn']} onChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'PSN' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Steam' })).toHaveAttribute('aria-pressed', 'false')
  })
})
