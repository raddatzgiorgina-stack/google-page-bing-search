// ==UserScript==
// @name               Google 主页 + 必应搜索
// @name:en            Google Homepage + Bing Search
// @namespace          https://github.com/raddatzgiorgina-stack/google-page-bing-search
// @version            1.0.0
// @description        页面保持谷歌外观，但每次搜索都由必应 (Bing) 执行。纯属个人兴趣编写，未上架应用商店，禁止盈利或攻击他人等不正当用途。
// @description:en     Keep the Google page, but run every search on Bing. Written purely out of personal interest, not published on any store, forbidden to use for profiteering or attacks.
// @author             raddatzgiorgina-stack
// @license            MIT
// @match              *://www.google.com/*
// @match              *://google.com/*
// @match              *://www.google.com.hk/*
// @match              *://www.google.com.tw/*
// @match              *://www.google.com.sg/*
// @match              *://www.google.co.jp/*
// @match              *://www.google.co.kr/*
// @match              *://www.google.co.uk/*
// @match              *://www.google.de/*
// @match              *://www.google.fr/*
// @match              *://www.google.ca/*
// @match              *://www.google.com.au/*
// @run-at             document-start
// @grant              GM_getValue
// @grant              GM_setValue
// @grant              GM_registerMenuCommand
// @homepageURL        https://github.com/raddatzgiorgina-stack/google-page-bing-search
// @supportURL         https://github.com/raddatzgiorgina-stack/google-page-bing-search/issues
// @downloadURL        https://raw.githubusercontent.com/raddatzgiorgina-stack/google-page-bing-search/main/userscript/google-page-bing-search.user.js
// @updateURL          https://raw.githubusercontent.com/raddatzgiorgina-stack/google-page-bing-search/main/userscript/google-page-bing-search.user.js
// ==/UserScript==

/*
 * 油猴版「Google 主页 + 必应搜索」
 *
 * ⚠️ 与 Chrome 扩展版的区别（重要）
 *   1. 油猴脚本**无法在请求发出前拦截**（Tampermonkey 在 MV3 版本已移除 @webRequest / GM_webRequest），
 *      所以它是「谷歌页面开始加载 → 脚本立刻跳转」的模式，会有一瞬间的谷歌页面闪现，
 *      并且这次查询**确实发给了谷歌**。
 *   2. 因此，**如果你所在网络完全无法访问谷歌，脚本没有机会运行，也就无法跳转**。
 *      这种场景请改用扩展版的「本地仿谷歌页面」，或者把 Chrome 默认搜索引擎直接设成必应。
 *   3. 油猴脚本也**无法接管新标签页 / 主页**（那属于浏览器内置页面的权限），
 *      新标签页请自行用 Chrome 设置或扩展处理。
 *
 * 纯属个人兴趣编写，未提交、也未通过 Chrome 应用商店审核；使用中出现的任何问题作者概不负责。
 * 严格禁止用于盈利、攻击他人等任何不正当用途。
 */

(function () {
  "use strict";

  /* ---------------- 纯逻辑部分（可在 Node 中单元测试） ---------------- */

  const GOOGLE_SEARCH_RE =
    /^https?:\/\/(?:www\.)?google\.(?:com|[a-z]{2})(?:\.[a-z]{2})?\/search\b/i;

  function bingUrl(query, isImageSearch) {
    const base = isImageSearch
      ? "https://www.bing.com/images/search?q="
      : "https://www.bing.com/search?q=";
    return base + encodeURIComponent(query);
  }

  /** 传入任意链接，若是谷歌搜索页且带查询词，返回对应必应地址；否则返回 null。 */
  function googleSearchToBing(href) {
    let url;
    try {
      url = new URL(href);
    } catch (e) {
      return null;
    }
    if (!GOOGLE_SEARCH_RE.test(url.href)) return null;
    const q = url.searchParams.get("q");
    if (!q) return null;
    const isImage = (url.searchParams.get("tbm") || "").toLowerCase() === "isch";
    return bingUrl(q, isImage);
  }

  // 供 Node 单元测试 require 使用；在油猴沙箱里 module 是 undefined，会继续往下走
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { googleSearchToBing, bingUrl, GOOGLE_SEARCH_RE };
    return;
  }

  /* ---------------- 油猴 / 浏览器部分 ---------------- */

  const STORE_KEY = "gpbs_enabled";

  function hasGM(fn) {
    return typeof window !== "undefined" && typeof window[fn] === "function";
  }

  function readEnabled() {
    try {
      return hasGM("GM_getValue") ? window.GM_getValue(STORE_KEY, true) !== false : true;
    } catch (e) {
      return true;
    }
  }

  function writeEnabled(value) {
    try {
      if (hasGM("GM_setValue")) window.GM_setValue(STORE_KEY, value);
    } catch (e) {
      /* 忽略 */
    }
  }

  let enabled = readEnabled();

  /** 如果当前地址是谷歌搜索页，就跳到必应；返回是否发生了跳转。 */
  function redirectIfNeeded(href) {
    if (!enabled) return false;
    const target = googleSearchToBing(href || location.href);
    if (!target) return false;
    location.replace(target);
    return true;
  }

  // 路径 1：页面刚开始加载就检查（油猴版最主要的路径，因为拦不到请求）
  if (redirectIfNeeded(location.href)) return;

  function readQueryFromForm(form) {
    const candidates = [
      'input[name="q"]',
      'textarea[name="q"]',
      'input[name="as_q"]',
      'input[type="search"]',
      'input[type="text"]',
      "textarea"
    ];
    for (let i = 0; i < candidates.length; i++) {
      const el = form.querySelector(candidates[i]);
      if (el && typeof el.value === "string" && el.value.trim()) {
        return el.value.trim();
      }
    }
    return "";
  }

  // 路径 2：拦截搜索框提交
  document.addEventListener(
    "submit",
    function (event) {
      if (!enabled) return;
      const form = event.target;
      if (!form || form.tagName !== "FORM") return;
      const action = form.getAttribute("action") || "";
      if (!/search/i.test(action) && location.pathname !== "/") return;
      const query = readQueryFromForm(form);
      if (!query) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      location.assign(bingUrl(query, /tbm=isch/i.test(location.href)));
    },
    true
  );

  // 路径 3：拦截指向谷歌搜索结果的链接
  document.addEventListener(
    "click",
    function (event) {
      if (!enabled) return;
      const node = event.target;
      const anchor = node && node.closest ? node.closest("a[href]") : null;
      if (!anchor) return;
      const target = googleSearchToBing(anchor.href);
      if (!target) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      location.assign(target);
    },
    true
  );

  // 路径 4：谷歌结果页用的是 history API，页面不会整体刷新，这里补一下
  try {
    ["pushState", "replaceState"].forEach(function (name) {
      const original = history[name];
      history[name] = function () {
        const result = original.apply(this, arguments);
        redirectIfNeeded(location.href);
        return result;
      };
    });
    window.addEventListener("popstate", function () {
      redirectIfNeeded(location.href);
    });
  } catch (e) {
    /* 部分页面会锁住 history，忽略 */
  }

  // 菜单开关
  if (hasGM("GM_registerMenuCommand")) {
    try {
      window.GM_registerMenuCommand(
        enabled ? "✅ 搜索转必应（点击停用）" : "⛔ 已停用（点击启用）",
        function () {
          enabled = !enabled;
          writeEnabled(enabled);
          alert(
            enabled
              ? "已启用：在谷歌页面搜索会改由必应执行。"
              : "已停用：恢复谷歌原生搜索。"
          );
          location.reload();
        }
      );
    } catch (e) {
      /* 忽略 */
    }
  }
})();
