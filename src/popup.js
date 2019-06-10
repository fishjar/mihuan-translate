(function () {

  /**
   * 翻译函数
   */
  function translate() {
    const word = translate_textarea.value.trim();
    if (!word) {
      return;
    }

    el_box_bd.innerHTML = `
      <div>loading...</div>
    `;

    chrome.runtime.sendMessage({
      contentScriptQuery: 'queryDict',
      dictType: 'google',
      dictParams: {
        tl: 'zh-CN',
        q: word,
      }
    }, ({ res, err }) => {
      if (err) {
        el_box_bd.innerHTML = `
          <div>${err}</div>
        `;
      } else {
        if (res.src === 'en' && word.indexOf(' ') === -1) { // 如果源语言是英文，且是单个单词，使用bing词典翻译
          chrome.runtime.sendMessage({
            contentScriptQuery: 'queryDict',
            dictType: 'bing',
            dictParams: {
              word,
              simple: true,
            }
          }, ({ res, err }) => {
            if (err) {
              el_box_bd.innerHTML = `
                <div>${err}</div>
              `;
            } else {
              let html = `<div><b>${res.result_word || word}</b></div>`;
              res.variant && (html += res.variant.map(item => `<div>${item.pos}: ${item.def}</div>`).join(''));
              res.phonetic_US && (html += `<div>美 ${res.phonetic_US}</div>`);
              res.phonetic_UK && (html += `<div>美 ${res.phonetic_UK}</div>`);
              res.translation && (html += res.translation.map(item => `<div>[${item.pos}] ${item.def}</div>`).join(''));

              el_box_bd.innerHTML = html;
            }
          });
        } else {
          el_box_bd.innerHTML = res.sentences.map(sentence => (`<div>${sentence.trans}</div>`)).join('');
        }
      }
    });
  }

  const translate_btn = document.getElementById('translate_btn'); // 翻译按钮
  const el_box_bd = document.getElementById('translate_res'); // 结果元素
  const translate_textarea = document.getElementById("translate__word"); // 输入框

  translate_textarea.focus(); // 聚焦输入框
  document.execCommand("paste"); // 复制粘帖板内容到输入框
  if(translate_textarea.value.trim()) {
    // 如果粘帖板不为空，直接翻译
    translate()
  }

  // 翻译按钮添加点击事件
  translate_btn.addEventListener('click', function (e) {
    translate();
  });

})();