import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import AnnouncementBar from './components/AnnouncementBar';
import HomePage from './HomePage';
import ShopPage from './pages/ShopPage';
import PreOrdersPage from './pages/PreOrdersPage';
import NewArrivalsPage from './pages/NewArrivalsPage';
import ContactPage from './pages/ContactPage';
import AdminPage from './pages/AdminPage';
import ProductPage from './pages/ProductPage';
import NotFoundPage from './pages/NotFoundPage';
import AccountLoginPage from './pages/AccountLoginPage';
import AccountOrdersPage from './pages/AccountOrdersPage';
import BuylistPage from './pages/BuylistPage';
import SinglesPage from './pages/SinglesPage';

export default function App() {
  return (
    <BrowserRouter>
      <AnnouncementBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/pre-orders" element={<PreOrdersPage />} />
        <Route path="/new-arrivals" element={<NewArrivalsPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/account" element={<AccountLoginPage />} />
        <Route path="/account/orders" element={<AccountOrdersPage />} />
        <Route path="/shop/:id" element={<ProductPage />} />
        <Route path="/buylist" element={<BuylistPage />} />
        <Route path="/singles" element={<SinglesPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
