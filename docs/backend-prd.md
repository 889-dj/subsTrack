# subsTrack Backend Specification

**Status:** Backend baseline implemented; production configuration pending  
**Version:** 1.0  
**Last updated:** 24 August 2026  
**Scope:** Current mobile product only

## 1. Purpose

This document defines the production backend required by the current subsTrack
mobile application. It is based on both:

- the API calls and product flows currently present in the Expo app; and
- the implementation already present in `subsTrack-backend`.

It separates existing behavior from work still required for a reliable App Store
and Play Store launch.

Statement upload, PDF/CSV parsing, transaction detection, bank connections, and
device digital-wellbeing data are **not part of this specification**. They are not
part of the current app and must not block v1.

## 2. Product scope

The backend supports these user-visible capabilities:

1. Sign in and maintain an authenticated account.
2. Create, view, edit, and delete recurring subscriptions.
3. Display renewals in overview, calendar, and subscription-list screens.
4. Calculate monthly commitment, annual run rate, category breakdowns, renewal
   forecasts, and month-over-month change without mixing currencies.
5. Synchronize Pro entitlement state from RevenueCat.
6. Delete the user's account and all associated data from inside the app.
7. Optionally deliver renewal notifications if reminders remain part of the v1
   product promise.

### 2.1 Explicit non-goals for v1

- Bank-statement uploads or document storage.
- AI extraction or recurring-payment detection.
- Open Banking or direct bank integrations.
- Screen Time / Digital Wellbeing collection.
- Automatic cancellation of third-party subscriptions.
- Currency conversion or live foreign-exchange rates.
- A web administration product beyond operational tooling.

## 3. Current implementation audit

### 3.1 Already present in `subsTrack-backend`

- Fastify 5 API written in TypeScript.
- PostgreSQL 16 with Drizzle ORM and migrations.
- Clerk bearer-token verification middleware.
- User profile endpoint.
- Subscription CRUD endpoints.
- Pause and resume routes.
- A payment-history route.
- A basic spend-trend route.
- RevenueCat and Clerk webhook routes.
- Local account deletion.
- Health, readiness, and API metadata routes.
- Docker configuration.

### 3.2 Already present in the mobile app

- Email/password login and registration client calls.
- Secure bearer-token storage.
- Subscription CRUD client calls and React Query hooks.
- Overview, calendar, subscriptions, insights, account, and paywall screens.
- RevenueCat purchase, restore, identity, and entitlement handling.
- Client-side subscription calculations and charts.
- In-app account deletion entry point.

### 3.3 Contract gaps that must be resolved

The required v1 outcomes below were implemented on 24 August 2026. The table is
retained as the audit trail explaining why the mobile and backend contracts
changed. Production credentials, deployment, and the final Pro policy remain
launch configuration/product decisions.

| Area | Mobile app today | Backend today | Required v1 outcome |
|---|---|---|---|
| Authentication | `POST /auth/login` and `/auth/register` | Clerk JWT verification | Use Clerk end to end; remove custom password API assumptions from production mobile |
| API prefix | Unversioned paths | `/v1/*` | Set production base URL to include `/v1`, or add the prefix to the typed client consistently |
| Account deletion | `DELETE /auth/account` | `DELETE /v1/account` | Standardize on `DELETE /v1/account` |
| Subscription status | Client type does not expose it | Stored in database | Return and type `status` consistently, or remove pause/resume from the public contract |
| Payment history | Not consumed by the current app | Synthesized from renewal cadence | Do not present synthetic entries as real charges |
| Analytics | Mostly calculated on device | Server combines values | Never add amounts in different currencies |
| User creation | Assumes authenticated user exists | Relies on Clerk webhook timing | Add just-in-time user reconciliation |

## 4. Architecture

### 4.1 Launch architecture

```text
Expo mobile app
    |
    | HTTPS + Clerk session JWT
    v
Fastify API
    |-- PostgreSQL (users, subscriptions, entitlements, webhook events)
    |-- Clerk API/webhooks (identity)
    |-- RevenueCat webhooks (Pro entitlement projection)
    `-- Push provider (optional v1 reminders)
