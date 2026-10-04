# FG-30 public page verification — 2026-10-04

## Published result

- Public page: https://friends-included-finance-topaz.vercel.app/
- Vercel Production deployment: commit `ba5a456`, status Ready; the deployment is connected to the GitHub `main` branch.
- The public header shows the user-provided name `WDH`.
- The live manager dashboard calculates from all saved records: Project A €2,050.04; Project B €2,225.00; Company €3,915.04. These totals include later S06/S07 and E08/E09.
- The separately labelled completed Test 1 snapshot uses S01–S02 and E01–E03 and displays Project A €700.00, Project B €1,800.00, Company €2,400.00, with earned commission Richard €90.00, Anastasia €110.00, and Jean-Claude €100.00.
- The separately labelled completed Test 2 snapshot uses S01–S05 and E01–E07 and displays Project A €2,050.00, Project B €2,180.00, Company €3,930.00, with earned commission Richard €140.00, Anastasia €175.00, and Jean-Claude €215.00.
- The live dashboard and both historical snapshots are computed from the stored Supabase records by reference. S06/S07/E08/E09 change current totals and remain visible in the records; they do not alter the two prescribed test snapshots.

## Page controls and access

The public page includes the five-role “Demonstration role” selector, sales and expense forms, manager decisions and delivery retries, the live financial dashboard, Telegram bot link, application spreadsheet link, source repository link, and entry/approval instructions. The production page loads without a Vercel sign-in prompt. The instructor can use the demonstration role to inspect the saved homework records and the public forms; application Sheet sharing and GitHub repository accessibility are separately covered by approved FG-33 and FG-29 evidence.

## Reproduction

1. Open the public page above and verify `Prepared by WDH` in the header.
2. Select Svetlana de Monte Carlo · Manager. Compare the live dashboard with both completed test cards.
3. Verify Test 1 displays €2,400.00 and Test 2 €3,930.00, while the live company result is €3,915.04 after later transactions.
4. Select Sales or Expenses under Transactions & decisions and verify the original Test 1/Test 2 rows and later S06/S07/E08/E09 records remain visible.
5. Switch the Demonstration role to an employee and verify their own saved submissions and statuses.

The values above came from the published page after commit `ba5a456` was Ready. No credential or private Telegram identifier is included.
