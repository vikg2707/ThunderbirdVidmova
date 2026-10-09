const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

test("date scan continues through unsorted pages instead of stopping at an old message",async()=>{
  const source=fs.readFileSync(path.join(__dirname,"..","background","background.js"),"utf8");
  const old={id:1,date:new Date("2026-10-07T22:00:00Z")};
  const recent={id:2,date:new Date("2026-10-08T08:00:00Z")};
  const recent2={id:3,date:new Date("2026-10-09T08:00:00Z")};
  const ctx={
    browser:{
      accounts:{list:async()=>[],onStartup:{addListener:()=>{}}},
      messages:{
        list:async()=>({id:"page-2",messages:[old]}),
        continueList:async id=>{assert.equal(id,"page-2");return{id:null,messages:[recent,recent2]}},
        onNewMailReceived:{addListener:()=>{}}
      },
      runtime:{onMessage:{addListener:()=>{}},onStartup:{addListener:()=>{}}},
    },
    VDStorage:{getOrders:async()=>[],getRefusals:async()=>[],getUnmatched:async()=>[],getSuppliers:async()=>[],getProcessingLog:async()=>[]},
    VDMailMonitor:{},
    setInterval:()=>1,clearInterval:()=>{},
    console
  };
  vm.createContext(ctx);
  vm.runInContext(source,ctx);
  const result=await ctx.VDScanInternals.messagesSince({id:"sent"},new Date("2026-10-08T00:00:00Z").getTime());
  assert.deepEqual(Array.from(result,m=>m.id),[2,3]);
});
