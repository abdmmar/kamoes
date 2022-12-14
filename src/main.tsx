import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Home } from '@/pages/Home'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
])

const Main = () => <RouterProvider router={router} />

export default Main
