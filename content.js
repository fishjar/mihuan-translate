(function () {

  let word = "";
  let isFixed = false;

  /**
   * 获取选中文本
   */
  function getSelectedText() {
    var userSelection, selectedText = '';
    if (window.getSelection) { //现代浏览器
      userSelection = window.getSelection();
      selectedText = userSelection.toString();
    } else if (document.selection) { // 老IE浏览器
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
    console.log(elmnt.id)
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
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
      elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
      elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
      /* stop moving when mouse button is released:*/
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }

  /**
   * 插入按钮到页面
   */
  function btnInit() {
    const elem = document.createElement('div');
    elem.id = 'mh_btn';
    elem.innerHTML = '<span>译</span>'
    elem.addEventListener('click', function (e) {
      if (!word) {
        return;
      }

      const el_box = document.getElementById('mh_box');
      el_box.style.display = "block";
      if (!isFixed) { //是否固定位置
        el_box.style.top = (e.clientY + 10) + "px";
        el_box.style.left = (e.clientX + 10) + "px";
      }
      const el_box_bd = document.getElementById('mh_box_bd');
      el_box_bd.innerHTML = `
        <div>loading...</div>
      `;

      let url = new URL('https://translate.google.cn/translate_a/single');
      let params = {
        client: 'gtx',
        sl: 'auto',
        tl: 'zh-CN',
        dj: '1',
        ie: 'UTF-8',
        oe: 'UTF-8',
        // dt: ['at', 'bd', 'ex', 'md', 'qca', 'rw', 'rm', 'ss', 't'],
        dt: 't',
        q: word,
      };
      url.search = new URLSearchParams(params);
      fetch(url).then(function (response) {
        return response.json();
      }).then(function (res) {
        if (res.src === 'zh-CN' || res.src === 'zh-TW' || res.src === 'zh-HK') { //如果源语言是中文，则目标语言设为英文
          params.tl = 'en';
          url.search = new URLSearchParams(params);
          fetch(url).then(function (response) {
            return response.json();
          }).then(function (res) {
            el_box_bd.innerHTML = `
              <div>${res.sentences[0].trans}</div>
            `;
          }).catch(function (err) {
            el_box_bd.innerHTML = `
            <div>${err}</div>
          `;
          });
        } else if (res.src === 'en' && word.indexOf(' ') === -1) { // 如果源语言是英文，且是单个单词，使用bing词典翻译
          url = new URL('https://xtk.azurewebsites.net/BingDictService.aspx');
          params = { Word: word };
          url.search = new URLSearchParams(params);
          fetch(url).then(function (response) {
            return response.json();
          }).then(function (res) {
            el_box_bd.innerHTML = `
              <div><b>${word}</b></div>
              <div>美 [${res.pronunciation && res.pronunciation.AmE}]</div>
              <div>英 [${res.pronunciation && res.pronunciation.BrE}]</div>
              ${res.defs.map(def => (`<div>[${def.pos}] ${def.def}</div>`)).join('')}
            `;
          }).catch(function (err) {
            el_box_bd.innerHTML = `
              <div><b>${word}</b></div>
              <div>${err}</div>
            `;
          });
        } else {
          el_box_bd.innerHTML = `
            <div>${res.sentences[0].trans}</div>
          `;
        }
      }).catch(function (err) {
        el_box_bd.innerHTML = `
          <div>${err}</div>
        `;
      });

    });
    document.body.appendChild(elem);
  }

  /**
   * 插入翻译框到页面
   */
  function boxInit() {
    const elem = document.createElement('div');
    elem.id = 'mh_box';
    elem.innerHTML = `
      <div id="mh_box_hd">
        <i id="mh_box_btn_fixed" class="mh_icon mh_icon_fullscreen" title="固定"></i>
        <i id="mh_box_btn_close" class="mh_icon mh_icon_close" title="关闭"></i>
      </div>
      <div id="mh_box_bd">
        <div>loading...</div>
      </div>
    `;
    document.body.appendChild(elem);
    dragElement(elem);

    // 关闭按钮
    const el_close = document.getElementById('mh_box_btn_close');
    el_close.onclick = function (e) {
      elem.style.display = 'none';
    }

    // 固定翻译框按钮
    const el_fixed = document.getElementById('mh_box_btn_fixed');
    el_fixed.onclick = function (e) {
      isFixed = !isFixed;
      if (isFixed) {
        el_fixed.classList.add('mh_fixed');
      } else {
        el_fixed.classList.remove('mh_fixed');
      }
    }
  }

  /**
   * 全局捕获鼠标事件
   */
  document.body.addEventListener('mouseup', function (e) {
    const elem = document.getElementById('mh_btn');
    const selectedText = getSelectedText().trim();
    if (!selectedText) {
      elem.style.display = "none";
      return;
    }
    word = selectedText;
    elem.style.display = "block";
    elem.style.top = (e.pageY + 10) + "px";
    elem.style.left = (e.pageX + 25) + "px";
  });


  /**
   * 页面初始化
   */
  window.onload = function () {
    boxInit();
    btnInit();
  };

})();