```

The API remains a stateless service. PostgreSQL is the source of truth for user
subscription data. Clerk is the source of truth for identity. RevenueCat is the
source of truth for store purchase state; the database stores a projection used
for fast authorization and display.

No queue or object-storage service is required for the current v1 scope. If
notifications ship, a PostgreSQL-backed scheduled-job process is sufficient at
the initial scale.

### 4.2 Technology baseline

Keep the existing backend choices unless a measured issue requires a change:

- Node.js 22
- Fastify 5
- TypeScript with strict type checking
- PostgreSQL 16
- Drizzle ORM and checked-in SQL migrations
- Zod request and response validation
- Clerk for authentication
- RevenueCat for mobile subscription entitlements

## 5. Authentication and identity

### 5.1 Decision

Production authentication uses Clerk. The mobile app must obtain a Clerk session
token and send it as:

```http
Authorization: Bearer <clerk-session-jwt>
```

The server must not implement or store app-specific passwords. Existing mobile
calls to `/auth/login` and `/auth/register` are mock-era behavior and are not part
of the production API.

### 5.2 Authenticated request behavior

For every protected request, the API must:

1. Verify JWT signature, issuer, audience, and expiration.
2. Extract the Clerk user id (`sub`).
3. Reconcile the local user row if it does not exist. A delayed Clerk webhook must
   never cause a subscription write to fail its foreign-key constraint.
4. Reject access to a soft-deleted account.
5. Scope every query by the authenticated user id.

Never accept a user id from a request body or query parameter as authorization.

### 5.3 RevenueCat identity

The RevenueCat `app_user_id` must equal the same Clerk user id. This is required
for deterministic entitlement synchronization across devices and webhooks.

### 5.4 User profile

#### `GET /v1/me`

Returns the authenticated user's profile and server-side product access state.

```json
{
  "id": "user_2abc",
  "email": "person@example.com",
  "isPro": true,
  "proUntil": "2026-09-21T00:00:00.000Z",
  "createdAt": "2026-08-01T10:00:00.000Z"
}
```

`proUntil` may be `null`. `isPro` is computed from the latest RevenueCat state,
not trusted from a mobile request.

## 6. API conventions

### 6.1 Base URL and versioning

All product routes use `/v1`. Health and webhook paths may remain outside the
version namespace.

Example production base URL:

```text
https://api.substrack.app/v1
```

If this full value is used as `EXPO_PUBLIC_API_URL`, typed mobile clients call
`/subscriptions`, `/me`, and `/account` beneath it.

### 6.2 Content and dates

- JSON requests use `Content-Type: application/json`.
- Timestamps use ISO 8601 UTC strings.
- Money is serialized as decimal strings or integer minor units, never binary
  floating-point results.
- Currency uses uppercase ISO 4217 codes such as `INR` and `USD`.
- Subscription renewal timestamps preserve the user's selected local calendar
  date. The API must also store the user's IANA timezone when reminders are used.

### 6.3 Success and error envelopes

Resource endpoints return the resource directly. List endpoints return a stable
object so pagination can be added without a breaking change.

```json
{
  "items": [],
  "nextCursor": null
}
```

Every error uses this shape:

```json
{
  "message": "Next renewal date is required",
  "code": "VALIDATION_ERROR",
  "requestId": "req_01J...",
  "fields": {
    "nextRenewalDate": "Required"
  }
}
```

`fields` is optional. Supported baseline codes:

- `UNAUTHENTICATED`
- `FORBIDDEN`
- `NOT_FOUND`
- `VALIDATION_ERROR`
- `CONFLICT`
- `RATE_LIMITED`
- `INTERNAL_ERROR`
- `ENTITLEMENT_REQUIRED`

### 6.4 Status codes

- `200` successful read or update
- `201` resource created
- `204` successful deletion with no body
- `400` malformed or invalid input
- `401` missing or invalid identity
- `403` authenticated but not allowed
- `404` absent resource or resource owned by another user
- `409` idempotency or state conflict
- `429` rate limited
- `500` unexpected server failure

Resources owned by another user return `404` to avoid revealing their existence.

## 7. Subscription domain

### 7.1 Canonical subscription representation

```json
{
  "id": "sub_01J...",
  "name": "Netflix",
  "cost": "649.00",
  "currency": "INR",
  "billingCycle": "monthly",
  "nextRenewalDate": "2026-09-04T00:00:00.000Z",
  "category": "Entertainment",
  "source": "App Store",
  "plan": "Standard",
  "note": null,
  "status": "active",
  "createdAt": "2026-08-12T09:20:00.000Z",
  "updatedAt": "2026-08-12T09:20:00.000Z"
}
```

Required fields are `name`, `cost`, `currency`, `billingCycle`, and
`nextRenewalDate`.

Rules:

- `name`: trimmed, 1–120 characters.
- `cost`: greater than zero, maximum two decimal places for currencies used by
  the current UI.
- `currency`: supported uppercase ISO currency.
- `billingCycle`: `monthly` or `yearly` for v1.
- `category`, `source`, and `plan`: optional, trimmed, maximum 100 characters.
- `note`: optional, maximum 1,000 characters.
- `status`: `active` or `paused`.

### 7.2 Endpoints

#### `GET /v1/subscriptions`

Returns all subscriptions owned by the current user. Default order is nearest
renewal first, then name. Optional query parameters:

- `status=active|paused|all` (default `all`)
- `cursor=<opaque>`
- `limit=1..100` (default `50`)

#### `POST /v1/subscriptions`

Creates one subscription and returns `201` with its canonical representation.
The server generates the id and timestamps.

#### `GET /v1/subscriptions/:id`

Returns one owned subscription.

#### `PATCH /v1/subscriptions/:id`

Accepts any editable subscription fields. Unknown properties are rejected. An
empty patch is rejected.

#### `DELETE /v1/subscriptions/:id`

Deletes the tracked subscription and returns `204`. This does not cancel the
service with the external merchant.

#### `POST /v1/subscriptions/:id/pause`

Sets `status` to `paused`. A paused item remains visible in the subscription list
but is excluded from upcoming renewals, commitment totals, and forecasts.

#### `POST /v1/subscriptions/:id/resume`

Sets `status` to `active`. The request may include a corrected
`nextRenewalDate` if the stored date is now in the past.

If pause/resume is not exposed by the final mobile UI, these two routes may remain
internal-compatible but are not required for the first store build.

### 7.3 Renewal calculation

Calendar operations must use calendar arithmetic rather than fixed durations:

- Monthly means add one calendar month, clamping to the last valid day when
  needed (for example, 31 January to 28/29 February).
- Yearly means add one calendar year, handling leap day deterministically.
- Do not model monthly as 30 days or yearly as 365 days.
- The server and mobile app must share fixture tests for end-of-month and leap-year
  cases.

## 8. Analytics and overview data

The current app can calculate most display data locally from subscriptions. That
is acceptable for v1 while account sizes are small. Server endpoints are useful
for consistency and future growth, but their financial semantics must be correct.

### 8.1 Currency rule

Amounts in different currencies must never be summed into one total. The API must
return separate series for each currency. v1 does not convert currencies.

### 8.2 Monthly commitment

For each active subscription:

- monthly item contribution = `cost`
- yearly item contribution = `cost / 12`

Values are grouped by currency. Rounding happens only when serializing a display
total, not for each intermediate item.

### 8.3 Month-over-month comparison

The overview's percentage column compares the selected month's scheduled renewal
total with the previous calendar month's scheduled renewal total, within the same
currency.

```text
changePercent = ((current - previous) / previous) * 100
```

If the previous value is zero, return `changePercent: null` with a neutral copy
state rather than displaying infinity.

### 8.4 `GET /v1/analytics/spend-trend`

Query:

- `months=1..24` (default `6`)
- optional `currency=INR`

Response:

```json
{
  "series": [
    {
      "currency": "INR",
      "points": [
        {
          "month": "2026-08",
          "scheduledAmount": "1135.00",
          "renewalCount": 8
        }
      ]
    }
  ]
}
```

This endpoint is a renewal schedule/forecast derived from tracked subscriptions;
it is not verified historical bank spending. UI and API naming must not call the
values actual charges.

### 8.5 `GET /v1/analytics/overview`

Optional consolidated endpoint for the overview and insights screens:

```json
{
  "asOf": "2026-08-21T12:00:00.000Z",
  "currencies": [
    {
      "currency": "INR",
      "monthlyCommitment": "1135.00",
      "annualRunRate": "13620.00",
      "activeCount": 8,
      "currentMonthScheduled": "1810.00",
      "previousMonthScheduled": "1655.00",
      "changePercent": "9.37",
      "byCategory": [
        {
          "category": "Entertainment",
          "monthlyCommitment": "799.00",
          "percentage": "70.40"
        }
      ]
    }
  ]
}
```

The API should only be added when the app adopts it. Until then, the typed mobile
client remains the source of access and screens must not call it directly.

### 8.6 Payment history semantics

The existing backend derives previous "payments" by subtracting 30 or 365 days
from the next renewal date. Those records are estimates, not observed payments.

For v1, choose one honest behavior:

1. Rename the route and response to forecast occurrences; or
2. Return only payment records explicitly entered or confirmed by the user.

The launch recommendation is option 1 unless actual payment entry is added. Do
not show synthetic records under a label such as "charged" or "payment history".

## 9. RevenueCat and Pro entitlements

### 9.1 Source of truth

RevenueCat is authoritative for App Store and Play Store subscription state. The
API stores an entitlement projection for authorization and account display.

Recommended entitlement fields:

- `userId`
- `entitlementId` (`pro`)
- `isActive`
- `productId`
- `store`
- `expiresAt`
- `environment` (`sandbox` or `production`)
- `originalAppUserId`
- `updatedAt`

### 9.2 `POST /api/webhooks/revenuecat`

Requirements:

- Verify the configured RevenueCat authorization header.
- Reject events with an unknown app user id format.
- Store and deduplicate each provider event id.
- Process duplicate and out-of-order events safely.
- Update the entitlement projection transactionally.
- Return success only after durable processing, or store the event for retry.
- Never log the full webhook payload in production.

The existing `users.proUntil` field may remain as a denormalized projection, but
webhook events must be recorded so failures and ordering can be diagnosed.

### 9.3 Feature enforcement

The final Pro feature set is a product decision. The server must not hard-code an
unapproved limit. Before store release, define a feature policy such as:

```json
{
  "plan": "free",
  "limits": {
    "subscriptions": 8
  },
  "features": {
    "renewalReminders": false,
    "priceAlerts": false,
    "csvExport": false
  }
}
```

Any paid promise shown on the paywall must either be enforced and functional or
removed from the paywall before submission. Client-only hiding is not access
control; paid limits must also be enforced by the API.

## 10. Webhooks

### 10.1 Clerk webhook

`POST /api/webhooks/clerk` synchronizes created, updated, and deleted users.

The server must verify the Svix signature against the exact raw request bytes.
The current Fastify JSON parser must not destroy the raw body before verification.
Use route-specific raw-body capture and test the signed request end to end.

The webhook is a reconciliation mechanism, not a prerequisite for the first
authenticated request. Just-in-time user creation remains necessary.

### 10.2 Webhook event table

```text
webhook_events
  provider           clerk | revenuecat
  provider_event_id  unique with provider
  payload_hash
  event_type
  status             received | processed | failed
  attempts
  last_error
  received_at
  processed_at
