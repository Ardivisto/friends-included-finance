'use strict';

const PEOPLE = Object.freeze({
  svetlana: 'Svetlana de Monte Carlo',
  richard: 'Richard Darling',
  anastasia: 'Anastasia Ferrari',
  jean_claude: 'Jean-Claude Bērziņš',
  kevin: 'Kevin von Whatever'
});
const SELLERS = ['richard', 'anastasia', 'jean_claude'];
const PROJECTS = { A: 'Respectable Relatives', B: 'Drunk University Friends', overhead: 'Company overhead' };

class InputError extends Error {
  constructor(message, status = 400) { super(message); this.name = 'InputError'; this.status = status; }
}
function required(value, name) {
  if (typeof value !== 'string' || !value.trim()) throw new InputError(`${name} is required.`);
  return value.trim();
}
function reference(value) {
  const v = required(value, 'Reference').toUpperCase();
  if (!/^[A-Z][A-Z0-9-]{1,31}$/.test(v)) throw new InputError('Reference must be 2–32 letters, digits, or hyphens, starting with a letter.');
  return v;
}
function amountCents(value) {
  const text = String(value ?? '').trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) throw new InputError('Amount must be a positive euro amount with at most two decimal places.');
  const [whole, fraction = ''] = text.split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(cents) || cents <= 0) throw new InputError('Amount must be greater than zero.');
  return cents;
}
function percent(value, label) {
  const v = Number(value);
  if (value === '' || value == null || !Number.isInteger(v) || v < 0 || v > 100) throw new InputError(`${label} must be a whole percentage from 0 to 100.`);
  return v;
}
function split(value) {
  if (!value || typeof value !== 'object') throw new InputError('Commission split is required.');
  const result = SELLERS.map((key) => percent(value[key], PEOPLE[key]));
  if (result.reduce((a, b) => a + b, 0) !== 100) throw new InputError('Commission percentages must total 100%.');
  return result;
}
function project(value) {
  if (value !== 'A' && value !== 'B') throw new InputError('Project must be A or B.');
  return value;
}
function allocation(value) {
  if (!['A', 'B', 'overhead'].includes(value)) throw new InputError('Allocation must be A, B, or Company overhead.');
  return value;
}
function saleInput(actor, input) {
  if (!SELLERS.includes(actor)) throw new InputError('Only salespeople can submit sales.', 403);
  return { reference: reference(input.reference), salesperson: actor, customer: required(input.customer, 'Customer'), project: project(input.project), description: required(input.description, 'Description'), amount_cents: amountCents(input.amount), proposed_split: split(input.split) };
}
function expenseInput(actor, input) {
  if (actor !== 'kevin') throw new InputError('Only Kevin can submit expenses.', 403);
  const category = required(input.category, 'Category');
  if (!['Materials', 'Travel', 'Other'].includes(category)) throw new InputError('Category must be Materials, Travel, or Other.');
  return { reference: reference(input.reference), reporter: actor, description: required(input.description, 'Description'), amount_cents: amountCents(input.amount), category, proposed_allocation: allocation(input.allocation) };
}
function commission(amount, percentages) {
  const pool = Math.round(amount / 10);
  const amounts = percentages.map((p) => Math.round(pool * p / 100));
  const residual = pool - amounts.reduce((a, b) => a + b, 0);
  const top = percentages.indexOf(Math.max(...percentages));
  amounts[top] += residual;
  return { pool, amounts };
}
function money(cents) { return `€${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function totals(sales, expenses) {
  const projects = { A: { income: 0, commissions: 0, expenses: 0, result: 0 }, B: { income: 0, commissions: 0, expenses: 0, result: 0 } };
  const earned = { richard: 0, anastasia: 0, jean_claude: 0 };
  let overhead = 0, awaiting = 0;
  for (const sale of sales) if (sale.status === 'approved') {
    const p = projects[sale.project];
    p.income += sale.amount_cents;
    const { pool, amounts } = commission(sale.amount_cents, sale.final_split);
    p.commissions += pool;
    SELLERS.forEach((person, i) => { earned[person] += amounts[i]; });
  }
  for (const expense of expenses) {
    const allocation = expense.final_allocation;
    if (allocation === 'A' || allocation === 'B') projects[allocation].expenses += expense.amount_cents;
    else if (allocation === 'overhead') overhead += expense.amount_cents;
    else awaiting += expense.amount_cents;
  }
  for (const p of Object.values(projects)) p.result = p.income - p.commissions - p.expenses;
  const income = projects.A.income + projects.B.income;
  const commissions = projects.A.commissions + projects.B.commissions;
  const allocated = projects.A.expenses + projects.B.expenses;
  return { projects, company: { income, commissions, allocated, overhead, awaiting, result: income - commissions - allocated - overhead - awaiting }, earned };
}
function saleDecisionMessage(sale) {
  const { pool, amounts } = commission(sale.amount_cents, sale.final_split);
  const changed = sale.proposed_split.some((v, i) => v !== sale.final_split[i]);
  const lines = SELLERS.map((key, i) => `${PEOPLE[key]}: ${sale.proposed_split[i]}%${changed ? ` → ${sale.final_split[i]}%` : ''} (${money(amounts[i])})`);
  return `Sale ${sale.reference} approved${changed ? ' — commission split changed' : ''}. Sale ${money(sale.amount_cents)}; total commission ${money(pool)}.\n${lines.join('\n')}`;
}
function expenseDecisionMessage(expense) {
  const changed = expense.proposed_allocation !== expense.final_allocation;
  return `Expense ${expense.reference} — allocation ${changed ? 'changed' : 'confirmed'}. ${money(expense.amount_cents)}: ${expense.description}. Proposed: ${PROJECTS[expense.proposed_allocation]}. Approved: ${PROJECTS[expense.final_allocation]}.`;
}
module.exports = { PEOPLE, SELLERS, PROJECTS, InputError, saleInput, expenseInput, split, allocation, commission, totals, money, saleDecisionMessage, expenseDecisionMessage };
