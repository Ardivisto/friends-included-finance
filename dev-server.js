'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const handler=require('./api/index');
const root=path.join(__dirname,'public');
const type={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
http.createServer((req,res)=>{const url=new URL(req.url,'http://local');if(url.pathname.startsWith('/api'))return handler(req,res);const name=url.pathname==='/'?'index.html':url.pathname.slice(1);const file=path.resolve(root,name);if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}fs.readFile(file,(error,data)=>{if(error){res.writeHead(404);return res.end('Not found');}res.writeHead(200,{'Content-Type':type[path.extname(file)]||'application/octet-stream'});res.end(data);});}).listen(process.env.PORT||3000,()=>console.log(`Local server on http://localhost:${process.env.PORT||3000}`));
