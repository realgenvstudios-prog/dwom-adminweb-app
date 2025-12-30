import React, { useState, useEffect } from "react";
import adminApiClient from "../services/apiClient";

interface Rider {
  id: number;
  name: string;
  status: string;
  isActive: boolean;
}

const RidersActivity: React.FC = () => {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRiders();
  }, []);

  const fetchRiders = async () => {
    try {
      setLoading(true);
      const allRiders = (await adminApiClient.get('/riders/admin/all')) as any;
      const activeRiders = (allRiders || [])
        .filter((r: any) => r.isActive)
        .slice(0, 4)
        .map((r: any) => ({
          id: r.id,
          name: r.name,
          status: r.status === 'available' ? 'Online' : 'Busy',
          isActive: r.isActive,
        }));
      setRiders(activeRiders);
    } catch (error) {
      console.error("Failed to fetch riders:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6 border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Riders Activity</h3>
        <a href="/riders" className="text-blue-600 text-sm font-medium hover:underline">View all riders</a>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <ul className="space-y-2">
          {riders.length > 0 ? (
            riders.map((rider) => (
              <li key={rider.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500 inline-block"></span>
                  <span>{rider.name}</span>
                </div>
                <span className="text-xs text-gray-500">{rider.status}</span>
              </li>
            ))
          ) : (
            <li className="text-sm text-gray-500">No active riders</li>
          )}
        </ul>
      )}
    </div>
  );
};

export default RidersActivity;