```

Webhook handlers must be idempotent. Failed durable events are retried with
bounded exponential backoff and surfaced in monitoring.

## 11. Account deletion

### 11.1 `DELETE /v1/account`

This endpoint performs in-app deletion required for store review.

Desired behavior:

1. Authenticate and require recent authentication when supported.
2. Mark the local account `deletion_pending` immediately.
3. Revoke app access.
4. Delete or anonymize all owned subscriptions, payment/forecast data, push
   tokens, and entitlement projections.
5. Delete the Clerk identity.
6. Call RevenueCat deletion/alias cleanup if required by the configured privacy
   workflow.
7. Record a non-identifying audit result.
8. Return `204` once deletion is durably scheduled or completed.

The existing approach deletes local data first and treats Clerk deletion as
best-effort. That can leave a usable identity. Implement a durable deletion job or
outbox so partial failures are retried and visible operationally.

Deletion must be idempotent. A repeated request must not restore or duplicate any
data.

## 12. Renewal notifications (conditional v1 feature)

The paywall currently promises renewal reminders. If that promise remains, the
backend needs:

- device push-token registration and revocation;
- user timezone and reminder preferences;
- a scheduler that selects upcoming active renewals;
- one idempotency key per user/subscription/reminder window;
- invalid-token handling;
- quiet-hours and permission-aware behavior.

Suggested endpoint:

#### `PUT /v1/devices/:installationId`

```json
{
  "platform": "ios",
  "pushToken": "ExponentPushToken[...]",
  "timezone": "Asia/Kolkata",
  "notificationsEnabled": true
}
```

If this system is not built for launch, remove renewal-reminder claims from the
paid feature list. A local-only reminder system may be used instead, but it must
be specified and tested separately by the mobile app.

## 13. Data model

### 13.1 Existing tables to retain

#### `users`

- Clerk user id primary key
- email
- Pro projection fields
- deletion status/timestamps
- created/updated timestamps

#### `subscriptions`

- id
- owner user id with cascade delete
- canonical fields from section 7
- status
- created/updated timestamps

#### `payments`

Retain only if rows represent real, explicit records. If entries remain derived,
rename the table/domain to `forecast_occurrences` and make their source clear.

### 13.2 Required additions

- `webhook_events` for idempotency and operational recovery.
- `deletion_jobs` or a generic outbox for multi-system account deletion.
- `entitlements` if a single `proUntil` projection is no longer sufficient.
- `devices` only if server-driven renewal notifications ship.

### 13.3 Indexes and constraints

- Index subscriptions by `(user_id, status, next_renewal_date)`.
- Unique webhook events by `(provider, provider_event_id)`.
- Unique device installations by `(user_id, installation_id)`.
- Constrain currency length and billing/status enums at the database layer.
- Store money in `numeric`, never float.
- All owned records cascade or are explicitly removed during account deletion.

## 14. Security and privacy

### 14.1 Required controls

- HTTPS only in production.
- Fail startup if production CORS origins are missing; never default to open CORS.
- Rate-limit login-adjacent, mutation, deletion, and webhook routes appropriately.
- Set a request id on every response and log entry.
- Validate all bodies, parameters, and query strings.
- Use parameterized ORM queries only.
- Keep Clerk, RevenueCat, database, and webhook secrets server-side.
- Never log authorization headers, tokens, full webhook payloads, user notes, or
  other sensitive account content.
- Redact emails in normal application logs.
- Encrypt database volumes and backups at rest.
- Use least-privilege database and infrastructure credentials.
- Rotate secrets without requiring a mobile release.

### 14.2 Retention

- Subscription data is retained while the account is active.
- Deleted account data is removed from active systems promptly.
- Backups expire on a documented schedule and are not used to restore an
  individual deleted account into production.
- Non-identifying security/audit records may be retained for a documented legal
  and operational period.

The privacy policy and store data-safety disclosures must match the real data
flows, including Clerk, RevenueCat, crash reporting, and push delivery.

## 15. Reliability and observability

### 15.1 Health endpoints

- `GET /healthz`: process is running; no dependency calls.
- `GET /readyz`: database reachable and migrations compatible.
- `GET /v1/meta`: API version and minimum supported app version where needed.

### 15.2 Logging and metrics

Use structured JSON logs with:

- timestamp
- level
- request id
- route template
- status code
- latency
- deployment version
- anonymized user reference when needed

Track at minimum:

- request rate, errors, and p95/p99 latency by route;
- database pool saturation and query latency;
- authentication failures;
- webhook receipt, duplicate, failure, and retry counts;
- account-deletion failures;
- notification send/failure counts if enabled.

Configure alerts for elevated 5xx rates, readiness failures, sustained webhook
failures, and deletion jobs exceeding their service-level objective.

### 15.3 Backups and recovery

- Automated encrypted PostgreSQL backups.
- Point-in-time recovery where supported.
- Quarterly restore test.
- Documented recovery point and recovery time objectives before launch.

## 16. Configuration

Required production configuration includes:

- `DATABASE_URL`
- `NODE_ENV=production`
- `PORT`
- allowed CORS origins
- Clerk issuer/audience/JWKS configuration
- Clerk webhook secret
- Clerk management API secret for deletion
- RevenueCat webhook authorization secret
- log level
- optional push-provider credentials

Startup must fail with a clear error when a required production secret is absent.
Secrets must come from the deployment secret manager, not committed `.env` files.

## 17. Testing requirements

### 17.1 Unit tests

- money normalization and rounding;
- monthly/yearly commitment calculations;
- month-over-month percentage including zero baseline;
- currency separation;
- renewal arithmetic for month ends and leap years;
- entitlement state transitions;
- validation schemas.

### 17.2 Integration tests

- Clerk JWT verification and rejected tokens;
- just-in-time user creation;
- CRUD ownership isolation between two users;
- subscription validation and deletion;
- raw-body webhook signature verification;
- duplicate and out-of-order RevenueCat events;
- account deletion across local data and Clerk retry behavior;
- database migrations from an empty database and the previous schema.

### 17.3 Contract tests

Publish an OpenAPI document from the server schemas and test the mobile typed
client against it. At minimum, cover:

- `/me`
- subscription CRUD
- `/account`
- analytics endpoints adopted by the mobile app

The mock API may remain for UI development, but its response fixtures must be
validated against the same schemas so it cannot silently drift from production.

## 18. Delivery plan

### Phase 1 — Make the current app and backend compatible

- Adopt Clerk in the production mobile auth flow.
- Standardize the `/v1` base URL strategy.
- Change account deletion to `/v1/account`.
- Reconcile users on authenticated requests.
- Serialize and type subscription `status` consistently.
- Add shared request/response schemas and stable error responses.

### Phase 2 — Correct financial semantics

- Replace fixed 30/365-day renewal calculations with calendar arithmetic.
- Separate every total and chart by currency.
- Rename synthetic payment history to forecast data or remove it.
- Add server analytics only where the mobile app benefits from it.

### Phase 3 — Harden integrations and privacy

- Fix and test Clerk raw-body webhook verification.
- Add webhook idempotency storage and retries.
- Make account deletion durable across Clerk, RevenueCat, and local data.
- Lock down production CORS, rate limits, logging, backups, and alerts.

### Phase 4 — Close store promises

- Decide exactly what Pro unlocks and enforce it server-side.
- Implement renewal notifications if they remain on the paywall.
- Reconcile privacy policy and store disclosures with actual providers.
- Complete production smoke tests on iOS and Android development builds.

## 19. Launch acceptance criteria

The backend is ready for the first store release when all of the following are
true:

- A new user can authenticate with Clerk and immediately use the API even if a
  webhook is delayed.
- A user can create, read, edit, and delete only their own subscriptions.
- Account deletion is available in-app and recoverably completes across systems.
- Overview, calendar, and insights data do not combine different currencies.
- Renewal dates remain correct across month ends, timezones, and leap years.
- RevenueCat entitlement events are verified, idempotent, observable, and tied to
  the same identity used by the API.
- Every feature claimed by the paywall works and is enforced, or the claim has
  been removed.
- Production CORS, secrets, rate limiting, backups, monitoring, and privacy
  disclosures are configured.
- The OpenAPI contract, mobile typed client, and mock fixtures agree.
- Required unit, integration, migration, and mobile smoke tests pass in CI.

## 20. Open product decisions

These decisions are deliberately not invented by the backend:

1. Which exact capabilities distinguish Free from Pro.
2. Whether paused subscriptions remain a v1 user-facing feature.
3. Whether renewal reminders are server-driven, local-only, or deferred.
4. Whether the app displays multiple currency sections or asks the user to select
   a primary display currency.
5. Whether users can record real historical payments manually.

They should be resolved before implementation reaches Phase 4 because they affect
the API policy, paywall copy, store disclosures, and test plan.
