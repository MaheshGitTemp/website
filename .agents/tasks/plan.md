# Implementation Plan — Security Hardening & Cleanup

All edits happen inside the worktree. Use absolute paths rooted at
`d:\React\LIVEPROJECT\website\.worktrees\security-hardening` and run git as
`git -C d:\React\LIVEPROJECT\website\.worktrees\security-hardening ...`.
Step agents' cwd is the parent workspace, NOT the worktree — never use relative paths.

## Environment notes (discovered during exploration)

- Backend: Express, entry `backend/src/app.js`, started with `node src/app.js` (`backend/package.json`).
  No real test runner — `npm test` is a stub (`echo "Error: no test specified" && exit 1`).
  Therefore backend verification is: `node -e "require('<file>')"` to confirm the module loads
  without syntax/import errors, plus (where a DB is available) a manual login smoke test. There is
  no automated backend test suite to run.
- Dependencies already present in `backend/package.json`: `bcrypt@^6.0.0`, `crypto-js@^4.2.0`,
  `pg@^8.13.1`, `jsonwebtoken`, `pg-format`. No new dependency installs are required.
- Frontend: Create React App under `fe_token`. Build check: `npm run build` (from `fe_token`).
  Deleting dead files (Task 6) is verified by the frontend build still succeeding.
- Auth model (confirmed in `backend/src/controllers/tokenController.js`): `authenticateToken`
  reads the `accessToken` HttpOnly cookie only (no Authorization header). The frontend `api`
  instance (`fe_token/src/utils/api.js`) sets `withCredentials: true`; the separate `publicApi`
  instance in `listingService.js` does NOT send credentials.
- No AGENTS.md / CONTRIBUTING.md / `.kiro/steering/*` exist in the worktree. README.md references
  an unrelated "Live_PowerBI" project (noted for Task 6; leave README unchanged).

## Task 2 frontend-credentials finding (CARRY INTO FINAL REPORT)

Confirmed by reading `fe_token/src/services/listingService.js`, `userService.js`,
`utils/api.js`, and the callers `components/pages/public/Listing.js` and
`components/pages/public/ProfileDetails.js`:

- `listingService.js` defines a dedicated `publicApi` axios instance with NO `withCredentials`,
  used by `getAllUsers` (GET `/getAllUsers`), `getPublicProfile` (POST `/getPublicProfile`), and
  `getPublicGallery` (POST `/GetUserGallery`).
- `Listing.js` (public listing page) calls `getAllUsers` via `publicApi` — unauthenticated.
- `ProfileDetails.js` guest branch calls `getPublicProfile` and `getPublicGallery` via `publicApi`
  — unauthenticated. (Logged-in users use the credentialed `api` instance.)

Consequence of Task 2: after auth is added to these three endpoints, logged-out visitors hitting
the public listing page and guest profile view will receive HTTP 401. This WILL break the
public/guest browsing experience. Per instructions the security fix takes priority and MUST be
applied anyway. Required frontend follow-up (document, do NOT implement here unless a later task
says so): either (a) route `Listing.js`/`ProfileDetails.js` guest calls through the credentialed
`api` instance and gate the pages behind login, or (b) introduce a deliberately-public, minimal
read-only endpoint set with server-side field redaction if anonymous browsing must remain. This
is a product decision and is out of scope for this hardening pass.

---

# Implementation Plan

- [ ] 1. Rewrite `backend/src/services/passwordfunction.js` to add bcrypt helpers while keeping
      CryptoJS only for legacy decryption.
      Add `const bcrypt = require('bcrypt');` (keep `CryptoJS` require and the `"secret1234"` key +
      `encrypt`/`decrypt` functions for legacy support). Implement and export:
      - `isBcryptHash(stored)` → returns true when `stored` is a string starting with `$2a$`,
        `$2b$`, or `$2y$`.
      - `hashPassword(plain)` → `return await bcrypt.hash(plain, 12);`
      - `verifyPassword(plain, stored)` → `async`; if `isBcryptHash(stored)` return
        `{ ok: await bcrypt.compare(plain, stored), legacy: false }`; otherwise decrypt `stored`
        via the existing CryptoJS `decrypt` and return `{ ok: decrypted === plain, legacy: true }`.
        Guard against `decrypt` throwing/returning undefined (treat as `{ ok: false, legacy: true }`).
      - Keep `module.exports.convertCredentials = convertCredentials;` exactly as-is for backward
        compat (still imported by `dbController.js` for `changePassword`/`resetPassword`), and add
        `module.exports.hashPassword`, `module.exports.verifyPassword`, `module.exports.isBcryptHash`.
      Files: `backend/src/services/passwordfunction.js`
      Verify: `node -e "const p=require('./backend/src/services/passwordfunction'); (async()=>{const h=await p.hashPassword('abc'); console.log(p.isBcryptHash(h)===true); console.log((await p.verifyPassword('abc',h)).ok===true && (await p.verifyPassword('abc',h)).legacy===false); console.log((await p.verifyPassword('wrong',h)).ok===false);})()"`
      run from the worktree root — expect three `true` lines.

