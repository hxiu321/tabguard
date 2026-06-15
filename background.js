importScripts("lib/utils.js", "lib/storage.js", "lib/ai.js");

const {
  DEFAULT_SETTINGS,
  buildLocalSummary,
  daysFromNow,
  faviconFallback,
  isSavableUrl,
  normalizeUrl
} = self.TabGuardUtils;

const { AISummarizer } = self.TabGuardAI;
const storage = self.TabGuardStorage;

chrome.runtime.onInstalled.addListener(async () => {
  const settings = await storage.getSettings();
  await storage.setSettings({ ...DEFAULT_SETTINGS, ...settings });
  await updateBadge();
});

if (chrome.runtime.onStartup) {
  chrome.runtime.onStartup.addListener(updateBadge);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message?.type) {
    return false;
  }

  const handlers = {
    SAVE_ACTIVE_TAB: saveActiveTab,
    GET_PAGES: getPages,
    DELETE_PAGE: deletePage,
    DELETE_PAGE_BY_URL: deletePageByUrl,
    RESET_EXPIRY: resetExpiry,
    OPEN_AND_REMOVE: openAndRemove,
    CLEAR_PAGES: clearPages,
    GET_SETTINGS: getSettings,
    SAVE_SETTINGS: saveSettings
  };

  const handler = handlers[message.type];
  if (!handler) {
    return false;
  }

  handler(message.payload || {}, sender)
    .then((data) => sendResponse({ ok: true, data }))
    .catch((error) => {
      console.error("[TabGuard]", error);
      sendResponse({
        ok: false,
        error: error?.message || "操作失败"
      });
    });

  return true;
});

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function saveActiveTab() {
  const tab = await getActiveTab();

  if (!tab?.id || !isSavableUrl(tab.url)) {
    throw new Error("当前页面无法保存");
  }

  const settings = await storage.getSettings();
  const pageInfo = await extractPageInfo(tab);
  const summarizer = new AISummarizer(settings);
  const aiResult = settings.autoSummary
    ? await summarizer.summarize(pageInfo)
    : {
        summary: buildLocalSummary(pageInfo),
        category: self.TabGuardUtils.inferCategory(`${pageInfo.title} ${pageInfo.url}`, settings.categories),
        source: "local"
      };

  const page = await storage.upsertPage({
    url: normalizeUrl(tab.url),
    title: pageInfo.title || tab.title || "未命名页面",
    summary: aiResult.summary,
    category: aiResult.category,
    savedAt: Date.now(),
    expiresAt: daysFromNow(settings.expiryDays),
    favicon: tab.favIconUrl || faviconFallback(tab.url),
    domain: self.TabGuardUtils.getDomain(tab.url),
    summarySource: aiResult.source
  });

  await updateBadge();

  if (settings.closeTabAfterSave) {
    setTimeout(() => {
      chrome.tabs.remove(tab.id).catch(() => {});
    }, 1800);
  }

  return {
    page,
    willClose: Boolean(settings.closeTabAfterSave)
  };
}

async function extractPageInfo(tab) {
  const fallback = {
    url: tab.url,
    title: tab.title || "未命名页面",
    content: ""
  };

  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const metaDescription =
          document.querySelector('meta[name="description"]')?.content ||
          document.querySelector('meta[property="og:description"]')?.content ||
          "";
        const headings = Array.from(document.querySelectorAll("h1, h2"))
          .slice(0, 4)
          .map((node) => node.innerText)
          .filter(Boolean);
        const paragraphs = Array.from(document.querySelectorAll("article p, main p, p"))
          .slice(0, 12)
          .map((node) => node.innerText)
          .filter((text) => text && text.trim().length > 20);

        return {
          url: location.href,
          title: document.title,
          content: [metaDescription, ...headings, ...paragraphs].join("\n").slice(0, 4000)
        };
      }
    });

    return {
      ...fallback,
      ...(result?.result || {})
    };
  } catch (error) {
    console.warn("[TabGuard] Page extraction failed.", error);
    return fallback;
  }
}

async function getPages() {
  return storage.getAllPages();
}

async function deletePage({ id }) {
  await storage.deletePage(id);
  await updateBadge();
  return true;
}

async function deletePageByUrl({ url }) {
  const result = await storage.deletePageByUrl(url);
  await updateBadge();
  return result;
}

async function resetExpiry({ id }) {
  const settings = await storage.getSettings();
  const page = await storage.resetExpiry(id, daysFromNow(settings.expiryDays));
  await updateBadge();
  return page;
}

async function openAndRemove({ id, url }) {
  if (!url) {
    throw new Error("缺少页面 URL");
  }

  await chrome.tabs.create({ url });

  if (id) {
    await storage.deletePage(id);
  } else {
    await storage.deletePageByUrl(url);
  }

  await updateBadge();
  return true;
}

async function clearPages() {
  await storage.clearPages();
  await updateBadge();
  return true;
}

async function getSettings() {
  return storage.getSettings();
}

async function saveSettings(settings) {
  const merged = {
    ...DEFAULT_SETTINGS,
    ...settings,
    expiryDays: Math.max(1, Number.parseInt(settings.expiryDays, 10) || DEFAULT_SETTINGS.expiryDays),
    categories: normalizeCategories(settings.categories)
  };

  await storage.setSettings(merged);
  return merged;
}

function normalizeCategories(categories) {
  const list = Array.isArray(categories) ? categories : DEFAULT_SETTINGS.categories;
  const unique = Array.from(
    new Set(
      list
        .map((category) => String(category || "").trim())
        .filter(Boolean)
    )
  );

  return unique.length ? unique : DEFAULT_SETTINGS.categories;
}

async function updateBadge() {
  const pages = await storage.getAllPages();
  const expired = pages.filter((page) => Number(page.expiresAt) < Date.now()).length;

  await chrome.action.setBadgeText({
    text: pages.length ? String(pages.length) : ""
  });
  await chrome.action.setBadgeBackgroundColor({
    color: expired ? "#D92D20" : "#2563EB"
  });
}
