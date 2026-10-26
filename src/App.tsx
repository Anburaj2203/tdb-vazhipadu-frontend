import { Navigate, Route, Routes } from 'react-router'
import Layout from '@/components/Layout'
import CartProvider from '@/features/cart/CartProvider'
import Cart from '@/routes/Cart'
import NotFound from '@/routes/NotFound'
import Offerings from '@/routes/Offerings'
import Orders from '@/routes/Orders'

function App() {
  return (
    <CartProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/offerings" replace />} />
          <Route path="offerings" element={<Offerings />} />
          <Route path="cart" element={<Cart />} />
          <Route path="orders" element={<Orders />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </CartProvider>
  )
}

export default App
