/**
 * 请求封装
 * @param {*} path
 * @param {*} params
 * @param {*} sendResponse
 */
function api(path, params, sendResponse) {
  const url = new URL(`https://caihua.jisunauto.com/trans${path}`);
  url.search = new URLSearchParams(params);
  fetch(url)
    .then((res) => {
      if (!res.ok) {
        throw new Error(`[${res.status}]${res.statusText}`);
      }
      return res.json();
    })
    .then((res) => {
      sendResponse({ res });
    })
    .catch((err) => {
      sendResponse({ err });
    });
}

/**
 * 添加消息监听
 */
chrome.runtime.onMessage.addListener(function (
  { type, data: { q } },
  sender,
  sendResponse
) {
  switch (type) {
    case "googleAuto":
      api("/google/auto", { q }, sendResponse);
      break;
    case "bingDict":
      api("/bing/dictf", { q }, sendResponse);
      break;
    default:
      sendResponse(new Error(`不支持的消息类型: ${type}`));
  }
  // 如果你希望异步调用sendResponse,需要在onMessage事件处理器中加上return true
  return true;
});
