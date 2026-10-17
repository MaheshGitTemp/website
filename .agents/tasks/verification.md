# Verification — Security Hardening & Cleanup (iteration 1)

All commands run from the worktree `d:\React\LIVEPROJECT\website\.worktrees\security-hardening`.
No secret values were printed during verification.

## 1. Dependencies
`backend/node_modules/bcrypt` is present — no `npm install` required.

## 2. Module require-load (does NOT start the server)
Command (cwd = `backend`):
```
node -e "require('./src/services/passwordfunction.js'); require('./src/services/db.js'); require('./src/controllers/dbController.js'); require('./src/routes/index.js'); console.log('ok')"
```
Result: printed `ok` — all four changed modules load without throwing.

## 3. Password round-trip (throwaway script, deleted after)
A temporary script hashed a password with `hashPassword` and verified with `verifyPassword`,
and encrypted `"test123"` with the legacy CryptoJS key `"secret1234"` then verified it.
Result (JSON):
```
{"isBcryptHash":true,"newOk":true,"newWrong":true,"legacyOk":true,"legacyWrong":true}
ALL_PASS=true
```
- New bcrypt hash → `isBcryptHash === true`, `verifyPassword` returns `{ ok:true, legacy:false }`.
- Wrong password against bcrypt hash → `{ ok:false }`.
- Legacy AES ciphertext → `verifyPassword` returns `{ ok:true, legacy:true }`.
- Wrong password against legacy ciphertext → `{ ok:false, legacy:true }`.
Throwaway script `backend/_pwcheck_tmp.js` was deleted after the run (confirmed absent).

## 4. docker-compose parses
Command: `docker compose config`
Result: exit code 0. Emits warnings that `PGUSER`, `PGPASSWORD`, `PGDATABASE`, `TOKEN_SECRET`,
`REFRESH_TOKEN_SECRET`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM` are unset — expected with no
root `.env` present, and proves the `${VAR}` interpolation is wired. Non-sensitive literals
(`NODE_ENV`, `PORT`, `CLIENT_ORIGIN`, `PGHOST`, `PGPORT`) remain inline.

## 5. Routes have auth restored
`backend/src/routes/index.js` now has `auth` on all three:
```
router.get('/getAllUsers',       auth, mydbController.getAllUsers);
router.post('/getPublicProfile', auth, mydbController.getPublicProfile);
router.post('/GetUserGallery',   auth, mydbController.GetUserGallery);
```

## 6. Credential/query logging removed
Searching `backend/src/services/db.js` for the leak patterns
(`console.log(query)`, `console.log('Query result:'`, `console.log('Query:'`,
`console.log('Params:'`, `console.log("query super`, `Gallery saved to DB`) returns
no matches. `console.error(...)` calls remain intact.

## 7. Migration file
`backend/migrations/001_widen_name_columns.sql` contains exactly 36
`ALTER TABLE ... ALTER COLUMN ... TYPE text;` statements (18 on `public.users`,
18 on `public.userdetails`) plus a header comment. NOT executed against any database.

## 8. Dead files deleted
`git status --short` shows the three files deleted:
```
D fe_token/src/App.js.save
D "fe_token/src/components/pages/private/EditProfile copy 2.js"
D "fe_token/src/components/pages/private/EditProfile copy.js"
```
Active `fe_token/src/components/pages/private/EditProfile.js` left untouched.

## Note
No backend test suite exists (`npm test` is a placeholder), so the require-load +
password round-trip checks above are the verification per the plan. The `fe_token`
frontend build was not run in this pass; the deleted files were leftover copies not
imported anywhere (confirmed by name — `App.js.save`, `EditProfile copy*.js`).
