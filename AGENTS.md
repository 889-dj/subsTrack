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
subscription CRUD, per-currency analytics, RevenueCat entitlement projection,
webhooks, and durable account deletion. The full contract is in
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
  _layout.tsx             providers: SafeArea → QueryClient → Auth → Purchases
  (auth)/login.tsx        signed-out
  (app)/                  signed-in; redirects to (auth) without a token
    (tabs)/               overview · calendar · add · subscriptions · insights
    add.tsx  [id].tsx     create / detail-edit
    account.tsx           identity, appearance, plan and deletion controls
    paywall.tsx           RevenueCat plans
src/
  api/                    typed axios clients + mock adapter + token provider
  hooks/                  Clerk/mock auth, purchases, subscriptions, theme
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

RevenueCat via `react-native-purchases`. Entitlement id is `pro`
(`src/lib/purchases.ts`). Setup notes are in `docs/revenuecat.md`; public SDK keys
come from `.env` (see `.env.example`) — the secret key must never reach the bundle.

`usePurchases()` handles identity carefully: it ties purchases to the signed-in
user id, skips the `'restored'` placeholder id (otherwise every restored session
would share one entitlement), and calls `forgetUser()` on sign-out.

> **The paywall gates nothing yet.** Purchase, restore and entitlement
> reads all work, but `isPro` is only used for *display* — the plan card in
> `account.tsx` and the "you're subscribed" state in `paywall.tsx`. No feature is
> locked. Deciding the exact Free/Pro policy and ensuring every paywall promise
> exists is still a product decision and a blocker for store release.

Purchases require a **development build** — they do not work in Expo Go.

---

## Status

**Built:** Clerk-backed email auth with verification, mock auth mode, subscription
CRUD, categories, calendar-safe monthly/yearly math, per-currency forecasts,
overview/insights, paywall, custom floating tab bar, backend webhooks, and durable
account deletion.

**Not built / undecided, in rough priority order for shipping:**

1. What Pro unlocks, enforcing it, and removing any unimplemented paywall claims.
2. Production Clerk, RevenueCat, database, webhook, and API deployment values.
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
npm run build:dev         EAS development build (needed for RevenueCat)
npm run build:prod        production build
npm run submit:android|ios
```

There is no mobile test or lint script — do not claim to have run either.
