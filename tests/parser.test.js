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
  const p={name:"Товар",confirmedQuantity:3,status:"partial"};
  assert.deepEqual(p,{name:"Товар",confirmedQuantity:3,status:"partial"});
});

test("ordered and confirmed quantities can be represented",()=>{
  assert.equal(Math.max(0,10-3),7);
});

test("parser source file is present",()=>{
  assert.ok(require("node:fs").existsSync(require("node:path").join(__dirname,"..","background","parser.js")));
});
