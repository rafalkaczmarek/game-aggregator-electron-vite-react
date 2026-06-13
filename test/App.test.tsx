import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { GameApi } from '@shared/types/game'
import type { SettingsApi } from '@shared/types/settings'
import App from '@src/App'

describe('App', () => {
  beforeEach(() => {
    window.gameApi = {
      getLibrary: vi.fn<GameApi['getLibrary']>().mockResolvedValue(null),
      scanAll: vi.fn<GameApi['scanAll']>(),
      scanPlatform: vi.fn(),
    }
    window.settingsApi = {
      get: vi.fn<SettingsApi['get']>().mockResolvedValue({
        steamApiKeySet: false,
        psnNpssoSet: false,
      }),
      update: vi.fn<SettingsApi['update']>(),
    }
  })

  it('renders the shell with settings and library sections', async () => {
    render(<App />)

    expect(screen.getByText('Wszystkie gry w jednym miejscu.')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Scan libraries' })).toBeInTheDocument()
  })
})
