async function findOrderForMessage(message) {
  const orders = await VDStorage.getOrders();
  if (!message) return null;

  const subject = (message.subject || "").toLowerCase();
  const from = (message.author || "").toLowerCase();

  let candidates = orders.filter(order => {
    const orderSubject = (order.subject || "").toLowerCase();
    const supplier = (order.supplier || "").toLowerCase();
    return (
      (orderSubject && subject.includes(orderSubject)) ||
      (supplier && from.includes(supplier))
    );
  });

  if (!candidates.length) candidates = orders;

  candidates.sort((a, b) => {
    const ad = Math.abs(new Date(message.date) - new Date(a.date));
    const bd = Math.abs(new Date(message.date) - new Date(b.date));
    return ad - bd;
  });

  return candidates[0] || null;
}

async function processReply(message, text) {
  if (await VDStorage.isMessageProcessed(message.id)) return null;

  const order = await findOrderForMessage(message);
  if (!order) return null;

  const parsed = VDParser.parseReplyText(text);
  const changes = [];

  for (const row of parsed) {
    const match = VDMatcher.matchProduct(row.name, order.items);
    if (!match.matched) continue;

    const item = match.item;
    const refused = Math.max(
      0,
      Number(item.orderedQuantity) - Number(row.confirmedQuantity || 0)
    );

    if (refused <= 0) continue;

    changes.push({
      orderId: order.orderId,
      morionCode: item.morionCode,
      name: item.name,
      refusedQuantity: refused,
      matchedName: row.name,
      confidence: match.score
    });
  }

  await VDStorage.markMessageProcessed(message.id, order.orderId, changes);
  return changes;
}

globalThis.VDMailMonitor = { findOrderForMessage, processReply };
