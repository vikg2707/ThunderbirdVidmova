const CODE=["код моріона","код моріона товара","код","morion","morion code","код товара","код товару","артикул","код_товару"];
const NAME=["назва","найменування","наименование","товар","название","name","опис"];
const ORDERED=["замовлено","заказано","замовлення","кількість замовлено","количество заказано"];
const CONF=["підтверджено","підтверджено кількість","відвантажено","відпущено","відпускаємо","відвантажимо","есть","є","наличие","в наявності","кількість підтверджено","qty","quantity","факт","фактично"];
const REFUSED=["відмова","відмовлено","відмовлено кількість","отказ","отказано","немає","нет","відсутність","отсутствует"];
const STATUS=["статус","status","результат","коментар","комментарий","примітка","примечание"];
function n(x){return String(x??"").toLowerCase().replace(/[№._-]/g," ").replace(/\s+/g," ").trim()}
function idx(h,a){const z=h.map(n);for(const x of a){const i=z.indexOf(n(x));if(i>=0)return i}return -1}
function num(x){const v=String(x??"").trim().replace(/\s/g,"").replace(",",".");const q=Number(v);return Number.isFinite(q)?q:null}
function detectFormat(rows){if(!rows.length)return null;let hi=-1,score=-1;for(let i=0;i<Math.min(15,rows.length);i++){const s=rows[i].filter(x=>CODE.concat(NAME,ORDERED,CONF,REFUSED,STATUS).some(a=>n(x)===n(a))).length;if(s>score){score=s;hi=i}}if(score<2)return null;const h=rows[hi];return {headerRow:hi,code:idx(h,CODE),name:idx(h,NAME),ordered:idx(h,ORDERED),confirmed:idx(h,CONF),refused:idx(h,REFUSED),status:idx(h,STATUS)}}
function formatSignature(rows,format){const f=format||detectFormat(rows);if(!f||!rows[f.headerRow])return "";return rows[f.headerRow].map(x=>n(x)).join("|")}
function rowsToReplies(rows,format){
 if(!rows.length)return[];
 const f=format||detectFormat(rows);if(!f)return[];
 const hi=f.headerRow,ci=f.code,ni=f.name,oi=f.ordered,pi=f.confirmed,ri=f.refused,si=f.status;
 if(ni<0)return[];
 const out=[];
 for(const r of rows.slice(hi+1)){
  const name=String(r[ni]??"").trim();if(!name)continue;
  const morionCode=ci>=0?String(r[ci]??"").trim():"";
  const ordered=oi>=0?num(r[oi]):null;
  let confirmed=pi>=0?num(r[pi]):null;
  const refused=ri>=0?num(r[ri]):null;
  const status=si>=0?String(r[si]??"").trim():"";
  if(confirmed===null&&refused!==null&&ordered!==null)confirmed=Math.max(0,ordered-refused);
  if(confirmed===null&&/відмов|отказ|немає|нет|відсут|отсутств/i.test(status))confirmed=0;
  if(confirmed===null)continue;
  out.push({name,morionCode,orderedQuantity:ordered,confirmedQuantity:confirmed,refusedQuantity:refused,status:status||"table"});
 }
 return out
}
globalThis.VDReplyTable={rowsToReplies,detectFormat,formatSignature};