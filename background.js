/* 服务工作者：初始化默认设置，并让 DNR 静态规则集与开关保持同步。 */

const RULESET_ID = "google_search_to_bing";

async function syncRuleset() {
  const { enabled } = await chrome.storage.sync.get({ enabled: true });
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
    console.warn("[google-bing] 规则集同步失败：", err);
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.sync.get(["enabled", "newtabMode"]);
  const patch = {};
  if (current.enabled === undefined) patch.enabled = true;
  if (current.newtabMode === undefined) patch.newtabMode = "real";
  if (Object.keys(patch).length) {
    await chrome.storage.sync.set(patch);
  }
  await syncRuleset();
});

chrome.runtime.onStartup.addListener(syncRuleset);
