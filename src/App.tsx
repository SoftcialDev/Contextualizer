import './App.css'
import { RouterProvider } from 'react-router'
import { router } from './router/app.router'

function App() {

  return (
    <>
        <RouterProvider router={router} />
    </>
  )
}

export default App
