import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import LocationsPage from "../pages/LocationsPage";
import LocationDetailPage from "../pages/LocationDetailPage";
import FavouritesPage from "../pages/FavouritesPage";
import AdminDashboard from "../pages/AdminDashboard";
import AdminUsersPage from "../pages/AdminUsersPage";
import AdminEventsPage from "../pages/AdminEventsPage";
import ProtectedRoute from "../components/ProtectedRoute";
import Header from "../components/Header";
import Footer from "../components/Footer";
import MapPage from '../pages/MapPage';
import EventsPage from "../pages/EventsPage";

const AppRouter = () => (
  <BrowserRouter>
    <Header />
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route
        path="/locations"
        element={
          <ProtectedRoute>
            <LocationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/events"
        element={
          <ProtectedRoute>
            <EventsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/location/:id"
        element={
          <ProtectedRoute>
            <LocationDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/favourites"
        element={
          <ProtectedRoute>
            <FavouritesPage />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute adminOnly>
            <AdminUsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/events"
        element={
          <ProtectedRoute adminOnly>
            <AdminEventsPage />
          </ProtectedRoute>
        }
      />
      <Route path="/map" element={<MapPage />} />
      <Route path="/location/:locationId" element={<MapPage />} />
      
    </Routes>
    <Footer />
  </BrowserRouter>
);

export default AppRouter;
