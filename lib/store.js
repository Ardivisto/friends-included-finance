'use strict';
const { InputError } = require('./domain');

function config() {
  const base = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) throw new InputError('Supabase is not configured on the server.', 503);
  return { base: base.replace(/\/$/, ''), key };
}
async function request(path, options = {}) {
  const { base, key } = config();
  const response = await fetch(`${base}/rest/v1/${path}`, {
    method: options.method || 'GET',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: options.prefer || 'return=representation', ...options.headers },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });
  const body = await response.text();
  let data; try { data = body ? JSON.parse(body) : null; } catch { data = body; }
  if (!response.ok) {
    const duplicate = data?.code === '23505';
    const denied = data?.code === '42501';
    const missing = data?.code === 'P0002';
    throw new InputError(duplicate ? 'Reference already exists.' : (data?.message || 'Database request failed.'), duplicate ? 409 : denied ? 403 : missing ? 404 : response.status >= 500 ? 502 : 400);
  }
  return data;
}
async function rpc(name, parameters) { return request(`rpc/${name}`, { method: 'POST', body: parameters }); }
async function list(table, query = '') { return request(`${table}?select=*&order=submitted_at.asc${query}`); }
async function one(table, ref) {
  const rows = await request(`${table}?select=*&reference=eq.${encodeURIComponent(ref)}&limit=1`);
  if (!rows.length) throw new InputError(`${table === 'sales' ? 'Sale' : 'Expense'} not found.`, 404);
  return rows[0];
}
async function employees() { return request('employees?select=*&order=id.asc'); }
async function deliveries() { return request('deliveries?select=*&order=id.asc'); }
async function linkTelegram(employee, userId, chatId) {
  return rpc('link_telegram',{p_employee:employee,p_user_id:userId,p_chat_id:chatId});
}
async function queueTelegram(type, row, event, chatId, payload) {
  await rpc('queue_delivery', { p_kind: 'telegram', p_type: type, p_ref: row.reference, p_event: event, p_chat: chatId, p_payload: payload });
  return true;
}
async function upsertDelivery(id, patch) { return request(`deliveries?id=eq.${id}`, { method: 'PATCH', body: patch }); }
module.exports = { request, rpc, list, one, employees, deliveries, linkTelegram, queueTelegram, upsertDelivery };
