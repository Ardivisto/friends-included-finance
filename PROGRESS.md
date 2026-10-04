# Wedding Guests for Hire — progress log

## Current item: FG-30

- **Completed this pass:** Added manager-only Test 1/Test 2 result snapshots calculated from the original saved references. They remain separate from the live dashboard, which includes all later transactions. Set Vercel Production `PUBLIC_OWNER_NAME` to the exact user-provided value `WDH`. Removed the temporary production probe page after independent review.
- **Test result:** Local suite passes 9/9; API and browser JavaScript syntax checks pass. Historical snapshot regression checks verify Test 1 company result €2,400 and Test 2 €3,930 even with later S06/S07/E08/E09 records in the same ledger.
- **Evidence:** FG-11/FG-12 evidence in `evidence/fg11-fg12-live-2026-10-04.md`; both reviewer verdicts APPROVED and tracker recorded. FG-29 reviewer verdict APPROVED, recorded in tracker chat. FG-30 prior verdict CHANGES REQUIRED; updated site awaits deployment and review.
- **Tracker state:** Tracker chat reports 24/34 APPROVED; 7 IN PROGRESS; FG-30 CHANGES REQUIRED; FG-31/FG-32 TODO. The external ledger file currently shows 23/34 because its follow-up FG-29 update hit the review usage limit; tracker has said the file write is deferred. Do not claim an unrecorded ledger-file change.
- **Next action:** Deploy the page update, verify public name and calculated snapshots, then submit FG-30 evidence and reproduction steps for exactly one reviewer verdict. Continue FG-02/04/05/17/18/27/31/32/34 after this deployment.

## Live application state

- Main site: https://friends-included-finance-topaz.vercel.app/
- Public repository: https://github.com/Ardivisto/friends-included-finance
- Application spreadsheet: https://docs.google.com/spreadsheets/d/1UCtGwWuBZiRKdSnXFMP6b6LB1v97u4fJ-HEbuAgty5s/edit
- Test 1/Test 2 original records remain saved. Additional fictional S06/S07 and E08/E09 change only the live totals; the dashboard derives those from the full transaction ledger.
- Current verified totals before the new display-only code change: Project A €2,050.04; Project B €2,225.00; company €3,915.04; earned Richard €140.00, Anastasia €180.01, Jean-Claude €215.00.
- Telegram UI access is paused after browser accessibility output exposed BotFather content. The bot itself remains configured and prior actual WDH messages are evidenced in the Test 1/2 records. No Telegram chat was opened during this pass.

## Evidence files

- `evidence/test1-live-2026-10-04.md` — prescribed Test 1 via WDH bot and website.
- `evidence/test2-live-2026-10-04.md` — prescribed cumulative Test 2.
- `evidence/fg26-live-2026-10-04.md` — denied requests and repeated decisions, with authorized log corroboration.
- `evidence/fg27-28-34-live-2026-10-04.md` — retry evidence limits, delivery outcomes and changing totals.
- `evidence/fg11-fg12-live-2026-10-04.md` — S07 tie rounding and E09 corrected allocation.
