const NAME=["назва","найменування","наименование","товар","название","name","опис"];
const CONF=["підтверджено","підтверджено кількість","відвантажено","відпускаємо","відвантажимо","есть","є","наличие","в наявності","кількість підтверджено","qty","quantity","факт","фактично"];
const STATUS=["статус","status","результат","відмова","коментар","комментарий","примітка","примечание"];
function n(x){return String(x??"").toLowerCase().replace(/[№._-]/g," ").replace(/\s+/g," ").trim()}
function idx(h,a){const z=h.map(n);for(const x of a){const i=z.indexOf(n(x));if(i>=0)return i}return -1}
function num(x){const v=String(x??"").trim().replace(/\s/g,"").replace(",",".");const q=Number(v);return Number.isFinite(q)?q:null}
function rowsToReplies(rows){
 if(!rows.length)return[];
 let hi=-1,score=-1;
 for(let i=0;i<Math.min(15,rows.length);i++){const s=rows[i].filter(x=>NAME.concat(CONF,STATUS).some(a=>n(x)===n(a))).length;if(s>score){score=s;hi=i}}
 if(score<2)return[];
 const h=rows[hi],ni=idx(h,NAME),ci=idx(h,CONF),si=idx(h,STATUS);if(ni<0)return[];
 const out=[];
 for(const r of rows.slice(hi+1)){
  const name=String(r[ni]??"").trim();if(!name)continue;
  let q=ci>=0?num(r[ci]):null;
  const status=si>=0?String(r[si]??"").trim():"";
  if(q===null&&/відмов|отказ|немає|нет|відсут|отсутств/i.test(status))q=0;
  if(q===null)continue;
  out.push({name,confirmedQuantity:q,status:status||"table"});
 }
 return out
}
globalThis.VDReplyTable={rowsToReplies};