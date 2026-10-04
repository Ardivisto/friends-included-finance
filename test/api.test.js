'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const handler=require('../api/index');

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
