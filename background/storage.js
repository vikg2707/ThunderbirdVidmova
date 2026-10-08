const DB_KEYS={orders:"orders",processedMessages:"processedMessages",refusals:"refusals",unmatched:"unmatched"};
async function load(key,fallback){const d=await browser.storage.local.get(key);return d[key]??fallback}
async function save(key,value){await browser.storage.local.set({[key]:value})}
const getOrders=()=>load(DB_KEYS.orders,[]),saveOrders=x=>save(DB_KEYS.orders,x);
const getProcessedMessages=()=>load(DB_KEYS.processedMessages,[]);
async function markMessageProcessed(messageId,orderId,result){const a=await getProcessedMessages();if(a.some(x=>x.messageId===messageId))return;a.push({messageId,orderId,processedAt:new Date().toISOString(),result});await save(DB_KEYS.processedMessages,a)}
async function isMessageProcessed(id){return(await getProcessedMessages()).some(x=>x.messageId===id)}
const getRefusals=()=>load(DB_KEYS.refusals,[]),saveRefusals=x=>save(DB_KEYS.refusals,x);
const getUnmatched=()=>load(DB_KEYS.unmatched,[]);
async function saveUnmatched(items){await save(DB_KEYS.unmatched,items.slice(-500))}
globalThis.VDStorage={getOrders,saveOrders,getProcessedMessages,markMessageProcessed,isMessageProcessed,getRefusals,saveRefusals,getUnmatched,saveUnmatched};