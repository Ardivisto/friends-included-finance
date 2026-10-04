# Friends Included finance desk

Day 4 Wedding Guests for Hire homework. This is a Vercel Node application with a static website, Supabase source records, a Telegram webhook, and an automatically updated Google Sheets copy. The application uses fixed server-side rules and no AI API.

## Architecture

```text
Telegram private chat ── webhook ──┐
                                   ├─ Vercel API ─ Supabase RPC + tables ─ dashboard
Website demonstration role ────────┘                   │
                                                      └─ delivery queue ─ Google Sheets / Telegram sendMessage
```

Both entry channels call `submitSale` or `submitExpense` in `api/index.js`. The functions validate through `lib/domain.js`, then use the same Supabase RPCs. Supabase stores proposals and final decisions separately. The dashboard computes totals from persisted records. Sheets is a view copy; edits to Sheets are never read back. Delivery records contain only synchronization and notification state, independent of financial status.

The website's role selector is intentionally a demonstration identity selector as prescribed by the assignment. It is not authentication for production use with real financial data. Server routes check the selected role, so a non-manager decision request is denied even if manually sent.

## Setup

1. Create a free Supabase project. Run [`supabase/schema.sql`](supabase/schema.sql) in its SQL editor. The script enables RLS on tables, with no client policies, and reserves RPC execution for the service role.
2. Create a Google Cloud project, enable the Google Sheets API, and create a service account. Create a spreadsheet and share it with the service account email as **Editor**. Give the instructor **Viewer** access. The backend creates `Sales` and `Expenses` tabs on first sync.
3. Create a Telegram bot with BotFather, start it in a private chat, and configure a webhook at `https://YOUR-VERCEL-URL/api/telegram` with an `X-Telegram-Bot-Api-Secret-Token` value matching `TELEGRAM_WEBHOOK_SECRET`. You can use [`scripts/set-webhook.js`](scripts/set-webhook.js) from a local shell with environment variables set; it prints no token.
4. Add the variables in [`.env.example`](.env.example) to Vercel **server-side** environment settings. Never commit real values. Set the public display name and the three public links.
5. Connect this GitHub repository to Vercel and deploy. Check `/api/state?role=svetlana`, then submit a temporary transaction through the bot, confirm it appears on the site and in Sheets, and clear the temporary records before Test 1.

`CRON_SECRET` protects the daily recovery job. Vercel Hobby supports daily crons; the website also offers an immediate retry for a failed delivery. The normal submission and decision requests attempt delivery immediately.

## Telegram grammar

```text
/id
/sale S01 | Olivia Rose | A | One proud uncle and an emotional grandmother | 1000 | 50/30/20
/expense E01 | Rented suit and fake pearl necklace for the relatives | 120 | Materials | A
```

`/id` reports the Telegram user ID and private chat ID. In the website, select Svetlana and link these IDs to one employee. Relinking preserves the submitting employee and original destination stored on earlier bot records.

## Test and evidence status

Run `npm test` or `node --test test/*.test.js` and `npm run check`. The live dashboard calculates from every saved transaction. The manager page also shows completed Test 1 and Test 2 snapshots calculated from their original reference sets; later records do not change those historical snapshots. Local tests cover both exact test totals, snapshot selection, validation, role checks, Telegram grammar, and commission rounding. They do **not** prove live integration or reviewer approval. Keep real evidence in `evidence/` after deployment; do not save credentials or full private IDs there.

The course's S01/E01 tests must use the actual Telegram bot and receive real return messages. Do not insert those rows directly into Supabase or simulate webhook messages to claim completion. Test 1 and Test 2 records remain in Supabase after completion.
