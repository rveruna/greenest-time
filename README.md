# Greenest Time

[![CI](https://github.com/rveruna/greenest-time/actions/workflows/ci.yml/badge.svg)](https://github.com/rveruna/greenest-time/actions/workflows/ci.yml)

**[Live demo](https://rveruna.github.io/greenest-time/)** (the web build of the same React Native code)

When is Britain's electricity cleanest? Pick how long your washing machine, dishwasher or EV charger runs for, and the app finds the cleanest window in the next 48 hours, how long to wait for it, and how much cleaner it is than starting now.

Built with Expo, React Native and TypeScript. Data comes from the free [Carbon Intensity API](https://carbonintensity.org.uk/) (national forecast, no API key).

## What it does

- Finds the cleanest run of 1 to 4 consecutive hours in a half-hourly, 48-hour forecast
- Draws the forecast as an SVG bar chart, coloured by the API's own index, with the best window outlined
- Shows a live countdown ("in 1 h 30 min") that updates without refetching
- Handles loading, error (with retry) and too-short-forecast states

## Decisions worth a look

- **The maths is a pure function.** `findBestWindow` (`src/lib/window.ts`) is a sliding window over the forecast, with no React or network in it, so it is tested directly. The tests include a lone dip that a naive "lowest slot" approach would pick but a real two-hour run would not, and ties going to the earliest start.
- **Colour is never the only signal.** The chart has a written legend, the card states the numbers, and the chart has a text summary for screen readers.
- **Reduced motion is respected.** The card entrance and the bar growth both switch off with the OS setting, using Reanimated's `useReducedMotion`.
- **Accessible controls.** The duration picker is a radio group with 44pt touch targets and an announced selected state. The result card is a live region, so a change is read out.
- **Small, honest data layer.** The response is validated (`parseSlots` throws on an unexpected body instead of drawing an empty chart), and requests are aborted on unmount.

## Accessibility

`npm run a11y-audit` builds the web version and runs [axe-core](https://github.com/dequelabs/axe-core) (WCAG 2.0 to 2.2, A and AA rules) in Chromium, in 11 states: loaded (light and dark, phone and desktop, reduced motion, 4 hours selected), the best time being now, loading, and error. It runs in CI and fails the build on any violation. Currently 0.

The audit serves **fixed fake forecast data** instead of calling the real API. That keeps CI from going red when a third-party service is slow or down, and it is what makes the loading and error states testable at all: the request is held open, or failed, on purpose.

**What it found:** the loading spinner was an unnamed `progressbar` on web (axe `aria-progressbar-name`). The visible "Loading the 48-hour forecast…" text is already announced through a live region, so the spinner is now hidden from assistive tech on every platform, including `aria-hidden` on web, where the native-only props are ignored.

**The audit is itself tested.** I broke the app on purpose, one rule at a time:

| Deliberate break                           | Caught?                          |
| ------------------------------------------ | -------------------------------- |
| Spinner exposed again (the bug above)      | Yes, in both loading scenarios   |
| Chart with no text alternative             | Yes, `role-img-alt`              |
| Low-contrast text in light mode            | Yes, only in the light scenarios |
| Low-contrast text in dark mode             | Yes, only in the dark scenarios  |
| Low contrast **only in the error message** | Yes, only in the error scenario  |

**Not tested:** VoiceOver or TalkBack on a real device, which is where a React Native app is really used. axe checks the web build only. Automated checks are a floor, not a guarantee.

## Run it

```bash
npm install
npm start          # then press i, a or w, or scan the QR code with Expo Go
npm run web        # browser
npm test
npm run lint
npm run typecheck
npm run build      # static web export to dist/
npm run a11y-audit # builds, then runs axe in Chromium with fake API data
```

## Not done

- National data only. The API also has regional forecasts by postcode, which would be the natural next step.
- Tests cover the logic and the API parsing. There are no component tests, so the UI was checked by hand in a real browser (light, dark, reduced motion, offline) rather than by automated tests.
- `npm audit` reports advisories in Expo's build tooling (Metro, CLI, config plugins). CI shows them but does not fail on them, because they need an Expo SDK upgrade to clear and none of that code ships in the web bundle.
- I have run the web build. The same code targets iOS and Android through Expo, but I have not tested it on a device or simulator.