- [ ] 2. Update the registration path in `backend/src/services/db.js` to store bcrypt hashes, and
      add a lazy-migration UPDATE helper.
      In the `register` function, replace the import usage: change
      `const { convertCredentials } = require('./passwordfunction');` at the top to also import
      `hashPassword` (e.g. `const { convertCredentials, hashPassword } = require('./passwordfunction');`).
      In `register`, replace `let encryptedPassword = await convertCredentials(dataToSave, true);`
      with `let encryptedPassword = await hashPassword(dataToSave.upassword);` (keep the
      `dataToSave.upassword = encryptedPassword; saveObjectsToDatabase(dataToSave);` lines).
      Add a new function `updateUserPasswordById(uid, newHash)` that follows the existing pool
      pattern (`const client = await pool.connect(); try { await client.query('UPDATE users SET
      upassword = $1 WHERE uid = $2', [newHash, uid]); } finally { client.release(); }`) and export
      it as `module.exports.updateUserPasswordById = updateUserPasswordById;` near the other
      exports at the bottom. Note: `updateUserPassword(uid, ...)` already exists but is wired to the
      change-password flow — add a distinct helper rather than reusing it, to keep concerns separate.
      Files: `backend/src/services/db.js`
      Verify: `node -e "require('./backend/src/services/db')"` from the worktree root loads with no
      error; confirm `require('./backend/src/services/db').updateUserPasswordById` is a function via
      `node -e "console.log(typeof require('./backend/src/services/db').updateUserPasswordById)"`
      → `function`. Depends on item 1.

- [ ] 3. Replace the login password check in `backend/src/controllers/dbController.js` with
      `verifyPassword` plus lazy re-hash, preserving all other behavior.
      In `exports.login`: import `verifyPassword` and `hashPassword` from
      `../services/passwordfunction` (the file already imports `convertCredentials` — extend that
      destructure; leave `convertCredentials` imported for `changePassword`/`resetPassword`).
      Keep the existing `status === 'Closed'` / `'Blocked'` checks and the
      `userobj[0].upassword === 'Closed'` check exactly. Replace these two lines:
      `const decryptedPassword = await convertCredentials(userobj, false);` and
      `if (data.upassword !== decryptedPassword || data.uemail !== userobj[0].uemail) { ... }`
      with: `const result = await verifyPassword(data.upassword, userobj[0].upassword);` then
      `if (!result.ok || data.uemail !== userobj[0].uemail) { return res.status(401).json({ status:
      'Failure', result: 'Invalid Credentials.' }); }`. On a legacy match, re-hash and migrate
      without blocking login:
      `if (result.legacy) { try { const newHash = await hashPassword(data.upassword); await
      prepareDBData.updateUserPasswordById(userobj[0].uid, newHash); } catch (e) {
      console.warn('Lazy password migration failed for uid', userobj[0].uid, e.message); } }`.
      Do NOT change the `tokenPayload` (`{ uid, uemail, ugender }`), the cookie options, or the
      success response body.
      Files: `backend/src/controllers/dbController.js`
      Verify: `node -e "require('./backend/src/controllers/dbController')"` from the worktree root
      loads with no error. If a DB + env is available, run a manual smoke test: log in an existing
      (legacy-AES) account → expect success and the stored `upassword` becomes a `$2b$`-prefixed
      hash afterward; log in a newly-registered account → success; wrong password → HTTP 401.
      Depends on items 1 and 2.

