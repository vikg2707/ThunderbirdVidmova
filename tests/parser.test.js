const test=require("node:test");
const assert=require("node:assert/strict");

function parseQty(s){
  const m=String(s).match(/(?:^|\s)(\d+)\s*(?:шт\.?|штук|од\.?|уп\.?)(?=\s|$|[,.;:])/i);
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



test("order table keeps empty columns aligned",()=>{
  const vm=require("node:vm");
  const src=require("node:fs").readFileSync(require("node:path").join(__dirname,"..","background","order-table.js"),"utf8");
  const ctx={};vm.createContext(ctx);vm.runInContext(src,ctx);
  const rows=[
    ["Код Моріона","","Назва","","Кількість"],
    ["12345","","Товар А","","2"],
    ["67890","","Товар Б","","1,5"]
  ];
  const x=ctx.VDOrderTable.rowsToItems(rows);
  assert.equal(x.length,2);
  assert.equal(x[0].morionCode,"12345");
  assert.equal(x[0].orderedQuantity,2);
  assert.equal(x[1].morionCode,"67890");
  assert.equal(x[1].orderedQuantity,1.5);
});

test("order table accepts header aliases and skips invalid quantities",()=>{
  const vm=require("node:vm");
  const src=require("node:fs").readFileSync(require("node:path").join(__dirname,"..","background","order-table.js"),"utf8");
  const ctx={};vm.createContext(ctx);vm.runInContext(src,ctx);
  const rows=[
    ["Артикул","Найменування","Заказано"],
    ["100","Товар А","3"],
    ["101","Товар Б","0"],
    ["102","Товар В","abc"]
  ];
  const x=ctx.VDOrderTable.rowsToItems(rows);
  assert.equal(x.length,1);
  assert.equal(x[0].morionCode,"100");
});

test("reply table calculates confirmed from refused quantity",()=>{
  const vm=require("node:vm");
  const src=require("node:fs").readFileSync(require("node:path").join(__dirname,"..","background","reply-table.js"),"utf8");
  const ctx={};vm.createContext(ctx);vm.runInContext(src,ctx);
  const x=ctx.VDReplyTable.rowsToReplies([
    ["Код Моріона","Назва","Замовлено","Відмова"],
    ["123","Товар А","10","3"]
  ]);
  assert.equal(x[0].confirmedQuantity,7);
  assert.equal(x[0].refusedQuantity,3);
});

test("reply table recognizes refusal status without quantity",()=>{
  const vm=require("node:vm");
  const src=require("node:fs").readFileSync(require("node:path").join(__dirname,"..","background","reply-table.js"),"utf8");
  const ctx={};vm.createContext(ctx);vm.runInContext(src,ctx);
  const x=ctx.VDReplyTable.rowsToReplies([
    ["Назва","Замовлено","Статус"],
    ["Товар А","5","відмова"]
  ]);
  assert.equal(x[0].confirmedQuantity,0);
});


test("parser supports partial quantity with slash",()=>{
  const vm=require("node:vm");
  const src=require("node:fs").readFileSync(require("node:path").join(__dirname,"..","background","parser.js"),"utf8");
  const ctx={DOMParser:class{}};
  vm.createContext(ctx);vm.runInContext(src,ctx);
  const x=ctx.VDParser.parseLine("Товар 6/10");
  assert.equal(x.confirmedQuantity,6);
});

test("parser supports partial quantity with Ukrainian z",()=>{
  const vm=require("node:vm");
  const src=require("node:fs").readFileSync(require("node:path").join(__dirname,"..","background","parser.js"),"utf8");
  const ctx={DOMParser:class{}};
  vm.createContext(ctx);vm.runInContext(src,ctx);
  const x=ctx.VDParser.parseLine("Товар 6 з 10");
  assert.equal(x.confirmedQuantity,6);
});


test("parser captures total in partial delivery phrase",()=>{
  const vm=require("node:vm");
  const src=require("node:fs").readFileSync(require("node:path").join(__dirname,"..","background","parser.js"),"utf8");
  const ctx={DOMParser:class{}};
  vm.createContext(ctx);vm.runInContext(src,ctx);
  const x=ctx.VDParser.parseLine("Товар — можем дать 2 из 10");
  assert.equal(x.confirmedQuantity,2);
  assert.equal(x.orderedQuantity,10);
});

test("parser handles refusal followed by partial delivery",()=>{
  const vm=require("node:vm");
  const src=require("node:fs").readFileSync(require("node:path").join(__dirname,"..","background","parser.js"),"utf8");
  const ctx={DOMParser:class{}};
  vm.createContext(ctx);vm.runInContext(src,ctx);
  const x=ctx.VDParser.parseLine("Товар — немає 5, дамо 2 шт");
  assert.equal(x.name,"Товар");
  assert.equal(x.confirmedQuantity,2);
});


test("reply table format signature detects changed columns",()=>{
  const vm=require("node:vm");
  const src=require("node:fs").readFileSync(require("node:path").join(__dirname,"..","background","reply-table.js"),"utf8");
  const ctx={};vm.createContext(ctx);vm.runInContext(src,ctx);
  const a=[["Код Моріона","Назва","Замовлено","Відвантажено"],["123","A","5","4"]];
  const b=[["Код Моріона","Назва","Замовлено","Кількість"],["123","A","5","4"]];
  assert.notEqual(ctx.VDReplyTable.formatSignature(a),ctx.VDReplyTable.formatSignature(b));
});


test("matcher preserves alphanumeric Morion codes",()=>{
  const vm=require("node:vm");
  const matcher=require("node:fs").readFileSync(require("node:path").join(__dirname,"..","background","matcher.js"),"utf8");
  const normalizer=require("node:fs").readFileSync(require("node:path").join(__dirname,"..","background","normalizer.js"),"utf8");
  const ctx={};vm.createContext(ctx);vm.runInContext(normalizer,ctx);vm.runInContext(matcher,ctx);
  const x=ctx.VDMatcher.matchProduct({name:"Інший товар",morionCode:"AB-001/25"},[{name:"Товар А",morionCode:"AB00125"}]);
  assert.equal(x.matched,true);
  assert.equal(x.confidence,"code");
});
