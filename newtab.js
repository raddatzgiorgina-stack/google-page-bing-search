/*
 * 新标签页行为：
 *   newtabMode = "real"  -> 直接跳到真实的谷歌首页 https://www.google.com/
 *   newtabMode = "local" -> 显示本地仿谷歌页面，搜索交给 Bing
 */
(async () => {
  let mode = "real";
  try {
    const state = await chrome.storage.sync.get({ newtabMode: "real" });
    mode = state.newtabMode || "real";
  } catch {
    /* 读不到设置时按默认值处理 */
  }

  if (mode === "real") {
    location.replace("https://www.google.com/");
    return;
  }

  document.documentElement.classList.add("ready");

  const lucky = document.getElementById("lucky");
  lucky?.addEventListener("click", () => {
    const q = document.getElementById("q").value.trim();
    location.assign(
      q ? "https://www.bing.com/search?q=" + encodeURIComponent(q) : "https://www.bing.com/"
    );
  });
})();
