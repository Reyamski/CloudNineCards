import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import AnnouncementBar from './components/AnnouncementBar';
import HomePage from './HomePage';
import ShopPage from './pages/ShopPage';
import PreOrdersPage from './pages/PreOrdersPage';
import SinglesPage from './pages/SinglesPage';
import NewArrivalsPage from './pages/NewArrivalsPage';
import ContactPage from './pages/ContactPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  return (
    <BrowserRouter>
      <AnnouncementBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/pre-orders" element={<PreOrdersPage />} />
        <Route path="/singles" element={<SinglesPage />} />
        <Route path="/new-arrivals" element={<NewArrivalsPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}
