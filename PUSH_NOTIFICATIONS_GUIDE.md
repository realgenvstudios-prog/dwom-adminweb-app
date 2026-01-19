# Push Notifications Implementation Guide

## Overview
Complete push notification system implemented using Firebase Cloud Messaging (FCM) for Android/iOS, with support for order status updates, product changes, and promotions.

---

## Backend Setup (NestJS)

### 1. Firebase Admin SDK Integration

**File:** `src/services/firebase.service.ts`

Initializes Firebase Admin SDK with credentials from environment variables:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

**Key Methods:**
- `sendNotification()` - Send to single device
- `sendMulticastNotification()` - Send to multiple devices
- `subscribeToTopic()` - Subscribe device to topic
- `sendTopicNotification()` - Send to topic

### 2. Notifications Service

**File:** `src/services/notifications.service.ts`

Provides business logic for sending notifications:

**Device Token Management:**
- `registerDeviceToken(userId, deviceToken)` - Register/add device token
- `removeDeviceToken(userId, deviceToken)` - Remove device token

**Notification Types:**
- Order Status: `sendOrderStatusNotification(orderId, status, userId)`
- Product Update: `sendProductUpdateNotification(title, body, productId)`
- Promotion: `sendPromotionNotification(title, body, userIds?, promotionId?)`
- Broadcast: `broadcastNotification(title, body, type, data)`
- To Multiple Users: `sendToUsers(userIds, title, body, type, data)`

**Features:**
- Supports both Firebase and Expo (backward compatibility)
- Automatic device token cleanup on failures
- Detailed logging for tracking
- Non-blocking notification sending

### 3. Notifications Controller

**File:** `src/notifications/notifications.controller.ts`

REST API endpoints:

```
POST /notifications/register-device
  - Register Firebase device token for user
  - Body: { deviceToken: string }

POST /notifications/remove-device
  - Remove device token
  - Body: { deviceToken: string }

POST /notifications/broadcast
  - Send broadcast to all users (Admin only)
  - Body: { title, body, type?, data? }

POST /notifications/send-to-users
  - Send to specific users (Admin only)
  - Body: { userIds[], title, body, type?, data? }

POST /notifications/promotion
  - Send promotion notification (Admin only)
  - Body: { title, body, promotionId?, userIds? }

POST /notifications/product-update
  - Send product update (Admin only)
  - Body: { title, body, productId }

POST /notifications/order-status
  - Send order status notification (Triggered by order changes)
  - Body: { userId, orderId, status }
```

### 4. Database Schema

**File:** `prisma/schema.prisma`

Updated User model:
```prisma
model User {
  ...
  deviceTokens    String[]                 @default([])
  ...
}
```

Migration needed: `npx prisma migrate dev --name "add_device_tokens_to_user"`

---

## User App Setup (React Native + Expo)

### 1. Installation

```bash
expo install expo-notifications
npm install firebase-admin  # Backend only
```

### 2. Notifications Service

**File:** `src/services/notificationsService.ts`

Handles all notification operations:

**Initialization:**
```typescript
const hasPermission = await NotificationsService.requestPermissions();
const deviceToken = await NotificationsService.getPushToken();
await NotificationsService.registerDeviceToken(deviceToken);
```

**Key Methods:**
- `getPushToken()` - Get device token
- `registerDeviceToken(deviceToken)` - Register with backend
- `removeDeviceToken(deviceToken)` - Remove token
- `setupNotificationListeners(onReceived, onTapped)` - Set up listeners
- `requestPermissions()` - Request notification permissions
- `sendTestNotification()` - Send test via backend
- `getUnreadCount()` - Get unread notification count
- `getUnreadNotifications()` - Fetch unread notifications
- `markAsRead(notificationId)` - Mark as read

### 3. Custom Hook

**File:** `src/hooks/useNotifications.ts`

Hook for managing notifications in components:

```typescript
const {
  unreadCount,
  notifications,
  loading,
  error,
  deviceTokenRegistered,
  loadNotifications,
  markAsRead,
  sendTestNotification,
} = useNotifications(isSignedIn);
```

### 4. App Integration

**File:** `App.tsx`

Added `NotificationInitializer` component:
- Requests notification permissions
- Gets device token
- Registers with backend
- Sets up foreground/background listeners
- Handles notification taps

```typescript
<NotificationInitializer />
```

---

## Admin Dashboard Integration

### 1. Marketing Service Extensions

**File:** `src/services/marketingService.ts`

New Firebase notification methods:
```typescript
sendBroadcastNotification(data)      // Send to all users
sendPromotionNotification(data)      // Send promotion
sendProductUpdateNotification(data)  // Send product update
sendToUsers(data)                    // Send to specific users
```

