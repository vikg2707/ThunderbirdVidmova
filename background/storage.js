const DB_KEYS = {
  orders: "orders",
  processedMessages: "processedMessages",
  refusals: "refusals"
};

async function load(key, fallback) {
  const data = await browser.storage.local.get(key);
  return data[key] ?? fallback;
}

async function save(key, value) {
  await browser.storage.local.set({ [key]: value });
}

async function getOrders() {
  return load(DB_KEYS.orders, []);
}

async function saveOrders(orders) {
  return save(DB_KEYS.orders, orders);
}

async function getProcessedMessages() {
  return load(DB_KEYS.processedMessages, []);
}

async function markMessageProcessed(messageId, orderId, result) {
  const items = await getProcessedMessages();
  const exists = items.some(x => x.messageId === messageId);
  if (exists) return;
  items.push({
    messageId,
    orderId,
    processedAt: new Date().toISOString(),
    result
  });
  await save(DB_KEYS.processedMessages, items);
}

async function isMessageProcessed(messageId) {
  const items = await getProcessedMessages();
  return items.some(x => x.messageId === messageId);
}

async function getRefusals() {
  return load(DB_KEYS.refusals, []);
}

async function saveRefusals(refusals) {
  return save(DB_KEYS.refusals, refusals);
}

globalThis.VDStorage = {
  getOrders,
  saveOrders,
  getProcessedMessages,
  markMessageProcessed,
  isMessageProcessed,
  getRefusals,
  saveRefusals
};
