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
    get.mockResolvedValue({ steamApiKeySet: false, psnNpssoSet: false })
    window.settingsApi = { get, update }
  })

  it('loads current settings state on mount', async () => {
    get.mockResolvedValue({ steamApiKeySet: true, psnNpssoSet: false })

    render(<Settings />)

    await waitFor(() => {
      expect(screen.getByText('Steam API key configured')).toBeInTheDocument()
    })
    expect(get).toHaveBeenCalledTimes(1)
  })

  it('shows message when saving empty key without configured key', async () => {
    const user = userEvent.setup()
    render(<Settings />)

    await waitFor(() => {
      expect(screen.getByLabelText('Steam Web API key')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Save API key' }))

    expect(update).not.toHaveBeenCalled()
    expect(screen.getByText('No changes to save.')).toBeInTheDocument()
  })

  it('saves trimmed api key', async () => {
    const user = userEvent.setup()
    update.mockResolvedValue({ steamApiKeySet: true, psnNpssoSet: false })

    render(<Settings />)
    await waitFor(() => {
      expect(screen.getByLabelText('Steam Web API key')).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText('Steam Web API key'), '  my-key  ')
    await user.click(screen.getByRole('button', { name: 'Save API key' }))

    await waitFor(() => {
      expect(screen.getByText('Settings saved.')).toBeInTheDocument()
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
    await user.click(screen.getByRole('button', { name: 'Save API key' }))

    await waitFor(() => {
      expect(screen.getByText('save failed')).toBeInTheDocument()
    })
  })

  it('clears configured api key', async () => {
    const user = userEvent.setup()
    get.mockResolvedValue({ steamApiKeySet: true, psnNpssoSet: false })
    update.mockResolvedValue({ steamApiKeySet: false, psnNpssoSet: false })

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
    get.mockResolvedValue({ steamApiKeySet: true, psnNpssoSet: false })
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

  it('loads psn online id from settings state', async () => {
    get.mockResolvedValue({ steamApiKeySet: false, psnNpssoSet: true, psnOnlineId: 'player-one' })

    render(<Settings />)

    await waitFor(() => {
      expect(screen.getByLabelText('PSN Online ID (optional)')).toHaveValue('player-one')
    })
    expect(screen.getByText('PSN NPSSO configured')).toBeInTheDocument()
  })

  it('saves trimmed psn npsso and online id', async () => {
    const user = userEvent.setup()
    update.mockResolvedValue({
      steamApiKeySet: false,
      psnNpssoSet: true,
      psnOnlineId: 'player-one',
    })

    render(<Settings />)
    await waitFor(() => {
      expect(screen.getByLabelText('PSN NPSSO token')).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText('PSN NPSSO token'), '  npsso-token  ')
    await user.type(screen.getByLabelText('PSN Online ID (optional)'), '  player-one  ')
    await user.click(screen.getByRole('button', { name: 'Save account settings' }))

    await waitFor(() => {
      expect(screen.getByText('Settings saved.')).toBeInTheDocument()
    })
    expect(update).toHaveBeenCalledWith({
      psnNpsso: 'npsso-token',
      psnOnlineId: 'player-one',
    })
  })

  it('shows message when saving whitespace-only npsso', async () => {
    const user = userEvent.setup()

    render(<Settings />)
    await waitFor(() => {
      expect(screen.getByLabelText('PSN NPSSO token')).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText('PSN NPSSO token'), '   ')
    await user.click(screen.getByRole('button', { name: 'Save account settings' }))

    expect(update).not.toHaveBeenCalled()
    expect(
      screen.getByText('PSN NPSSO token cannot be empty. Use Clear token to remove it.'),
    ).toBeInTheDocument()
  })

  it('clears configured psn npsso token', async () => {
    const user = userEvent.setup()
    get.mockResolvedValue({ steamApiKeySet: false, psnNpssoSet: true })
    update.mockResolvedValue({ steamApiKeySet: false, psnNpssoSet: false })

    render(<Settings />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Clear token' })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Clear token' }))

    await waitFor(() => {
      expect(screen.getByText('PSN NPSSO token removed.')).toBeInTheDocument()
    })
    expect(update).toHaveBeenCalledWith({ psnNpsso: '' })
  })

  it('shows psn save error message when update fails', async () => {
    const user = userEvent.setup()
    update.mockRejectedValue(new Error('psn save failed'))

    render(<Settings />)
    await waitFor(() => {
      expect(screen.getByLabelText('PSN NPSSO token')).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText('PSN NPSSO token'), 'bad-token')
    await user.click(screen.getByRole('button', { name: 'Save account settings' }))

    await waitFor(() => {
      expect(screen.getByText('psn save failed')).toBeInTheDocument()
    })
  })
})
