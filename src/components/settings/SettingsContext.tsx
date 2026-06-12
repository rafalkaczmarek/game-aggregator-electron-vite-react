import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { SettingsState, SettingsUpdate } from '@shared/types/settings'

interface SettingsContextValue {
  state: SettingsState | null
  update: (update: SettingsUpdate) => Promise<SettingsState>
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SettingsState | null>(null)

  useEffect(() => {
    void window.settingsApi.get().then(setState)
  }, [])

  const update = useCallback(async (patch: SettingsUpdate) => {
    const next = await window.settingsApi.update(patch)
    setState(next)
    return next
  }, [])

  return (
    <SettingsContext.Provider value={{ state, update }}>{children}</SettingsContext.Provider>
  )
}

export function useSettingsContext() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettingsContext must be used within SettingsProvider')
  }
  return context
}
