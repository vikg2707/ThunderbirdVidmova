function levenshtein(a, b) {
  const prev = Array(b.length + 1).fill(0);
  const curr = Array(b.length + 1).fill(0);

  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,
        prev[j] + 1,
        prev[j - 1] + cost
      );
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}

function similarity(a, b) {
  if (a === b) return 1;
  if (!a || !b) return 0;
  const maxLen = Math.max(a.length, b.length);
  return maxLen ? 1 - levenshtein(a, b) / maxLen : 1;
}

function tokenScore(a, b) {
  const aa = new Set(VDNormalizer.tokenize(a));
  const bb = new Set(VDNormalizer.tokenize(b));
  if (!aa.size || !bb.size) return 0;

  let common = 0;
  for (const t of aa) if (bb.has(t)) common++;

  return common / Math.max(aa.size, bb.size);
}

function matchProduct(replyName, items) {
  const normalizedReply = VDNormalizer.normalizeProductName(replyName);
  let best = null;

  for (const item of items) {
    const exact = VDNormalizer.normalizeProductName(item.name) === normalizedReply;
    const score = exact
      ? 1
      : 0.65 * similarity(
          VDNormalizer.normalizeProductName(item.name),
          normalizedReply
        ) + 0.35 * tokenScore(item.name, replyName);

    if (!best || score > best.score) {
      best = { item, score, exact };
    }
  }

  if (!best || (!best.exact && best.score < 0.82)) {
    return { matched: false, score: best?.score ?? 0, item: null };
  }

  return { matched: true, score: best.score, item: best.item };
}

globalThis.VDMatcher = { matchProduct };
