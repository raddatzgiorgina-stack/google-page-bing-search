# Google Homepage + Bing Search

> Keep the Google search page as your homepage — but run every search on **Bing**.
> A Chrome / Edge extension written **purely out of personal interest**.

![New tab preview](docs/preview-newtab.png)

[简体中文](README.md) | **English**

---

## What is this

Chrome's built-in settings can only point the **address bar** and the **new tab search box** at Bing. But if you type into the search box on the `google.com` page itself and hit Enter, the search still goes to Google — because that request is issued by the web page, not by the browser UI.

This extension fills exactly that gap: **any navigation to `google.*/search?q=…` is rewritten to `bing.com/search?q=…` before the request is ever sent.**

- The page still looks like Google (new tab / homepage stay on Google)
- Every search goes to Bing — **including the search box inside the Google page**
- Your browser's default search engine setting is never modified, and you can switch it off with one click

## Features

| Feature | Detail |
| --- | --- |
| Search redirect | `google.*/search?q=KEYWORD` → `bing.com/search?q=KEYWORD`; image search → `bing.com/images` |
| Request-level rewrite | Built on MV3 `declarativeNetRequest`. The rewrite happens **before** the request is sent, so you never see a flash of the Google results page |
| Fallback interception | A content script catches search-box submits and link clicks for edge cases the rules miss |
| New tab takeover | Two modes: **real Google homepage** / **local Google-lookalike page** (the latter needs no Google access at all) |
| One-click toggle | Enable or disable from the toolbar popup at any time |
| Parameter cleanup | Drops leftover Google params (`oq`, `sourceid`, `ie`, …) so the landing URL stays clean |

## Screenshots

| Settings popup | Local Google-lookalike page |
| --- | --- |
| ![popup](docs/preview-popup.png) | ![newtab](docs/preview-newtab.png) |

## Installation

### Option 1 — Load unpacked (recommended)

1. Download this repo: `Code` → `Download ZIP` and extract it, or `git clone` it
2. Open `chrome://extensions/` (Edge: `edge://extensions/`)
3. Turn on **Developer mode** in the top-right corner
4. Click **Load unpacked** and pick the folder that **contains `manifest.json`**
5. Click the toolbar icon → **Test a search**. It should land on `bing.com/search?q=hello+bing`

### Option 2 — CRX package

There is a packed `.crx` under `dist/`. Please note:

> Since Chrome 137, **a CRX that does not come from the Chrome Web Store can no longer be installed directly**. I tested all three routes — command-line `--load-extension`, registry-based external install, and `External Extensions` — and all of them are blocked. The CRX is fine for distribution, archiving, or enterprise policy deployment; for local use, please use Option 1.

### Option 3 — Userscript (Tampermonkey)

If "developer mode + load unpacked" feels like too much hassle, use the userscript version:

