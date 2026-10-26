import { Route, Routes } from 'react-router'
import Layout from '@/components/Layout'
import About from '@/routes/About'
import Home from '@/routes/Home'
import NotFound from '@/routes/NotFound'
import Orders from '@/routes/Orders'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="orders" element={<Orders />} />
        <Route path="about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App
