function levenshtein(a,b){const p=Array(b.length+1).fill(0),c=Array(b.length+1).fill(0);for(let j=0;j<=b.length;j++)p[j]=j;for(let i=1;i<=a.length;i++){c[0]=i;for(let j=1;j<=b.length;j++){const k=a[i-1]===b[j-1]?0:1;c[j]=Math.min(c[j-1]+1,p[j]+1,p[j-1]+k)}for(let j=0;j<=b.length;j++)p[j]=c[j]}return p[b.length]}
function similarity(a,b){if(a===b)return 1;if(!a||!b)return 0;return 1-levenshtein(a,b)/Math.max(a.length,b.length)}
function tokenScore(a,b){const aa=new Set(VDNormalizer.tokenize(a)),bb=new Set(VDNormalizer.tokenize(b));if(!aa.size||!bb.size)return 0;let n=0;for(const t of aa)if(bb.has(t))n++;return n/Math.max(aa.size,bb.size)}
function codeOf(x){
 const s=String(x?.morionCode??x?.code??"").trim().toUpperCase();
 return s.replace(/[\s._-]+/g,"");
}
function matchProduct(reply,items){
 const rn=VDNormalizer.normalizeProductName(reply?.name||reply||"");
 const rc=codeOf(reply);
 let best=null;
 for(const item of items){
  const ic=codeOf(item);
  if(rc&&ic&&rc===ic)return{matched:true,confidence:"code",score:1,item};
  const n=VDNormalizer.normalizeProductName(item.name);
  const exact=n===rn,sim=similarity(n,rn),tok=tokenScore(item.name,reply?.name||reply);
  const score=exact?1:.65*sim+.35*tok;
  if(!best||score>best.score)best={item,score,exact};
 }
 if(!best)return{matched:false,confidence:"none",score:0,item:null};
 if(best.exact)return{matched:true,confidence:"exact",score:1,item:best.item};
 if(best.score>=0.94)return{matched:true,confidence:"high",score:best.score,item:best.item};
 return{matched:false,confidence:"unmatched",score:best.score,item:null};
}
globalThis.VDMatcher={matchProduct};