1. Install the [Tampermonkey](https://www.tampermonkey.net/) browser extension first (available in the Chrome Web Store);
2. Open the link below and Tampermonkey will pop up its install page automatically:

   ```
   https://raw.githubusercontent.com/raddatzgiorgina-stack/google-page-bing-search/main/userscript/google-page-bing-search.user.js
   ```

3. Click **Install**. You can toggle this script on and off from the Tampermonkey dashboard afterwards.

#### How the userscript differs from the extension (**read this before choosing**)

| | Extension | Userscript |
| --- | --- | --- |
| When it intercepts | **Before** the request is sent (`declarativeNetRequest`) | **Right after** the page starts loading, then jumps |
| Does the query reach Google? | **No** | **Yes** — the request has already been sent |
| Works when Google is unreachable? | **Yes** (the rules act locally, no need to reach Google) | **No** — the script never gets a chance to run, because the page never loads |
| Can it take over the new tab page / homepage? | Yes | **No** — built-in browser pages don't allow script injection |
| Image search → `bing.com/images` | Yes | Yes |
| Installation effort | Developer mode + load unpacked | One click |

The reason for these differences: **Tampermonkey removed `@webRequest` / `GM_webRequest` in its Manifest V3 versions** (which is what Chrome runs today). Straight from the official docs:

> *It is also not available anymore at Manifest v3 versions of Tampermonkey 5.2+ (Chrome and derivates).*

Without request interception, a userscript can only "let the Google page start loading, then swap it out immediately".

**Bottom line**: if you can reach Google normally and just want the easy route, the userscript is fine. If you can't reach Google, or you want the new tab page to be Google too, use the extension.

## How it works

At its core this is a single declarative network rule (see `rules.json`):

```
https://www.google.com/search?q=KEYWORD          ->  https://www.bing.com/search?q=KEYWORD
https://www.google.com/search?q=KEYWORD&tbm=isch ->  https://www.bing.com/images/search?q=KEYWORD
```

It uses the `declarativeNetRequest` redirect capability, so the rewrite happens at the **network layer** and the browser never sends the search request to Google at all. That also means the redirect works even if Google is slow or unreachable from your network.

The second layer is `content.js`, which intercepts `submit` events from the search box and clicks on Google search links. The two layers cover each other's blind spots.

## Settings

Click the toolbar icon to open the popup:

| Setting | Description |
| --- | --- |
| **Google search → Bing** | Master switch; turn it off to restore native Google behaviour |
| **New tab / homepage → Real Google homepage** | New tabs open `https://www.google.com/` (default) |
| **New tab / homepage → Local lookalike page** | Shows a local page styled like Google; searches go straight to Bing. **Use this if google.com is unreachable from your network** |

## FAQ

**Do I need to uninstall anything first?**
No. The extension never touches your browser settings.

**Does it affect Gmail or Docs?**
No. The rules only match `google.*/search?...`, and `content.js` only acts on search pages.

**Why does it request so many permissions?**
`declarativeNetRequest` redirect rules require host permissions for the URLs being rewritten, hence the list of common Google domains. The extension does not read or upload any page content; everything happens locally, and there is no telemetry of any kind.

**Why does an image search sometimes become a regular Bing web search?**
Only URLs shaped like `/search?q=xx&tbm=isch` (with `q` first) are redirected to `bing.com/images`. Other parameter orders fall back to a Bing web search. Add another rule in `rules.json` if you want to cover those.

**Why wasn't my homepage set to Google automatically?**
`chrome_settings_overrides.homepage` may be ignored for an unpacked install (the domain-ownership verification requirement applies to Web Store publishing). Just set it manually: Settings → Appearance → Show home button → enter `https://www.google.com/`.

## Prior art — why not use an existing extension

I searched GitHub first, and **found nothing that fits**:

- The closest, [HotlineBing](https://github.com/StefanSokic/HotlineBing), replaces **the entire Google page** and is built on the legacy Manifest V2;
- [SwapSearch](https://github.com/harish-chary/SwapSearch) and [SearchBar](https://github.com/minxuanz/SearchBar) require a **manual click** to switch engines;
- [chrome-search-extras](https://github.com/tranc99/chrome-search-extras) merely **adds** a Bing entry alongside Google;
- most of the rest are reverse "Bing → Google" redirectors.

The full survey is in [docs/RESEARCH.md](docs/RESEARCH.md).

## Disclaimer

**This project was written purely out of personal interest, for technical learning and exchange.**

- **Not published on any store**: This Extension has **never been submitted to, nor approved by, the Chrome Web Store**. It is not a published store extension and is not distributed through any store.
- **Usability**: Because Chrome strictly restricts extension installation sources, the Extension **may fail to install, or may not work fully after installation**, and it may partially or completely stop working due to browser updates, changes to Google's pages, or changes to Bing's endpoints. **The author accepts no responsibility for any problem encountered while using it.**
- It is not affiliated with Google or Microsoft in any way. All trademarks and product names belong to their respective owners.
- The extension only rewrites your own browser requests locally. It collects nothing, stores nothing, uploads nothing, and contains no analytics or tracking code.
- **Strictly forbidden** uses include: **any form of profiteering** (commercial sale, paid distribution, bundling into a commercial product, etc.); **attacking or harming others** (intruding into, scanning, or disrupting other people's systems, networks, accounts, or data); and any **improper or unlawful conduct** such as circumventing content filtering, fraud, harassment, or spreading unlawful information. Violators bear all consequences themselves.
- Please comply with the laws of your jurisdiction and the terms of service of the sites you visit.

See [DISCLAIMER.md](DISCLAIMER.md) for the full bilingual text, including the complete review-status notice and the list of prohibited uses.

## License

[MIT](LICENSE)
