const FULL_REFUSAL_PATTERNS = [
  /\\bотказ\\b/i, /\\bнет\\b/i, /\\bне ?будет\\b/i,
  /\\bотсутствует\\b/i, /\\bнет в наличии\\b/i,
  /\\bнема(?:є|е)\\b/i, /\\bвідмова\\b/i
];

const PARTIAL_PATTERNS = [
  /(?:можем дать|можемо дати|дамо|є)\\s*[:=-]?\\s*(\\d+)\\s*(?:шт|шт\\.|штук|од)/i,
  /(?:дать|поставка|поставим|відвантажимо)\\s*(\\d+)\\s*(?:шт|шт\\.|штук|од)/i
];

function htmlToText(html) {
  const doc = new DOMParser().parseFromString(html || "", "text/html");
  return doc?.body?.textContent || "";
}

function cleanLine(line) {
  return line.replace(/\\s+/g, " ").trim();
}

function parseLine(line) {
  const text = cleanLine(line);
  if (!text) return null;

  for (const pattern of FULL_REFUSAL_PATTERNS) {
    if (pattern.test(text)) {
      return {
        name: text.replace(pattern, "").replace(/[—-]+\\s*$/, "").trim(),
        confirmedQuantity: 0,
        status: "full_refusal",
        source: text
      };
    }
  }

  for (const pattern of PARTIAL_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      return {
        name: text.slice(0, match.index).replace(/[—:-]+\\s*$/, "").trim(),
        confirmedQuantity: Number(match[1]),
        status: "partial",
        source: text
      };
    }
  }

  const qty = text.match(/\\b(\\d+)\\s*(?:шт|шт\\.|штук|од)\\b/i);
  if (qty) {
    const prefix = text.slice(0, qty.index).replace(/[—:-]+\\s*$/, "").trim();
    if (prefix) {
      return {
        name: prefix,
        confirmedQuantity: Number(qty[1]),
        status: "quantity",
        source: text
      };
    }
  }

  return null;
}

function parseReplyText(value) {
  const text = String(value || "").includes("<html")
    ? htmlToText(value)
    : String(value || "");

  return text
    .split(/\\r?\\n/)
    .map(parseLine)
    .filter(Boolean);
}

globalThis.VDParser = { parseReplyText };
