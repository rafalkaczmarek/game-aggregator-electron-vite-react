import { MAX_USER_MESSAGE_LENGTH } from '../../shared/types/recommendations'

export function normalizeUserMessage(userMessage?: string): string | undefined {
  const trimmed = userMessage?.trim()
  if (!trimmed) return undefined
  return trimmed.slice(0, MAX_USER_MESSAGE_LENGTH)
}

export function buildUserPreferenceLines(userMessage?: string): string[] {
  const message = normalizeUserMessage(userMessage)
  if (!message) return []

  return [
    '',
    'DODATKOWE WSKAZÓWKI OD UŻYTKOWNIKA:',
    message,
    'Uwzględnij te preferencje przy wyborze rekomendacji.',
  ]
}
