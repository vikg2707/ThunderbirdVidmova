const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

test("learning an alias can reprocess every resolvable unmatched row for that message",async()=>{
  const source=fs.readFileSync(path.join(__dirname,"..","background","mail-monitor.js"),"utf8");
  const order={orderId:"order-1",supplier:"Supplier",subject:"Order",items:[
    {name:"Товар А",morionCode:"100",orderedQuantity:10},
    {name:"Товар Б",morionCode:"200",orderedQuantity:5}
  ]};
  const unmatched=[
    {orderId:"order-1",messageId:"msg-1",replyName:"Аліас А",confirmedQuantity:7},
    {orderId:"order-1",messageId:"msg-1",replyName:"Аліас Б",confirmedQuantity:0},
    {orderId:"order-1",messageId:"msg-other",replyName:"Аліас А",confirmedQuantity:1}
  ];
  const refusals=[],logs=[];
  const aliases={"аліас а":order.items[0],"аліас б":order.items[1]};
  const ctx={
    VDStorage:{
      getOrders:async()=>[order],
      getUnmatched:async()=>unmatched,
      resolveUnmatched:async(messageId,orderId,replyName,item)=>{
        for(const row of unmatched)if(!row.resolvedAt&&String(row.messageId)===String(messageId)&&String(row.orderId)===String(orderId)&&row.replyName===replyName){row.resolvedAt="now";row.resolvedMorionCode=item.morionCode;row.resolvedName=item.name;}
      },
      upsertRefusal:async x=>{refusals.push(x)},
      addProcessingLog:async x=>{logs.push(x)}
    },
    VDSupplier:{resolveAlias:async(_order,name)=>aliases[String(name).toLowerCase()]||null},
    VDNormalizer:{normalizeProductName:x=>String(x).toLowerCase()},
    VDMatcher:{normalizeMorionCode:x=>String(x)},
    console
  };
  vm.createContext(ctx);vm.runInContext(source,ctx);
  const result=await ctx.VDMailMonitor.reprocessUnmatchedMessage("msg-1","order-1");
  assert.equal(result.resolved,2);
  assert.equal(result.refusedQuantity,8);
  assert.equal(refusals.length,2);
  assert.equal(refusals.find(x=>x.morionCode==="100").refusedQuantity,3);
  assert.equal(refusals.find(x=>x.morionCode==="200").refusedQuantity,5);
  assert.equal(unmatched[0].resolvedAt,"now");
  assert.equal(unmatched[1].resolvedAt,"now");
  assert.equal(unmatched[2].resolvedAt,undefined);
  assert.equal(logs.length,1);
  assert.equal(logs[0].reprocessed,true);
  assert.equal(logs[0].unmatched,0);
});
