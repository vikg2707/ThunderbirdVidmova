const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");

const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,"..","manifest.json"),"utf8"));

test("manifest has Thunderbird extension identity",()=>{
  assert.equal(manifest.manifest_version,2);
  assert.equal(manifest.applications.gecko.id,"thunderbird-vidmova@algofarm.site");
  assert.ok(manifest.version);
});

test("all background scripts exist and are ordered",()=>{
  const scripts=manifest.background.scripts;
  assert.ok(Array.isArray(scripts));
  for(const file of scripts)assert.ok(fs.existsSync(path.join(__dirname,"..",file)),`Missing ${file}`);
  assert.ok(scripts.indexOf("background/storage.js")<scripts.indexOf("background/mail-monitor.js"));
  assert.ok(scripts.indexOf("background/supplier.js")<scripts.indexOf("background/mail-monitor.js"));
  assert.ok(scripts.indexOf("background/background.js")===scripts.length-1);
});

test("popup exists",()=>{
  assert.ok(fs.existsSync(path.join(__dirname,"..",manifest.browser_action.default_popup)));
});