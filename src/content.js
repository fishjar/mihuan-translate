(function () {
  let word = ""; // 选中的文本
  let isFixed = false; // 是否固定弹框位置

  /**
   * 获取选中文本
   */
  function getSelectedText() {
    let userSelection,
      selectedText = "";
    if (window.getSelection) {
      //现代浏览器
      userSelection = window.getSelection();
      selectedText = userSelection.toString();
    } else if (document.selection) {
      // 老IE浏览器
      userSelection = document.selection.createRange();
      selectedText = userSelection.text;
    }
    return selectedText;
  }

  /**
   * 设置元素可拖动
   * @param {*} elmnt
   */
  function dragElement(elmnt) {
    let pos1 = 0,
      pos2 = 0,
      pos3 = 0,
      pos4 = 0;
    if (document.getElementById(elmnt.id + "_hd")) {
      /* if present, the header is where you move the DIV from:*/
      document.getElementById(elmnt.id + "_hd").onmousedown = dragMouseDown;
    } else {
      /* otherwise, move the DIV from anywhere inside the DIV:*/
      elmnt.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
      e = e || window.event;
      e.preventDefault();
      // get the mouse cursor position at startup:
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      // call a function whenever the cursor moves:
      document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
      e = e || window.event;
      e.preventDefault();
      // calculate the new cursor position:
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      // set the element's new position:
      elmnt.style.top = elmnt.offsetTop - pos2 + "px";
      elmnt.style.left = elmnt.offsetLeft - pos1 + "px";
    }

    function closeDragElement() {
      /* stop moving when mouse button is released:*/
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }

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
   * 点击翻译按钮
   * @param {*} e
   */
  function handleBtnClick(e) {
    if (!word) {
      return;
    }

    const $box = document.getElementById("mh_box");
    $box.style.display = "block";

    if (!isFixed) {
      // 没有固定位置
      $box.style.top = e.clientY + 10 + "px";
      $box.style.left = e.clientX + 10 + "px";
    }

    const $bd = document.getElementById("mh_box_bd");
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

        $bd.insertAdjacentHTML("beforeend", dictHtml);
      })
      .catch((err) => {
        $bd.innerHTML = `<div>${err.message || "出错了..."}</div>`;
      });
  }

  /**
   * 全局捕获鼠标事件
   * @param {*} e
   */
  function handleMouseUp(e) {
    const elem = document.getElementById("mh_btn");
    const selectedText = getSelectedText().trim();
    if (!selectedText) {
      elem.style.display = "none";
      return;
    }
    word = selectedText;
    elem.style.display = "block";
    elem.style.top = e.pageY + 10 + "px";
    elem.style.left = e.pageX + 25 + "px";
  }

  /**
   * 插入按钮到页面
   */
  function btnInit() {
    const elem = document.createElement("div");
    elem.id = "mh_btn";
    elem.innerHTML = "<span>译</span>";
    elem.addEventListener("click", handleBtnClick);
    document.body.appendChild(elem);

    //全局捕获鼠标事件
    document.body.addEventListener("mouseup", handleMouseUp);
  }

  /**
   * 插入翻译框到页面
   */
  function boxInit() {
    const $box = document.createElement("div");
    $box.id = "mh_box";
    $box.innerHTML = `
      <div id="mh_box_hd">
        <i id="mh_box_btn_fixed" class="mh_icon mh_icon_fullscreen" title="固定"></i>
        <span>MiHuan</span>
        <i id="mh_box_btn_close" class="mh_icon mh_icon_close" title="关闭"></i>
      </div>
      <div id="mh_box_bd_wrap">
        <div id="mh_box_bd">
          <div>loading...</div>
        </div>
      </div>
    `;
    document.body.appendChild($box); // 插入dom
    dragElement($box); // 可拖动

    // 关闭按钮
    const $close = document.getElementById("mh_box_btn_close");
    $close.onclick = function (e) {
      $box.style.display = "none";
    };

    // 固定翻译框按钮
    const $fixed = document.getElementById("mh_box_btn_fixed");
    $fixed.onclick = function (e) {
      isFixed = !isFixed;
      if (isFixed) {
        $fixed.classList.add("mh_fixed");
      } else {
        $fixed.classList.remove("mh_fixed");
      }
    };
  }

  /**
   * 页面初始化
   */
  window.onload = function () {
    boxInit();
    btnInit();
  };
})();
