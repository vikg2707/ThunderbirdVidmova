browser.runtime.onMessage.addListener(async (message) => {
  if (message?.type === "GET_REFUSALS") {
    return VDStorage.getRefusals();
  }

  if (message?.type === "CLEAR_REFUSALS") {
    await VDStorage.saveRefusals([]);
    return [];
  }

  return null;
});

browser.runtime.onInstalled.addListener(() => {
  console.log("ThunderbirdVidmova installed");
});
