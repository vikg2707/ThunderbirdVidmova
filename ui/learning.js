document.addEventListener("click",function(e){
  const b=e.target.closest(".bind-alias");
  if(!b)return;
  bindAlias(Number(b.dataset.idx));
});