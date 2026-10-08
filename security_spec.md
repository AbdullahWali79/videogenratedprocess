# Security Specification: Video Workflow Organizer

## 1. Data Invariants
1. **User Scoping & Isolation**: All projects and their subcollections (scenes, prompts, characters, assets, tasks) belong strictly to `users/{userId}`. Only the authenticated owner matching `request.auth.uid == userId` can read or write.
2. **Project Identity**: A subdocument (scene, prompt, character, asset, task) must belong to the path's `{projectId}`.
3. **No Cross-User Access**: An authenticated user `userB` cannot read, list, create, edit, or delete any resources under `/users/{userA}/...`.
4. **No Unauthenticated Access**: Unauthenticated requests are denied on all paths.
5. **No System Overwrites**: Document IDs must pass character and size validation (max 128 alphanumeric/hyphen/underscore).
6. **No Arbitrary Fields**: Required fields must exist, string sizes must not exceed safe limits, preventing Denial of Wallet attacks.

## 2. The "Dirty Dozen" Payloads
1. **Payload 1 (Cross-User Project Read)**: `GET /users/userA/projects/proj1` authenticated as `userB`. Target: PERMISSION_DENIED.
2. **Payload 2 (Unauthenticated Project Create)**: `CREATE /users/userA/projects/proj1` with `{ title: "My Video" }` unauthenticated. Target: PERMISSION_DENIED.
3. **Payload 3 (Spoofed Owner ID)**: `CREATE /users/userB/projects/proj1` with `{ userId: "userA", title: "Video" }` authenticated as `userB`. Target: PERMISSION_DENIED.
4. **Payload 4 (Ghost Field Injection)**: `UPDATE /users/userA/projects/proj1` with `{ isAdmin: true }` authenticated as `userA`. Target: PERMISSION_DENIED.
5. **Payload 5 (Oversized Title Bomb)**: `CREATE /users/userA/projects/proj1` with `{ title: "A".repeat(50000) }` authenticated as `userA`. Target: PERMISSION_DENIED.
6. **Payload 6 (Cross-User Scene Read)**: `GET /users/userA/projects/proj1/scenes/scene1` authenticated as `userB`. Target: PERMISSION_DENIED.
7. **Payload 7 (Cross-User Prompt Creation)**: `CREATE /users/userA/projects/proj1/prompts/p1` authenticated as `userB`. Target: PERMISSION_DENIED.
8. **Payload 8 (Invalid Prompt Category)**: `CREATE /users/userA/projects/proj1/prompts/p1` with `{ category: "malicious_type" }` authenticated as `userA`. Target: PERMISSION_DENIED.
9. **Payload 9 (Asset Cross-User Hijack)**: `UPDATE /users/userA/projects/proj1/assets/a1` authenticated as `userB`. Target: PERMISSION_DENIED.
10. **Payload 10 (Poisoned Path Variable)**: `CREATE /users/userA/projects/%00%00malicious/scenes/s1` authenticated as `userA`. Target: PERMISSION_DENIED.
11. **Payload 11 (Blanket Collection Scraping)**: `LIST /users` authenticated as any user. Target: PERMISSION_DENIED.
12. **Payload 12 (Foreign Project Mismatch)**: `CREATE /users/userA/projects/proj1/scenes/s1` with `{ projectId: "proj999" }` authenticated as `userA`. Target: PERMISSION_DENIED.