- [ ] 4. Restore authentication on the three public-leaking routes in `backend/src/routes/index.js`.
      Add the existing `auth` middleware before the controller on exactly these three routes
      (leave the "removed auth for testing" comments or clean them up, but ensure auth is active):
      `router.get('/getAllUsers', auth, mydbController.getAllUsers);`
      `router.post('/getPublicProfile', auth, mydbController.getPublicProfile);`
      `router.post('/GetUserGallery', auth, mydbController.GetUserGallery);`
      Leave every other route unchanged, including the genuinely-public ones (`/login`, `/register`,
      `/refresh`, `/logout`, `/sendOtp`, `/verifyOtp`, `/resetPassword`). See the Task 2
      frontend-credentials finding above — this intentionally breaks logged-out public browsing;
      apply anyway and carry the finding into the report.
      Files: `backend/src/routes/index.js`
      Verify: `node -e "require('./backend/src/routes/index')"` from the worktree root loads with no
      error. Grep is not sufficient; if a running server is available, confirm an unauthenticated
      `GET /api/getAllUsers` returns 401 and an authenticated request (valid cookie) returns 200.

- [ ] 5. Remove credential/query debug logging from `backend/src/services/db.js`, keeping error logs.
      Delete only these logging statements (they print query objects and result rows that leak
      emails/phones/query values); keep all `console.error(...)` calls and all functional code:
      - `console.log(query)` and `console.log('Query result:', res.rows)` in `ValidateUser`
        (around lines 33, 35).
      - `console.log(query)` and `console.log('Query result:', res.rows)` in `GetUserById`
        (around lines 122, 124).
      - `console.log(query)` and `console.log('Query result:', res.rows)` in `GetUserDetails`
        (around lines 141, 143).
      - `console.log("query super ")` and `console.log('Query result:', res.rows)` in
        `GetUserDetailsById` (around lines 251, 254).
      - `console.log(query)` and `console.log('Query result:', res.rows)` in `FetchAllUserDetails`
        (around lines 353, 356).
      - `console.log('Gallery saved to DB:', res.rows)` in `SaveUserGallery` (around line 176).
      - `console.log('Query result:', res.rows)` in `getAllUserDetails` (around line 610).
      - In `Fetchlistdata`, remove `console.log('Query:', dataText);` and
        `console.log('Params:', dataValues);` (the params array contains search values / possibly PII).
      Line numbers are approximate — match by content. Do NOT remove the unreachable
      `console.log('Object saved to the database successfully.')` lines that follow `return`
      statements (harmless, functional-adjacent) unless trivially the same statement; the priority
      is removing the query/result/param leaks.
      Files: `backend/src/services/db.js`
      Verify: `node -e "require('./backend/src/services/db')"` loads with no error. Confirm no
      remaining query/result leak logs: searching the file for `console.log('Query result:'`,
      `console.log(query)`, `console.log('Query:'`, `console.log('Params:'`, and
      `Gallery saved to DB` returns no matches, while `console.error(` matches remain.

