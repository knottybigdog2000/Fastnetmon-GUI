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
- [x] `trust proxy` enabled so rate limiting sees real client IPs behind the
      nginx container instead of erroring on `X-Forwarded-For`.

## High priority

- [x] **Password change UI + endpoint.** `PUT /api/users/:id/password` —
      self-change requires the current password; changing another user is an
      admin reset. Key icon on the Users page opens the dialog. Minimum
      password length (8) now also enforced on user creation.
- [x] **Real role-based access control.** `viewer` role added: read-only
      access enforced in backend middleware (proxy mutations, server and user
      management all require admin; viewers keep dashboards, rule views, audit
      log, and self password change). Role picker on user creation; Users and
      Settings pages hidden from viewers; auth middleware now returns 401 only
      for dead sessions and 403 for permission denials. Note: a role change
      takes effect at the user's next login (role lives in the JWT).
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
- [x] **Respect `is_active` in the proxy** — inactive servers now return 400.
- [ ] **Backend tests.** `npm test` is a placeholder. Start with supertest
      coverage of auth, servers CRUD (encryption round-trip), and proxy error
      paths — the seed/encrypt fixes above had no safety net.

## Low / polish

- [x] **Audit log.** Every mitigation action through the proxy (non-GET),
      login (success and failure), and user/server change is recorded in an
      `audit_log` table (capped at 20k rows) and shown on the new Audit Log
      page, polling every 10s.
- [x] **Live server health.** `GET /api/servers/health` probes each active
      FNM instance; the Servers page shows Online + latency, Auth failed, or
      Unreachable per server, refreshing every 15s.
- [ ] IPv6 support in the Mitigation page validator (`isValidIpOrCidr` is
      IPv4-only; FNM supports IPv6 blackholes).
- [ ] CI (GitHub Actions): lint + `tsc` + backend tests on PR.
- [ ] Delete `FNM-GUI-Fix-TodoList.docx` once this file is the agreed source of
      truth.
