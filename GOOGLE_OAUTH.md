# Google OAuth Implementation — HubNest CRM

## How It Works (One Flow, No Exceptions)

```
User clicks "Sign in with Google"
    │
    ▼
Google returns an ID Token (JWT signed by Google)
    │
    ▼
Frontend  POST /api/v1/auth/google  { credential: "<id_token>" }
    │
    ▼
Backend verifies the ID token signature with Google's public keys
    │
    ▼
Extract email from the verified token payload
    │
    ▼
SELECT * FROM users WHERE email = '<google_email>'   ← DB is the gatekeeper
    │
    ├── Not found        → 404  "No CRM account found. Contact your administrator."
    ├── status != Active → 403  "Account is inactive or suspended."
    ├── Role not allowed → 403  "Access denied. Insufficient privileges."
    │
    ▼
Issue accessToken + refreshToken (same JWT payload as password login)
    │
    ▼
Frontend stores tokens → redirects to role dashboard
```

**No OTP step.** Google already verified the identity. Everything else (RBAC, tenant
isolation, session tracking) is identical to the normal email+password login.

---

## Files Changed / Created

| File | What it does |
|------|-------------|
| `server/src/services/googleAuthService.js` | Verifies the Google ID token using `google-auth-library` |
| `server/src/modules/auth/auth.service.js` | `loginWithGoogle()` — DB lookup + token issuance |
| `server/src/modules/auth/auth.controller.js` | `googleLogin()` — HTTP handler for `POST /auth/google` |
| `server/src/modules/auth/auth.routes.js` | Route: `POST /auth/google` (rate-limited) |
| `server/src/config/env.js` | Added `googleClientId`, `googleClientSecret` |
| `client/services/auth.ts` | `authService.googleLogin(credential)` |
| `client/components/shared/GoogleProvider.tsx` | Wraps app with `GoogleOAuthProvider` |
| `client/app/layout.tsx` | Mounts `GoogleProvider` in root layout |
| `client/components/auth/LoginExperience.tsx` | `<GoogleLogin>` button in login form |
| `client/app/auth/login/page.tsx` | `handleGoogleLogin()` handler |
| `client/app/(auth)/login/page.tsx` | Same handler (duplicate login route) |

---

## DB Check — Exact Code

### 1. `googleAuthService.js` — Verify the Google ID Token

```js
// server/src/services/googleAuthService.js
const { OAuth2Client } = require('google-auth-library');
const env = require('../config/env');

const client = new OAuth2Client(env.googleClientId);

async function verifyGoogleToken(idToken) {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: env.googleClientId,   // must match the Client ID that issued the token
  });
  const payload = ticket.getPayload();
  if (!payload) throw Object.assign(new Error('Invalid Google token'), { statusCode: 401 });
  return {
    googleId: payload.sub,          // Google's unique user ID
    email: payload.email,           // e.g.  sandipsharm4322@gmail.com
    name: payload.name,
    picture: payload.picture,
    emailVerified: payload.email_verified,
  };
}
```

### 2. `auth.service.js` — DB Lookup (the gatekeeper)

