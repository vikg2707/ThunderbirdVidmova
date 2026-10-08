const DB_KEYS={orders:"orders",processedMessages:"processedMessages",refusals:"refusals",unmatched:"unmatched",suppliers:"suppliers",processingLog:"processingLog"};
async function load(k,f){const d=await browser.storage.local.get(k);return d[k]??f}async function save(k,v){await browser.storage.local.set({[k]:v})}
const getOrders=()=>load(DB_KEYS.orders,[]),saveOrders=x=>save(DB_KEYS.orders,x),getProcessedMessages=()=>load(DB_KEYS.processedMessages,[]);
async function markMessageProcessed(messageId,orderId,result){const a=await getProcessedMessages();if(a.some(x=>x.messageId===messageId))return;a.push({messageId,orderId,processedAt:new Date().toISOString(),result});await save(DB_KEYS.processedMessages,a)}
async function isMessageProcessed(id){return(await getProcessedMessages()).some(x=>x.messageId===id)}
const getRefusals=()=>load(DB_KEYS.refusals,[]),saveRefusals=x=>save(DB_KEYS.refusals,x),getUnmatched=()=>load(DB_KEYS.unmatched,[]);
async function saveUnmatched(x){await save(DB_KEYS.unmatched,x.slice(-500))}
const getSuppliers=()=>load(DB_KEYS.suppliers,[]),getProcessingLog=()=>load(DB_KEYS.processingLog,[]);
async function upsertSupplier(profile){const a=await getSuppliers(),k=String(profile.key||"").toLowerCase(),i=a.findIndex(x=>x.key===k);if(i>=0)a[i]={...a[i],...profile,lastSeen:new Date().toISOString()};else a.push({...profile,key:k,firstSeen:new Date().toISOString(),lastSeen:new Date().toISOString()});await save(DB_KEYS.suppliers,a)}
async function addProcessingLog(x){const a=await getProcessingLog();a.push({...x,seenAt:x.seenAt||new Date().toISOString()});await save(DB_KEYS.processingLog,a.slice(-1000))}
globalThis.VDStorage={getOrders,saveOrders,getProcessedMessages,markMessageProcessed,isMessageProcessed,getRefusals,saveRefusals,getUnmatched,saveUnmatched,getSuppliers,upsertSupplier,getProcessingLog,addProcessingLog};