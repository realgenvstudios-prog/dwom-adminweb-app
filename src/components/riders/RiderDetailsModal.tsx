import React from "react";
import type { RiderData } from "../../services/ridersService";

interface RiderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rider: RiderData | null;
}

const RiderDetailsModal: React.FC<RiderDetailsModalProps> = ({
  isOpen,
  onClose,
  rider,
}) => {
  if (!isOpen || !rider) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">{rider.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Email</p>
                <p className="text-sm text-gray-700">{rider.email || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Phone</p>
                <p className="text-sm text-gray-700">{rider.phone}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">License Number</p>
                <p className="text-sm text-gray-700">{rider.licenseNumber}</p>
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Delivery Information</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Zone</p>
                <p className="text-sm text-gray-700">{rider.zone}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Vehicle Type</p>
                <p className="text-sm text-gray-700 capitalize">{rider.vehicleType}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-1 ${
                  rider.status === "available" ? "bg-green-100 text-green-700" :
                  rider.status === "on_delivery" ? "bg-blue-100 text-blue-700" :
                  rider.status === "busy" ? "bg-yellow-100 text-yellow-700" :
                  "bg-gray-100 text-gray-700"
                }`}>
                  {rider.status}
                </span>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Total Deliveries</p>
                <p className="text-2xl font-bold text-blue-600">{rider.totalDeliveries}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Rating</p>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-500 text-lg">★</span>
                  <span className="text-xl font-bold text-gray-800">{rider.rating.toFixed(1)}</span>
                  <span className="text-xs text-gray-500">/5.0</span>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Earnings</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Total Earnings</p>
                <p className="text-2xl font-bold text-green-600">GH₵ {(rider.totalEarnings || 0).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Account</p>
                <p className="text-sm text-gray-700">{rider.accountName || "Not provided"}</p>
              </div>
            </div>
          </div>

          {/* Status Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Status</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Active</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-1 ${
                  rider.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}>
                  {rider.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Active Orders</p>
                <p className="text-sm text-gray-700">{rider.activeOrders}</p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Location</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Latitude</p>
                <p className="text-sm text-gray-700">{rider.currentLat ? rider.currentLat.toFixed(6) : "Not available"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Longitude</p>
                <p className="text-sm text-gray-700">{rider.currentLng ? rider.currentLng.toFixed(6) : "Not available"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RiderDetailsModal;
