import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { GameApi } from '@shared/types/game'
import type { SettingsApi } from '@shared/types/settings'
import Recommendations from '@src/components/recommendations/Recommendations'

describe('Recommendations', () => {
  const getRecommendations = vi.fn<GameApi['getRecommendations']>()
  const settingsGet = vi.fn<SettingsApi['get']>()

  beforeEach(() => {
    getRecommendations.mockReset()
    settingsGet.mockReset()
    settingsGet.mockResolvedValue({ steamApiKeySet: false, githubPatSet: true, psnNpssoSet: false })
    window.gameApi = {
      getLibrary: vi.fn(),
      scanAll: vi.fn(),
      scanPlatform: vi.fn(),
      getRecommendations,
    }
    window.settingsApi = { get: settingsGet, update: vi.fn() }
  })

  it('disables generate button when github pat is not configured', async () => {
    settingsGet.mockResolvedValue({ steamApiKeySet: false, githubPatSet: false, psnNpssoSet: false })

    render(<Recommendations />)

    await waitFor(() => {
      expect(screen.getByTestId('generate-recommendations')).toBeDisabled()
    })
    expect(
      screen.getByText(/Dodaj token GitHub PAT/i),
    ).toBeInTheDocument()
  })

  it('loads and displays recommendation results', async () => {
    const user = userEvent.setup()
    getRecommendations.mockResolvedValue({
      owned: [
        {
          title: 'Cyberpunk 2077',
          reason: 'Masz ją w katalogu.',
          source: 'owned',
          platform: 'gog',
        },
      ],
      discover: [
        {
          title: 'Hades',
          reason: 'Dynamiczna akcja.',
          source: 'discover',
        },
      ],
      errors: ['Uwaga testowa'],
      basedOnPlayedCount: 12,
    })

    render(<Recommendations />)
    await user.click(screen.getByTestId('generate-recommendations'))

    await waitFor(() => {
      expect(screen.getByText('Cyberpunk 2077')).toBeInTheDocument()
    })
    expect(screen.getByText('Hades')).toBeInTheDocument()
    expect(screen.getByText('Profil oparty na 12 grach z czasem gry.')).toBeInTheDocument()
    expect(screen.getByText('Uwaga testowa')).toBeInTheDocument()
  })

  it('uses singular copy for one played game', async () => {
    const user = userEvent.setup()
    getRecommendations.mockResolvedValue({
      owned: [{ title: 'Dota 2', reason: 'Powód', source: 'owned', platform: 'steam' }],
      discover: [],
      errors: [],
      basedOnPlayedCount: 1,
    })

    render(<Recommendations />)
    await user.click(screen.getByTestId('generate-recommendations'))

    await waitFor(() => {
      expect(screen.getByText('Profil oparty na 1 grze z czasem gry.')).toBeInTheDocument()
    })
  })

  it('shows empty recommendation state', async () => {
    const user = userEvent.setup()
    getRecommendations.mockResolvedValue({
      owned: [],
      discover: [],
      errors: [],
      basedOnPlayedCount: 0,
    })

    render(<Recommendations />)
    await user.click(screen.getByTestId('generate-recommendations'))

    await waitFor(() => {
      expect(
        screen.getByText(/Najpierw zeskanuj bibliotekę/i),
      ).toBeInTheDocument()
    })
  })

  it('shows empty owned and discover sections separately', async () => {
    const user = userEvent.setup()
    getRecommendations.mockResolvedValue({
      owned: [],
      discover: [{ title: 'Hades', reason: 'Nowość', source: 'discover' }],
      errors: [],
      basedOnPlayedCount: 3,
    })

    render(<Recommendations />)
    await user.click(screen.getByTestId('generate-recommendations'))

    await waitFor(() => {
      expect(screen.getByText(/Brak dopasowanych gier w katalogu/i)).toBeInTheDocument()
    })
    expect(screen.getByText('Hades')).toBeInTheDocument()
  })

  it('shows error when recommendation request throws', async () => {
    const user = userEvent.setup()
    getRecommendations.mockRejectedValue(new Error('API padło'))

    render(<Recommendations />)
    await user.click(screen.getByTestId('generate-recommendations'))

    await waitFor(() => {
      expect(screen.getByText('API padło')).toBeInTheDocument()
    })
  })
})
