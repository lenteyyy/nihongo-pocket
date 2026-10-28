#!/usr/bin/env python3
"""Match imiwa's sentences and translations to Tatoeba's public export.

Usage: python3 scripts/build-public-data.py JAPANESE.bz2 ENGLISH.bz2 LINKS.bz2
Only byte-for-byte unchanged sentences and translations with linked IDs are published.
"""
import bz2, collections, json, sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
if len(sys.argv)!=4:raise SystemExit(__doc__)
source=root/'public/data';output=root/'datasets/published';output.mkdir(parents=True,exist_ok=True)
load=lambda name:json.loads((source/(name+'.json')).read_text(encoding='utf-8'))
sentences=load('sentences');wanted={s['id']:s for s in sentences};jp={}
with bz2.open(sys.argv[1],'rt',encoding='utf-8') as f:
 for line in f:
  row=line.rstrip('\n').split('\t')
  if row[0] in wanted and len(row)>=4:jp[row[0]]=row
links=collections.defaultdict(list)
with bz2.open(sys.argv[3],'rt',encoding='utf-8') as f:
 for line in f:
  row=line.rstrip('\n').split('\t')
  if len(row)>=2 and row[0] in wanted:links[row[0]].append(row[1])
need={id for ids in links.values() for id in ids};en={}
with bz2.open(sys.argv[2],'rt',encoding='utf-8') as f:
 for line in f:
  row=line.rstrip('\n').split('\t')
  if row[0] in need and len(row)>=4:en[row[0]]=row
verified=[]
for old in sentences:
 sid=old['id'];original=jp.get(sid)
 if not original or original[2]!=old['ja']:continue
 values=old.get('translations',{}).get('eng',[]);matches=[]
 for id in links[sid]:
  row=en.get(id)
  if row and row[2] in values and row[2] not in [x['text'] for x in matches]:
   matches.append({'id':id,'author':None if row[3]=='\\N' else row[3],'text':row[2]})
 if not matches:continue
 matches.sort(key=lambda x:values.index(x['text']))
 verified.append({'id':sid,'ja':old['ja'],'translations':{'eng':[x['text'] for x in matches]},'source':'Tatoeba',
  'attribution':{'ja':{'id':sid,'author':None if original[3]=='\\N' else original[3]},'eng':[{'id':x['id'],'author':x['author']} for x in matches]}})
ids={s['id'] for s in verified};words=[w for w in load('vocabulary') if w['exampleId'] in ids]
grammar=[]
for g in load('grammar'):
 item={**g,'exampleIds':[i for i in g['exampleIds'] if i in ids]}
 if item['exampleIds']:grammar.append(item)
for name,data in [('vocabulary',words),('sentences',verified),('grammar',grammar)]:
 (output/(name+'.json')).write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print(json.dumps({'vocabulary':len(words),'sentences':len(verified),'grammar':len(grammar),'excluded_unverified_sentences':len(sentences)-len(verified)},ensure_ascii=False))
