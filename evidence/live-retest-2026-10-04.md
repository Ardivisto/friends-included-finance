# Live retest notes — 2026-10-04

This is partial evidence only. It does not establish an FG approval or reviewer verdict.

## Deployment and persistence baseline

- Production site: https://friends-included-finance-topaz.vercel.app/ . Vercel marks the production deployment Ready, from GitHub `main`, commit `4f2181a`.
- The deployed dashboard initially showed all company and project totals as €0.00, no saved sales or expenses, no delivery jobs, and no Telegram links for the five employees.
- Vercel Production currently has these variables by name only: `PUBLIC_BOT_USERNAME`, `PUBLIC_SHEET_URL`, `PUBLIC_REPO_URL`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`. No Google Sheets or Telegram server variables are configured. Secret values were not revealed.

## FG-10 validation retests through the deployed website

Using the site's role selector and transaction form:

| Request | Visible server response | Persistence view |
|---|---|---|
| Kevin expense, amount `0`, fictional reference `FG10-ZERO-LIVE-01` | `Amount must be greater than zero.` | The form stayed on the page and the submissions list remained empty. |
| Kevin expense, amount `-1` | `Amount must be a positive euro amount with at most two decimal places.` | The submissions list remained empty. |
| Richard sale, amount `100`, proposed split `60/30/20`, fictional reference `FG10-SPLIT-LIVE-01` | `Commission percentages must total 100%.` | The submissions list remained empty. |

These checks used fictional validation data and did not create records. They provide live application-level rejection evidence, but not a captured HTTP request/response trace or a persisted before/after database query. Missing amount, positive sale/expense formatting, and commission earned results still need live completion.

## Telegram and Sheets integration

- Sent `/id` in the project bot chat `@WDH_project_bot`; no bot response appeared. The deployed manager view still lists every employee as unlinked. No actual bot transaction or return notification was recorded.
- Google Cloud confirms the `Friends Included Sheets Writer` service account is enabled. Its Keys tab showed no rows before creation. With the user's approval, a new JSON private key was created and Google reported that it saved `elite-outpost-510612-u6-efecf4b54239.json` to the computer.
- The downloaded JSON file is not present in the workspace or the checked Windows Downloads/Desktop locations, so its contents were not read or transmitted. Vercel has no Google private-key/email/sheet-ID variables, and no actual Sheet write was attempted.

## Test result and remaining FG status

- Local Node test suite: 8/8 pass (including `test/api.test.js` and `test/domain.test.js`).
- Prior live direct API requests from PowerShell could not be made because the Windows workspace denied outbound sockets. The browser form above successfully reached the deployed handler for invalid requests.
- FG-02, FG-06, FG-07, FG-10 retain the reviewer's prior `UNVERIFIED` verdicts and are not approved. Total approved remains 0/34.
- To continue: the downloaded Google key needs to be copied into the workspace at `google-service-account.json` so it can be kept out of Git and loaded securely into Vercel; Telegram token/webhook setup and account linking remain incomplete; then run the real Sheet/bot flow and full tests, capture database/Sheet/bot evidence, and request fresh reviewer decisions.
