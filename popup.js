const RULESET_ID = "google_search_to_bing";

const $ = (id) => document.getElementById(id);

function setStatus(enabled) {
  $("status").textContent = enabled
    ? "已启用：Google 搜索 → Bing"
    : "已停用：搜索不会被改写";
}

async function render() {
  const { enabled, newtabMode } = await chrome.storage.sync.get({
    enabled: true,
    newtabMode: "real"
  });
  $("enabled").checked = enabled !== false;
  $("newtabMode").value = newtabMode || "real";
  setStatus(enabled !== false);
}

$("enabled").addEventListener("change", async (event) => {
  const enabled = event.target.checked;
  await chrome.storage.sync.set({ enabled });

  try {
    if (enabled) {
      await chrome.declarativeNetRequest.updateEnabledRulesets({
        enableRulesetIds: [RULESET_ID]
      });
    } else {
      await chrome.declarativeNetRequest.updateEnabledRulesets({
        disableRulesetIds: [RULESET_ID]
      });
    }
  } catch (err) {
    console.warn("规则集切换失败：", err);
  }

  setStatus(enabled);
});

$("newtabMode").addEventListener("change", async (event) => {
  await chrome.storage.sync.set({ newtabMode: event.target.value });
});

$("test").addEventListener("click", () => {
  // 打开一个谷歌搜索地址；若一切正常，最终会落在 bing.com/search。
  chrome.tabs.create({ url: "https://www.google.com/search?q=hello+bing" });
});

render().catch((err) => console.warn("读取设置失败：", err));
