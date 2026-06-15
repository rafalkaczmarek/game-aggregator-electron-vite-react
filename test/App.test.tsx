import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
      getRecommendations: vi.fn<GameApi['getRecommendations']>().mockResolvedValue({
        owned: [],
        discover: [],
        errors: [],
        basedOnPlayedCount: 0,
      }),
    }
    window.settingsApi = {
      get: vi.fn<SettingsApi['get']>().mockResolvedValue({
        steamApiKeySet: false,
        githubPatSet: false,
        psnNpssoSet: false,
      }),
      update: vi.fn<SettingsApi['update']>(),
    }
  })

  it('renders the shell with sidebar navigation and home page', () => {
    render(<App />)

    expect(screen.getByTestId('app-sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('home-page')).toBeInTheDocument()
    expect(screen.getByText('Wszystkie gry w jednym miejscu.')).toBeInTheDocument()
    expect(screen.getByTestId('nav-library')).toBeInTheDocument()
    expect(screen.getByTestId('nav-recommendations')).toBeInTheDocument()
    expect(screen.getByTestId('nav-settings')).toBeInTheDocument()
  })

  it('navigates to separate pages from the sidebar', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByTestId('nav-library'))
    expect(screen.getByRole('button', { name: 'Scan libraries' })).toBeInTheDocument()

    await user.click(screen.getByTestId('nav-recommendations'))
    expect(screen.getByTestId('recommendations-section')).toBeInTheDocument()

    await user.click(screen.getByTestId('nav-settings'))
    expect(screen.getByText('Settings', { exact: true })).toBeInTheDocument()
  })
})
