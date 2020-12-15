# mihuan-translate

一个给自己用的谷歌浏览器翻译扩展

- 首先，使用谷歌翻译，中文会翻译成英文，其他语言则翻译成中文
- 如果是英文单词，继续使用 bing 词典查询详细解释

![截图0](./src0.png)
![截图](./src.png)

## 翻译系列自产自消项目（为了英文也算拼了...）

- 后端翻译服务（smart-translator）： https://github.com/fishjar/smart-translator
- 谷歌浏览器翻译插件（mihuan-translate）： https://github.com/fishjar/mihuan-translate
- VSCODE 翻译插件（vscode-translate）： https://github.com/fishjar/vscode-translate

## 一些记录

### 其一

2019 年 5 月发现不能使用，开始以为服务器什么问题，
最终定位到问题，原来是谷歌浏览器同源政策改变引起的。
跨域请求即使写到`permissions`名单了也不行。

- [Changes to Cross-Origin Requests in Chrome Extension Content Scripts](https://www.chromium.org/Home/chromium-security/extension-content-script-fetches)
- [What is new in Chrome with the context of Chrome Extensions?](https://medium.com/aviabird/handling-cross-origin-fetches-in-chrome-extensions-for-chrome-73-98a094052b7f)

解决办法是把网络请求从`content_scripts`写到`background`脚本里面。
然后两个脚本间用`chrome.runtime`的事件来通信，生生把一个脚本解决的事情弄成两个脚本。

### 其二

2019 年 7 月又不能使用了，确切的说查询新的英文单词出错，
曾查过的词（`mongodb`里面有缓存）是没问题的，新查的词不行。

开始以为是`bing`的网站更改了页面结构，导致解析失败。
可是定位问题后，结果令人沮丧。

`bing`的页面结构没有变化，我的代码也没有变化，
本地调试没有任何问题，服务器运行就不行。

最大可能是：`bing`对爬虫做了一些限制，可能是针对 header，ip，或其他。

查询`select`单词为例：

正常访问的页面：

![正常访问的页面](./bing1.png)

实际访问得到的页面：

![实际访问得到的页面](./bing2.png)

No results found for select.

Search tips:

- Ensure words are spelled correctly.
- Try rephrasing keywords or using synonyms.
- Try less specific keywords.
- Make your queries as concise as possible.

这个问题就有点棘手了，有时间再解决吧：

- 方案一：使用更完备的`Request Headers`躲过限制（希望可以）
- 方案二：改用`Headless Chrome`试试（可能对查询速度有影响）
- 方案三：换服务器试试（下策）

### 三

2019 年 8 月发现自动复活了，还好够懒（其实什么也没做）。。。可能微软对服务器 IP 解禁了

### 四

想着更新一版：

- 后端从其他项目中剥离出来，跑一个单独的服务
- 并从长远考虑，弃掉国内服务商的 ssl，使用 letsencrypt 的免费 ssl 服务
- 功能上增加微软翻译、DEEPL 翻译、有道翻译、有道词典等功能

实施后：

- 剥离服务比较简单
- letsencrypt 费了一番周折也搞定
- 但功能增加上就发现没那么简单了
  - 有道翻译、有道词典还算简单
  - DEEPL 有严格的调用频率限制，研究了一番没有找到好的破解办法，又不想用`Headless`这样的大杀器，暂时放弃
  - 微软词典遇到并验证了之前的问题，微软服务器估计有个 IP 白名单，而且是动态维护的
    - 本地调试没问题，部署到两台服务器，一个可以，一个不行
  - 微软翻译和微软词典一样，本地调试没问题，部署上去，两台服务器都不行

插件增加功能的时候，本来是可以加上有道翻译和有道词典的。
但是发现有道翻译质量远远不如谷歌，有还不如没有。
而有道词典则内容比 bing 词典少很多，也有点鸡肋。
最后考虑，这种高频工具，速度和稳定性最很重要，而多个平台对比翻译不是刚需。
所以插件功能上没有增加，还是谷歌翻译和 bing 词典的组合。
