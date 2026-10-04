'use strict';
const token=process.env.TELEGRAM_BOT_TOKEN,secret=process.env.TELEGRAM_WEBHOOK_SECRET,url=process.env.PUBLIC_VERCEL_URL;
if(!token||!secret||!url){console.error('Set TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, and PUBLIC_VERCEL_URL in this shell.');process.exit(1);}
const endpoint=`https://api.telegram.org/bot${token}/setWebhook`;
fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:`${url.replace(/\/$/,'')}/api/telegram`,secret_token:secret,allowed_updates:['message']})}).then(async(r)=>{const result=await r.json();if(!r.ok||!result.ok){console.error('Webhook setup failed:',result.description||r.status);process.exitCode=1;}else console.log('Telegram webhook configured.');}).catch((error)=>{console.error('Webhook setup failed:',error.message);process.exitCode=1;});
