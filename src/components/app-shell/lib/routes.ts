export type AppRouteId = 'home' | 'library' | 'recommendations' | 'settings'

export type AppNavItem = {
  id: AppRouteId
  label: string
  path: string
  description: string
}

export const APP_NAV_ITEMS: AppNavItem[] = [
  {
    id: 'home',
    label: 'Start',
    path: '/',
    description: 'Przegląd aplikacji',
  },
  {
    id: 'library',
    label: 'Biblioteka',
    path: '/library',
    description: 'Gry ze wszystkich platform',
  },
  {
    id: 'recommendations',
    label: 'Rekomendacje',
    path: '/recommendations',
    description: 'Propozycje na podstawie AI',
  },
  {
    id: 'settings',
    label: 'Ustawienia',
    path: '/settings',
    description: 'Tokeny i klucze API',
  },
]
