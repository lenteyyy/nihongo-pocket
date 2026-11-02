import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const load=async name=>JSON.parse(await readFile(new URL(`../datasets/published/${name}.json`,import.meta.url),'utf8'));
test('published sentences retain their exact text and have readings for each kanji token',async()=>{
 const sentences=await load('sentences');
 for(const s of sentences){
  assert.ok(s.ja.length<=45,s.id);
  assert.equal(s.ruby.map(([text])=>text).join(''),s.ja,s.id);
  for(const [text,kana] of s.ruby)if(/[\u3400-\u9fff々〆ヶ]/u.test(text))assert.ok(kana&&!/[a-z]/i.test(kana),`${s.id}: ${text}`);
 }
});
