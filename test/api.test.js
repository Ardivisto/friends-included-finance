'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const handler=require('../api/index');

test('completed test snapshots use only their original saved references',()=>{
  const sale=(reference,amount_cents,project,final_split,status='approved')=>({reference,amount_cents,project,final_split,status});
  const expense=(reference,amount_cents,final_allocation,status='allocated')=>({reference,amount_cents,final_allocation,status});
  const sales=[sale('S01',100000,'A',[50,30,20]),sale('S02',200000,'B',[20,40,40]),sale('S03',150000,'A',[20,30,50]),sale('S04',80000,'B',[25,25,50]),sale('S05',60000,'B',null,'pending'),sale('S06',5000,'B',[0,100,0]),sale('S07',5,'A',[50,50,0])];
  const expenses=[expense('E01',12000,'A'),expense('E02',8000,'A'),expense('E03',10000,'overhead'),expense('E04',25000,'B'),expense('E05',9000,'B'),expense('E06',6000,'overhead'),expense('E07',14000,null,'awaiting'),expense('E08',3500,'overhead'),expense('E09',2500,'overhead')];
  const snapshots=handler._test.homeworkSnapshots(sales,expenses);
  assert.equal(snapshots.test1.totals.company.result,240000);
  assert.equal(snapshots.test2.totals.company.result,393000);
  assert.equal(snapshots.test2.totals.earned.jean_claude,21500);
  assert.equal(snapshots.test1.salesCount,2);assert.equal(snapshots.test2.salesCount,5);assert.equal(snapshots.test2.expensesCount,7);
});

async function call(path,body){
  const req={url:path,method:'POST',body,headers:{}};
  const res={headers:{},setHeader(name,value){this.headers[name]=value;},end(value){this.value=value;}};
  await handler(req,res);
  return {status:res.statusCode,body:JSON.parse(res.value)};
}

test('processing layer denies wrong roles and malformed inputs before persistence (FG-06, FG-10, FG-26)',async()=>{
  const sale={reference:'S99',customer:'Fictional Customer',project:'A',description:'Fictional guests',amount:'100',split:{richard:50,anastasia:30,jean_claude:20}};
  assert.deepEqual(await call('/api/sales/approve',{role:'richard',reference:'S01'}),{status:403,body:{error:'Only Svetlana can approve sales.'}});
  assert.deepEqual(await call('/api/sales',{role:'kevin',...sale}),{status:403,body:{error:'Only salespeople can submit sales.'}});
  const invalid=await call('/api/sales',{role:'richard',...sale,split:{richard:60,anastasia:30,jean_claude:20}});
  assert.equal(invalid.status,400);assert.match(invalid.body.error,/total 100/);
  const zero=await call('/api/expenses',{role:'kevin',reference:'E99',description:'Fictional costume',category:'Materials',allocation:'A',amount:'0'});
  assert.equal(zero.status,400);assert.match(zero.body.error,/greater than zero/);
  const missing=await call('/api/expenses',{role:'kevin',reference:'E99',description:'Fictional costume',category:'Materials',allocation:'A'});
  assert.equal(missing.status,400);assert.match(missing.body.error,/positive euro/);
  assert.deepEqual(await call('/api/expenses','{"role":"kevin"'),{status:400,body:{error:'Invalid JSON body.'}});
});
