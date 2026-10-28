export function dayKey(date=new Date()){const d=new Date(date);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
export function normalize(s){return String(s||'').normalize('NFKC').replace(/[\s、。！？!?,.「」『』，．・…〜～]/g,'').toLowerCase()}
// A transparent interval scheduler; not FSRS. All times are local date boundaries.
export function schedule(previous,grade,now=new Date()){const p=previous||{reviews:0,lapses:0,interval:0};let interval;if(grade==='again')interval=1;else if(grade==='hard')interval=Math.max(1,Math.ceil((p.interval||1)*1.2));else if(grade==='easy')interval=p.reviews?Math.max(4,Math.ceil(p.interval*2.5)):4;else interval=p.reviews?Math.max(2,Math.ceil(p.interval*2)):2;const next=new Date(now);next.setHours(0,0,0,0);next.setDate(next.getDate()+interval);return {...p,reviews:p.reviews+1,lapses:p.lapses+(grade==='again'?1:0),interval,lastReview:new Date(now).toISOString(),due:dayKey(next),lastGrade:grade}}
export function seedForDay(day){let n=2166136261;for(const c of day)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0}
export function shuffled(items,seed){const a=[...items];let s=seed||1;for(let i=a.length-1;i>0;i--){s=(Math.imul(s,1664525)+1013904223)>>>0;const j=s%(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
export const PRACTICE_TYPES=['recognition','recall','production','dictation','translation','translation_reverse','listening','grammar'];
export function makePlan({words,sentences,grammar,reviews={},count=40,day=dayKey(),mode='today',practiceType='recall'}){
 const direct={vocabulary:'recall',recognition:'recognition',recall:'recall',production:'production',dictation:'dictation',translation:'translation',translation_reverse:'translation_reverse',listening:'listening',grammar:'grammar'};
 const type=direct[mode]||practiceType;if(!PRACTICE_TYPES.includes(type))return [];
 const seed=seedForDay(day+mode+type),sentenceMap=new Map(sentences.map(s=>[s.id,s]));
 const eligible=words.filter(w=>w.meaning?.eng?.length&&sentenceMap.has(w.exampleId)&&(!['translation','translation_reverse'].includes(type)||sentenceMap.get(w.exampleId).translations?.eng?.length));
 const ordered=(items)=>{const due=items.filter(w=>reviews[w.id]?.due&&reviews[w.id].due<=day),fresh=items.filter(w=>!reviews[w.id]),later=items.filter(w=>reviews[w.id]?.due>day);return mode==='review'?shuffled(due,seed):[...shuffled(due,seed),...shuffled(fresh,seed+1),...shuffled(later,seed+2)]};
 if(type==='grammar'){
  const choices=ordered(grammar.filter(g=>g.exampleIds?.some(id=>sentenceMap.has(id))));
  if(!choices.length||!eligible.length)return [];
  const n=mode==='review'?Math.min(count,choices.length):count;
  return Array.from({length:n},(_,i)=>{const g=choices[i%choices.length],examples=g.exampleIds.filter(id=>sentenceMap.has(id));return {wordId:eligible[i%eligible.length].id,type,grammarId:g.id,exampleId:examples[Math.floor(i/choices.length)%examples.length]}});
 }
 const pool=ordered(eligible);if(!pool.length)return [];const n=mode==='review'?Math.min(count,pool.length):count;
 return Array.from({length:n},(_,i)=>({wordId:pool[i%pool.length].id,type,grammarId:null,exampleId:pool[i%pool.length].exampleId}));
}
export function parseCSV(text){text=text.replace(/^\uFEFF/,'');let rows=[],row=[],field='',quote=false;for(let i=0;i<text.length;i++){const c=text[i];if(quote){if(c==='"'&&text[i+1]==='"'){field+='"';i++}else if(c==='"')quote=false;else field+=c}else if(c==='"')quote=true;else if(c===','){row.push(field);field=''}else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);if(row.some(x=>x.trim()))rows.push(row);row=[];field=''}else field+=c}if(quote)throw new Error('CSV の引用符が閉じられていません');if(field||row.length){row.push(field);rows.push(row)}if(!rows.length)return [];const headers=rows.shift().map(x=>x.trim().toLowerCase());return rows.map(values=>Object.fromEntries(headers.map((h,i)=>[h,(values[i]||'').trim()]))) }
export function diff(expected,actual){const a=Array.from(expected),b=Array.from(actual);if(a.length*b.length>40000)return [{type:'same',text:actual}];const dp=Array.from({length:a.length+1},()=>new Uint16Array(b.length+1));for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)dp[i][j]=a[i]===b[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);let i=0,j=0,out=[];function add(type,char){if(out.length&&out.at(-1).type===type)out.at(-1).text+=char;else out.push({type,text:char})}while(i<a.length||j<b.length){if(i<a.length&&j<b.length&&a[i]===b[j]){add('same',a[i]);i++;j++}else if(j<b.length&&(i===a.length||dp[i][j+1]>=dp[i+1][j]))add('extra',b[j++]);else add('missing',a[i++])}return out}
