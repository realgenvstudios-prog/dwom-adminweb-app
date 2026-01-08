import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import adminAuthService from '../services/authService';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/orders', label: 'Orders' },
    { path: '/warehouse', label: 'Warehouse Operations' },
    { path: '/products', label: 'Products' },
    { path: '/categories', label: 'Categories' },
    { path: '/bundles', label: 'Bundles' },
    { path: '/subscriptions', label: 'Subscriptions' },
    { path: '/riders', label: 'Riders' },
    { path: '/customers', label: 'Customers' },
    { path: '/finance', label: 'Finance' },
    { path: '/marketing', label: 'Marketing' },
    { path: '/admins', label: 'Admins' },
    { path: '/support', label: 'Support' },
    { path: '/settings', label: 'Settings' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    adminAuthService.logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-80 bg-gray-900 text-white flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-3xl font-bold text-    { path: '/products', label: 'Pr        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-6 py-4 text-base font-medium transition-colors ${
                isActive(item.path)
                  ? 'bg-gray-700 text-white border-l-4 border-red-600'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-6 borde    adminAuthService.logout()   <button
            onClick={handleLogout}
            className="w-full px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors text-center"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between shadow-sm">
          <h2 className="text-3xl font-bold text-gray-900">Dashboard              className={`bame="flex items-center gap-4">
            <span className="text-sm text-gray-600">Admin User</span>
            <div class                  : 'text-gray-300 hover:bg-gray-800'
    justify-center text-white font-bold">
              A
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
