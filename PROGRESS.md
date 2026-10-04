# Wedding Guests for Hire — progress log

## Current item: FG-30

- **Completed:** Published commit `ba5a456` to GitHub `main`; Vercel Production is Ready. The public page now shows the user-provided name WDH and distinct Test 1/Test 2 snapshots computed from their saved reference sets. The live dashboard still uses all saved records. The temporary production probe page has been removed.
- **Tests:** 9/9 local tests pass; server/client JavaScript syntax checks pass. Live public page confirms Test 1 company result €2,400.00, Test 2 €3,930.00, and current company result €3,915.04 with later records. E09 and S07 remain visible. Evidence: `evidence/fg30-public-page-live-2026-10-04.md`.
- **Reviewer/tracker:** FG-11 and FG-12 are explicitly APPROVED and recorded. FG-29 is APPROVED in the tracker chat. Current tracker chat count: 24/34 APPROVED, 7 IN PROGRESS, FG-30 CHANGES REQUIRED, FG-31/FG-32 TODO. The shared acceptance ledger file still reads 23/34 because its FG-29 file update was deferred after an automatic-review usage limit; no local edit was made to that external ledger.
- **Evidence handoff:** FG-30 updated deployment evidence is ready; next action is send it to the independent reviewer and request exactly one verdict.

## Live application state

- Public site: https://friends-included-finance-topaz.vercel.app/
- Public repository: https://github.com/Ardivisto/friends-included-finance
- Application spreadsheet: https://docs.google.com/spreadsheets/d/1UCtGwWuBZiRKdSnXFMP6b6LB1v97u4fJ-HEbuAgty5s/edit
- Test 1 and Test 2 transaction records remain saved. Additional fictional S06/S07 and E08/E09 change current dashboard totals naturally; the historical test snapshots are computed from their original reference sets.
- Current live totals: Project A €2,050.04; Project B €2,225.00; company €3,915.04; earned Richard €140.00, Anastasia €180.01, Jean-Claude €215.00.
- Telegram UI access remains paused after the browser accessibility output exposed BotFather content. The bot is configured and actual WDH notifications for the prescribed tests are recorded in the evidence files. No Telegram chat was opened during this pass.

## Evidence files

- `evidence/test1-live-2026-10-04.md` — prescribed Test 1 through WDH bot and website.
- `evidence/test2-live-2026-10-04.md` — prescribed cumulative Test 2.
- `evidence/fg11-fg12-live-2026-10-04.md` — S07 rounding and E09 allocation.
- `evidence/fg26-live-2026-10-04.md` — denied requests and repeat decisions, with authorized log corroboration.
- `evidence/fg27-28-34-live-2026-10-04.md` — retry evidence limits and dynamic totals.
- `evidence/fg30-public-page-live-2026-10-04.md` — deployed public page, historical test snapshots, and current dashboard.
