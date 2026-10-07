const ABBREVIATIONS = new Map([
  ["таб.", "таблетки"],
  ["табл.", "таблетки"],
  ["кап.", "капсули"],
  ["капс.", "капсули"],
  ["амп.", "ампули"],
  ["фл.", "флакон"],
  ["уп.", "упаковка"]
]);

function normalizeProductName(value) {
  let s = String(value ?? "").toLowerCase().trim();

  s = s.replace(/ё/g, "е");
  s = s.replace(/№\s*(\d+)/g, "n$1");
  s = s.replace(/\bn\s*(\d+)/g, "n$1");

  for (const [from, to] of ABBREVIATIONS) {
    s = s.replace(new RegExp(from.replace(".", "\\."), "g"), to);
  }

  s = s.replace(/[„“”"']/g, "");
  s = s.replace(/[.,;:()[\]{}+\/=\\|_-]/g, " ");
  s = s.replace(/\s+/g, " ").trim();

  const ignored = new Set([
    "можем", "дати", "шт", "есть", "будет", "нет", "отказ",
    "отсутствует", "отсутствует.", "товар", "позиция"
  ]);

  s = s.split(" ").filter(x => x && !ignored.has(x)).join(" ");
  return s;
}

function tokenize(value) {
  return normalizeProductName(value).split(" ").filter(Boolean);
}

globalThis.VDNormalizer = { normalizeProductName, tokenize };
