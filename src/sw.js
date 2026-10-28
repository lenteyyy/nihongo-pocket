const CACHE='nihongo-pocket-v2.0';
const BASE=new URL('./',self.location.href).pathname;
const APP=['./','./index.html','./style.css','./app.js','./core.js','./icon.svg','./manifest.webmanifest','./data/vocabulary.json','./data/sentences.json','./data/grammar.json'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('nihongo-pocket-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin||!new URL(event.request.url).pathname.startsWith(BASE))return;event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request))) });
