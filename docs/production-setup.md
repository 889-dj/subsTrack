# Production setup

The application and backend integration are implemented. These are the external
dashboard and deployment values required to switch from the local mock to the
production service.

## 1. Clerk

Create a Clerk application with email/password authentication and email-code
verification enabled. Register the native app identifiers:

- iOS bundle id: `com.devjain.subsTrack`
- Android package: `com.devjain.subsTrack`

Configure a Clerk webhook at:

```text
https://<your-api-domain>/api/webhooks/clerk
```

Subscribe to `user.created`, `user.updated`, and `user.deleted`. Keep these
values in their proper environments:

```text
# Mobile/EAS; public by design
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...

# Backend only
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SECRET=whsec_...
```

`CLERK_JWT_KEY`, `CLERK_AUDIENCE`, and `CLERK_AUTHORIZED_PARTIES` are optional
hardening values documented in the backend `.env.example`.

## 2. PostgreSQL and API

Provision PostgreSQL, deploy `../subsTrack-backend`, and set every production
variable from its `.env.example`. Before accepting traffic, run:

```sh
npm run db:migrate
```

The deployed API must expose HTTPS and its readiness endpoint must return 200:

```text
https://<your-api-domain>/readyz
```

Then configure the mobile/EAS environment:

```text
EXPO_PUBLIC_USE_MOCK_API=false
EXPO_PUBLIC_API_URL=https://<your-api-domain>/v1
```

The `/v1` suffix is required.

## 3. RevenueCat

Follow `docs/revenuecat.md`. In addition to the two public platform keys used by
the app, the backend needs `REVENUECAT_WEBHOOK_SECRET` and
`REVENUECAT_SECRET_API_KEY`. Point the RevenueCat webhook to:

```text
https://<your-api-domain>/api/webhooks/revenuecat
```

## 4. Build and smoke test

Clerk configuration and RevenueCat are native-build concerns. Create a fresh
development build after setting EAS environment values, then test this sequence:

1. Create an account and verify its email.
2. Create, edit, and delete a subscription.
3. Confirm overview, calendar, and insights totals do not mix currencies.
4. Purchase and restore Pro with store sandbox accounts.
5. Delete the account, then confirm its subscriptions and external identities
   are removed.

Do not ship until the final Free/Pro limits match the paywall copy. Renewal
reminders, price alerts, and exports must either exist or be removed from the
purchase promise.
