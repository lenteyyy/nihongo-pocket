import { access, cp, mkdir, rm } from 'node:fs/promises';
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await cp('src', 'dist', { recursive: true });
let published=process.argv.includes('--published');
if(!published){try{await access('public/data/vocabulary.json')}catch{published=true}}
if(published) await cp('datasets/published','dist/data',{recursive:true});
else await cp('public', 'dist', { recursive: true });
console.log(`Built static site in dist/ (${published?'published':'local'} data).`);
