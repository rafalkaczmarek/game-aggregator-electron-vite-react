import { useEffect, useState } from 'react'
import type { RecommendationsOptions, RecommendationsResult } from '@shared/types/recommendations'

function toRecommendationsOptions(userMessage: string): RecommendationsOptions | undefined {
  const trimmed = userMessage.trim()
  return trimmed ? { userMessage: trimmed } : undefined
}

export function useRecommendations() {
  const [result, setResult] = useState<RecommendationsResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [githubConfigured, setGithubConfigured] = useState<boolean | null>(null)
  const [userMessage, setUserMessage] = useState('')

  useEffect(() => {
    void window.settingsApi.get().then((settings) => {
      setGithubConfigured(settings.githubPatSet)
    })
  }, [])

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      const recommendations = await window.gameApi.getRecommendations(
        toRecommendationsOptions(userMessage),
      )
      setResult(recommendations)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Nie udało się wygenerować rekomendacji.')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  return {
    result,
    loading,
    error,
    githubConfigured,
    userMessage,
    setUserMessage,
    handleGenerate,
  }
}
