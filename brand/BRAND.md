# subsTrack brand guide

## The mark: the Panther
A black panther head with cyan eyes. Calm, watchful, premium. It is both the app icon and the in-app mascot.
(It has no name yet; pick one and add it here.)

## Palette (matches `src/theme.ts`)
| Role | Hex |
|---|---|
| Panther ink | `#0E1330` |
| Tile indigo (brand) | `#4457E6`, gradient to `#2F3DB8` |
| Eyes (cyan) | `#3DD9E8` |
| Lavender (nose, mascot outline) | `#C9CFFF` |
| Dark-mode head | `#252E80` on `#0A0E26` |
| Alert eyes (amber) | `#FFB547` |

## Files
- Source of truth: `brand/panther.mjs` generates every SVG in `brand/panther/`. Edit shapes there, then run `node brand/panther.mjs`.
- Shipped PNGs (in `assets/`): `icon.png` (iOS light, RGB, no alpha), `icon-dark.png`, `icon-tinted.png`, `android-icon-foreground/background/monochrome.png`, `favicon.png`, `splash-icon.png`.
- Mascot poses: `assets/mascot/panther-{neutral,alert,happy,sleepy}.{svg,png}`.
- Preview of everything: `brand/panther/preview-sheet.png`. Rejected ideas: `brand/explorations/`.
- To re-export PNGs after editing: render each SVG at 1024px (`logo-mascot-pipeline/scripts/render.mjs`), then flatten `icon.png` to RGB.

## Usage
- Minimum size 24px. Clear space around the mark: one ear width.
- Don't recolour the panther, add text inside the icon, stretch it, or put it on a busy background.
- Mascot poses carry a light outline so they work on both light and dark screens.

## Mascot poses and voice
Calm, brief, never shaming or sarcastic.
| Pose | Use | Example line |
|---|---|---|
| Neutral | Overview, general | "All quiet. Nothing renews this week." |
| Alert (amber eyes) | Renewal within 3 days | "Heads up: Netflix renews tomorrow." |
| Happy | Saved money, paused a subscription | "Paused. That's $9.99 a month back." |
| Sleepy | Empty states | "Nothing here yet. Add your first subscription." |

Alert uses amber, not red: red is reserved in the UI for money going out.

## Before you ship
- **Name:** "SubsTrack", "Substrack" and "Subtrack" already appear as subscription-tracker listings (App Store, Android, Product Hunt), per search snippets that were not verified in the stores. Check before publishing.
- **iOS icons:** `ios/` is generated and untracked, so run `npx expo prebuild` (or a new EAS build) for the new icon to appear. Icons can't be checked in Expo Go.
- Not verified on a physical device home screen.
