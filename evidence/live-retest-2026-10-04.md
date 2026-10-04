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

## Production retest update — 2026-10-04, 19:16 EEST

The previous notes above are historical; these live checks supersede the earlier statements that there were no saved transactions and no Google-related Vercel variables.

- Production is Ready on commit `765cf2f` (`Improve live validation feedback`). The GitHub repository is connected to Vercel.
- I exercised the deployed transaction forms with fictional values. Vercel runtime logs show `POST /api/expenses` 400 for zero and negative amounts, `POST /api/sales` 400 for an invalid commission sum, `POST /api/sales` 400 for a missing amount, valid positive `POST /api/expenses` and `POST /api/sales` responses of 201, and a duplicate sales reference response of 409. The interface displayed the matching validation text, and the old validation alert cleared after correcting an input.
- Supabase Table Editor visibly contains two pending website sales: `FG10-SPLIT-LIVE-01` and `FG10-MISSING-LIVE-01`, each 10,000 cents (€100.00), both with proposed split `[50,30,20]`, no final split, and no linked Telegram chat. The expense submission `FG10-EXP-VALID-01` is €20.00 and awaiting allocation. Thus these positive tests prove persistence and pending state, but they are practice records, not prescribed Test 1 or Test 2 data.
- The manager dashboard consequently shows €20.00 awaiting allocation and company result -€20.00; approved income, commissions, project results, and earned commission remain €0.00. Sales and expense views mark Sheet synchronization failed because the server has no working Sheets private key configuration yet.
- Vercel Production now has the server-side service-account email and spreadsheet ID variable names configured. Google Cloud reports that the approved JSON key was downloaded as `elite-outpost-510612-u6-efecf4b54239.json`, but the browser download is not available in the workspace. No private key was read or copied to chat, GitHub, or public site. No successful Sheet row has been written.
- Telegram Web shows the project bot `@WDH_project_bot` and an unanswered `/id` command. A bot token exists in the account's BotFather conversation, but it has not been transferred into Vercel and no webhook or real Telegram transaction/return notification has been verified. No unrelated Telegram conversations were used for the assignment.
- The progress log and deliverable ZIP have been refreshed. Local tests pass 8/8. Reviewer approval count remains 0/34; prior UNVERIFIED decisions for FG-02, FG-06, FG-07, and FG-10 have not been promoted based on implementation tests.

### Evidence mapping and remaining gaps

- FG-10: live Vercel 400/201/409 traces, form responses, persisted valid examples, and current totals. Still needs the DOCX's full exact financial-rule coverage and clean prescribed test run; practice rows must be cleared first.
- FG-02: the two sales and one expense demonstrate persisted proposals, pending statuses, amounts, source, and timestamps in Supabase. Missing: final manager decisions, actual bot-linked origin IDs, successful notification records, a working Sheet sync, and duplicate after-reload evidence for all relevant transaction types.
- FG-06: this run has not produced a new complete role walkthrough or captured live 403 traces for the five role views.
- FG-07: Sheet and Vercel deployment are present, but service-account credential handoff is incomplete and actual Sheets write/retry evidence is missing.
- FG-19–FG-28: neither prescribed Test 1 nor Test 2 has been completed. Do not treat these FG10 practice records as either prescribed test.

## FG-10 targeted reviewer retest — 2026-10-04, 19:27 EEST

- Submitted a fictional Richard sale amount `1.001`; the form returned “Amount must be a positive euro amount with at most two decimal places.” Vercel Logs show a production `POST /api/sales` response 400 at 19:25:03 GMT+3 (request `6z7tc-1791131103659-efc6db67e254`).
- Submitted a split with Richard `101`, Anastasia `0`, Jean-Claude `-1` (sum 100); the form showed “Value must be less than or equal to 100.” The Vercel production log contains a `POST /api/sales` 400 at 19:22:48 GMT+3 (request `pj8m5-1791130968431-9fd06ac2cecb`).
- The invalid attempts added no transactions: after refresh the manager still saw exactly two sales (`FG10-SPLIT-LIVE-01`, `FG10-MISSING-LIVE-01`) and one expense (`FG10-EXP-VALID-01`); both failed requests had 400 responses.
- As Svetlana, approved `FG10-SPLIT-LIVE-01` with its original proposed split `[50,30,20]`. Production returned success, and after a full page reload Supabase-backed UI showed it still approved, original proposal retained, final split `[50,30,20]`, and earned pool €10.00. Manager dashboard showed €100.00 approved income, €10.00 commission expense, €90.00 project A result; €5.00 / €3.00 / €2.00 earned by Richard / Anastasia / Jean-Claude; the pending €20.00 expense remained awaiting allocation, and company result was €70.00. This is a fictional practice decision, not prescribed Test 1.
- The entry form says sale services are delivered and paid and that approval is internal. Neither the sale record nor dashboard adds tax/VAT; the €100.00 sale contributes €100.00 income and the separate 10% €10.00 commission expense. The reviewer should assess this against DOCX wording.
- The same transaction has a Telegram approval delivery record marked `no_recipient`; Sheets deliveries remain failed with “Google Sheets is not configured on the server.” This confirms failure visibility, not successful notification or Sheet synchronization.

