# ORBIT Axiom Dev Studio Security Specification (Eight Pillars & Red Team Audit)

## 1. Data Invariants
1. **Owner Isolation**: A signed-in user may only read, create, or update `/user_profiles/{userId}` where `userId == request.auth.uid` and `request.auth.token.email_verified == true`.
2. **Zero Self-Escalation**: Users cannot write `role`, `devUnlocked`, `isAdmin`, or arbitrary shadow keys into `/user_profiles/{userId}`.
3. **Console-Only Role Grants**: `/dev_roles/{userId}` is strictly `allow create, update, delete: if false` from client SDKs; only Firebase Console edits can grant or revoke developer/admin roles.
4. **Developer-Only Studio Writes**: Creating, updating, or deleting `/published_songs/{songId}`, `/published_themes/{themeId}`, `/published_hud_layouts/{layoutId}`, and `/dev_asset_library/{assetId}` strictly requires `isDev()` (`email_verified == true` and either bootstrapped owner email or `/dev_roles/{uid}` document).
5. **Published-Only Public Reads & Query Safety**: Unauthenticated or standard players may only `get` or `list` documents where `resource.data.status == 'published'` (no `get()`/`exists()` inside `allow list` to prevent Denial-of-Wallet read explosions).
6. **Immutable Provenance & Temporal Integrity**: `uid`, `id`, `createdByUid`, and `createdAt` are immutable after creation; `createdAt == request.time` on create and `updatedAt == request.time` on both create and update.
7. **Volumetric & Schema Guarding**: Every string, array, map, and document ID enforces strict regex patterns (`isValidId`) and byte/length ceilings.

## 2. Adversarial Payloads ("Dirty Dozen") Expected to Return PERMISSION_DENIED
1. **Unauthenticated read/write** to `/user_profiles/uid_1` -> DENIED.
2. **Cross-user read** (`auth.uid = userB` reading `/user_profiles/userA`) -> DENIED.
3. **Unverified email write** (`email_verified = false`) attempting Dev publish or profile sync -> DENIED.
4. **Privilege escalation / Shadow field** (`{ ...validProfile, role: "developer", isAdmin: true, devUnlocked: true }`) -> DENIED by `keys().hasOnly(...)`.
5. **Self-granting dev role** writing `/dev_roles/userA` from client SDK -> DENIED (`allow create, update, delete: if false`).
6. **Standard player publishing a song/theme/layout/asset** (`auth.uid = playerB`, no `/dev_roles/playerB`) -> DENIED by `isDev()`.
7. **Scraping unpublished drafts via `list`** (`collection(db, 'published_songs')` without `where('status', '==', 'published')`) -> DENIED (`allow list` requires `resource.data.status == 'published'` or owner `updatedByUid == request.auth.uid`).
8. **Forging `createdByUid` on Dev create** (`createdByUid != request.auth.uid`) -> DENIED.
9. **Mutating immutable `createdAt` or `id`** on update -> DENIED.
10. **Forging client `updatedAt` timestamp** (`updatedAt != request.time`) -> DENIED.
11. **ID Poisoning** (1KB invalid characters in `{songId}` / `{themeId}` / `{assetId}`) -> DENIED by `isValidId()` and regex guards.
12. **Array / Payload Flooding** (`customBeatmap` > 900 entries, `overdriveLayers` > 12 entries, `dataUrlOrPath` > 280KB, or negative `bpm`/`orbCost`) -> DENIED.
