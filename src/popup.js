(function () {
  const $btn = document.getElementById("trans_btn"); // 翻译按钮
  const $bd = document.getElementById("trans_bd"); // 结果元素
  const $input = document.getElementById("trans_input"); // 输入框

  $input.focus(); // 聚焦输入框
  document.execCommand("paste"); // 复制粘帖板内容到输入框
  handleTranslate(); // 翻译

  // 翻译按钮添加点击事件
  $btn.addEventListener("click", function (e) {
    handleTranslate();
  });

  /**
   * 发送消息给background
   * @param {*} type
   * @param {*} data
   */
  function sendMsg(type, data) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type, data }, ({ res, err }) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  }

  /**
   * 翻译函数
   */
  function handleTranslate() {
    const word = $input.value.trim();
    if (!word) {
      return;
    }
    $bd.innerHTML = `<div>loading...</div>`;

    sendMsg("googleAuto", { q: word })
      .then((resGoogle) => {
        if (!resGoogle || !Array.isArray(resGoogle.trans)) {
          return;
        }
        let transHtml = ``;
        resGoogle.trans.forEach((item) => {
          transHtml += `<p>${item}</p>`;
        });
        $bd.innerHTML = transHtml;
        if (resGoogle.isWord) {
          return sendMsg("bingDict", { q: word });
        }
      })
      .then((resBing) => {
        if (!resBing) {
          return;
        }
        const {
          resultWord,
          trans, //翻译
          variants, // 相关词
          phoneticUS, //音标
          phoneticUK, //音标
          colls, //搭配
          synonyms, //同义词
          antonyms, //反义词
          bilinguals, //英汉双解
          ees, //英英
          sentences, // 例句
        } = resBing;
        let dictHtml = ``;
        dictHtml += `<fieldset>`;
        dictHtml += `<legend><b>${resultWord || word}</b></legend>`;
        variants &&
          variants.forEach((item) => {
            dictHtml += `<div>${item.pos}: ${item.def}</div>`;
          });
        phoneticUS && (dictHtml += `<div>美 ${phoneticUS}</div>`);
        phoneticUK && (dictHtml += `<div>英 ${phoneticUK}</div>`);
        trans &&
          trans.forEach((item) => {
            dictHtml += `<div>[${item.pos}] ${item.def}</div>`;
          });
        dictHtml += `</fieldset>`;
        if (colls && colls.length > 0) {
          dictHtml += `<fieldset>`;
          dictHtml += `<legend>搭配</legend>`;
          colls.forEach((item) => {
            dictHtml += `<div>[${item.pos}] ${item.def.join(", ")}</div>`;
          });
          dictHtml += `</fieldset>`;
        }
        if (synonyms && synonyms.length > 0) {
          dictHtml += `<fieldset>`;
          dictHtml += `<legend>同义词</legend>`;
          synonyms.forEach((item) => {
            dictHtml += `<div>[${item.pos}] ${item.def.join(", ")}</div>`;
          });
          dictHtml += `</fieldset>`;
        }
        if (antonyms && antonyms.length > 0) {
          dictHtml += `<fieldset>`;
          dictHtml += `<legend>反义词</legend>`;
          antonyms.forEach((item) => {
            dictHtml += `<div>[${item.pos}] ${item.def.join(", ")}</div>`;
          });
          dictHtml += `</fieldset>`;
        }
        if (bilinguals && bilinguals.length > 0) {
          dictHtml += `<fieldset>`;
          dictHtml += `<legend>英汉双解</legend>`;
          bilinguals.forEach((item) => {
            dictHtml += `<div>[${item.pos}]</div>`;
            dictHtml += `<ul>`;
            item.def.forEach((d) => {
              dictHtml += `<li>`;
              dictHtml += `<div>${d.val}</div>`;
              dictHtml += `<div>${d.bil}</div>`;
              dictHtml += `</li>`;
            });
            dictHtml += `</ul>`;
          });
          dictHtml += `</fieldset>`;
        }
        if (ees && ees.length > 0) {
          dictHtml += `<fieldset>`;
          dictHtml += `<legend>英英</legend>`;
          ees.forEach((item) => {
            dictHtml += `<div>[${item.pos}]</div>`;
            dictHtml += `<ul>`;
            item.def.forEach((d) => {
              dictHtml += `<li>${d}</li>`;
            });
            dictHtml += `</ul>`;
          });
          dictHtml += `</fieldset>`;
        }
        if (sentences && sentences.length > 0) {
          dictHtml += `<fieldset>`;
          dictHtml += `<legend>例句</legend>`;
          dictHtml += `<ul>`;
          sentences.forEach((item) => {
            dictHtml += `<li>`;
            dictHtml += `<div>${item.sen_en}</div>`;
            dictHtml += `<div>${item.sen_cn}</div>`;
            dictHtml += `</li>`;
          });
          dictHtml += `</ul>`;
          dictHtml += `</fieldset>`;
        }
        $bd.insertAdjacentHTML("beforeend", dictHtml);
      })
      .catch((err) => {
        $bd.innerHTML = `<div>${err.message || "出错了..."}</div>`;
      });
  }
})();
