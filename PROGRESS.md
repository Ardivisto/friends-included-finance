# Wedding Guests for Hire progress

The reviewed tracker ledger is the acceptance authority for FG statuses. This file records implementation progress without assigning reviewer verdicts.

| Current IDs | Completed local work | Test result | Evidence sent | Reviewer verdict | Next action |
|---|---|---|---|---|---|
| FG-01–FG-18, FG-33–FG-34 | Repository-connected Vercel project deployed at https://friends-included-finance-topaz.vercel.app/. Google Cloud project and Sheets API created; service account has Editor on the application spreadsheet. Supabase schema, shared rules, website, Telegram webhook, Sheets adapter, durable row positions and delivery queue are in source. | 8/8 local tests pass; deployed page loads, but displays “Supabase is not configured on the server.” No live integration yet. | None | None | User creates Supabase project with database password and Google service-account JSON key; configure server env and test live flow |
| FG-19–FG-28 | Exact Test 1 and Test 2 fixtures in calculation tests | Pure calculation and validation tests pass; actual test records not submitted | None | None | Run both tests through live services after account setup |
| FG-29–FG-32 | Public GitHub repository at https://github.com/Ardivisto/friends-included-finance connected to Vercel; initial website deployed at https://friends-included-finance-topaz.vercel.app/ | Vercel reported successful deployment; page opens, but backend is not yet connected | None | None | Finish integration and both prescribed tests before final publication and course submission |

Latest local verification: 8/8 tests pass, including exact Test 1 and cumulative Test 2 arithmetic, negative API requests, Sheet column mapping, and notification text. Supabase project creation is paused at new database password entry. Google Cloud Terms were accepted, Sheets API enabled, and service-account Editor access granted; JSON key creation is paused for user credential handoff. Vercel deployment succeeded. Telegram Web access is paused because automatic browser review rejected the unidentified current chat; user must navigate to Saved Messages and confirm its header. No live data-flow claim or reviewer verdict has been made.

No FG item is marked approved here. Only the tracker may do so after the reviewer explicitly approves that same ID.
