#!/usr/bin/env python3
"""Update the publication's imiwa-selected JMdict entries from a current JSON release.

Usage: python3 scripts/update-public-jmdict.py /path/to/jmdict-eng-VERSION.json.tgz
Only source entry IDs are retained; entries no longer found are excluded.
"""
import json,sys,tarfile
from pathlib import Path
root=Path(__file__).resolve().parents[1]
if len(sys.argv)!=2:raise SystemExit(__doc__)
archive=Path(sys.argv[1]);file=root/'datasets/published/vocabulary.json'
old=json.loads(file.read_text(encoding='utf-8'))
with tarfile.open(archive,'r:gz') as tf:
 members=[m for m in tf.getmembers() if m.isfile() and m.name.endswith('.json') and '/' not in m.name]
 if len(members)!=1:raise SystemExit('Expected one JSON file in the release archive')
 data=json.load(tf.extractfile(members[0]))
if not data.get('dictDate') or not data.get('words'):raise SystemExit('Missing source data or date')
lookup={x['id']:x for x in data['words']};updated=[];rejected=0
for w in old:
 new=lookup.get(w['id'])
 if not new:rejected+=1;continue
 forms=[x['text'] for x in new.get('kanji',[])];readings=new.get('kana',[])
 if w['word'] not in forms and not any(x.get('text')==w['word'] for x in readings):rejected+=1;continue
 allowed=[x['text'] for x in readings if '*' in x.get('appliesToKanji',[]) or w['word'] in x.get('appliesToKanji',[])]
 if not allowed:rejected+=1;continue
 gloss=[];pos=[]
 for sense in new.get('sense',[]):
  for x in sense.get('gloss',[]):
   if x.get('lang')=='eng' and x.get('text') and x['text'] not in gloss:gloss.append(x['text'])
  for x in sense.get('partOfSpeech',[]):
   if x not in pos:pos.append(x)
 if not gloss:rejected+=1;continue
 item={**w,'forms':forms,'kana':w['kana'] if w['kana'] in allowed else allowed[0], 'meaning':{'eng':gloss[:8]},'pos':pos[:5]}
 updated.append(item)
file.write_text(json.dumps(updated,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
metadata={'source':'JMdict / EDRDG; JSON release converted by jmdict-simplified','date':data['dictDate'],'release':archive.name,'words':len(updated),'excluded':rejected}
(root/'datasets/published/dictionary-version.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(metadata,ensure_ascii=False))
