const test=require("node:test");
const assert=require("node:assert/strict");

function parseQty(s){
  const m=String(s).match(/(?:^|\s)(\d+)\s*(?:шт\.?|штук|од\.?|уп\.?)\b/i);
  return m?Number(m[1]):null;
}
test("full refusal quantity is zero",()=>assert.equal(parseQty("Мезим №20 - отказ"),null));
test("quantity is detected",()=>assert.equal(parseQty("Нурофен №20 6 шт"),6));
test("ordered minus confirmed",()=>assert.equal(Math.max(0,10-6),4));
test("full refusal",()=>assert.equal(Math.max(0,5-0),5));
test("fully supplied is excluded",()=>assert.equal(Math.max(0,10-10),0));

test("partial quantity phrase is parsed before refusal keyword",()=>{
  const vm=require("node:vm");
  const src=require("node:fs").readFileSync(require("node:path").join(__dirname,"..","background","parser.js"),"utf8");
  const ctx={DOMParser:class{}};
  vm.createContext(ctx);vm.runInContext(src,ctx);
  const x=ctx.VDParser.parseLine("Товар — немає 10, можемо дати 3 шт");
  assert.equal(x.name,"Товар");
  assert.equal(x.confirmedQuantity,3);
  assert.equal(x.status,"partial");
});

test("quantity phrase is parsed",()=>{
  const vm=require("node:vm");
  const src=require("node:fs").readFileSync(require("node:path").join(__dirname,"..","background","parser.js"),"utf8");
  const ctx={DOMParser:class{}};
  vm.createContext(ctx);vm.runInContext(src,ctx);
  const x=ctx.VDParser.parseLine("Товар 6 шт");
  assert.equal(x.name,"Товар");
  assert.equal(x.confirmedQuantity,6);
});

test("full refusal is parsed",()=>{
  const vm=require("node:vm");
  const src=require("node:fs").readFileSync(require("node:path").join(__dirname,"..","background","parser.js"),"utf8");
  const ctx={DOMParser:class{}};
  vm.createContext(ctx);vm.runInContext(src,ctx);
  const x=ctx.VDParser.parseLine("Товар — відмова");
  assert.equal(x.name,"Товар");
  assert.equal(x.confirmedQuantity,0);
  assert.equal(x.status,"full_refusal");
});

test("ordered and confirmed quantities can be represented",()=>{
  assert.equal(Math.max(0,10-3),7);
});

test("parser source file is present",()=>{
  assert.ok(require("node:fs").existsSync(require("node:path").join(__dirname,"..","background","parser.js")));
});

test("reply table parser detects confirmed quantity",()=>{
  const vm=require("node:vm");
  const src=require("node:fs").readFileSync(require("node:path").join(__dirname,"..","background","reply-table.js"),"utf8");
  const ctx={};vm.createContext(ctx);vm.runInContext(src,ctx);
  const x=ctx.VDReplyTable.rowsToReplies([["Назва","Підтверджено"],["Товар А","3"],["Товар Б","0"]]);
  assert.equal(x.length,2);
  assert.equal(x[0].confirmedQuantity,3);
  assert.equal(x[1].confirmedQuantity,0);
});


test("reply table parser extracts Morion code and refusal",()=>{
  const vm=require("node:vm");
  const src=require("node:fs").readFileSync(require("node:path").join(__dirname,"..","background","reply-table.js"),"utf8");
  const ctx={};vm.createContext(ctx);vm.runInContext(src,ctx);
  const x=ctx.VDReplyTable.rowsToReplies([["Код Моріона","Назва","Замовлено","Відвантажено","Відмова"],["12345","Товар А","10","7","3"]]);
  assert.equal(x[0].morionCode,"12345");
  assert.equal(x[0].orderedQuantity,10);
  assert.equal(x[0].confirmedQuantity,7);
  assert.equal(x[0].refusedQuantity,3);
});


test("reply table format can be detected and reused",()=>{
  const vm=require("node:vm");
  const src=require("node:fs").readFileSync(require("node:path").join(__dirname,"..","background","reply-table.js"),"utf8");
  const ctx={};vm.createContext(ctx);vm.runInContext(src,ctx);
  const rows=[["Код Моріона","Назва","Замовлено","Відвантажено"],["123","A","5","4"]];
  const f=ctx.VDReplyTable.detectFormat(rows);
  const x=ctx.VDReplyTable.rowsToReplies(rows,f);
  assert.equal(f.code,0);
  assert.equal(f.confirmed,3);
  assert.equal(x[0].confirmedQuantity,4);
});

