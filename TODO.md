# FastNetMon GUI — Todo

Supersedes `FNM-GUI-Fix-TodoList.docx` (March 2026 code review). **All 14 items
from that review are implemented** — JWT secret guard, CORS allowlist, CSP,
login rate limiting, AES-256-GCM credential encryption, gated SQLite logging,
server edit dialog, delete confirmations, IP/CIDR validation, sonner toasts,
dashboard server selector, dead dependency removal, shared `types/fnm.ts`, and
the relative `/api` URL with nginx proxying.

## Recently fixed (July 2026)

- [x] Seeded admin no longer defaults to `admin`/`password` — uses
      `ADMIN_USERNAME`/`ADMIN_PASSWORD` from `.env`, or generates a random
      password printed once at first start.
- [x] `decrypt()` no longer silently falls back to returning the stored value
      on failure — a wrong `ENCRYPTION_KEY` now produces a clear 500 from the
      proxy instead of sending ciphertext as the password.
- [x] `PUT /api/servers/:id` crashed when `is_active` was omitted (the edit
      form never sends it); it now preserves the existing value.
- [x] Input validation on server create/update (400 instead of raw SQLite errors).
- [x] Removed debug logging of usernames on login and of proxied request bodies.
- [x] Removed dead code in `proxy.js` and stray `frontend/test.txt`.

## High priority

- [ ] **Password change UI + endpoint.** There is no way to change a password —
      the only workaround is deleting and recreating the user. Add
      `PUT /api/users/:id/password` (require current password for self-change)
      and a form on the Users page.
- [ ] **Real role-based access control.** `role` exists in the DB and JWT but is
      never checked, and the UI offers no role choice — every user is a full
      admin. Add a `viewer` role (read-only: no user/server management, no
      mitigation actions) and enforce it in backend middleware, not just the UI.
- [ ] **HTTPS to FastNetMon instances.** The proxy hardcodes `http://`; FNM API
      credentials transit the network in clear. Add a per-server `use_tls` flag
      (and a "skip TLS verify" escape hatch for self-signed certs).

## Medium

- [ ] **Token/session hardening.** JWT lives in localStorage (XSS-readable) with
      a fixed 1-day expiry and no logout invalidation. Consider httpOnly cookie
      sessions or short-lived tokens with refresh.
- [ ] **Restrict the proxy.** `/api/proxy/:id/*` forwards any path/method to the
      FNM API. An allowlist of known FNM endpoints would shrink the blast radius
      of a stolen token.
- [ ] **Respect `is_active` in the proxy** — inactive servers can still be
      queried directly by ID.
- [ ] **Backend tests.** `npm test` is a placeholder. Start with supertest
      coverage of auth, servers CRUD (encryption round-trip), and proxy error
      paths — the seed/encrypt fixes above had no safety net.

## Low / polish

- [ ] IPv6 support in the Mitigation page validator (`isValidIpOrCidr` is
      IPv4-only; FNM supports IPv6 blackholes).
- [ ] Audit log of mitigation actions (who blackholed/unblocked what, when).
- [ ] CI (GitHub Actions): lint + `tsc` + backend tests on PR.
- [ ] Health/status indicator per server on the Servers page (ping the FNM API
      instead of only showing the manual active flag).
- [ ] Delete `FNM-GUI-Fix-TodoList.docx` once this file is the agreed source of
      truth.