Reviewer’s preceding decision for FG-10 was UNVERIFIED. This additional test evidence was resubmitted to the reviewer for a fresh single verdict; the tracker received the same evidence and verdict after reviewer completion. No item status is changed by this evidence alone.

## FG-10 deployed-server boundary retest — 2026-10-04, 19:34 EEST

The reviewer found that the previous 101% attempt had been blocked by browser-side limits. To test the backend rather than browser validation, commit `23eb687` removed only the `min=0`/`max=100` attributes from the three commission inputs; the shared server validator remains responsible for enforcement. Production deployment `dpl_3yhbS9DPTeaaKXmLhgGGsDoRyEw6` is Ready, branch `main`, commit `23eb687`.

At the production form, as Richard, submitted fictional sale ref `FG10-SERVER-RANGE-02`, amount €100, shares `101 / 0 / -1` (sum 100). The deployed form displayed `Richard Darling must be a whole percentage from 0 to 100.` Vercel Logs show the actual production POST `/api/sales` completed HTTP 400 at 19:33:48 GMT+3, request `vfx99-1791131628799-bddbeaf95b01`, routed to `/api/index.js` in production. After page reload, the manager still saw exactly two sales (one approved practice record and one pending practice record) and one expense. The rejected reference did not appear.

This closes the reviewer’s remaining stated FG-10 server-boundary gap with concrete live evidence. The reviewer independently returned `APPROVED` for FG-10 after reproducing the 101/0/-1 server rejection and unchanged totals. The tracker recorded FG-10 `APPROVED`; current total is 1/34. Google Sheets, Telegram, role walkthrough, and prescribed Test 1/Test 2 gaps remain separate items.

## FG-06 production role and denial retest — 2026-10-04, 19:44 EEST

On the deployed demonstration-role selector, Richard sees his two fictional sales with approved/pending statuses; Anastasia and Jean-Claude each see “No records for this view yet”; Kevin’s Expenses tab shows his own €20.00 expense as awaiting allocation; Svetlana’s manager view sees both sales and the expense, with corresponding records and totals. The role selector is labeled “Demonstration role”.

To capture denied backend responses independently of hidden buttons, a temporary no-secret test page was deployed in commit `35425f1` at `/authorization-probe.html`; it sent only fictional denied requests and is being removed immediately after these checks. Results:

- Kevin submitted fictional sale `FG06-DENIED-SALE-01`: the page showed HTTP 403 and `Only salespeople can submit sales.` Vercel trace `kgk6v-1791132247444-fd496ef617ef`, production `POST /api/sales`, 19:44:07 GMT+3.
- Richard attempted to approve the existing pending practice sale: the page showed HTTP 403 and `Only Svetlana can approve sales.` Vercel trace `x46fj-1791132257154-8d2fa5bec9e4`, production `POST /api/sales/approve`, 19:44:17 GMT+3.
- Both requests were denied before persistence. After a manager refresh, two sales and one expense remain with unchanged totals. The denied sale reference is absent.

The reviewer initially returned `UNVERIFIED` because it could not access the request traces after the temporary page was removed. I reopened the page on Ready production commit `7472c2e` at the reviewer’s request. The reviewer then independently clicked both controls, observed both HTTP 403 responses, refreshed the manager view, and confirmed two sales, one expense, and unchanged €70.00 company result. It returned `APPROVED` for FG-06; the tracker recorded the same-ID approval. Current total: 2/34 (FG-06 and FG-10). The temporary page is being removed again after the completed reviewer check.

Follow-up cleanup: the authorization probe was removed from the production source after reviewer verification. Deployment removal and a production 404 check are the remaining cleanup checks; the probe is not part of the deliverable.
