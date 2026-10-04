# Live preflight, 2026-10-04 (Europe/Riga)

This is partial evidence only. It does not establish a completed FG item or a reviewer verdict.

- GitHub main: `cf24e5d` at https://github.com/Ardivisto/friends-included-finance.
- Production website: https://friends-included-finance-topaz.vercel.app/ . It displayed both project dashboards and company totals at €0.00, five employees with no Telegram links, and links to the application spreadsheet and repository.
- Supabase SQL Editor returned: employees 5; sales 0; expenses 0; deliveries 0; sheet positions 0. The production dashboard read the same clean state.
- Anonymous request to the application spreadsheet's CSV export returned HTTP 200 with `text/csv`; the empty sheet had 0 bytes. Google Sheets UI showed link viewers as Viewer and the application service account as Editor.
- Live POST `/api/sales/approve` with demonstration role `richard` and S01 returned HTTP 403: `{"error":"Only Svetlana can approve sales."}`.
- Live POST `/api/sales` with role `kevin` returned HTTP 403: `{"error":"Only salespeople can submit sales."}`.
- Live POST `/api/sales` with role `richard` and 60/30/20 returned HTTP 400: `{"error":"Commission percentages must total 100%."}`.
- Live POST `/api/expenses` with role `kevin` and amount `0` returned HTTP 400: `{"error":"Amount must be greater than zero."}`.
- A following `GET /api/state?role=svetlana` still showed sales 0, expenses 0, delivery jobs 0, and company result 0 cents. Thus those denied actions changed no financial data.

Google Sheets writes and Telegram messages remain unverified. The prescribed S01/E01 bot submissions and both full tests have not begun.
