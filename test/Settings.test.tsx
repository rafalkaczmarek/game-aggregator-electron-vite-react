import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SettingsApi } from '@shared/types/settings'
import Settings from '@src/components/Settings'

describe('Settings', () => {
  const get = vi.fn<SettingsApi['get']>()
  const update = vi.fn<SettingsApi['update']>()

  beforeEach(() => {
    get.mockReset()
    update.mockReset()
    get.mockResolvedValue({ steamApiKeySet: false })
    window.settingsApi = { get, update }
  })

  it('loads current settings state on mount', async () => {
    get.mockResolvedValue({ steamApiKeySet: true })

    render(<Settings />)

    await waitFor(() => {
      expect(screen.getByText('API key configured')).toBeInTheDocument()
    })
    expect(get).toHaveBeenCalledTimes(1)
  })

  it('shows message when saving empty key without configured key', async () => {
    const user = userEvent.setup()
    render(<Settings />)

    await waitFor(() => {
      expect(screen.getByLabelText('Steam Web API key')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Save settings' }))

    expect(update).not.toHaveBeenCalled()
    expect(screen.getByText('No API key provided.')).toBeInTheDocument()
  })

  it('saves trimmed api key', async () => {
    const user = userEvent.setup()
    update.mockResolvedValue({ steamApiKeySet: true })

    render(<Settings />)
    await waitFor(() => {
      expect(screen.getByLabelText('Steam Web API key')).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText('Steam Web API key'), '  my-key  ')
    await user.click(screen.getByRole('button', { name: 'Save settings' }))

    await waitFor(() => {
      expect(screen.getByText('Steam API key saved.')).toBeInTheDocument()
    })
    expect(update).toHaveBeenCalledWith({ steamApiKey: 'my-key' })
  })

  it('shows save error message when update fails', async () => {
    const user = userEvent.setup()
    update.mockRejectedValue(new Error('save failed'))

    render(<Settings />)
    await waitFor(() => {
      expect(screen.getByLabelText('Steam Web API key')).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText('Steam Web API key'), 'bad-key')
    await user.click(screen.getByRole('button', { name: 'Save settings' }))

    await waitFor(() => {
      expect(screen.getByText('save failed')).toBeInTheDocument()
    })
  })

  it('clears configured api key', async () => {
    const user = userEvent.setup()
    get.mockResolvedValue({ steamApiKeySet: true })
    update.mockResolvedValue({ steamApiKeySet: false })

    render(<Settings />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Clear key' })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Clear key' }))

    await waitFor(() => {
      expect(screen.getByText('Steam API key removed.')).toBeInTheDocument()
    })
    expect(update).toHaveBeenCalledWith({ steamApiKey: '' })
  })

  it('shows clear error message when update fails', async () => {
    const user = userEvent.setup()
    get.mockResolvedValue({ steamApiKeySet: true })
    update.mockRejectedValue(new Error('clear failed'))

    render(<Settings />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Clear key' })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Clear key' }))

    await waitFor(() => {
      expect(screen.getByText('clear failed')).toBeInTheDocument()
    })
  })
})
