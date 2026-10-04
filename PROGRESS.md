# Wedding Guests for Hire progress

The reviewed tracker ledger is the acceptance authority for FG statuses. This file records implementation progress without assigning reviewer verdicts.

| Current IDs | Completed local work | Test result | Evidence sent | Reviewer verdict | Next action |
|---|---|---|---|---|---|
| FG-01–FG-18, FG-33–FG-34 | Vercel application source, Supabase schema, shared server rules, website, Telegram webhook, Sheets adapter, durable row positions and delivery queue. Application Google spreadsheet created with Sales and Expenses tabs. | Local checks pass; no live integration yet | None | None | Complete Supabase and Google Cloud setup, connect Vercel, deploy, collect real evidence |
| FG-19–FG-28 | Exact Test 1 and Test 2 fixtures in calculation tests | Pure calculation and validation tests pass; actual test records not submitted | None | None | Run both tests through live services after account setup |
| FG-29–FG-32 | Public GitHub repository created and source pushed at https://github.com/Ardivisto/friends-included-finance | Repository files verified; Vercel app not yet installed, site not deployed or submitted | None | None | Connect Vercel, verify instructor access, submit one course URL |

Latest local verification: 8/8 tests pass, including exact Test 1 and cumulative Test 2 arithmetic, negative API requests, Sheet column mapping, and notification text. Supabase project creation is paused at new password entry. Google Cloud is paused at first-use Terms acceptance. Vercel is paused at GitHub app installation. These are external account actions; no live service claims or reviewer verdicts have been made.

No FG item is marked approved here. Only the tracker may do so after the reviewer explicitly approves that same ID.
