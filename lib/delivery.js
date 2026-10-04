'use strict';
const crypto = require('node:crypto');
const store = require('./store');
const { commission, PEOPLE, PROJECTS, money } = require('./domain');

const SALES_HEADER = ['Reference','Submission time','Salesperson','Customer','Project','Description','Amount EUR','Proposed Richard %','Proposed Anastasia %','Proposed Jean-Claude %','Approved Richard %','Approved Anastasia %','Approved Jean-Claude %','Earned Richard EUR','Earned Anastasia EUR','Earned Jean-Claude EUR','Status'];
const EXPENSES_HEADER = ['Reference','Submission time','Reporter','Description','Category','Amount EUR','Proposed allocation','Final allocation','Status'];
function decimal(cents) { return (cents / 100).toFixed(2); }
function sheetRow(kind, row) {
  if (kind === 'sale') {
    const amounts = row.status === 'approved' ? commission(row.amount_cents, row.final_split).amounts : [0,0,0];
    return [row.reference,row.submitted_at,PEOPLE[row.salesperson],row.customer,PROJECTS[row.project],row.description,decimal(row.amount_cents),...row.proposed_split,...(row.final_split || ['','','']),...amounts.map(decimal),row.status === 'approved' ? 'Approved' : 'Pending'];
  }
  return [row.reference,row.submitted_at,PEOPLE[row.reporter],row.description,row.category,decimal(row.amount_cents),PROJECTS[row.proposed_allocation],row.final_allocation ? PROJECTS[row.final_allocation] : '',row.status === 'allocated' ? 'Allocated' : 'Awaiting allocation'];
}
function googleConfig() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!email || !privateKey || !sheetId) throw new Error('Google Sheets is not configured on the server.');
  return { email, privateKey, sheetId };
}
async function googleToken(email, privateKey) {
  const now = Math.floor(Date.now() / 1000);
  const b64 = (v) => Buffer.from(JSON.stringify(v)).toString('base64url');
  const input = `${b64({ alg:'RS256',typ:'JWT' })}.${b64({ iss:email,scope:'https://www.googleapis.com/auth/spreadsheets',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600 })}`;
  const signature = crypto.sign('RSA-SHA256',Buffer.from(input),privateKey).toString('base64url');
  const response = await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:`${input}.${signature}`})});
  if (!response.ok) throw new Error(`Google authentication failed (${response.status}).`);
  return (await response.json()).access_token;
}
async function sheetsRequest(path, token, method='GET', body) {
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${path}`,{method,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:body ? JSON.stringify(body):undefined});
  if (!response.ok) throw new Error(`Google Sheets write failed (${response.status}).`);
  return response.json();
}
async function syncSheet(kind, row) {
  const { email, privateKey, sheetId } = googleConfig();
  const token = await googleToken(email,privateKey);
  const tab = kind === 'sale' ? 'Sales' : 'Expenses';
  const header = kind === 'sale' ? SALES_HEADER : EXPENSES_HEADER;
  const meta = await sheetsRequest(`${encodeURIComponent(sheetId)}?fields=sheets.properties.title`,token);
  if (!(meta.sheets||[]).some((s)=>s.properties?.title===tab)) {
    await sheetsRequest(`${encodeURIComponent(sheetId)}:batchUpdate`,token,'POST',{requests:[{addSheet:{properties:{title:tab}}}]});
  }
  const root = `${encodeURIComponent(sheetId)}/values/`;
  const first = await sheetsRequest(`${root}${encodeURIComponent(`${tab}!A:A`)}`,token);
  const refs = (first.values || []).map((r)=>r[0]);
  if (refs[0] !== 'Reference') await sheetsRequest(`${root}${encodeURIComponent(`${tab}!A1`)}?valueInputOption=RAW`,token,'PUT',{values:[header]});
  const existing = refs.indexOf(row.reference);
  const index = existing >= 0 ? existing + 1 : Math.max(refs.length + 1,2);
  const last = kind === 'sale' ? 'Q' : 'I';
  await sheetsRequest(`${root}${encodeURIComponent(`${tab}!A${index}:${last}${index}`)}?valueInputOption=RAW`,token,'PUT',{values:[sheetRow(kind,row)]});
  return { tab, row: index };
}
async function sendTelegram(chatId,text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('Telegram is not configured on the server.');
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:chatId,text})});
  if (!response.ok) throw new Error(`Telegram send failed (${response.status}).`);
  return response.json();
}
async function processDelivery(id) {
  const claimed = await store.rpc('claim_delivery',{p_id:id});
  if (!claimed) return { skipped:true };
  try {
    if (claimed.kind === 'sheet') {
      const row = await store.one(claimed.entity_type === 'sale' ? 'sales':'expenses',claimed.reference);
      await syncSheet(claimed.entity_type,row);
    } else {
      if (!claimed.recipient_chat_id) {
        await store.upsertDelivery(id,{status:'no_recipient',locked_until:null});
        return { noRecipient:true };
      }
      await sendTelegram(claimed.recipient_chat_id,claimed.payload);
    }
    await store.upsertDelivery(id,{status:'sent',last_error:null,locked_until:null,delivered_at:new Date().toISOString()});
    return { sent:true };
  } catch(error) {
    await store.upsertDelivery(id,{status:'failed',last_error:error.message,locked_until:null,next_attempt_at:new Date(Date.now()+Math.min(600000,30000*claimed.attempt_count)).toISOString()});
    return { failed:true,error:error.message };
  }
}
async function dueDeliveries(limit=20) {
  const all = await store.deliveries();
  return all.filter((d)=>['pending','failed'].includes(d.status) && new Date(d.next_attempt_at)<=new Date()).slice(0,limit);
}
module.exports = { SALES_HEADER,EXPENSES_HEADER,sheetRow,syncSheet,sendTelegram,processDelivery,dueDeliveries };
