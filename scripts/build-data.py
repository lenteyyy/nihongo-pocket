#!/usr/bin/env python3
"""Build a compact, example-backed personal study set from the imiwa export."""
import json, re, sys
from pathlib import Path
from collections import defaultdict
root=Path(__file__).resolve().parents[1]
source=Path(sys.argv[1]) if len(sys.argv)>1 else root.parent.parent/'imiwa-decoded'
out=root/'public/data';out.mkdir(parents=True,exist_ok=True)
patterns=['に伴って','に伴い','につれて','にしたがって','にもかかわらず','に違いない','わけではない','ざるを得ない','にすぎない','ことになる','ことはない','おそれがある','に応じて','に対して','に関して','に比べて','一方で','上で']
words={}
with (source/'dictionary.jsonl').open(encoding='utf-8') as f:
 for line in f:
  o=json.loads(line); forms=[x.get('e','') for x in o.get('k',[]) if x.get('e')]; reads=[x.get('e','') for x in o.get('r',[]) if x.get('e')]; senses=o.get('s',[])
  word=forms[0] if forms else (reads[0] if reads else '')
  meanings={lang:[m for s in senses for m in s.get('m',{}).get(lang,[])] for lang in ['eng']}
  if not word or not reads or not meanings['eng'] or len(word)>14: continue
  if not re.search(r'[一-龯]',word) or len(word)<2: continue
  priorities=[p for x in (o.get('k',[])+o.get('r',[])) for p in x.get('p',[])]
  pos=[]
  for sense in senses:
   for v in sense.get('p',[]):
    code=v.get('e',{}).get('c')
    if code and code not in pos:pos.append(code)
  words[o['n']]={'id':str(o['n']),'word':word,'kana':reads[0], 'forms':forms,'meaning':{k:v[:8] for k,v in meanings.items() if v},'pos':pos[:5], 'level':'', 'priority':priorities, 'source':'JMdict'}
examples={}; sentences={}; grammar={p:[] for p in patterns}
with (source/'sentences.jsonl').open(encoding='utf-8') as f:
 for line in f:
  x=json.loads(line); ja=x['japanese']; trans=x.get('translations',{})
  if not (8<=len(ja)<=70 and trans.get('eng')):continue
  if '\n' in ja or '\r' in ja:continue
  sid=str(x['id']); item={'id':sid,'ja':ja,'translations':{k:v for k,v in trans.items() if k == 'eng'},'source':'Tatoeba','romaji':x.get('romaji','')}
  matched=set()
  for token in (x.get('analysis') or {}).get('t',[]):
   for ref in token.get('x',[]):
    w=words.get(ref)
    if w and (w['word'] in ja or token.get('e')==w['word']) and ref not in examples:
     examples[ref]=sid;matched.add(ref)
  matched_patterns=[p for p in patterns if p in ja and len(grammar[p])<3]
  if matched or matched_patterns or len(sentences)<12000:
   sentences[sid]=item
   for p in matched_patterns:grammar[p].append(sid)
# Select abundant example-backed content, favouring actual dictionary priority markers.
def score(w):
 return (0 if any(p in ('news1','ichi1','spec1') for p in w['priority']) else 1, 0 if len(w['word'])>=3 else 1, w['id'])
selected=sorted((w for id,w in words.items() if id in examples),key=score)[:12000]
for w in selected:w['exampleId']=examples[int(w['id'])]
needed={w['exampleId'] for w in selected}
needed.update(sid for ids in grammar.values() for sid in ids)
# Keep a substantial sentence feed while avoiding a 200k-sentence first download.
needed.update(list(sentences)[:12000])
selected_sentences=[s for sid,s in sentences.items() if sid in needed]
grammar_items=[{'id':'grammar-'+str(i),'pattern':p,'exampleIds':ids,'level':''} for i,(p,ids) in enumerate(grammar.items()) if ids]
for name,data in [('vocabulary',selected),('sentences',selected_sentences),('grammar',grammar_items)]:
 (out/(name+'.json')).write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print(json.dumps({'vocabulary':len(selected),'sentences':len(selected_sentences),'grammar':len(grammar_items),'words_with_example':sum(w['exampleId'] in needed for w in selected)},ensure_ascii=False))
