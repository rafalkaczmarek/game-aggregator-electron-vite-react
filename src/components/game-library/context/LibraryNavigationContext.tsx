import { createContext, useContext } from 'react'

type LibraryNavigationContextValue = {
  onGameNavigate: (gameKey: string) => void
  registerScrollContainer: (element: HTMLElement | null) => void
}

export const LibraryNavigationContext = createContext<LibraryNavigationContextValue | null>(null)

export function useLibraryNavigation(): LibraryNavigationContextValue | null {
  return useContext(LibraryNavigationContext)
}