```js
// server/src/modules/auth/auth.service.js  (loginWithGoogle)

// Step 1 — verify signature with Google
const googleUser = await verifyGoogleToken(idToken);

// Step 2 — email must be verified by Google
if (!googleUser.emailVerified) {
  throw Object.assign(new Error('Google account email is not verified'), { statusCode: 401 });
}

// Step 3 — email MUST exist in the users table
//   findByEmail runs this SQL:
//
//   SELECT u.id, u.tenant_id, u.role_id, u.name, u.email, u.admin_id,
//          u.status, u.phone, u.photo_url, u.language,
//          r.name AS role_name, r.permissions,
//          t.schema_name
//   FROM users u
//   JOIN roles   r ON r.id = u.role_id
//   JOIN tenants t ON t.id = u.tenant_id
//   WHERE u.email = $1          ← google email matched here
//
const user = await findByEmail(googleUser.email);

if (!user) {
  // Email exists in Google but NOT in the CRM database → blocked
  throw Object.assign(
    new Error('No CRM account found for this Google email. Contact your administrator.'),
    { statusCode: 404 }
  );
}

// Step 4 — account must be Active (not blocked/suspended)
if (user.status !== 'Active') {
  throw Object.assign(
    new Error('Account is inactive or suspended. Contact your administrator.'),
    { statusCode: 403 }
  );
}

// Step 5 — role must be a recognised CRM role
const ALLOWED_ROLES = new Set([
  'Super Admin', 'Admin', 'Sales Manager', 'Sales Executive',
  'Marketing Head', 'Marketing Executive', 'Support Manager',
  'Support Agent', 'Finance Executive', 'Finance Manager',
  'Accountant', 'Auditor',
]);
if (!ALLOWED_ROLES.has(user.role_name)) {
  throw Object.assign(
    new Error('Access denied. Insufficient privileges to login.'),
    { statusCode: 403 }
  );
}

// Step 6 — all checks passed, issue our own JWT (same payload as password login)
const tokenPayload = {
  userId:     user.id,
  tenantId:   user.tenant_id,
  roleId:     user.role_id,
  role:       user.role_name,
  roleName:   user.role_name,
  schemaName: user.schema_name,
};
const accessToken  = tokenService.generateAccessToken(tokenPayload);
const refreshToken = tokenService.generateRefreshToken({ userId: user.id });
await tokenService.saveRefreshToken(user.id, refreshToken, ipAddress, userAgent);
```

### 3. `userModel.js` — The actual SQL query

```js
// server/src/models/userModel.js
async function findByEmail(email) {
  const result = await query(
    `SELECT u.id, u.tenant_id, u.role_id, u.name, u.email, u.admin_id,
            u.password_hash, u.status, u.created_at, u.updated_at,
            u.phone, u.photo_url, u.language,
            r.name AS role_name, r.permissions,
            t.schema_name
     FROM users u
     JOIN roles   r ON r.id = u.role_id
     JOIN tenants t ON t.id = u.tenant_id
     WHERE u.email = $1`,          // ← Google email matched against users.email column
    [email]
  );
  return result.rows[0] || null;   // null = not found → 404
}
```

---

## Env Variables Required

### `server/.env`
```env
GOOGLE_CLIENT_ID=394098059728-xxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxx
```

### `client/.env.local`
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=394098059728-xxxxxxxxxxxx.apps.googleusercontent.com
```

> Both files must use the **same Client ID**.  
> `GOOGLE_CLIENT_SECRET` is only needed on the server.  
> `NEXT_PUBLIC_*` prefix is required for Next.js to expose the value to the browser.

---

## Google Cloud Console Setup

1. Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
2. Application type: **Web application**
3. Add **Authorised JavaScript Origins**:
   - `http://localhost:3000` (development)
   - `https://yourdomain.com` (production)
4. No redirect URI needed — this implementation uses the **implicit/token flow** (ID token sent directly to your backend, no redirect callback).

---

## Access Control Summary

| Scenario | Result |
|----------|--------|
| Gmail not in `users` table | **Blocked** — 404 |
| Gmail in DB, `status = Inactive` | **Blocked** — 403 |
| Gmail in DB, `status = Suspended` | **Blocked** — 403 |
| Gmail in DB, `status = Active`, valid role | **Allowed** → JWT issued |
| Gmail in DB, `status = Active`, unknown role | **Blocked** — 403 |

**The database is the only allowlist.** To grant a user Google OAuth access, a Super Admin
or Admin simply creates their account in the CRM with their Gmail address. No `.env` changes,
no code changes needed.

---

## Adding a New Google OAuth User

1. Super Admin logs in → **Admin Panel → Users → Create User**
2. Set the **Email** field to their Gmail address (e.g. `sandipsharm4322@gmail.com`)
3. Set their **Role** (Super Admin / Admin / Marketing Head / etc.)
4. Set **Status** = Active
5. The user can now click "Sign in with Google" on the login page and will land on their
   role-specific dashboard.
