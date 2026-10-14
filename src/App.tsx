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
import BundlesPage from './components/BundlesPage';
import SeasonalProductsPage from './components/SeasonalProductsPage';
import SubscriptionsPage from './components/SubscriptionsPage';
import WorkforcePage from './components/WorkforcePage';
import FinanceHubPage from './components/FinanceHubPage';
import MarketingPage from './components/MarketingPage';
import CustomersPage from './components/CustomersPage';
import NotesTrackingPage from './components/NotesTrackingPage';
import SettingsPage from './components/SettingsPage';
import SupportPage from './components/SupportPage';
import DataDeletionRequestsPage from './components/DataDeletionRequestsPage';
import DeliveryZonesPage from './components/DeliveryZonesPage';
import AnalyticsPage from './components/AnalyticsPage';
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
      <Route path="/suppliers" element={<Navigate to="/warehouse" replace />} />
      <Route path="/expenses" element={<Navigate to="/finance" replace />} />
      <Route path="/workers" element={<Navigate to="/workforce" replace />} />
      <Route
        path="/workforce"
        element={
          <ProtectedRoute>
            <Layout>
              <WorkforcePage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="/founder-ledger" element={<Navigate to="/finance" replace />} />
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
      <Route path="/categories" element={<Navigate to="/products" replace />} />
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
      <Route path="/riders" element={<Navigate to="/workforce" replace />} />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <Layout>
              <AnalyticsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance"
        element={
          <ProtectedRoute>
            <Layout>
              <FinanceHubPage />
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
      <Route path="/coupons" element={<Navigate to="/marketing" replace />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default App;
