# subsTrack

A React Native (Expo) mobile app for tracking recurring subscriptions.

The differentiator is **statement scanning**: instead of only typing subscriptions
in by hand, the user uploads a bank statement (PDF/CSV) and the backend parses it,
groups transactions into recurring charges, and returns them as *detections* with a
confidence score. The user reviews and corrects those detections, and the ones they
keep become tracked subscriptions.

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

**There is no backend.** `setupMockApi()` is called unconditionally in
`app/_layout.tsx`, and `axios-mock-adapter` intercepts every request. All auth,
subscriptions, statement parsing and AI detection are simulated in
`src/api/mock.ts` — including fake progress and fake detections.

The mock deliberately mirrors the REST contract a real backend would expose, so
switching over is configuration only:

```
EXPO_PUBLIC_USE_MOCK_API=false
EXPO_PUBLIC_API_URL=https://<real-backend>
```

No hook or screen changes when that happens. **Keep it that way** — if you add an
endpoint, add it to both the typed client in `src/api/` and the mock, and never let
screens reach around the client.

> **Open question — backend is undecided.** Whether this ships with a real
> server (and who builds it) has not been settled. It is the single largest
> unknown blocking store release, because statement parsing and AI detection
> cannot run purely on-device as designed. Revisit before committing to a
> launch date.

### The REST contract (defined by the mock, spec for any real backend)

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/auth/register`, `/auth/login` | Returns `{ token, user }` |
| `GET` | `/subscriptions` | List |
| `POST` | `/subscriptions` | Create |
| `GET` `PATCH` `DELETE` | `/subscriptions/:id` | Read / update / remove |
| `POST` | `/statements` | Multipart upload; returns immediately, work is async |
| `GET` | `/statements/:id` | Poll for `status` + `progress` |
| `GET` | `/statements/:id/detections` | Detected recurring charges |
| `POST` | `/statements/:id/confirm` | Turn kept detections into subscriptions |

Statement lifecycle: `uploading → parsing → analyzing → ready`, or `failed`.
The client polls `GET /statements/:id` and drives the progress UI from it.

---

## Architecture

```
app/                      expo-router file routes only — thin screens
  _layout.tsx             providers: SafeArea → QueryClient → Auth → Purchases
  (auth)/login.tsx        signed-out
  (app)/                  signed-in; redirects to (auth) without a token
    (tabs)/               index (list) · upload (scan) · account
    add.tsx  [id].tsx     create / detail-edit
    review.tsx            confirm or correct AI detections
    paywall.tsx           RevenueCat plans
src/
  api/                    typed axios clients + mock adapter + token storage
  hooks/                  useAuth, usePurchases (context); useSubscriptions,
                          useStatements (React Query)
  components/             shared UI
  types.ts                all shared types live here
  theme.ts                colors / spacing / radius / typography / shadow
  utils/                  money, filePicker
```

**Conventions**

- Import via the `@/` alias (`@/src/...`), never long relative paths.
- Server state is React Query. Don't hand-roll fetch-in-`useEffect`.
- All shared types go in `src/types.ts`. Don't redeclare shapes locally.
- Style from `src/theme.ts` tokens — no hardcoded hex, spacing or font sizes.
- Auth tokens live in `expo-secure-store` (`src/api/tokenStorage.ts`), never
  AsyncStorage.
- App is light-mode only right now (`userInterfaceStyle: "light"`).

---

## Monetization

RevenueCat via `react-native-purchases`. Entitlement id is `pro`
(`src/lib/purchases.ts`). Setup notes are in `docs/revenuecat.md`; public SDK keys
come from `.env` (see `.env.example`) — the secret key must never reach the bundle.

`usePurchases()` handles identity carefully: it ties purchases to the signed-in
user id, skips the `'restored'` placeholder id (otherwise every restored session
would share one entitlement), and calls `forgetUser()` on sign-out.

> **The paywall gates nothing, on purpose.** Purchase, restore and entitlement
> reads all work, but `isPro` is only used for *display* — the plan card in
> `account.tsx` and the "you're subscribed" state in `paywall.tsx`. No feature is
> locked. Deciding what Pro actually buys (statement scans per month? unlimited
> subscriptions?) is an open product decision and a blocker for store release.

Purchases require a **development build** — they do not work in Expo Go.

---

## Status

**Built:** email auth flow, subscription CRUD, categories, monthly/yearly cost
math, statement upload + polling + progress UI, detection review screen, paywall,
custom floating tab bar.

**Not built / undecided, in rough priority order for shipping:**

1. Real backend — including actual PDF/CSV parsing and the AI detection model.
2. What Pro unlocks, and enforcing it.
3. Store listing assets, privacy policy, data-handling disclosure (bank statements
   are sensitive — both stores will ask).
4. No test suite and no linter are configured.
5. Password reset, account deletion (Apple requires in-app account deletion).

---

## Commands

```
npm start                 dev server
npm run android|ios|web   run on a platform
npm run build:dev         EAS development build (needed for RevenueCat)
npm run build:prod        production build
npm run submit:android|ios
```

There is no test or lint script — don't claim to have run one.
