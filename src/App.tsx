import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './components/LoginPage';
import AcceptInvitePage from './components/AcceptInvitePage';
import DashboardPage from './components/DashboardPage';
import AdminsPage from './components/AdminsPage';
import OrdersPage from './components/OrdersPage';
import WarehouseOperationsPage from './components/WarehouseOperationsPage';
import ProductsPage from './components/ProductsPage';
import CategoriesPage from './components/CategoriesPage';
import BundlesPage from './components/BundlesPage';
import SeasonalProductsPage from './components/SeasonalProductsPage';
import SubscriptionsPage from './components/SubscriptionsPage';
import RidersPage from './components/RidersPage';
import FinancePage from './components/FinancePage';
import MarketingPage from './components/MarketingPage';
import CustomersPage from './components/CustomersPage';
import NotesTrackingPage from './components/NotesTrackingPage';
import SettingsPage from './components/SettingsPage';
import SupportPage from './components/SupportPage';
import DataDeletionRequestsPage from './components/DataDeletionRequestsPage';
import DeliveryZonesPage from './components/DeliveryZonesPage';
import CouponsPage from './components/CouponsPage';
import SuppliersPage from './components/SuppliersPage';
import './App.css';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/accept-invite" element={<AcceptInvitePage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admins"
        element={
          <ProtectedRoute>
            <Layout>
              <AdminsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <Layout>
              <OrdersPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/warehouse"
        element={
          <ProtectedRoute>
            <Layout>
              <WarehouseOperationsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/suppliers"
        element={
          <ProtectedRoute>
            <Layout>
              <SuppliersPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <Layout>
              <ProductsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/categories"
        element={
          <ProtectedRoute>
            <Layout>
              <CategoriesPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/bundles"
        element={
          <ProtectedRoute>
            <Layout>
              <BundlesPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/seasonal"
        element={
          <ProtectedRoute>
            <Layout>
              <SeasonalProductsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/subscriptions"
        element={
          <ProtectedRoute>
            <Layout>
              <SubscriptionsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/riders"
        element={
          <ProtectedRoute>
            <Layout>
              <RidersPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance"
        element={
          <ProtectedRoute>
            <Layout>
              <FinancePage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/marketing"
        element={
          <ProtectedRoute>
            <Layout>
              <MarketingPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/customers"
        element={
          <ProtectedRoute>
            <Layout>
              <CustomersPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/notes"
        element={
          <ProtectedRoute>
            <Layout>
              <NotesTrackingPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout>
              <SettingsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/support"
        element={
          <ProtectedRoute>
            <Layout>
              <SupportPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/data-deletion-requests"
        element={
          <ProtectedRoute>
            <Layout>
              <DataDeletionRequestsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/delivery-zones"
        element={
          <ProtectedRoute>
            <Layout>
              <DeliveryZonesPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/coupons"
        element={
          <ProtectedRoute>
            <Layout>
              <CouponsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default App;
