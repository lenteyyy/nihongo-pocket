import { access, cp, mkdir, rm, readFile, writeFile } from 'node:fs/promises';
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await cp('src', 'dist', { recursive: true });
let published=process.argv.includes('--published');
if(!published){try{await access('public/data/vocabulary.json')}catch{published=true}}
if(published){
 await cp('datasets/published','dist/data',{recursive:true});
 const path='dist/index.html';
 const html=await readFile(path,'utf8');
 const beacon=`<script type="module" src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{&quot;token&quot;:&quot;caf5e3ce5c0f4c879461f09964737766&quot;}'></script>`;
 await writeFile(path,html.replace('</head>',`${beacon}</head>`));
}
else await cp('public', 'dist', { recursive: true });
console.log(`Built static site in dist/ (${published?'published':'local'} data).`);
