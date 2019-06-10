(function () {
  chrome.runtime.onMessage.addListener(function ({ contentScriptQuery, dictType = 'google', dictParams }, sender, sendResponse) {
    if (contentScriptQuery == 'queryDict') {
      const url = new URL(`https://caihua.jisunauto.com/dict/${dictType}/dict`);
      let params = {
        client: 'gtx',
        sl: 'auto',
        tl: 'zh-CN',
        dj: '1',
        ie: 'UTF-8',
        oe: 'UTF-8',
        dt: 't',
        ...dictParams
      };
      if (dictType === 'bing') {
        params = dictParams
      }
      url.search = new URLSearchParams(params);
      fetch(url)
        .then(response => response.json())
        .then(res => {
          // 如果源语言是中文，则目标语言设为英文
          if (dictType === 'google' && (res.src === 'zh-CN' || res.src === 'zh-TW' || res.src === 'zh-HK')) {
            url.search = new URLSearchParams({ ...params, tl: 'en' });
            return fetch(url)
              .then(response => response.json())
              .then(res => sendResponse({ res }));
          }
          return sendResponse({ res });
        })
        .catch(err => sendResponse({ err }));
      return true;  // Will respond asynchronously.
    }
  });
})()
