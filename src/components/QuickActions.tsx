import React from "react";
import { useNavigate } from "react-router-dom";

const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl shadow p-6 border">
      <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => navigate('/products')}
          className="bg-blue-50 border border-blue-200 text-blue-700 rounded-lg py-2 px-3 text-sm font-medium hover:bg-blue-100 transition-colors"
        >
          Add Product
        </button>

        <button
          onClick={() => navigate('/bundles')}
          className="bg-green-50 border border-green-200 text-green-700 rounded-lg py-2 px-3 text-sm font-medium hover:bg-green-100 transition-colors"
        >
          Create Bundle
        </button>

        <button
          onClick={() => navigate('/marketing')}
          className="bg-purple-50 border border-purple-200 text-purple-700 rounded-lg py-2 px-3 text-sm font-medium hover:bg-purple-100 transition-colors"
        >
          Notification
        </button>

        <button
          onClick={() => navigate('/orders')}
          className="bg-orange-50 border border-orange-200 text-orange-700 rounded-lg py-2 px-3 text-sm font-medium hover:bg-orange-100 transition-colors"
        >
          View Orders
        </button>
      </div>
    </div>
  );
};

export default QuickActions;
