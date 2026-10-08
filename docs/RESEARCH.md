# 调研记录：有没有现成的「谷歌主页 + 必应搜索」插件？

调研时间：2026-10-08
调研途径：GitHub 仓库搜索 API（多组关键词）、Bing 网页检索、Chrome 官方开发文档核对。

## 结论

没有找到与需求**完全一致**的现成插件。现有的相关项目可以分成四类，都不是目标形态。

## 一、把谷歌整体重定向到必应（最接近，但不符）

| 仓库 | Stars | 说明 |
| --- | --- | --- |
| [StefanSokic/HotlineBing](https://github.com/StefanSokic/HotlineBing) | 1 | terribleHack 黑客松作品。把 google 的 186 个域名、所有搜索、新标签页全部换成 bing.com。Manifest V2，且会破坏谷歌页面本身。 |
| [funnyboy-roks/Bing-Redirect](https://github.com/funnyboy-roks/Bing-Redirect) | 0 | 恶作剧：把所有谷歌搜索重定向到必应第 7 页。 |
| [pendo324/Bing2Google](https://github.com/pendo324/Bing2Google) | 1 | 反向：把 Skype 的 “Search with Bing” 转成谷歌。 |
| [theaquarium/bingtogoogle](https://github.com/theaquarium/bingtogoogle) | 1 | 反向：Bing → Google。 |
| [mathiasyde/bing-annihilator](https://github.com/mathiasyde/bing-annihilator) | 1 | 反向：Bing → Google。 |
| [littletree71/redirect-to-google](https://github.com/littletree71/redirect-to-google) | 0 | 反向：Bing → Google（安全/隐私理由）。 |
| [flourigh/Gootana](https://github.com/flourigh/Gootana) | 0 | 反向：Bing → Google。 |
| [lorenz-h/bingdeflector](https://github.com/lorenz-h/bingdeflector) | 0 | Firefox 版，Bing → Google。 |
| [varunachar/StartWith](https://github.com/varunachar/StartWith) | 0 | 把 Windows 开始菜单发起的所有 bing 搜索转成谷歌。 |

## 二、一键切换搜索引擎（需要手动点）

- [harish-chary/SwapSearch](https://github.com/harish-chary/SwapSearch) — 从当前 URL 里取关键词，一键换到 Google / Bing / DuckDuckGo / Yahoo。
- [minxuanz/SearchBar](https://github.com/minxuanz/SearchBar)
- [xmbms/SearchPlus](https://github.com/xmbms/SearchPlus)
- [zhaihm/SearchEngineSwitcher](https://github.com/zhaihm/SearchEngineSwitcher)
- [Fatpandac/searchbar](https://github.com/Fatpandac/searchbar) — ⌘K 命令面板式搜索。
- [kazmi07/Smart-Omnibox-MultiSearch](https://github.com/kazmi07/Smart-Omnibox-MultiSearch) — 地址栏关键字路由到不同引擎。
- [ahkohd/Inline-Search](https://github.com/ahkohd/Inline-Search) — 划词后按快捷键调起指定引擎。

关键差异：这些是「人在结果页上再点一下换引擎」，而不是「在谷歌页面里搜索时自动走必应」。

## 三、在谷歌搜索页里并列加一个必应入口

- [tranc99/chrome-search-extras](https://github.com/tranc99/chrome-search-extras) — “enables you to search using Bing as well as Google on the Google Search Page”。属于多一个入口，不替换原有行为。

## 四、New Tab / 主题类，可顺带选引擎

- [DeepaliPaspule/Homepage-Theme](https://github.com/DeepaliPaspule/Homepage-Theme) — Material You 风格新标签页，可选 Google / DuckDuckGo / Bing / YouTube，但页面是它自己的设计。
- [ssprasad-cyber/UtpadShakt](https://github.com/ssprasad-cyber/UtpadShakt) — 极简新标签页 + 切换引擎。
- [jakex7/unducked](https://github.com/jakex7/unducked) — 保留默认新标签页，用 DuckDuckGo Bangs 语法增强搜索。
- [SandroLinux/Come-on-DuckDuckGo](https://github.com/SandroLinux/Come-on-DuckDuckGo)、[SandroLinux/come-on-qwant](https://github.com/SandroLinux/come-on-qwant) — 访问 Google/Bing/Yahoo/Yandex/Baidu/Sogou 一律跳到指定引擎。

## 五、Chrome 自带能力（不用扩展能走多远）

- 设置 → 搜索引擎 → 把默认搜索引擎设为 Bing：**地址栏**和**新标签页的搜索框**都会走必应。
- 设置 → 启动时 → 打开特定网页：可把启动页设为 `https://www.google.com/`。
- 缺口：**谷歌页面内部那个搜索框**，以及点击谷歌搜索链接产生的 `/search?q=` 请求，Chrome 自带设置改不了——这正是本扩展要补的部分。

## 六、技术要点核对（来自 developer.chrome.com）

- `declarativeNetRequest` 的 `redirect` 动作**需要主机权限**（官方文档在 “Redirects” 一节明确写 “requires host permission to …”）。因此清单里申请了常见谷歌域名的主机权限。
- `regexSubstitution` 用 `\1` 引用捕获组，官方示例即 `"regexSubstitution": "https://\\1.xyz.com/"`。
- `chrome_settings_overrides` 中 homepage / search provider 所用域名，要求开发者用 Search Console 验证所有权。实测在解压加载 + 无头浏览器环境下该字段被忽略（但扩展本身正常加载，其余功能不受影响），所以 README 里给了手动设置主页的替代办法。
- `chrome_url_overrides` 属于静态清单声明，**无法运行时开关**，所以“恢复 Chrome 默认新标签页”需要手动删掉该字段。
- `declarativeNetRequest` 与 `declarativeNetRequestWithHostAccess` 能力相同，区别只在安装时的权限提示。本次选用了 `declarativeNetRequest` + 主机权限的组合。
