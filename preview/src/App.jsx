import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import AnnouncementBar from './components/AnnouncementBar';
import HomePage from './HomePage';
import ShopPage from './pages/ShopPage';
import PreOrdersPage from './pages/PreOrdersPage';
import HowPreordersPage from './pages/HowPreordersPage';
import NewArrivalsPage from './pages/NewArrivalsPage';
import DeckBuilderPacksPage from './pages/DeckBuilderPacksPage';
import ContactPage from './pages/ContactPage';
// F6: AdminPage is the heaviest single page (~2.5k lines); lazy-load so the
// public storefront chunk doesn't ship it.
const AdminPage = lazy(() => import('./pages/AdminPage'));
import ProductPage from './pages/ProductPage';
import NotFoundPage from './pages/NotFoundPage';
import AccountLoginPage from './pages/AccountLoginPage';
import AccountOrdersPage from './pages/AccountOrdersPage';
import BuylistPage from './pages/BuylistPage';
import SinglesPage from './pages/SinglesPage';
import CartPage from './pages/CartPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import { ToastProvider } from './components/Toast';
import MobileTabBar from './components/MobileTabBar';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AnnouncementBar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/pre-orders" element={<PreOrdersPage />} />
          <Route path="/how-preorders-work" element={<HowPreordersPage />} />
          <Route path="/new-arrivals" element={<NewArrivalsPage />} />
          <Route path="/deck-builder-packs" element={<DeckBuilderPacksPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/admin" element={<Suspense fallback={null}><AdminPage /></Suspense>} />
          <Route path="/account" element={<AccountLoginPage />} />
          <Route path="/account/orders" element={<AccountOrdersPage />} />
          <Route path="/shop/:id" element={<ProductPage />} />
          <Route path="/buylist" element={<BuylistPage />} />
          <Route path="/singles" element={<SinglesPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <MobileTabBar />
      </ToastProvider>
    </BrowserRouter>
  );
}
