# Security Specification & Payload TDD

## 1. Data Invariants
1. **Identity Isolation**: Users can only read/write their own `/users/{userId}` document and cannot escalate `role` to `admin`.
2. **Verified Auth & Email Spoofing Prevention**: All authenticated writes require `request.auth.token.email_verified == true`. Admin email checks strictly verify `email_verified == true`.
3. **Immutable Ownership & Timestamps**: `createdAt`, `userId`, and `uid` are immutable after creation; `createdAt` and `updatedAt` must equal `request.time`.
4. **Catalog Integrity & Stock Control**: Only admins can create, delete, or edit product pricing/details. Verified buyers may only decrement `stock` (`incoming.stock < existing.stock && incoming.stock >= 0`) alongside `updatedAt`.
5. **Order Lifecycle & Terminal Locking**: Customers can only create orders with `userId == request.auth.uid` and `status == 'paid'`. Once an order reaches `delivered` or `cancelled`, non-admins cannot alter it.
6. **Review Consistency**: Reviews must reference an existing `/products/{productId}` document via `exists()`.
7. **Query Enforcement**: `allow list` on `/orders` and `/notifications` strictly enforces `resource.data` ownership/targeting without `get()`/`exists()` inside `allow list`.

## 2. The "Dirty Dozen" Attack Payloads
1. **Self-Assigned Admin Role**: `POST /users/attacker` with `{ role: "admin" }` -> `PERMISSION_DENIED`.
2. **Privilege Escalation Update**: `PATCH /users/user1` changing `role` to `"admin"` -> `PERMISSION_DENIED`.
3. **Shadow Field Injection**: `POST /orders/ord1` with extra ghost field `{ isFree: true }` -> `PERMISSION_DENIED`.
4. **PII Cross-User Read**: `GET /users/victim` as `attacker` -> `PERMISSION_DENIED`.
5. **Unverified Admin Email Spoof**: `POST /products/p1` with `email: "uzorbenny51@gmail.com"`, `email_verified: false` -> `PERMISSION_DENIED`.
6. **Negative Price / Stock Poisoning**: `PATCH /products/p1` as buyer setting `price: 0.01` -> `PERMISSION_DENIED`.
7. **Stock Inflation by Buyer**: `PATCH /products/p1` as buyer setting `stock: 9999` -> `PERMISSION_DENIED`.
8. **Order Ownership Spoofing**: `POST /orders/ord2` with `userId: "victim"` -> `PERMISSION_DENIED`.
9. **Terminal Order Reopening**: `PATCH /orders/ord_delivered` as customer changing `status: "paid"` -> `PERMISSION_DENIED`.
10. **Forged Timestamp**: `POST /orders/ord3` with `createdAt: "2020-01-01T00:00:00Z"` -> `PERMISSION_DENIED`.
11. **Orphaned Review**: `POST /reviews/rev1` with `productId: "nonexistent"` -> `PERMISSION_DENIED`.
12. **ID Poisoning**: `PUT /products/invalid$id!with/1500chars...` -> `PERMISSION_DENIED`.
