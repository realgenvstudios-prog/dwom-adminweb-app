import adminApiClient from './apiClient';

// Converts the VAPID public key (base64url, as returned by web-push on the
// backend) into the Uint8Array PushManager.subscribe() requires.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const adminPushService = {
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  },

  getPermission(): NotificationPermission | 'unsupported' {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
  },

  /**
   * Checks whether this browser already holds an active push subscription
   * (doesn't confirm the backend still has it — just the browser's side).
   */
  async isSubscribed(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const registration = await navigator.serviceWorker.getRegistration('/sw.js');
      if (!registration) return false;
      const subscription = await registration.pushManager.getSubscription();
      return !!subscription;
    } catch {
      return false;
    }
  },

  /**
   * Registers the service worker, requests notification permission, and
   * subscribes to push — must be called from a user gesture (e.g. a button
   * click), since browsers reject permission requests made automatically.
   */
  async subscribe(): Promise<{ success: boolean; error?: string }> {
    if (!this.isSupported()) {
      return { success: false, error: 'Push notifications are not supported in this browser.' };
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return { success: false, error: 'Notification permission was not granted.' };
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const { publicKey } = await adminApiClient.get<{ publicKey: string | null }>('/admin-push/vapid-public-key');
      if (!publicKey) {
        return { success: false, error: 'Push notifications are not configured on the server yet.' };
      }

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
        });
      }

      const json = subscription.toJSON();
      await adminApiClient.post('/admin-push/subscribe', {
        endpoint: json.endpoint,
        keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
      });

      return { success: true };
    } catch (error: any) {
      console.error('❌ [AdminPushService] Subscribe failed:', error);
      return { success: false, error: error.message || 'Failed to enable notifications.' };
    }
  },

  async unsubscribe(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.getRegistration('/sw.js');
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await adminApiClient.delete(`/admin-push/unsubscribe?endpoint=${encodeURIComponent(endpoint)}`);
      }
      return true;
    } catch (error) {
      console.error('❌ [AdminPushService] Unsubscribe failed:', error);
      return false;
    }
  },
};

export default adminPushService;
