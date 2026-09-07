# Security Specification: Carol Ann Cloud OS Firestore

## 1. Data Invariants
- **User Isolation**: A user can only access, read, write, or mutate their own sub-collections (`/users/{userId}/**`).
- **Identity Integrity**: All written documents with `userId` must strictly match `request.auth.uid`. Unauthenticated writes are rejected.
- **Workspace State Integrity**: Workspace documents at `/workspaces/{workspaceId}` must only be read and written by the authenticated owner where `userId == request.auth.uid`.
- **Relational Integrity**: Bus events can only be authored by authenticated users with `userId == request.auth.uid`.
- **Connector Configuration**: Connector configs must contain valid URLs, status strings, and cannot inject arbitrary scripts.
- **Boundary Limits**: All strings are capped in length to prevent denial-of-wallet resource exhaustion.

## 2. The "Dirty Dozen" Threat Payloads
1. **Unauthenticated Read of User Profile**: Anonymous client attempts `get(/users/user_abc)`. -> *Must return PERMISSION_DENIED*.
2. **Cross-User Profile Spoofing**: Authenticated `user_1` attempts `set(/users/user_2)` with `id: "user_2"`. -> *Must return PERMISSION_DENIED*.
3. **Identity Impersonation in Messages**: `user_1` attempts `set(/users/user_1/messages/msg_1)` with `userId: "user_2"`. -> *Must return PERMISSION_DENIED*.
4. **Denial-of-Wallet Path Variable Poisoning**: Document ID containing 2000 characters or illegal path traversal syntax. -> *Must return PERMISSION_DENIED*.
5. **Unauthorized Memory Modification**: `user_1` attempts updating memories of `user_2`. -> *Must return PERMISSION_DENIED*.
6. **Orphaned Bus Event Write**: Unauthenticated client posts event to `/bus_events/evt_malicious`. -> *Must return PERMISSION_DENIED*.
7. **Cross-Tenant Bus Event Spoofing**: `user_1` writes a bus event with `userId: "victim_user"`. -> *Must return PERMISSION_DENIED*.
8. **Malicious Connector Injection**: Client attempts storing executable script payload inside connector endpointUrl. -> *Must return PERMISSION_DENIED*.
9. **Workspace Hijacking**: `user_1` attempts writing `/workspaces/workspace_user2` claiming ownership. -> *Must return PERMISSION_DENIED*.
10. **Unbounded Array Flooding**: Client attempts writing an errand item array containing 5,000 items. -> *Must return PERMISSION_DENIED*.
11. **Negative Energy Level Tampering**: Client writes wellness check-in with `energyLevel: -999`. -> *Must return PERMISSION_DENIED*.
12. **Future Timestamp Spoofing**: Client writes future-dated audit events far exceeding server timestamp boundaries. -> *Must return PERMISSION_DENIED*.
