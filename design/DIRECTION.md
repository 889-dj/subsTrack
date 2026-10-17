# Direction: "Quiet Ledger" (refine, keep identity)

Keep the dark cosmic palette, Geist / Geist Mono and the violet→cyan accent pair. Change hierarchy, legibility,
feedback and the add flow. No new dependencies.

## Tokens
Unchanged (`src/theme.ts`). Additions are component-level only: warning tone for "due soon" chips, 11px minimum
for any label, tabular figures everywhere a number updates.

## Per screen
| Screen | Focal element | Change |
|---|---|---|
| Overview | Monthly total in hero | Hero metrics were 8.5/13px; raised to 10.5/15px, delta shown as `▲ 4.2% vs last month` in plain words. Cards get spring press feedback and a short staggered entrance. |
| Subscriptions | The next charge | Rows gain a due-soon chip (Today / Tomorrow / In Nd, warning tone for <= 3 days). List grouped by "This week / Later this month / Later". |
| Add | Name + amount | Popular-services quick-pick row prefilling name, category, cycle (new subscriptions only). Errors clear as the user types. Currency symbol shown beside the amount. Renewal date shows relative label ("in 12 days"). |
| Detail | Countdown | Large "Renews in N days" card with amount above the key/value list; pause/remove unchanged. |

## Motion
- Press: spring to 0.97, damping 18 / stiffness 320 (touch feedback should land under ~100 ms).
- List enter: FadeInDown 280 ms, stagger 40 ms, capped at 8 items (no random delays on finance lists).
- Count-up: 800 ms ease-out cubic (was 1200 ms; research said avoid 2 s).
- Reduce motion: press scale and entering animations are skipped.

## Research that drove this (per-source status in the handoff)
- Quick-pick of popular services with custom fallback — MacStories Bobby review https://www.macstories.net/reviews/bobby-subscription-tracking-made-easy/
- Labels above fields, live inline validation, editable smart defaults — https://baymard.com/learn/input-fields
- Total-first home + due-date sort — https://apps.apple.com/app/id6749521313
- Motion defaults — https://docs.swmansion.com/react-native-reanimated/docs/animations/withSpring/
- Honest cancellation copy (pain: charges continue after "cancel") — Trustpilot sample https://www.trustpilot.com/review/rocketmoney.com?stars=1. The detail screen already says pausing is not cancelling; kept and made more prominent.

## Anti-patterns
Dead buttons, decorative gradients beyond hero/CTA, ellipsised numerals, paywalled access to the user's own list.

## Pass 2 (bolder)
- **Overview hero**: gradient card (`heroGradient` token) with two soft glows, count-up total, delta as a pill ("▲ 4.2% vs last month"), a yearly/active subline, and a "Next 7 days" panel (amount + charge count, headline currency only). The old 3-column metric ledger was folded into the subline and panel.
- **Detail**: `RenewalRing` — arc fills as the charge approaches (monthly = 30-day cycle, yearly = 365), warning tone at <= 3 days, 700 ms ease-out fill, instant under reduce-motion.
- **Everywhere**: `PressableScale` on buttons, chips and rows; focus ring on text fields; staggered entrances on Overview, Subscriptions, Calendar and Insights (40 ms step, 8 items max).
- **Known web-only console noise**: react-native-svg's PieChart in `CategoryBreakdown` logs "Unknown event handler property onResponder*" on web. Harmless; native is unaffected.

## Pass 3 (research-driven polish)
Research this round (per-source status): Dribbble search + top shot — loaded in the rendered browser; NN/g (touch targets, empty states, user control and freedom, dashboards-preattentive) — loaded; WCAG 2.2 contrast-minimum — loaded; Expo Haptics, Reanimated withSpring/entering, Gesture Handler Swipeable + usePanGesture — loaded; Apple HIG (typography, haptics), Material elevation, Smashing, uxdesign.cc — title only/404/403; Mobbin — needs paid plan; App Store pages for Copilot/Monarch/Cash App — 404 or JS-blocked.

| Evidence | Decision |
|---|---|
| Things 3 swipe-to-act (reviews); Gesture Handler `overshootFriction` 8, `rightThreshold` 40 | `SwipeableRow`: swipe-left Pause/Resume + Remove on Subscriptions rows |
| NN/g user control and freedom: undo for recoverable changes, labelled exits | `ToastProvider` + `useUndoableActions`: optimistic remove with Undo snackbar (6 s, DELETE fires on expiry); explicit Cancel on Add |
| NN/g dashboards-preattentive: bar length over donut/radial | Category donut → segmented bar (also removes the web `onResponder*` console noise) |
| NN/g touch targets: ~1 cm minimum | Chips 36 → 40pt, toast action 40pt, swipe actions 84pt wide |
| NN/g empty states: never blank while loading | Existing skeleton-before-empty behaviour kept |
| Dribbble top shot (heartbeat, 336k views): "+N" badge for same-day renewals, price chip beside name, "remind me" row | Grouped-renewal card already matches; reminders left out of scope |
| Rocket Money (Time review): "crowded at first" | Overview kept to hero + coming up + forecast |

Not done: haptics (Expo docs: Light on swipe threshold, Medium on commit, Success after save) — `expo-haptics` is not installed and needs a native rebuild.

## Pass 4 (panelui components)
- **Forecast**: `BarChart` is now `stacked`, one series per category (top 4 + "Other"), with a legend. Needs the backend's new additive `byCategory` on each spend-trend point (`subsTrack-backend/src/analytics.ts`, covered by a new test); the mock mirrors it and the app tolerates its absence.
- **Overview hero**: compact `LineChart` sparkline of the next months inside the gradient hero (white on gradient — `Kpi` itself can't be used there because its text/surface colours come from panelui's theme, not the hero's).
- **Insights run-rate**: panelui `Kpi` (value, trend badge with `goodDirection="down"` so a rise reads as bad, sparkline), drawn with `surface={false}` inside the app's own card so it matches the other cards.
- **Detail**: `Timeline` for the next renewals, soonest charge active.
- **Toast + Swipe**: now panelui's. `useToast()` keeps its old shape and wraps `toast.show` at the top edge (the bottom belongs to the tab bar); panelui's toast has no expiry callback so undo-delete keeps its own timer. `SwipeableRow` wraps `Swipe` + `Swipe.Group`.
- Not used: `Calendar` (a picker; ours shows logos/dots), `RingChart`/`Meter` (our `RenewalRing` fits), `WaterfallChart` (needs history the backend does not keep), budget rings (new feature).
