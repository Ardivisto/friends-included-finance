'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const d=require('../lib/domain');
const delivery=require('../lib/delivery');

test('Sales and Expenses copy keeps proposal and final values separate (FG-16, FG-33)',()=>{
  const sale={reference:'S02',submitted_at:'2026-10-04T10:00:00Z',salesperson:'anastasia',customer:'Daniel King',project:'B',description:'University friends, dancing, and the stripping performance',amount_cents:200000,proposed_split:[0,50,50],final_split:null,status:'pending'};
  const pending=delivery.sheetRow('sale',sale);
  assert.equal(pending.length,delivery.SALES_HEADER.length);
  assert.deepEqual(pending.slice(7,13),[0,50,50,'','','']);
  assert.deepEqual(pending.slice(13,16),['0.00','0.00','0.00']);
  sale.final_split=[20,40,40];sale.status='approved';
  const approved=delivery.sheetRow('sale',sale);
  assert.deepEqual(approved.slice(7,13),[0,50,50,20,40,40]);
  assert.deepEqual(approved.slice(13,16),['40.00','80.00','80.00']);
  const expense={reference:'E02',submitted_at:'2026-10-04T10:00:00Z',reporter:'kevin',description:'Taxi for the grandmother; Kevin selected the wrong project',category:'Travel',amount_cents:8000,proposed_allocation:'B',final_allocation:'A',status:'allocated'};
  const copied=delivery.sheetRow('expense',expense);
  assert.equal(copied.length,delivery.EXPENSES_HEADER.length);
  assert.equal(copied[6],'Drunk University Friends');assert.equal(copied[7],'Respectable Relatives');
});

test('Decision messages state final shares, amount, and changed proposals (FG-17, FG-21, FG-24)',()=>{
  const sale={reference:'S03',amount_cents:150000,proposed_split:[40,40,20],final_split:[20,30,50]};
  const message=d.saleDecisionMessage(sale);
  assert.match(message,/S03 approved — commission split changed/);
  assert.match(message,/total commission €150\.00/);
  assert.match(message,/Richard Darling: 40% → 20% \(€30\.00\)/);
  assert.match(message,/Anastasia Ferrari: 40% → 30% \(€45\.00\)/);
  assert.match(message,/Jean-Claude Bērziņš: 20% → 50% \(€75\.00\)/);
  const expense=d.expenseDecisionMessage({reference:'E05',amount_cents:9000,description:'Minibus for university friends; Kevin selected the wrong project again',proposed_allocation:'A',final_allocation:'B'});
  assert.match(expense,/allocation changed/);
  assert.match(expense,/€90\.00/);
  assert.match(expense,/Proposed: Respectable Relatives\. Approved: Drunk University Friends/);
});
