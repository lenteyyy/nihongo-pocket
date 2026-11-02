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

test('furigana attaches to kanji only and leaves okurigana outside ruby',async()=>{
 const {furiganaParts}=await import('../src/core.js');
 assert.deepEqual(furiganaParts('食べる','たべる'),[['食','た'],['べる','']]);
 assert.deepEqual(furiganaParts('申し込む','もうしこむ'),[['申','もう'],['し',''],['込','こ'],['む','']]);
 assert.deepEqual(furiganaParts('日本語','にほんご'),[['日本語','にほんご']]);
 assert.deepEqual(furiganaParts('何か','なにか'),[['何','なに'],['か','']]);
 assert.deepEqual(furiganaParts('食べる','しょく'),null);
 assert.deepEqual(furiganaParts('取り戻す','とりもどす'),[['取','と'],['り',''],['戻','もど'],['す','']]);
});
