import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './components/LoginPage';
import AdminsPage from './components/AdminsPage';
import OrdersPage from './components/OrdersPage';
import WarehouseOperationsPage from './components/WarehouseOperationsPage';
import ProductsPage from './components/ProductsPage';
import CategoriesPage from './components/CategoriesPage';
import BundlesPage from './components/BundlesPage';
import SubscriptionsPage from './components/SubscriptionsPage';
import RidersPage from './components/RidersPage';
import FinancePage from './components/FinancePage';
import MarketingPage from './components/MarketingPage';
import CustomersPage from './components/CustomersPage';
import SettingsPage from './components/SettingsPage';
import './App.css';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AdminsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <OrdersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/warehouse"
        element={
          <ProtectedRoute>
            <WarehouseOperationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <ProductsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/categories"
        element={
          <ProtectedRoute>
            <CategoriesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bundles"
        element={
          <ProtectedRoute>
            <BundlesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/subscriptions"
        element={
          <ProtectedRoute>
            <SubscriptionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/riders"
        element={
          <ProtectedRoute>
            <RidersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance"
        element={
          <ProtectedRoute>
            <FinancePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/marketing"
        element={
          <ProtectedRoute>
            <MarketingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customers"
        element={
          <ProtectedRoute>
            <CustomersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default App;
