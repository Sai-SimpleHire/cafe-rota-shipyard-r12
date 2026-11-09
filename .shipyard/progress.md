# Progress

## Done

- Step 1 (design): DESIGN.md completed below the generated block; build plan below.
- Step 2 (phase-1): schema, members + access, app frame, change password, Plan the week. Tests in tests/rota, tests/members.
- Step 3 (phase-2): Staff (add/remove), My shifts (cards, ask to swap), Swap requests
  (approve / turn down). Tests in tests/staff, tests/swaps.
- Step 4 (phase-3): search engines told to stay away; all checks pass; every page answers.

## Decisions the next session needs

- One café, so no organisation separation: `scoped()` (organization_tenancy) is not installed
  and "more than one café" is out of scope. Queries use `@/lib/prisma` directly.
- Roles are two values (manager / staff) on our own `CafeMember` row, checked on the server
  by `src/lib/members/access.ts`. The `rbac` part is not installed; two fixed roles do not
  need it.
- The first account registered becomes the manager. Later self-registrations get no access
  ("ask your manager"). Staff accounts are made by the manager with a starting password and
  `mustChangePassword`; `/change-password` is enforced by the (app) layout.
- A swap moves the shift to the named colleague when the manager approves. Nothing comes
  back the other way; the colleague is not asked.
- Removing staff disables their sign-in, ends their sessions, turns down their waiting swap
  requests, and keeps their shifts on the rota marked "Left" for the manager to reassign.
- Shift times are wall-clock café times: a calendar date plus minutes after midnight.

## Not checked yet

- The signed-in screens were not opened in a browser: doing that on the preview would have
  made the agent the café's manager in the founder's own data. The browser checks
  (before launch) should walk: register manager → add staff → plan + publish → staff
  first sign-in + change password → ask swap → approve.

## Next (before launch, when the founder asks)

1. Browser checks for the four core flows (id tests).
2. Walk the app in a browser (id browser-check).
3. Security review (id security).

## Before launch (done 2026-11-09)

- Browser checks: e2e/staff, plan-week, my-shifts, swaps (+ smoke); shared steps in e2e/rota.ts.
  The fixed test manager is manager@cafe-rota.test; checks rely on the test DB being empty or
  that account being the manager.
- Browser walk fixes: table headings (data_table/table.css), current tab underline, brand nowrap.
- Security: /api/account/password only while on the starting password (requireStartingPassword);
  requireMember refuses anyone still on a starting password.
- Open: the first person to register becomes manager — the founder must register first.
