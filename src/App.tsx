import { RouterProvider } from 'react-router-dom'
import { appRouter } from '@src/components/app-shell/lib/router'

function App() {
  return <RouterProvider router={appRouter} />
}

export default App
