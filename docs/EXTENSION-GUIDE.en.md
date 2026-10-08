# Google Homepage + Bing Search (Chrome Extension)

[简体中文](README.md) | **English**

Goal: **keep the new tab page / homepage as the Google search page, but run every search on Bing.**

⚠️ **Read before use**: This extension has **never been submitted to, nor approved by, the Chrome Web Store**. It cannot be guaranteed to install or work fully in every environment; **the author accepts no responsibility for any problem encountered while using it**. This project was written **purely out of personal interest**, and is **strictly forbidden** to be used for profiteering, attacking others, or any other improper purpose. See *Section 9 — Disclaimer and Prohibited Uses* at the end for details.

---

## 1. First, the conclusion (about existing extensions)

I searched GitHub and the public web, and **found no existing extension that fully matches this need**. The closest ones:

| Project | What it does | Does it fit? |
| --- | --- | --- |
| [StefanSokic/HotlineBing](https://github.com/StefanSokic/HotlineBing) | Redirects **every** Google domain and search to bing.com, and replaces the new tab page with a custom one | No — the Google page is replaced entirely, and it is on the legacy Manifest V2 |
| [harish-chary/SwapSearch](https://github.com/harish-chary/SwapSearch) | One-click switch of the current search between Google / Bing / DuckDuckGo / Yahoo | No — manual clicking, not an automatic rewrite |
| [tranc99/chrome-search-extras](https://github.com/tranc99/chrome-search-extras) | Adds an extra "search with Bing" entry on the Google search page | No — it only adds a parallel entry, it doesn't replace the original behaviour |
| [SandroLinux/Come-on-DuckDuckGo](https://github.com/SandroLinux/Come-on-DuckDuckGo) | Sends visits to Google/Bing/Yahoo etc. to DuckDuckGo instead | No — wrong target engine and wrong page |

There are also plenty of reverse "bing → google" redirectors, plus engine-roulette extensions like `SearchBar` / `SearchPlus` / `SearchEngineSwitcher`. A fuller survey is in `research-findings.md` in the same directory.

**So this extension was written from scratch for this specific need.**

One clarification: if all you want is for the **address bar search** to use Bing, Chrome's built-in settings already do that (Settings → Search engine → set the default to Bing).
You only need an extension because you want "the page stays Google, the search goes to Bing" — and that includes the search submitted from **the search box inside the Google page**, which Chrome's settings cannot touch.

---

## 2. How this extension works

At its core there is one rewrite rule:

```
https://www.google.com/search?q=KEYWORD          ->  https://www.bing.com/search?q=KEYWORD
https://www.google.com/search?q=KEYWORD&tbm=isch ->  https://www.bing.com/images/search?q=KEYWORD
```

It is implemented in two layers that **cover each other's blind spots**:

1. **`rules.json` (declarativeNetRequest static rules)** — rewrites the Google search URL to a Bing URL **before the request is ever sent**.
   So whether the search comes from the address bar or from the search box on the Google homepage, the Google results page is **never loaded first** — no flash, and it does not depend on Google's servers being reachable.
2. **`content.js` (fallback content script)** — if a request ever slips past the rules (for example a rare Google domain without a host permission), it intercepts the search box submit and link clicks in the page and sends them to Bing as well.

Two extra "page feel" options come with it:

- `chrome_settings_overrides.homepage` sets the browser **homepage** to `https://www.google.com/`.
- `chrome_url_overrides.newtab` takes over the **new tab page**, with two modes (see below).

---

## 3. Installation (load unpacked in developer mode)

1. Open Chrome and type `chrome://extensions/` in the address bar.
2. Turn on **Developer mode** in the top-right corner.
3. Click **Load unpacked**.
4. Select this folder, `google-homepage-bing-search` (the folder that **contains `manifest.json`**).
5. If Chrome asks whether to change your homepage settings during install, choose **Keep**.

The same works in Edge: `edge://extensions/` → developer mode → Load unpacked.

---

## 4. Settings

Click the extension icon in the toolbar to open the settings popup:

| Setting | Description |
| --- | --- |
| **Google search → Bing** | Master switch. Turn it off and search behaviour returns to native Google. |
| **New tab / homepage → Real Google homepage** | New tabs jump to `https://www.google.com/`, i.e. the Google search page itself. **(default)** |
| **New tab / homepage → Local lookalike page** | Shows a local page styled like the Google homepage (coloured logo + rounded search box); searches go straight to Bing. **Use this when google.com is unreachable.** |
| **Test a search** | Opens `google.com/search?q=hello+bing`; if everything works, it ends up on `bing.com/search?q=hello+bing`. |

---

## 5. FAQ

**1. Why is there a separate "local lookalike page"?**

Because a direct connection to `google.com` is usually unavailable from mainland China. The default "real Google homepage" needs to reach Google; if it can't, switch to the local lookalike page, which does not depend on Google's servers at all.

**2. I don't want the extension to take over my new tab page (I want Chrome's default one). What do I do?**

Open `manifest.json`, delete the block below, then click the refresh button for this extension on `chrome://extensions/`:

```json
"chrome_url_overrides": {
  "newtab": "newtab.html"
},
```

Note: `chrome_url_overrides` can only be declared statically in the manifest; there is no runtime toggle for it, so this is the only way to turn it off.

**3. I don't want the extension to change my homepage?**

Same idea: delete the `"chrome_settings_overrides"` block from `manifest.json`.

**4. Why did an image search turn into a Bing web search?**

Only URLs shaped like `/search?q=xx&tbm=isch` (with `q` first) are sent to `bing.com/images`; other parameter orders degrade to a Bing web search. If you hit one, just add another rule in the same format as the ones in `rules.json`.

**5. Why does it request so many permissions?**

`declarativeNetRequest` redirect rules require the extension to hold host permissions for **the URLs being rewritten**, hence the list of a dozen common Google domains (google.com / .com.hk / .com.tw / .co.jp / .co.uk / .de, etc.). The extension **does not read, let alone upload, any page content** — every rewrite happens locally.

**6. Will it affect my access to Gmail or Docs?**

No. The rules only match `google.*/search?...`, and `content.js` only acts when it lands on a search page.

**7. Why didn't the homepage setting take effect?**

The official documentation states that domains used in `chrome_settings_overrides` must have their ownership verified by the developer through Search Console; that restriction is mainly aimed at extensions published to the Web Store.
In testing (Edge headless, unpacked install) the field was **ignored** by the browser, but it **does not affect the extension loading** — the search rewrite and the new tab page keep working normally.
If it didn't take effect, simply set it by hand: Chrome → Settings → Appearance → turn on "Show home button" → set the custom homepage to `https://www.google.com/`.

---

## 6. File structure

```
google-homepage-bing-search/
├── manifest.json          # MV3 manifest: permissions, ruleset, homepage/new tab overrides
├── rules.json             # Core: Google search -> Bing redirect rules
├── background.js          # Default settings + keeps the ruleset in sync with the toggle
├── content.js             # Fallback interception (form submit / link clicks)
├── newtab.html/.css/.js   # New tab page (real Google homepage or local lookalike)
├── popup.html/.css/.js    # Toolbar settings popup
├── icons/                 # 16 / 48 / 128 icons
├── README.md              # Documentation (Simplified Chinese)
└── README.en.md           # Documentation (English)
```

---

## 7. Optional "more thorough" setup

If you also want the **address-bar search suggestions / autocomplete** to come from Bing, set Chrome's default search engine to Bing
(Settings → Search engine → Manage search engines). Combined with this extension, the Google page stays as it is while every search goes through Bing.

---

## 8. CRX packaging and future updates

The bundled `.crx` is a **CRX3** package produced by Chrome's own packer. Its signing public key is already written into the `key` field of `manifest.json`,
and the extension ID is fixed at **`nkbpomhadicbpikkdoeamjokkblbdaed`**.

**Important caveat**: since Chrome 137, a CRX that does not come from the Chrome Web Store can generally no longer be installed directly (command-line `--load-extension`,
registry-based external install, and `External Extensions` were all tested and blocked). Therefore:

- **For local use** → "Load unpacked" is the most reliable (see section 3).
- **What the CRX is for** → distributing to others, archiving, or enterprise policy / Web Store publishing.

### Repacking after you change the code (keeping the same extension ID)

```
chrome.exe --pack-extension="<extension dir>" --pack-extension-key="google-homepage-bing-search-signing-key.pem"
```

- Take good care of the private key `google-homepage-bing-search-signing-key.pem`: **the same private key means the same extension ID**. If you lose it, you can only move to a new ID, which amounts to a different extension.
- After a successful pack, a `<extension dir name>.crx` is generated next to the extension directory, with the extension ID unchanged.
- Remember to bump `version` in `manifest.json` before packing, so versions stay distinguishable.

---

## 9. Disclaimer and prohibited uses

### 9.1 Review status and usability (please read first)

- This extension has **never been submitted to, nor approved by, the Chrome Web Store**. It is not a published store extension and is not distributed through any store.
- Because Chrome strictly restricts extension installation sources, the extension **may fail to install, or may not work fully after installation**; its behaviour may differ across browser versions and system environments.
- Even when installation succeeds, functionality **may partially or completely stop working** due to browser updates, changes to Google's pages, or changes to Bing's endpoints — and it may not be fixed promptly.
- Therefore, **the author accepts no responsibility for any problem encountered while using it**. Please assess and bear the risks of use yourself.

### 9.2 Nature of the project

This project was written **purely out of personal interest**, for technical learning, hands-on browser-extension development, and personal workflow tuning. It is **not a commercial product**, and is not backed or endorsed by any company or organisation.

### 9.3 No affiliation

This extension is **not affiliated with, partnered with, sponsored by, or endorsed by** Google LLC or Microsoft Corporation in any way. The names and trademarks "Google", "Chrome", "Bing", and "Edge" belong to their respective owners and are used here only to describe functionality and compatibility factually.

### 9.4 Data handling

This extension only rewrites your own browser requests **locally on your machine**, and every rewrite runs entirely offline. It does **not collect, store, or upload** any browsing history, search queries, page content, or personal data, and the code contains **no analytics, telemetry, advertising, or tracking** of any kind.

### 9.5 Prohibited uses (strictly forbidden)

The following uses of this extension are **strictly forbidden**:

1. **Any form of profiteering** — including but not limited to commercial sale, paid distribution, per-use charging, subscription fees, or bundling this extension into a commercial product or paid service for profit.
2. **Attacking or harming others** — including but not limited to attacking, intruding into, scanning, probing, disrupting, or disabling other people's systems, networks, accounts, or data.
3. **Improper or unlawful conduct** — including but not limited to circumventing content filtering or regulatory measures, online fraud, harassment, spreading unlawful or harmful information, or infringing others' privacy or intellectual property.
4. Any other conduct that violates applicable laws and regulations, offends public order and morals, or harms the legitimate rights and interests of others.

All consequences arising from a violation of the above are **borne solely by the user** and are unrelated to the author.

### 9.6 Limitation of liability

This extension is provided "**as is**", without warranty of any kind, express or implied. The author accepts **no liability** for any direct or indirect loss arising from the use of, or inability to use, this extension. Please comply with the laws of your jurisdiction and the terms of service of the sites you visit.
