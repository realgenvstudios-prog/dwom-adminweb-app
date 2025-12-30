import React from "react";
import { useNavigate } from "react-router-dom";

const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl shadow p-6 border flex flex-col gap-3">
      <h3 className="text-lg font-semibold mb-2">Quick Actions</h3>
      
      <button
        onClick={() => navigate('/products')}
        className="w-full bg-blue-50 border border-blue-200 text-blue-700 rounded-lg py-2 px-3 font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add New Product
      </button>

      <button
        onClick={() => navigate('/bundles')}
        className="w-full bg-green-50 border border-green-200 text-green-700 rounded-lg py-2 px-3 font-medium hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Create Bundle
      </button>

      <button
        onClick={() => navigate('/marketing')}
        className="w-full bg-purple-50 border border-purple-200 text-purple-700 rounded-lg py-2 px-3 font-medium hover:bg-purple-100 transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        Send Notification
      </button>

      <button
        onClick={() => navigate('/orders')}
        className="w-full bg-orange-50 border border-orange-200 text-orange-700 rounded-lg py-2 px-3 font-medium hover:bg-orange-100 transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        View All Orders
      </button>
    </div>
  );
};

export default QuickActions;
