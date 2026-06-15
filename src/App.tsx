import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppShell from '@src/components/app-shell/AppShell'
import GameLibrary from '@src/components/game-library/GameLibrary'
import Home from '@src/components/home/Home'
import Recommendations from '@src/components/recommendations/Recommendations'
import Settings from '@src/components/settings/Settings'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Home />} />
          <Route path='library' element={<GameLibrary />} />
          <Route path='recommendations' element={<Recommendations />} />
          <Route path='settings' element={<Settings />} />
          <Route path='*' element={<Navigate to='/' replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
