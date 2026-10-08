const FULL_REFUSAL_PATTERNS=[/(?<![\p{L}\p{N}])відмова(?![\p{L}\p{N}])/iu,/(?<![\p{L}\p{N}])відмовлено(?![\p{L}\p{N}])/iu,/(?<![\p{L}\p{N}])немає(?![\p{L}\p{N}])/iu,/(?<![\p{L}\p{N}])нема(?![\p{L}\p{N}])/iu,/(?<![\p{L}\p{N}])відсут\w*/iu,/(?<![\p{L}\p{N}])отказ(?![\p{L}\p{N}])/iu,/(?<![\p{L}\p{N}])нет(?![\p{L}\p{N}])/iu,/(?<![\p{L}\p{N}])не\s*будет(?![\p{L}\p{N}])/iu,/(?<![\p{L}\p{N}])отсутств\w*/iu,/(?<![\p{L}\p{N}])нет\s+в\s+наличии(?![\p{L}\p{N}])/iu];
const PARTIAL_PATTERNS=[/(?:можемо\s+дати|можем\s+дать|дамо|дадим|відвантажимо|отгрузим|підтвердимо|подтвердим|поставим)\s*[:=-]?\s*(\d+(?:[.,]\d+)?)\s*(?:шт\.?|штук|од\.?|уп\.?)?/i,/(?:^|\s)(?:є|есть)\s*(\d+(?:[.,]\d+)?)\s*(?:шт\.?|штук|од\.?|уп\.?)?/i];
const QTY_PATTERNS=[/(?:^|\s)(\d+(?:[.,]\d+)?)\s*(?:шт\.?|штук|од\.?|уп\.?)(?=\s|$|[,.;:])/i,/(?:^|\s)(\d+(?:[.,]\d+)?)\s*(?:з|із|из|\/)\s*(\d+(?:[.,]\d+)?)(?:\s|$)/i];
function htmlToText(h){const d=new DOMParser().parseFromString(h||"","text/html");return(d?.body?.textContent||"").replace(/\u00a0/g," ")}
function cleanName(s){
 let v=String(s||"").replace(/\s+/g," ").trim();
 v=v.replace(/\s*[—–:\-]\s*(?:відмова|відмовлено|немає|нема|відсут\w*|отказ|нет|не\s*будет|отсутств\w*)(?:\s+\d+(?:[.,]\d+)?)?\s*[,;:]?\s*$/iu,"");
 return v.replace(/^[\s—–:\-]+|[\s—–:\-]+$/g,"").trim();
}
function parseLine(line){
 const t=String(line).replace(/\s+/g," ").trim();
 if(t.length<3)return null;
 for(const p of PARTIAL_PATTERNS){
  const m=t.match(p);
  if(m){const n=cleanName(t.slice(0,m.index));if(n.length>=3)return{name:n,confirmedQuantity:Number(String(m[1]).replace(",",".")),status:"partial",source:t}}
 }
 for(const p of QTY_PATTERNS){
  const m=t.match(p);
  if(m){
   const n=cleanName(t.slice(0,m.index));
   if(n.length>=3){
    const q=Number(String(m[1]).replace(",","."));
    const total=m[2]?Number(String(m[2]).replace(",",". ")):null;
    return{name:n,confirmedQuantity:q,status:total!==null?"partial":"quantity",orderedQuantity:total,source:t}
   }
  }
 }
 for(const p of FULL_REFUSAL_PATTERNS)if(p.test(t)){
  const n=cleanName(t);
  if(n.length>=3)return{name:n,confirmedQuantity:0,status:"full_refusal",source:t}
 }
 return null
}
function parseReplyText(v){const r=String(v||""),t=/<\/?(?:html|body|div|p|br|table|tr|td)\b/i.test(r)?htmlToText(r):r;return t.split(/\r?\n/).map(parseLine).filter(Boolean)}
globalThis.VDParser={parseReplyText,parseLine};