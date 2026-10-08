/*
 * 兜底内容脚本。
 * 正常情况下由 rules.json 里的 declarativeNetRequest 规则在“请求发出前”就把
 * 谷歌搜索地址重定向到 bing.com；本脚本只在规则未命中时补位
 * （例如某个冷门谷歌域名没申请主机权限、或规则集被临时关闭后又提交了表单）。
 */
(() => {
  "use strict";

  const GOOGLE_SEARCH_RE =
    /^https?:\/\/(?:www\.)?google\.(?:com|[a-z]{2})(?:\.[a-z]{2})?\/search\b/i;

  let enabled = true;

  chrome.storage.sync
    .get({ enabled: true })
    .then((state) => {
      enabled = state.enabled !== false;
      if (enabled) checkCurrentLocation();
    })
    .catch(() => {});

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes.enabled) {
      enabled = changes.enabled.newValue !== false;
    }
  });

  function bingUrl(query, isImageSearch) {
    const prefix = isImageSearch
      ? "https://www.bing.com/images/search?q="
      : "https://www.bing.com/search?q=";
    return prefix + encodeURIComponent(query);
  }

  /** 传入任意链接，若是谷歌搜索页且带有查询词，则返回对应的必应地址。 */
  function toBingUrl(href) {
    let url;
    try {
      url = new URL(href, location.href);
    } catch {
      return null;
    }
    if (!GOOGLE_SEARCH_RE.test(url.href)) return null;

    const q = url.searchParams.get("q");
    if (!q) return null;

    const isImageSearch = (url.searchParams.get("tbm") || "").toLowerCase() === "isch";
    return bingUrl(q, isImageSearch);
  }

  function checkCurrentLocation() {
    const target = toBingUrl(location.href);
    if (target) location.replace(target);
  }

  function readQueryFromForm(form) {
    const candidates = [
      'input[name="q"]',
      'textarea[name="q"]',
      'input[name="as_q"]',
      'input[type="search"]',
      'input[type="text"]',
      "textarea"
    ];
    for (const selector of candidates) {
      const el = form.querySelector(selector);
      if (el && typeof el.value === "string" && el.value.trim()) {
        return el.value.trim();
      }
    }
    return "";
  }

  // 拦截搜索框提交（谷歌首页 / 结果页顶部的搜索框）。
  document.addEventListener(
    "submit",
    (event) => {
      if (!enabled) return;

      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;

      const action = form.getAttribute("action") || "";
      const looksLikeSearch = /search/i.test(action) || location.pathname === "/";
      if (!looksLikeSearch) return;

      const query = readQueryFromForm(form);
      if (!query) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      location.assign(bingUrl(query, /tbm=isch/i.test(location.href)));
    },
    true
  );

  // 拦截指向谷歌搜索页的链接点击。
  document.addEventListener(
    "click",
    (event) => {
      if (!enabled) return;

      const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!anchor) return;

      const target = toBingUrl(anchor.href);
      if (!target) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      location.assign(target);
    },
    true
  );
})();