### 2. Updated Notification Modal

**File:** `src/components/marketing/SendNotificationModal.tsx`

Enhanced with two modes:
1. **Template Mode** - Use existing notification templates
2. **Custom Firebase Mode** - Send custom notifications immediately

Features:
- Custom title and body
- Notification type selection
- Success/failure count feedback
- Real-time sending to active users

---

## Environment Variables Required

### Backend (.env)
```env
FIREBASE_PROJECT_ID=dwom-app
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@dwom-app.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### App Configuration
- Firebase project ID: `dwom-app`
- Sender ID: `1708685097770`
- API: Cloud Messaging API V1 (enabled)

---

## Notification Triggers

### 1. Order Status Updates
Automatically triggered when order status changes:
- `pending` → `ready` → `on_the_way` → `arrived` → `delivered`
- Custom messages for each status
- Backward compatible with existing order tracking

### 2. Product Updates
Sent via admin dashboard:
- Price changes
- Stock status updates
- Product availability announcements

### 3. Promotions
Can target:
- All users (broadcast)
- Specific user segments
- Specific zones (future enhancement)

### 4. System Messages
General notifications for:
- Subscription billing
- System maintenance
- Support responses

---

## Testing

### 1. Send Test Notification
```bash
curl -X POST http://localhost:3000/notifications/test \
  -H "Authorization: Bearer <token>"
```

### 2. Admin Dashboard
1. Navigate to Marketing page
2. Click "Send Notification"
3. Select "Send Custom Firebase Notification"
4. Enter title and body
5. Choose notification type
6. Send

### 3. Notification Receipt
- **App Foreground:** Shows banner, plays sound
- **App Backgrounded:** Shows system notification
- **App Closed:** Shows system notification, handled on app launch
- **Tap:** Routes to relevant screen (order, product, etc.)

---

## Delivery Guarantees

- **Immediate delivery** for foreground app (user will see banner)
- **Push to system** for background/closed app (OS handles display)
- **Automatic retry** on failure (managed by Firebase)
- **Token validation** with cleanup of invalid tokens
- **Graceful degradation** if tokens unavailable

---

## Backward Compatibility

System maintains support for:
- **Expo Push Tokens** (legacy `expoPushToken` field)
- **Existing notification templates**
- **Notification database records**

New Firebase system works alongside existing system without breaking changes.

---

## Monitoring & Analytics

### Device Token Management
- Tracked in User model as `deviceTokens[]` array
- Failed deliveries logged with error details
- Invalid tokens automatically cleaned up

### Notification Logs
- Each send creates a Notification record
- Tracks success/failure counts
- Stores notification type and recipient info

### Admin Metrics
- Visible in Marketing dashboard
- Shows delivery statistics
- Campaign performance tracking

---

## Troubleshooting

### Notifications Not Received
1. Verify permissions granted in app settings
2. Check device token is registered: `GET /notifications/unread`
3. Verify app has internet connectivity
4. Check Firebase project credentials

### Failed Deliveries
- Check backend logs for Firebase API errors
- Verify device token format is correct
- Ensure user has notifications enabled in app settings

### Token Registration Issues
- Device token must be obtained after permissions granted
- Token changes on app reinstall (will be new)
- Check AsyncStorage for saved token: `deviceToken` key

---

## Future Enhancements

1. **Scheduled Notifications** - Database-backed scheduling
2. **User Preferences** - Per-type notification toggles
3. **In-App Messages** - Rich HTML content delivery
4. **Analytics Dashboard** - Delivery metrics and user engagement
5. **A/B Testing** - Test different notification variations
6. **Deep Linking** - Route to specific app screens
7. **Topic-Based Subscriptions** - Subscribe to interest categories

---

## Files Created/Modified

### Backend
- ✅ `src/services/firebase.service.ts` - Firebase Admin SDK wrapper
- ✅ `src/services/notifications.service.ts` - Enhanced with Firebase
- ✅ `src/notifications/notifications.controller.ts` - New Firebase endpoints
- ✅ `prisma/schema.prisma` - Added deviceTokens to User model

### User App
- ✅ `src/services/notificationsService.ts` - Firebase notification client
- ✅ `src/hooks/useNotifications.ts` - Custom hook for notifications
- ✅ `App.tsx` - NotificationInitializer component

### Admin Dashboard
- ✅ `src/services/marketingService.ts` - Firebase notification methods
- ✅ `src/components/marketing/SendNotificationModal.tsx` - Enhanced UI

---

## Implementation Complete ✅

All components are integrated and ready for:
- Device token registration
- Notification sending (broadcast, targeted, order status)
- Admin dashboard control
- User app reception and handling
- Analytics and tracking
