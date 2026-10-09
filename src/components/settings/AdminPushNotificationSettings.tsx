import React, { useEffect, useState } from 'react';
import adminPushService from '../../services/adminPushService';

const AdminPushNotificationSettings: React.FC = () => {
  const [supported, setSupported] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      setSupported(adminPushService.isSupported());
      setSubscribed(await adminPushService.isSubscribed());
      setChecking(false);
    };
    check();
  }, []);

  const handleEnable = async () => {
    setLoading(true);
    setError(null);
    const result = await adminPushService.subscribe();
    if (result.success) {
      setSubscribed(true);
    } else {
      setError(result.error || 'Failed to enable notifications.');
    }
    setLoading(false);
  };

  const handleDisable = async () => {
    setLoading(true);
    setError(null);
    const ok = await adminPushService.unsubscribe();
    if (ok) {
      setSubscribed(false);
    } else {
      setError('Failed to disable notifications.');
    }
    setLoading(false);
  };

  return (
    <div className="border-t border-gray-100 pt-6 mt-2">
      <h3 className="text-sm font-semibold text-gray-900 mb-1">New Order Alerts</h3>
      <p className="text-sm text-gray-500 mb-3">
        Get a desktop notification the moment a new order comes in — even if this dashboard
        isn't open in any tab. Works per browser, so enable it on each device you want alerted.
      </p>

      {!supported && !checking && (
        <p className="text-sm text-amber-600">This browser doesn't support push notifications.</p>
      )}

      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

      {supported && !checking && (
        <button
          onClick={subscribed ? handleDisable : handleEnable}
          disabled={loading}
          className={`px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 ${
            subscribed
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {loading ? 'Working…' : subscribed ? 'Disable on this device' : 'Enable on this device'}
        </button>
      )}
    </div>
  );
};

export default AdminPushNotificationSettings;