- [ ] 6. Externalize secrets in `docker-compose.yml` and add `.env.example` + `.gitignore` at repo
      root.
      In `docker-compose.yml`, under the `backend` service `environment:` block, replace the
      hardcoded sensitive values with `${VAR}` interpolation (compose auto-loads a root `.env`):
      `TOKEN_SECRET: ${TOKEN_SECRET}`, `REFRESH_TOKEN_SECRET: ${REFRESH_TOKEN_SECRET}`,
      `EMAIL_USER: ${EMAIL_USER}`, `EMAIL_PASS: ${EMAIL_PASS}`,
      `EMAIL_FROM: ${EMAIL_FROM}`, `PGUSER: ${PGUSER}`, `PGPASSWORD: ${PGPASSWORD}`,
      `PGDATABASE: ${PGDATABASE}`. Do the same for the `db` service:
      `POSTGRES_USER: ${PGUSER}`, `POSTGRES_PASSWORD: ${PGPASSWORD}`, `POSTGRES_DB: ${PGDATABASE}`.
      Keep non-sensitive structure/values as literals (`NODE_ENV`, `PORT`, `PGHOST`, `PGPORT`,
      `CLIENT_ORIGIN`, ports, networks, healthcheck, the commented dev block). Do NOT invent real
      secret values anywhere.
      Create `/.env.example` at repo root documenting EVERY variable with placeholder (non-secret)
      values: `NODE_ENV`, `PORT`, `CLIENT_ORIGIN`, `TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`,
      `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`, `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`,
      `PGDATABASE` (e.g. `TOKEN_SECRET=replace_with_strong_random_string`,
      `EMAIL_PASS=your_gmail_app_password_here`).
      Create a root `/.gitignore` (none exists today) ignoring: `.env`, `backend/src/.env`,
      `fe_token/.env`, `**/node_modules`, `.worktrees/`. If one is later found to exist, append the
      missing entries instead of overwriting. Do NOT delete existing `backend/src/.env` or
      `fe_token/.env`; do NOT print/echo any secret values.
      Files: `docker-compose.yml`, `.env.example` (new), `.gitignore` (new)
      Verify: run `docker compose config` from the worktree root — it parses with no error and shows
      the `${VAR}` values resolved (warnings about unset vars are acceptable when no `.env` is
      present and prove interpolation is wired). Confirm `.env.example` lists all 13 variable names
      and `.gitignore` contains the five required patterns.

- [ ] 7. Create the non-destructive schema-widening migration
      `backend/migrations/001_widen_name_columns.sql` (script only — do NOT run it, do NOT modify
      the dump).
      Add a header comment stating: what it does (widens `name`-typed columns to `text` to remove
      the 63-byte truncation risk), that it is idempotent (Postgres `ALTER COLUMN ... TYPE text` is
      safe to re-run on an already-`text` column), and that it must be run manually by a DBA against
      the target database. Emit one `ALTER TABLE ... ALTER COLUMN ... TYPE text;` per column.
      `public.users` (18 columns): ufname, ulname, udob, utob, ugender, upob, upresentloc, uphone,
      uheight, ucaste, uemail, upassword, ujob, upackage, relation, ucreated, ucountry, ustate.
      `public.userdetails` (18 columns): familyresidence, fathername, mothername, fatheroccupation,
      motheroccupation, brothers, sisters, brothersmarried, sistersmarried, nakshtra, padam, rasi,
      habitdrink, habitsmoke, degree, jobcity, diet, maritalstatus. (Column list derived from the
      CREATE TABLE statements in `telugusambandhamdump.sql`; `about` and `partnerpreferences` are
      already `text` and are intentionally excluded.)
      Example line: `ALTER TABLE public.users ALTER COLUMN ufname TYPE text;`
      Files: `backend/migrations/001_widen_name_columns.sql` (new)
      Verify: the file exists and contains exactly 36 `ALTER TABLE ... ALTER COLUMN ... TYPE text;`
      statements (18 + 18) plus the header comment. Do NOT execute against any database.

- [ ] 8. Delete the three confirmed dead/leftover frontend files (all three verified to exist).
      Delete:
      - `fe_token/src/components/pages/private/EditProfile copy.js`
      - `fe_token/src/components/pages/private/EditProfile copy 2.js`
      - `fe_token/src/App.js.save`
      Do NOT touch the active `fe_token/src/components/pages/private/EditProfile.js`. Do NOT drop the
      unused `register` DB table. Leave `README.md` unchanged (it references an unrelated
      "Live_PowerBI" project — note this in the report only).
      Files: delete the three paths above.
      Verify: the three files no longer exist (`git -C <worktree> status` shows them deleted), and
      `npm run build` in `fe_token` still succeeds (nothing imported them).

## Final report must include

- The Task 2 frontend-credentials finding verbatim from the section above: the public listing page
  (`Listing.js`) and guest profile view (`ProfileDetails.js`) call the three now-protected endpoints
  via the credential-less `publicApi`, so logged-out browsing returns 401 after this change — the
  security fix was applied as the priority, and the frontend follow-up (gate behind login or add a
  deliberate redacted public endpoint) is required but out of scope here.
- Confirmation that all three Task 6 files existed and were deleted.
- Note that README.md references an unrelated "Live_PowerBI" project (left unchanged).
- For any item marked "verify during implementation" (e.g. whether legacy accounts migrate on
  login), report the actual observed result.
