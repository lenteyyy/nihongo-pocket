import http from 'node:http';
import https from 'node:https';
import {readFile, stat} from 'node:fs/promises';
import path from 'node:path';
const port=Number(process.env.PORT || 4173),root=path.resolve('dist');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json','.svg':'image/svg+xml'};
http.createServer(async(req,res)=>{try{let url=new URL(req.url,'http://localhost');if(url.pathname==='/api/tts'){
 const text=url.searchParams.get('text')||'';if(!text||Array.from(text).length>180){res.writeHead(400);res.end();return}
 const params=new URLSearchParams({ie:'UTF-8',client:'tw-ob',tl:'ja',q:text});
 const upstream=https.get('https://translate.google.com/translate_tts?'+params,{headers:{'User-Agent':'Mozilla/5.0'}},r=>{if(r.statusCode!==200||!String(r.headers['content-type']||'').startsWith('audio/')){res.writeHead(502);res.end();r.resume();return}res.writeHead(200,{'Content-Type':'audio/mpeg','Cache-Control':'no-store'});r.pipe(res)});
 upstream.setTimeout(15000,()=>upstream.destroy());upstream.on('error',()=>{if(!res.headersSent)res.writeHead(502);res.end()});req.on('close',()=>{if(!res.writableEnded)upstream.destroy()});return;
 }let rel=decodeURIComponent(url.pathname);let file=path.resolve(root,'.'+rel);if(!file.startsWith(root+path.sep)&&file!==root)throw 0;if((await stat(file)).isDirectory())file=path.join(file,'index.html');let body=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(body)}catch{res.writeHead(404);res.end('Not found')}}).listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}/`));
