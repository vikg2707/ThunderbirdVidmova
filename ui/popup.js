async function render() {
  const refusals = await browser.runtime.sendMessage({ type: "GET_REFUSALS" });
  const rows = document.getElementById("rows");
  const summary = document.getElementById("summary");

  rows.textContent = "";
  summary.textContent = `Відмовлено: ${refusals.length} позицій`;

  if (!refusals.length) {
    rows.innerHTML = '<tr><td colspan="3" class="empty">Відмов поки немає</td></tr>';
    return;
  }

  for (const item of refusals) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td></td><td></td><td></td>
    `;
    tr.children[0].textContent = item.name;
    tr.children[1].textContent = item.morionCode;
    tr.children[2].textContent = item.refusedQuantity;
    rows.appendChild(tr);
  }
}

document.getElementById("copy").addEventListener("click", async () => {
  const refusals = await browser.runtime.sendMessage({ type: "GET_REFUSALS" });
  const text = refusals
    .map(x => `${x.name}\\t${x.morionCode}\\t${x.refusedQuantity}`)
    .join("\\n");

  await navigator.clipboard.writeText(text);
});

document.getElementById("clear").addEventListener("click", async () => {
  if (!confirm("Очистити поточний список?")) return;
  await browser.runtime.sendMessage({ type: "CLEAR_REFUSALS" });
  await render();
});

render();
