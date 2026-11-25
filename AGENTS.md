# subsTrack

A React Native (Expo) mobile app for manually tracking recurring subscriptions,
renewal dates, recurring commitments, and spending forecasts.

There is no statement-upload, bank-document parsing, AI-detection, or device
digital-wellbeing feature in the current product. Do not add those flows unless
the product scope is explicitly changed in a future request.

**Current goal: ship to the App Store and Play Store.** Decisions should be weighed
against that, not against "make the demo look good".

---

## Expo has changed

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before
writing any code. Do not rely on memory of older Expo/React Native APIs — SDK 57,
React 19.2 and RN 0.86 (new architecture enabled) differ meaningfully from what
most training data describes.

---

## The one thing to know first

The production backend lives beside this repository at `../subsTrack-backend`.
It is a Fastify/TypeScript/PostgreSQL service with Clerk authentication,
subscription CRUD, per-currency analytics, RevenueCat entitlement projection
(unused by the app for now), webhooks, and durable account deletion. The full contract is in
`docs/backend-prd.md`; its OpenAPI file is in the backend repository.

`setupMockApi()` is still called from `app/_layout.tsx`, but the mock adapter only
activates when `EXPO_PUBLIC_USE_MOCK_API` is not `false`. This keeps UI development
available without intercepting production requests.

The mock deliberately mirrors the REST contract a real backend would expose, so
switching over is configuration only:

```
EXPO_PUBLIC_USE_MOCK_API=false
EXPO_PUBLIC_API_URL=https://<real-backend>/v1
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
```

No hook or screen changes when that happens. **Keep it that way** — if you add an
endpoint, add it to both the typed client in `src/api/` and the mock, and never let
screens reach around the client.

### The mobile REST contract

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/me` | Authenticated profile + entitlement projection |
| `GET` | `/subscriptions` | `{ items, nextCursor }` |
| `POST` | `/subscriptions` | Create |
| `GET` `PATCH` `DELETE` | `/subscriptions/:id` | Read / update / remove |
| `POST` | `/subscriptions/:id/pause`, `/resume` | Status changes |
| `GET` | `/analytics/spend-trend`, `/analytics/overview` | Per-currency analytics |
| `DELETE` | `/account` | Permanent account deletion |

In production, Clerk owns registration/login and supplies rotating session JWTs;
there are no backend password endpoints. Mock mode retains local `/auth/*` routes
only to support offline UI development.

---

## Architecture

```
app/                      expo-router file routes only — thin screens
  _layout.tsx             providers: SafeArea → QueryClient → Auth
  (auth)/login.tsx        signed-out
  (app)/                  signed-in; redirects to (auth) without a token
    (tabs)/               overview · calendar · add · subscriptions · insights
    add.tsx  [id].tsx     create / detail-edit
    account.tsx           identity, appearance and deletion controls
src/
  api/                    typed axios clients + mock adapter + token provider
  hooks/                  Clerk/mock auth, subscriptions, theme
  components/             shared UI
  types.ts                all shared types live here
  theme.ts                colors / spacing / radius / typography / shadow
  utils/                  money and renewal forecasting
```

**Conventions**

- Import via the `@/` alias (`@/src/...`), never long relative paths.
- Server state is React Query. Don't hand-roll fetch-in-`useEffect`.
- All shared types go in `src/types.ts`. Don't redeclare shapes locally.
- Style from `src/theme.ts` tokens — no hardcoded hex, spacing or font sizes.
- Clerk persists native sessions through its SecureStore token cache. Mock tokens
  use `src/api/tokenStorage.ts`. Never put production tokens in AsyncStorage on
  native platforms.
- Light, dark, and system appearance modes are supported.

---

## Monetization

**There is no paid plan in the app yet.** RevenueCat (`react-native-purchases`), the
paywall screen and the Free/Pro plan card were removed to ship without store
billing costs. The backend still has its RevenueCat webhook and entitlement
projection (`/me` returns `isPro`), but nothing in the app reads it. Re-adding
billing means restoring those pieces from git history (see the "Remove RevenueCat"
commit), adding a Play/App Store app in RevenueCat for a real `goog_`/`appl_` key,
and deciding what Pro unlocks. Never ship a `test_` RevenueCat key in a release build.

---

## Status

**Built:** Clerk-backed email auth with verification, mock auth mode, subscription
CRUD, categories, calendar-safe monthly/yearly math, per-currency forecasts,
overview/insights, custom floating tab bar, backend webhooks, and durable
account deletion.

**Not built / undecided, in rough priority order for shipping:**

1. Production Clerk, database, webhook, and API deployment values.
2. (Later) A paid plan: what Pro unlocks, RevenueCat set-up, and the paywall.
3. Store listing assets, privacy policy, and accurate data-handling disclosures.
4. Password reset UX.
5. The mobile app has type checking but no UI test suite or linter yet. The
   backend has unit/API tests and strict type checking.

---

## Commands

```
npm start                 dev server
npm run android|ios|web   run on a platform
npm run typecheck         TypeScript validation
npm run build:dev         EAS development build
npm run build:prod        production build
npm run submit:android|ios
```

There is no mobile test or lint script — do not claim to have run either.
