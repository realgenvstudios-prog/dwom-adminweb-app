import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './components/LoginPage';
import AcceptInvitePage from './components/AcceptInvitePage';
import ResetPasswordPage from './components/ResetPasswordPage';
import DashboardPage from './components/DashboardPage';
import AdminsPage from './components/AdminsPage';
import OrdersPage from './components/OrdersPage';
import WarehouseOperationsPage from './components/WarehouseOperationsPage';
import CatalogPage from './components/CatalogPage';
import SubscriptionsPage from './components/SubscriptionsPage';
import FieldOperationsPage from './components/FieldOperationsPage';
import FinanceHubPage from './components/FinanceHubPage';
import MarketingPage from './components/MarketingPage';
import CustomersPage from './components/CustomersPage';
import SettingsPage from './components/SettingsPage';
import SupportPage from './components/SupportPage';
import DataDeletionRequestsPage from './components/DataDeletionRequestsPage';
import AnalyticsPage from './components/AnalyticsPage';
import './App.css';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/accept-invite" element={<AcceptInvitePage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
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
      <Route path="/suppliers" element={<Navigate to="/warehouse?tab=suppliers" replace />} />
      <Route path="/expenses" element={<Navigate to="/finance?tab=expenses" replace />} />
      <Route path="/workers" element={<Navigate to="/field-operations?tab=pickers" replace />} />
      <Route path="/workforce" element={<Navigate to="/field-operations" replace />} />
      <Route path="/riders" element={<Navigate to="/field-operations" replace />} />
      <Route path="/delivery-zones" element={<Navigate to="/field-operations?tab=zones" replace />} />
      <Route
        path="/field-operations"
        element={
          <ProtectedRoute>
            <Layout>
              <FieldOperationsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="/founder-ledger" element={<Navigate to="/finance?tab=founderLedger" replace />} />
      <Route
        path="/catalog"
        element={
          <ProtectedRoute>
            <Layout>
              <CatalogPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="/products" element={<Navigate to="/catalog" replace />} />
      <Route path="/categories" element={<Navigate to="/catalog?tab=categories" replace />} />
      <Route path="/bundles" element={<Navigate to="/catalog?tab=bundles" replace />} />
      <Route path="/seasonal" element={<Navigate to="/catalog" replace />} />
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
      <Route path="/notes" element={<Navigate to="/analytics?tab=notes" replace />} />
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
      <Route path="/coupons" element={<Navigate to="/marketing?tab=coupons" replace />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default App;
