# Admin Dashboard - Backend Connection Setup

## ✅ **Phase 1: Complete - Foundation Created**

### Files Created:

1. **`src/config/apiConfig.ts`** - API configuration
   - Base URL from environment variable
   - Default headers
   - Timeout settings

2. **`src/services/apiClient.ts`** - Core API client
   - GET, POST, PATCH, DELETE methods
   - Automatic JWT token injection
   - Auto-logout on 401 errors
   - Token persistence in localStorage

3. **`src/services/authService.ts`** - Admin authentication
   - `login(email, password)` - Authenticate admin
   - `logout()` - Clear session
   - `isAuthenticated()` - Check auth status
   - `verifyToken()` - Validate token with backend
   - `getCurrentAdmin()` - Get logged-in admin details

4. **`src/services/ordersService.ts`** - Orders API
   - `getAll(page, limit)` - List orders
   - `getById(id)` - Get order details
   - `updateStatus(id, status)` - Update order status
   - `assignRider(orderId, riderId)` - Assign rider
   - `getStats()` - Get order statistics

5. **`.env`** - Environment configuration
   - `VITE_API_URL` - Backend URL (ngrok tunnel)

---

## 🎯 **Next Steps - Phase 2:**

### Services to Create:
- [ ] `customersService.ts` - User management
- [ ] `productsService.ts` - Product CRUD
- [ ] `inventoryService.ts` - Stock management
- [ ] `ridersService.ts` - Rider management
- [ ] `subscriptionsService.ts` - Subscription analytics
- [ ] `financialService.ts` - Revenue & MRR tracking

### Pages to Connect:
- [ ] Create Login Page (uses `authService`)
- [ ] Create Auth Guard/Protected Routes
- [ ] Connect Orders Page (uses `ordersService`)
- [ ] Connect Customers Page (uses `customersService`)
- [ ] Connect Products Page (uses `productsService`)
- [ ] Connect Inventory Page (uses `inventoryService`)
- [ ] Connect Riders Page (uses `ridersService`)
- [ ] Connect Finance Page (uses `financialService`)

### Authentication Flow:
1. Admin visits `/login`
2. Enters email & password
3. `authService.login()` calls backend
4. Backend returns JWT token
5. Token stored in localStorage & apiClient
6. User redirected to dashboard
7. All API calls include JWT in header
8. On 401, auto-logout and redirect to login

---

## 📡 **API Endpoints Needed (Backend):**

```
POST   /auth/admin/login                    - Admin login
GET    /admin/profile                       - Get admin profile
GET    /orders                              - List orders
GET    /orders/:id                          - Order details
PATCH  /orders/:id                          - Update order
POST   /orders/:id/assign-rider             - Assign rider
GET    /orders/stats/overview               - Order stats
GET    /users                               - List customers
GET    /products                            - List products
GET    /inventory                           - Inventory levels
GET    /inventory/low-stock                 - Low stock items
GET    /riders                              - List riders
GET    /subscriptions/admin/dashboard/...   - Subscription analytics
```

---

## ✨ **Ready for Phase 2!**

All foundation is set. Ready to:
1. Create more API services
2. Build Login page with auth
3. Connect dashboard pages to APIs
