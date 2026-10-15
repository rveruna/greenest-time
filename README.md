# Greenest Time

[![CI](https://github.com/rveruna/greenest-time/actions/workflows/ci.yml/badge.svg)](https://github.com/rveruna/greenest-time/actions/workflows/ci.yml)

**[Live demo](https://rveruna.github.io/greenest-time/)** (the web build of the same React Native code)

[![A postcode, EH1, switches the forecast to South Scotland; choosing 4 hours moves the outlined cleanest window to 20:00 to 00:00, 84% cleaner than now; Add to calendar confirms the event was downloaded, and the chart below shows the outlined window (recorded with sample forecast data)](docs/demo.gif)](https://rveruna.github.io/greenest-time/)

When is your electricity cleanest? Pick how long your washing machine, dishwasher or EV charger runs for, and the app finds the cleanest window in the next 48 hours for your part of the grid, how long to wait for it, and how much cleaner it is than starting now. Then it reminds you when it's time.

Built with Expo, React Native and TypeScript. Data comes from the free [Carbon Intensity API](https://carbonintensity.org.uk/) (national or regional forecast, no API key).

## What it does

- Finds the cleanest run of 1 to 4 consecutive hours in a half-hourly, 48-hour forecast
- Draws the forecast as an SVG bar chart, coloured by the API's own index, with the best window outlined
- Shows a live countdown ("in 1 h 30 min") that updates without refetching
- **Reminds you.** On a phone, a local notification five minutes before the window opens. On the web, an "Add to calendar" file with the same alert, because a closed browser tab cannot fire a scheduled notification
- **Uses your local grid.** Enter a postcode for your region's forecast (Scotland's grid is often far cleaner than the national average). Only the first half, like EH1, is ever sent
- **Remembers your choices.** Duration and postcode survive closing the app
- Handles loading, error (with retry), unknown-postcode and too-short-forecast states

## Decisions worth a look

- **The maths is a pure function.** `findBestWindow` (`src/lib/window.ts`) is a sliding window over the forecast, with no React or network in it, so it is tested directly. The tests include a lone dip that a naive "lowest slot" approach would pick but a real two-hour run would not, and ties going to the earliest start.
- **Colour is never the only signal.** The chart has a written legend, the card states the numbers, and the chart has a text summary for screen readers.
- **Reduced motion is respected.** The card entrance and the bar growth both switch off with the OS setting, using Reanimated's `useReducedMotion`.
- **Accessible controls.** The duration picker is a radio group with 44pt touch targets and an announced selected state. The result card is a live region, so a change is read out.
- **One feature, two platforms, no pretending.** `src/reminders/` has `index.native.ts` (expo-notifications) and `index.ts` (web calendar file) behind one interface, and Metro picks the right one per platform. The web demo says "Add to calendar", not "Remind me", because that is what it can actually do.
- **Privacy by design.** `outwardCode()` reduces any postcode to its outward half before it is stored or sent. The accessibility audit's postcode scenario also checks the actual request: it types "EH1 1AA" and fails if anything more than `EH1` is sent.
- **Defensive storage.** Saved settings are re-validated field by field on load, so an old or corrupted value falls back to defaults instead of crashing. The first forecast request waits for them, so a saved postcode is never preceded by a wasted national fetch.
- **An API quirk handled.** An unknown postcode comes back as `null` with a 200 status, not an error. It gets its own message and a one-tap way back to the national forecast.
- **Small, honest data layer.** The response is validated (`parseSlots` throws on an unexpected body instead of drawing an empty chart), and requests are aborted on unmount.

## Rules

What the app promises is written down in plain English, as Gherkin feature files that run with the unit tests:

- [`cleanest-window.feature`](src/lib/cleanest-window.feature): the cleanest 1 to 4 hour run, ties, fitting the forecast, and "% cleaner than now"
- [`start-and-reminder.feature`](src/lib/start-and-reminder.feature): "Now is the best time", the countdown, and the five-minute reminder and calendar alert
- [`postcode-and-settings.feature`](src/lib/postcode-and-settings.feature): only the outward postcode is used, and saved settings fall back safely

Each file is agreed behaviour, not a test. If one fails, the code is wrong; the rule is not edited to make a build pass.

The steps call the same pure functions the app uses (no browser, network or rendering), through a `.steps.ts` file next to each feature. `npm test` runs them. To add a case, add a row to an `Examples` table, or a new scenario that reuses existing steps: only the `.feature` file changes. A step with no matching definition fails the run with its text. A scenario tagged `@bug` is shown as skipped, for a rule the code breaks today.

**Checked by breaking it.** Making `findBestWindow` pick the dirtiest window fails 16 steps, sending ties to the latest start fails the 3 tie cases, and a 10-minute reminder fails 4.

## Accessibility

`npm run a11y-audit` builds the web version and runs [axe-core](https://github.com/dequelabs/axe-core) (WCAG 2.0 to 2.2, A and AA rules) in Chromium, in 15 states: loaded (light and dark, phone and desktop, reduced motion, 4 hours selected), the best time being now, a regional forecast, a mistyped postcode, an unknown postcode, a reminder added, loading, and error. It runs in CI and fails the build on any violation. Currently 0.

The audit serves **fixed fake forecast data** instead of calling the real API. That keeps CI from going red when a third-party service is slow or down, and it is what makes the loading and error states testable at all: the request is held open, or failed, on purpose.

**What it found:** the loading spinner was an unnamed `progressbar` on web (axe `aria-progressbar-name`). The visible "Loading the 48-hour forecast…" text is already announced through a live region, so the spinner is now hidden from assistive tech on every platform, including `aria-hidden` on web, where the native-only props are ignored.

**The audit is itself tested.** I broke the app on purpose, one rule at a time:

| Deliberate break                                                              | Caught?                                       |
| ----------------------------------------------------------------------------- | --------------------------------------------- |
| Spinner exposed again (the bug above)                                         | Yes, in both loading scenarios                |
| Chart with no text alternative                                                | Yes, `role-img-alt`                           |
| Low-contrast text in light mode                                               | Yes, only in the light scenarios              |
| Low-contrast text in dark mode                                                | Yes, only in the dark scenarios               |
| Low contrast **only in the error message**                                    | Yes, only in the error scenario               |
| Postcode field with no label                                                  | Yes, `label` (critical)                       |
| Full postcode sent to the API                                                 | Yes, by the audit's request check, not by axe |
| Low-contrast postcode help text                                               | Yes                                           |
| Low contrast **only in the reminder confirmation**, which appears after a tap | Yes, only in the "reminder added" scenario    |

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

## Testing the reminder on a phone

The scheduled notification only exists on iOS and Android, so it is not in the web demo or the CI audit. To try it:

1. `npm start`, then scan the QR code with Expo Go
2. Tap **Remind me at …** and allow notifications
3. The notification arrives five minutes before the window

The scheduling logic (`reminderAt`) and the calendar file (`buildIcs`) are unit tested; the native call itself is not.

## Not done

- Tests cover the logic and the API parsing. There are no component tests, so the UI was checked by hand in a real browser (light, dark, reduced motion, offline) rather than by automated tests.
- `npm audit` reports advisories in Expo's build tooling (Metro, CLI, config plugins). CI shows them but does not fail on them, because they need an Expo SDK upgrade to clear and none of that code ships in the web bundle.
- I have run and browser-tested the web build. The native notification has not been run on a device or simulator by me yet.
