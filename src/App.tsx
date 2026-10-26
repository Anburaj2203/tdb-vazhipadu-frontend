import { Route, Routes } from 'react-router'
import Layout from '@/components/Layout'
import CartProvider from '@/features/cart/CartProvider'
import About from '@/routes/About'
import Cart from '@/routes/Cart'
import Home from '@/routes/Home'
import NotFound from '@/routes/NotFound'
import Offerings from '@/routes/Offerings'
import Orders from '@/routes/Orders'

function App() {
  return (
    <CartProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="offerings" element={<Offerings />} />
          <Route path="cart" element={<Cart />} />
          <Route path="orders" element={<Orders />} />
          <Route path="about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </CartProvider>
  )
}

export default App
