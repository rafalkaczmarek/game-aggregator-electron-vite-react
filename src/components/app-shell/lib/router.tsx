import { createHashRouter, Navigate } from 'react-router-dom'
import AppShell from '../AppShell'
import Home from '@src/components/home/Home'

export const appRouter = createHashRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: <Home /> },
      {
        path: 'library',
        lazy: () =>
          import('@src/components/game-library/GameLibrary').then((module) => ({
            Component: module.default,
          })),
      },
      {
        path: 'recommendations',
        lazy: () =>
          import('@src/components/recommendations/Recommendations').then((module) => ({
            Component: module.default,
          })),
      },
      {
        path: 'settings',
        lazy: () =>
          import('@src/components/settings/Settings').then((module) => ({
            Component: module.default,
          })),
        children: [
          { index: true, element: <Navigate to='steam' replace /> },
          {
            path: 'steam',
            lazy: () =>
              import('@src/components/settings/ui/SteamSettingsPage').then((module) => ({
                Component: module.default,
              })),
          },
          {
            path: 'github',
            lazy: () =>
              import('@src/components/settings/ui/GitHubModelsSettingsPage').then((module) => ({
                Component: module.default,
              })),
          },
          {
            path: 'psn',
            lazy: () =>
              import('@src/components/settings/ui/PsnSettingsPage').then((module) => ({
                Component: module.default,
              })),
          },
        ],
      },
      { path: '*', element: <Navigate to='/' replace /> },
    ],
  },
])
