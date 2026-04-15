import { Routes, Route } from 'react-router-dom';
import { ProductsList } from './ProductsList';
import { ProductDetail } from './ProductDetail';

export function ProductsRouter() {
  return (
    <Routes>
      <Route index element={<ProductsList />} />
      <Route path=":id" element={<ProductDetail />} />
    </Routes>
  );
}
