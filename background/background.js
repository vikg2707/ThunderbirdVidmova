async function saveOrderFromMessage(message){
  const existing=await VDStorage.getOrders();
  if(existing.some(o=>o.messageId===message.id))return null;
  const text=await VDMailMonitor.extractMessageText(message.id);
  const items=VDOrderParser.parseOrderText(text);
  if(!items.length)return null;
  const order={
    orderId:"order-"+message.id,
    date:message.date,
    supplier:message.author||"",
    subject:message.subject||"",
    messageId:message.id,
    items
  };
  existing.push(order);
  await VDStorage.saveOrders(existing);
  return order;
}

async function scanSentOrders(){
  try{
    const accounts=await browser.accounts.list(false);
    const cutoff=Date.now()-14*24*3600*1000;
    for(const account of accounts||[]){
      const sent=account.identities?.length ? null : null;
      const folders=[];
      function walk(f){
        if(!f)return;
        if(String(f.type||"").toLowerCase()==="sent")folders.push(f);
        for(const c of f.subFolders||[])walk(c);
      }
      walk(account.rootFolder);
      for(const folder of folders){
        const list=await browser.messages.list(folder,{sortType:"date",sortOrder:"descending"});
        for(const message of list.messages||[]){
          if(new Date(message.date).getTime()<cutoff)break;
          await saveOrderFromMessage(message);
        }
      }
    }
  }catch(e){console.error("Sent-order scan error",e);}
}

async function folders(){
  const a=await browser.accounts.list(false),o=[];
  function w(f){if(!f)return;o.push(f);for(const c of f.subFolders||[])w(c)}
  for(const x of a||[])w(x.rootFolder);
  return o
}

async function scanIncoming(){
  if(running)return;
  running=true;
  try{
    await scanSentOrders();
    if(!(await VDStorage.getOrders()).length)return;
    const cutoff=Date.now()-604800000;
    for(const f of await folders()){
      const l=await browser.messages.list(f,{sortType:"date",sortOrder:"descending"});
      for(const m of l.messages||[]){
        if(new Date(m.date).getTime()<cutoff)break;
        if(await VDStorage.isMessageProcessed(m.id))continue;
        await VDMailMonitor.processReplyMessage(m)
      }
    }
  }catch(e){console.error("ThunderbirdVidmova scan error",e)}
  finally{running=false}
}

let timer=null,running=false;
function start(){if(timer)clearInterval(timer);timer=setInterval(scanIncoming,45000);scanIncoming()}
browser.runtime.onMessage.addListener(async m=>{
  if(m?.type==="GET_REFUSALS")return VDStorage.getRefusals();
  if(m?.type==="GET_ORDERS")return VDStorage.getOrders();
  if(m?.type==="CLEAR_REFUSALS"){await VDStorage.saveRefusals([]);return[]}
  if(m?.type==="SCAN_NOW"){await scanIncoming();return VDStorage.getRefusals()}
  return null
});
browser.runtime.onStartup.addListener(start);
start();