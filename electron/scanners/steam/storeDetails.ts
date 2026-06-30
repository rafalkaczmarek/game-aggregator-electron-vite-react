interface SteamStoreAppData {
  short_description?: string
}

interface SteamStoreAppEntry {
  success?: boolean
  data?: SteamStoreAppData
}

export async function fetchSteamStoreDescription(appId: string): Promise<string | null> {
  const url = `https://store.steampowered.com/api/appdetails?appids=${appId}&l=english`

  try {
    const response = await fetch(url)
    if (!response.ok) return null

    const payload = (await response.json()) as Record<string, SteamStoreAppEntry>
    const entry = payload[appId]
    const description = entry?.success ? entry.data?.short_description : undefined

    if (typeof description !== 'string') return null

    const trimmed = description.trim()
    return trimmed.length > 0 ? trimmed : null
  } catch {
    return null
  }
}
