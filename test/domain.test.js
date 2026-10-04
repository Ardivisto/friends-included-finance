'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const d=require('../lib/domain');
const api=require('../api/index')._test;

const sale=(reference,salesperson,amount_cents,project,proposed_split,final_split=null)=>({reference,salesperson,amount_cents,project,proposed_split,final_split,status:final_split?'approved':'pending'});
const expense=(reference,amount_cents,proposed_allocation,final_allocation=null)=>({reference,amount_cents,proposed_allocation,final_allocation,status:final_allocation?'allocated':'awaiting'});

test('input rules and role checks (FG-03, FG-05, FG-06, FG-10, FG-26)',()=>{
  const input={reference:'S01',customer:'Olivia Rose',project:'A',description:'One proud uncle and an emotional grandmother',amount:'1000',split:{richard:50,anastasia:30,jean_claude:20}};
  assert.equal(d.saleInput('richard',input).amount_cents,100000);
  assert.throws(()=>d.saleInput('kevin',input),/Only salespeople/);
  assert.throws(()=>d.saleInput('richard',{...input,split:{richard:60,anastasia:30,jean_claude:20}}),/total 100/);
  assert.throws(()=>d.expenseInput('kevin',{reference:'E01',description:'Costumes',amount:'0',category:'Materials',allocation:'A'}),/greater than zero/);
  assert.throws(()=>d.expenseInput('kevin',{reference:'E01',description:'Costumes',category:'Materials',allocation:'A'}),/positive euro/);
  assert.throws(()=>d.expenseInput('richard',{reference:'E01',description:'Costumes',amount:'1',category:'Materials',allocation:'A'}),/Only Kevin/);
});

test('commission pool and rounding residual (FG-11)',()=>{
  assert.deepEqual(d.commission(100000,[50,30,20]),{pool:10000,amounts:[5000,3000,2000]});
  // A one-cent pool, with equal highest shares: residual goes to Richard.
  assert.deepEqual(d.commission(10,[40,40,20]),{pool:1,amounts:[1,0,0]});
  assert.deepEqual(d.commission(10,[20,40,40]),{pool:1,amounts:[0,1,0]});
});

test('Telegram input grammar (FG-05)',()=>{
  const s=api.parseBot('/sale S01 | Olivia Rose | A | One proud uncle and an emotional grandmother | 1000 | 50/30/20');
  assert.deepEqual(d.saleInput('richard',s.input).proposed_split,[50,30,20]);
  const e=api.parseBot('/expense E01 | Rented suit and fake pearl necklace for the relatives | 120 | Materials | A');
  assert.equal(d.expenseInput('kevin',e.input).amount_cents,12000);
});

test('Test 1 predecision, final totals, and original proposals (FG-19–FG-22)',()=>{
  const sales=[sale('S01','richard',100000,'A',[50,30,20]),sale('S02','anastasia',200000,'B',[0,50,50])];
  const expenses=[expense('E01',12000,'A'),expense('E02',8000,'B'),expense('E03',10000,'overhead','overhead')];
  const pre=d.totals(sales,expenses);
  assert.equal(pre.company.income,0);assert.equal(pre.company.commissions,0);assert.equal(pre.projects.A.result,0);assert.equal(pre.projects.B.result,0);assert.equal(pre.company.result,-30000);
  sales[0].status='approved';sales[0].final_split=[50,30,20];sales[1].status='approved';sales[1].final_split=[20,40,40];
  expenses[0].final_allocation='A';expenses[1].final_allocation='A';
  const t=d.totals(sales,expenses);
  assert.deepEqual(t.projects.A,{income:100000,commissions:10000,expenses:20000,result:70000});
  assert.deepEqual(t.projects.B,{income:200000,commissions:20000,expenses:0,result:180000});
  assert.deepEqual(t.company,{income:300000,commissions:30000,allocated:20000,overhead:10000,awaiting:0,result:240000});
  assert.deepEqual(t.earned,{richard:9000,anastasia:11000,jean_claude:10000});
  assert.deepEqual(sales[1].proposed_split,[0,50,50]);assert.equal(expenses[1].proposed_allocation,'B');
});

test('Test 2 cumulative totals and reconciliation (FG-23–FG-25, FG-28)',()=>{
  const sales=[sale('S01','richard',100000,'A',[50,30,20],[50,30,20]),sale('S02','anastasia',200000,'B',[0,50,50],[20,40,40]),sale('S03','jean_claude',150000,'A',[40,40,20],[20,30,50]),sale('S04','richard',80000,'B',[25,25,50],[25,25,50]),sale('S05','richard',60000,'B',[100,0,0])];
  const expenses=[expense('E01',12000,'A','A'),expense('E02',8000,'B','A'),expense('E03',10000,'overhead','overhead'),expense('E04',25000,'B','B'),expense('E05',9000,'A','B'),expense('E06',6000,'overhead','overhead'),expense('E07',14000,'A')];
  const t=d.totals(sales,expenses);
  assert.deepEqual(t.projects.A,{income:250000,commissions:25000,expenses:20000,result:205000});
  assert.deepEqual(t.projects.B,{income:280000,commissions:28000,expenses:34000,result:218000});
  assert.deepEqual(t.company,{income:530000,commissions:53000,allocated:54000,overhead:16000,awaiting:14000,result:393000});
  assert.deepEqual(t.earned,{richard:14000,anastasia:17500,jean_claude:21500});
  assert.equal(t.projects.A.result+t.projects.B.result-t.company.overhead-t.company.awaiting,t.company.result);
  assert.equal(d.commission(sales[2].amount_cents,sales[2].final_split).amounts.join(','),'3000,4500,7500');
  assert.equal(d.commission(sales[3].amount_cents,sales[3].final_split).amounts.join(','),'2000,2000,4000');
  const before=t.company.result;
  sales.push(sale('S06','anastasia',10000,'A',[0,100,0],[0,100,0]));
  assert.equal(d.totals(sales,expenses).company.result,before+9000);
});
