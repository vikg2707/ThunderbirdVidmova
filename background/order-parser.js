function parseOrderLine(line){
  const text=String(line||"").replace(/\s+/g," ").trim();
  if(!text)return null;

  const parts=text.split(/\t|;|\s{2,}/).map(x=>x.trim()).filter(Boolean);
  if(parts.length>=3){
    const qty=parts.findIndex(x=>/^\d+(?:[.,]\d+)?$/.test(x));
    if(qty>=0){
      const nums=parts.filter(x=>/^\d+(?:[.,]\d+)?$/.test(x));
      if(nums.length>=2){
        const code=nums[0],quantity=Number(nums[nums.length-1].replace(",","."));
        const name=parts.filter(x=>x!==code&&x!==String(quantity)).join(" ");
        if(name.length>=3&&code.length>=3)return{name,morionCode:code,orderedQuantity:quantity};
      }
    }
  }

  const m=text.match(/^(.*?)\s+(\d{4,})\s+(\d+(?:[.,]\d+)?)$/);
  if(m)return{name:m[1].trim(),morionCode:m[2],orderedQuantity:Number(m[3].replace(",","."))};

  return null;
}

function parseOrderText(text){
  const result=[];
  for(const line of String(text||"").split(/\r?\n/)){
    const item=parseOrderLine(line);
    if(item)result.push(item);
  }
  return result;
}

globalThis.VDOrderParser={parseOrderText,parseOrderLine};