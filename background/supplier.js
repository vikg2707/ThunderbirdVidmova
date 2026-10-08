function supplierKey(author){const s=String(author||"").toLowerCase();const m=s.match(/<([^>]+)>/);return(m?m[1]:s).trim()}
function aliasKey(x){return VDNormalizer.normalizeProductName(x)}
async function learnSupplier(order,attachmentNames=[]){const key=supplierKey(order.supplier);if(!key)return;const ext={};for(const n of attachmentNames){const x=String(n).toLowerCase().match(/\.(xlsx|xls|csv)$/);if(x)ext[x[1]]=(ext[x[1]]||0)+1}await VDStorage.upsertSupplier({key,displayName:order.supplier,subjectExample:order.subject,attachmentTypes:ext,itemsCount:order.items?.length||0})}
async function learnReplyFormat(order,format,signature=""){const key=supplierKey(order.supplier);if(!key||!format||!signature)return;const a=await VDStorage.getSuppliers(),p=a.find(x=>x.key===key),history=Array.isArray(p?.replyFormatHistory)?p.replyFormatHistory.slice():[],now=new Date().toISOString(),i=history.findIndex(x=>x.signature===signature);let entry;if(i>=0){entry={...history[i],uses:Number(history[i].uses||0)+1,lastSeen:now,format};history[i]=entry}else{entry={signature,uses:1,firstSeen:now,lastSeen:now,format};history.push(entry)}
const current=p?.replyFormat||null;
let stable=current;
if(!stable?.signature)stable=entry;
else if(stable.signature===signature)stable={...stable,...entry};
else if(entry.uses>=2)stable=entry;
history.sort((x,y)=>{const u=Number(y.uses||0)-Number(x.uses||0);return u||String(y.lastSeen||"").localeCompare(String(x.lastSeen||""))});
await VDStorage.upsertSupplier({key,replyFormat:{...stable.format,signature:stable.signature,learnedAt:stable.lastSeen,uses:stable.uses},replyFormatHistory:history.slice(0,5)})}
async function getReplyFormat(order){const key=supplierKey(order.supplier),a=await VDStorage.getSuppliers(),p=a.find(x=>x.key===key);return p?.replyFormat||null}
async function learnAlias(order,replyName,item,confidence="manual"){const key=supplierKey(order.supplier),alias=aliasKey(replyName),code=String(item?.morionCode||"");if(!key||!alias||!code)return false;if(confidence==="high")return false;const a=await VDStorage.getSuppliers(),p=a.find(x=>x.key===key);const aliases={...(p?.aliases||{})};aliases[alias]={morionCode:code,name:item.name,uses:Number(aliases[alias]?.uses||0)+1,lastConfidence:confidence};await VDStorage.upsertSupplier({key,aliases});return true}
async function resolveAlias(order,replyName){const key=supplierKey(order.supplier),alias=aliasKey(replyName),a=await VDStorage.getSuppliers(),p=a.find(x=>x.key===key),hit=p?.aliases?.[alias];if(!hit)return null;return order.items.find(x=>String(x.morionCode)===String(hit.morionCode))||null}
globalThis.VDSupplier={supplierKey,learnSupplier,learnAlias,resolveAlias,learnReplyFormat,getReplyFormat};