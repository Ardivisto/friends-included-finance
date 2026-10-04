'use strict';
const domain = require('../lib/domain');
const store = require('../lib/store');
const delivery = require('../lib/delivery');

function respond(res,status,data) { res.statusCode=status; res.setHeader('Content-Type','application/json; charset=utf-8'); res.setHeader('Cache-Control','no-store'); res.end(JSON.stringify(data)); }
async function bodyOf(req) {
  const parse = (raw) => {
    try { return JSON.parse(raw); }
    catch { throw new domain.InputError('Invalid JSON body.'); }
  };
  if (req.body !== undefined) return typeof req.body === 'string' ? parse(req.body) : req.body;
  let raw=''; for await (const chunk of req) { raw+=chunk; if (raw.length>100000) throw new domain.InputError('Request is too large.'); }
  return raw ? parse(raw) : {};
}
function actor(req,body) {
  const role = body.role || new URL(req.url,'http://local').searchParams.get('role');
  if (!Object.hasOwn(domain.PEOPLE,role)) throw new domain.InputError('Select a valid demonstration role.',403);
  return role;
}
function origin(row,source,chatId) { return { ...row,origin:source,origin_chat_id:chatId || null }; }
async function publish(type,row,event,chatId,message) {
  const outbox = await store.deliveries();
  const relevant = outbox.filter((d)=>d.entity_type===type && d.reference===row.reference && (d.kind==='sheet' || (d.kind==='telegram' && d.event===event)));
  const results=[]; for (const job of relevant) if (job.status==='pending') results.push({id:job.id,...await delivery.processDelivery(job.id)});
  return results;
}
async function submitSale(role,input,source='website',chatId=null) {
  const record=origin(domain.saleInput(role,input),source,chatId);
  if (source==='telegram') record.confirmation=`Sale ${record.reference} recorded. ${domain.money(record.amount_cents)}; project ${record.project} (${domain.PROJECTS[record.project]}). Status: Pending approval.`;
  const row=await store.rpc('submit_sale',{p_record:record});
  const deliveries=await publish('sale',row,'submitted',chatId,record.confirmation);
  return { row,deliveries };
}
async function submitExpense(role,input,source='website',chatId=null) {
  const record=origin(domain.expenseInput(role,input),source,chatId);
  if (source==='telegram') record.confirmation=`Expense ${record.reference} recorded. ${domain.money(record.amount_cents)}; proposed allocation: ${domain.PROJECTS[record.proposed_allocation]}. Status: ${record.proposed_allocation==='overhead'?'Allocated as company overhead':'Awaiting allocation'}.`;
  const row=await store.rpc('submit_expense',{p_record:record});
  const deliveries=await publish('expense',row,'submitted',chatId,record.confirmation);
  return { row,deliveries };
}
async function decideSale(role,reference,splitInput) {
  if (role!=='svetlana') throw new domain.InputError('Only Svetlana can approve sales.',403);
  const before=await store.one('sales',reference);
  const chosen=splitInput ? domain.split(splitInput) : before.proposed_split;
  const message=domain.saleDecisionMessage({...before,final_split:chosen});
  const row=await store.rpc('decide_sale',{p_actor:role,p_reference:reference,p_split:chosen,p_payload:message});
  if (before.status==='approved') return { row,repeated:true,deliveries:[] };
  const employee=(await store.employees()).find((x)=>x.id===row.salesperson);
  const chatId=row.origin==='telegram'?row.origin_chat_id:employee?.telegram_chat_id;
  const deliveries=await publish('sale',row,'approved',chatId,message);
  return { row,repeated:false,deliveries,recipient:chatId?'linked':'No Telegram recipient linked' };
}
async function decideExpense(role,reference,allocationInput) {
  if (role!=='svetlana') throw new domain.InputError('Only Svetlana can allocate expenses.',403);
  const before=await store.one('expenses',reference);
  const chosen=domain.allocation(allocationInput || before.proposed_allocation);
  const message=domain.expenseDecisionMessage({...before,final_allocation:chosen});
  const row=await store.rpc('decide_expense',{p_actor:role,p_reference:reference,p_allocation:chosen,p_payload:message});
  if (before.status==='allocated') return { row,repeated:true,deliveries:[] };
  const employee=(await store.employees()).find((x)=>x.id===row.reporter);
  const chatId=row.origin==='telegram'?row.origin_chat_id:employee?.telegram_chat_id;
  const deliveries=await publish('expense',row,'allocated',chatId,message);
  return { row,repeated:false,deliveries,recipient:chatId?'linked':'No Telegram recipient linked' };
}
function parseBot(text) {
  const [command,...parts]=text.split('|').map((x)=>x.trim());
  if (command.startsWith('/sale ')) {
    if (parts.length!==5) throw new domain.InputError('Use /sale REF | customer | A or B | description | amount | Richard/Anastasia/Jean-Claude percentages');
    const [customer,project,description,amount,splits]=parts.slice(0,5);
    // First field is the reference after /sale; the other five fields follow bars.
    return { kind:'sale',input:{reference:command.slice(6).trim(),customer,project,description,amount,split:Object.fromEntries(domain.SELLERS.map((k,i)=>[k,splits?.split('/')[i]]))} };
  }
  if (command.startsWith('/expense ')) {
    if (parts.length!==4) throw new domain.InputError('Use /expense REF | description | amount | Materials/Travel/Other | A/B/overhead');
    return {kind:'expense',input:{reference:command.slice(9).trim(),description:parts[0],amount:parts[1],category:parts[2],allocation:parts[3]}};
  }
  throw new domain.InputError('Use /sale REF | customer | A/B | description | amount | 50/30/20 or /expense REF | description | amount | category | A/B/overhead.');
}
async function telegram(req,res) {
  if (!process.env.TELEGRAM_WEBHOOK_SECRET || req.headers['x-telegram-bot-api-secret-token']!==process.env.TELEGRAM_WEBHOOK_SECRET) return respond(res,403,{error:'Forbidden'});
  const update=await bodyOf(req), message=update.message;
  if (!message?.from?.id || !message?.chat?.id || !message?.text) return respond(res,200,{ok:true});
  const chatId=message.chat.id;
  try {
    if (message.chat.type!=='private') throw new domain.InputError('Please use a private chat.');
    if (message.text.startsWith('/start') || message.text.startsWith('/id')) {
      await delivery.sendTelegram(chatId,`Your Telegram user ID is ${message.from.id}; private chat ID is ${chatId}. Ask Svetlana to link both in manager setup.\nUse /sale REF | customer | A/B | description | amount | 50/30/20 or /expense REF | description | amount | category | A/B/overhead.`);
      return respond(res,200,{ok:true});
    }
    const employee=(await store.employees()).find((x)=>String(x.telegram_user_id)===String(message.from.id));
    if (!employee) throw new domain.InputError('Your Telegram user ID is not linked. Ask Svetlana to link it in manager setup.');
    const parsed=parseBot(message.text);
    if (parsed.kind==='sale') await submitSale(employee.id,parsed.input,'telegram',chatId);
    else await submitExpense(employee.id,parsed.input,'telegram',chatId);
    return respond(res,200,{ok:true});
  } catch(error) {
    try { await delivery.sendTelegram(chatId,`Not recorded: ${error.message}`); } catch { /* Telegram outage is visible in server logs. */ }
    return respond(res,200,{ok:true});
  }
}
async function state(role) {
  const [sales,expenses,employees,deliveries]=await Promise.all([store.list('sales'),store.list('expenses'),store.employees(),store.deliveries()]);
  const visibleSales=role==='svetlana'?sales:sales.filter((s)=>s.salesperson===role);
  const visibleExpenses=role==='svetlana'?expenses:expenses.filter((e)=>e.reporter===role);
  const refs=new Set([...visibleSales,...visibleExpenses].map((r)=>r.reference));
  return {sales:visibleSales,expenses:visibleExpenses,deliveries:deliveries.filter((d)=>refs.has(d.reference)).map((d)=>({id:d.id,kind:d.kind,entity_type:d.entity_type,reference:d.reference,event:d.event,status:d.status,attempt_count:d.attempt_count,last_error:d.last_error,delivered_at:d.delivered_at})),employees:role==='svetlana'?employees.map((e)=>({id:e.id,display_name:e.display_name,telegram_user_id:e.telegram_user_id,telegram_chat_id:e.telegram_chat_id})):[],totals:role==='svetlana'?domain.totals(sales,expenses):null,public:{owner:process.env.PUBLIC_OWNER_NAME || '',bot:process.env.PUBLIC_BOT_USERNAME || '',sheet:process.env.PUBLIC_SHEET_URL || '',repo:process.env.PUBLIC_REPO_URL || ''}};
}
async function retry(role,id) {
  if (role!=='svetlana') throw new domain.InputError('Only Svetlana can retry deliveries.',403);
  const all=await store.deliveries(),job=all.find((x)=>x.id===Number(id));
  if (!job) throw new domain.InputError('Delivery not found.',404);
  if (job.status==='sent') return {alreadySent:true};
  await store.upsertDelivery(job.id,{status:'pending',next_attempt_at:new Date().toISOString(),last_error:null});
  return delivery.processDelivery(job.id);
}
async function cron(req) {
  if (!process.env.CRON_SECRET || req.headers.authorization!==`Bearer ${process.env.CRON_SECRET}`) throw new domain.InputError('Forbidden.',403);
  const [sales,expenses,employees,jobsBefore]=await Promise.all([store.list('sales'),store.list('expenses'),store.employees(),store.deliveries()]);
  const has=(type,ref,event)=>jobsBefore.some((d)=>d.kind==='telegram'&&d.entity_type===type&&d.reference===ref&&d.event===event);
  for (const row of sales.filter((s)=>s.status==='approved'&&!has('sale',s.reference,'approved'))) {
    const employee=employees.find((e)=>e.id===row.salesperson);
    await store.queueTelegram('sale',row,'approved',row.origin==='telegram'?row.origin_chat_id:employee?.telegram_chat_id,domain.saleDecisionMessage(row));
  }
  for (const row of expenses.filter((e)=>e.status==='allocated'&&e.proposed_allocation!=='overhead'&&!has('expense',e.reference,'allocated'))) {
    const employee=employees.find((e)=>e.id===row.reporter);
    await store.queueTelegram('expense',row,'allocated',row.origin==='telegram'?row.origin_chat_id:employee?.telegram_chat_id,domain.expenseDecisionMessage(row));
  }
  const jobs=await delivery.dueDeliveries();
  const results=[]; for (const job of jobs) results.push({id:job.id,...await delivery.processDelivery(job.id)});
  return {processed:results.length,results};
}
async function setupTelegramWebhook(req) {
  if (!process.env.TELEGRAM_SETUP_SECRET || req.headers.authorization!==`Bearer ${process.env.TELEGRAM_SETUP_SECRET}`) {
    throw new domain.InputError('Forbidden.',403);
  }
  const token=process.env.TELEGRAM_BOT_TOKEN,secret=process.env.TELEGRAM_WEBHOOK_SECRET,base=process.env.PUBLIC_VERCEL_URL;
  if (!token || !secret || !base) throw new Error('Telegram webhook is not configured on the server.');
  const response=await fetch(`https://api.telegram.org/bot${token}/setWebhook`,{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({url:`${base.replace(/\/$/,'')}/api/telegram`,secret_token:secret,allowed_updates:['message']})
  });
  const result=await response.json();
  if (!response.ok || !result.ok) throw new Error('Telegram webhook registration failed.');
  return {configured:true};
}
module.exports=async function handler(req,res) {
  try {
    const url=new URL(req.url,'http://local'),path=url.pathname.replace(/^\/api/,'') || '/';
    if (path==='/telegram' && req.method==='POST') return telegram(req,res);
    if (path==='/telegram/setup' && req.method==='POST') return respond(res,200,await setupTelegramWebhook(req));
    if (path==='/cron' && req.method==='GET') return respond(res,200,await cron(req));
    const body=req.method==='POST'?await bodyOf(req):{};
    const role=actor(req,body);
    if (path==='/state' && req.method==='GET') return respond(res,200,await state(role));
    if (path==='/sales' && req.method==='POST') return respond(res,201,await submitSale(role,body));
    if (path==='/expenses' && req.method==='POST') return respond(res,201,await submitExpense(role,body));
    if (path==='/sales/approve' && req.method==='POST') return respond(res,200,await decideSale(role,body.reference,body.split));
    if (path==='/expenses/allocate' && req.method==='POST') return respond(res,200,await decideExpense(role,body.reference,body.allocation));
    if (path==='/telegram/link' && req.method==='POST') {
      if (role!=='svetlana') throw new domain.InputError('Only Svetlana can link Telegram accounts.',403);
      if (!Object.hasOwn(domain.PEOPLE,body.employee)) throw new domain.InputError('Select an employee.');
      if (!/^\d+$/.test(String(body.userId)) || !/^-?\d+$/.test(String(body.chatId))) throw new domain.InputError('Enter the Telegram user ID and private chat ID.');
      const linked=await store.linkTelegram(body.employee,body.userId,body.chatId);
      return respond(res,200,{employee:linked.id,linked:true});
    }
    if (path==='/deliveries/retry' && req.method==='POST') return respond(res,200,await retry(role,body.id));
    return respond(res,404,{error:'Not found.'});
  } catch(error) {
    return respond(res,error.status || 500,{error:error.status ? error.message : 'Unexpected server error.'});
  }
};
module.exports._test={parseBot,submitSale,submitExpense,decideSale,decideExpense};
