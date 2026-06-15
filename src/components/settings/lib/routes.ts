export type SettingsRouteId = 'steam' | 'github' | 'psn'

export type SettingsNavItem = {
  id: SettingsRouteId
  label: string
  path: string
  description: string
}

export const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
  {
    id: 'steam',
    label: 'Steam',
    path: '/settings/steam',
    description: 'Klucz Steam Web API',
  },
  {
    id: 'github',
    label: 'GitHub Models',
    path: '/settings/github',
    description: 'Token do rekomendacji AI',
  },
  {
    id: 'psn',
    label: 'PlayStation',
    path: '/settings/psn',
    description: 'Token NPSSO i Online ID',
  },
]
