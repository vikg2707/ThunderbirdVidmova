async function get(){return browser.runtime.sendMessage({type:"GET_REFUSALS"})}
function render(items){
  const rows=document.getElementById("rows"),stats=document.getElementById("stats");
  rows.textContent="";
  stats.textContent=items.length+" позицій";
  if(!items.length){rows.innerHTML='<tr><td colspan="3" class="empty">Відмов поки немає</td></tr>';return}
  for(const x of items){
    const tr=document.createElement("tr");
    for(const v of [x.name,x.morionCode,x.refusedQuantity]){
      const td=document.createElement("td");td.textContent=v;tr.appendChild(td)
    }
    rows.appendChild(tr)
  }
}
async function refresh(){render(await get())}
document.getElementById("scan").onclick=async()=>{
  const s=document.getElementById("status");s.textContent="Перевіряю пошту...";
  try{render(await browser.runtime.sendMessage({type:"SCAN_NOW"}));s.textContent="Готово"}
  catch(e){s.textContent="Помилка: "+e.message}
};
document.getElementById("copy").onclick=async()=>{
  const items=await get();
  await navigator.clipboard.writeText(items.map(x=>x.name+"\t"+x.morionCode+"\t"+x.refusedQuantity).join("\n"));
  document.getElementById("status").textContent="Скопійовано"
};
document.getElementById("clear").onclick=async()=>{
  if(!confirm("Очистити поточний список?"))return;
  await browser.runtime.sendMessage({type:"CLEAR_REFUSALS"});await refresh();
  document.getElementById("status").textContent="Список очищено"
};
refresh();