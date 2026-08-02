# RevenueCat setup

The app code is finished; what follows is the dashboard and store configuration it
expects. Until steps 1–3 are done the paywall renders an explanatory notice
instead of plans, so the app stays usable while you work through them.

## What the code expects

| Thing | Value | Defined in |
| --- | --- | --- |
| Entitlement identifier | `pro` | [src/lib/purchases.ts](../src/lib/purchases.ts) |
| Offering | whichever is marked **current** | `fetchPlans()` |
| Packages | the `$rc_monthly` and `$rc_annual` package types | `buildPlans()` |

The paywall reads `offering.monthly` / `offering.annual`, falling back to a scan of
`availablePackages` by package type. Only those two terms are shown — a lifetime or
weekly package in the same offering is ignored.

## 1. Store products

Create an auto-renewing subscription in each store you ship to:

- **Google Play Console** → Monetize → Subscriptions: one subscription with a monthly
  base plan and an annual base plan.
- **App Store Connect** → Subscriptions: one subscription group containing a monthly
  and an annual product.

## 2. RevenueCat dashboard

1. Create the project and add the Play Store / App Store apps to it.
2. **Products** → import the store products above.
3. **Entitlements** → create one with identifier `pro` and attach both products.
4. **Offerings** → create an offering, mark it **current**, and add two packages:
   the monthly product as `Monthly` and the annual product as `Annual`.

## 3. API keys

Copy `.env.example` to `.env` and fill in the public SDK keys from
**Project settings → API keys**:

```
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxx
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxx
```

Restart the bundler afterwards — `EXPO_PUBLIC_` values are inlined at bundle time.

For EAS builds the `.env` file is not uploaded. Each build profile in
[eas.json](../eas.json) declares an `environment`, so set the keys once per
environment instead:

```sh
eas env:set --name EXPO_PUBLIC_REVENUECAT_ANDROID_KEY --value goog_xxx --environment development --visibility plaintext
eas env:set --name EXPO_PUBLIC_REVENUECAT_IOS_KEY --value appl_xxx --environment development --visibility plaintext
```

Repeat for `preview` and `production`.

## 4. Build

`react-native-purchases` is a native module, so it only works in a build made after
it was installed — Expo Go and older dev clients will show the "Not available in this
build" notice:

```sh
npm run build:dev:android
```

## Testing purchases

- **Android**: add your Google account as a licence tester in Play Console, and
  install a build from an internal testing track.
- **iOS**: use a sandbox tester account, or StoreKit configuration in a simulator build.

## Where things live

- [src/lib/purchases.ts](../src/lib/purchases.ts) — SDK wrapper; every call degrades
  to a value instead of throwing.
- [src/hooks/usePurchases.tsx](../src/hooks/usePurchases.tsx) — provider exposing
  `isPro`, `plans`, `purchase`, `restore`.
- [app/(app)/paywall.tsx](<../app/(app)/paywall.tsx>) — the paywall, presented as a modal.

To gate a feature, read `isPro` from `usePurchases()` and send non-subscribers to
`/paywall`.
