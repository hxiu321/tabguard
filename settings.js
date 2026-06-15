const utils = globalThis.TabGuardUtils;
const storage = globalThis.TabGuardStorage;

const form = document.getElementById("settingsForm");
const els = {
  addCategory: document.getElementById("addCategory"),
  apiKey: document.getElementById("apiKey"),
  autoSummary: document.getElementById("autoSummary"),
  backButton: document.getElementById("backButton"),
  baseUrl: document.getElementById("baseUrl"),
  categoryList: document.getElementById("categoryList"),
  clearAllData: document.getElementById("clearAllData"),
  closeTabAfterSave: document.getElementById("closeTabAfterSave"),
  expiryDays: document.getElementById("expiryDays"),
  newCategory: document.getElementById("newCategory"),
  pageTotal: document.getElementById("pageTotal"),
  provider: document.getElementById("provider"),
  saveHint: document.getElementById("saveHint")
};

const state = {
  settings: { ...utils.DEFAULT_SETTINGS },
  pages: []
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  try {
    bindEvents();
    await loadSettings();
  } catch (error) {
    console.error("[TabGuard] Settings failed to initialize.", error);
    setHint(error.message || "设置页加载失败");
  }
}

function bindEvents() {
  els.backButton.addEventListener("click", () => {
    if (history.length > 1) {
      history.back();
    } else {
      window.close();
    }
  });

  form.addEventListener("submit", saveSettings);
  els.addCategory.addEventListener("click", addCategory);
  els.newCategory.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addCategory();
    }
  });
  els.clearAllData.addEventListener("click", clearAllData);
}

async function loadSettings() {
  const [settings, pages] = await Promise.all([
    readSettings(),
    readPages()
  ]);

  state.settings = { ...utils.DEFAULT_SETTINGS, ...(settings || {}) };
  state.settings.categories = normalizeCategories(state.settings.categories);
  state.pages = pages || [];
  fillForm();
  renderCategories();
  renderPageCount();
}

function fillForm() {
  els.provider.value = state.settings.provider;
  els.baseUrl.value = state.settings.baseUrl;
  els.apiKey.value = state.settings.apiKey;
  els.closeTabAfterSave.checked = Boolean(state.settings.closeTabAfterSave);
  els.autoSummary.checked = Boolean(state.settings.autoSummary);
  els.expiryDays.value = state.settings.expiryDays;
}

function renderCategories() {
  els.categoryList.replaceChildren(
    ...state.settings.categories.map((category, index) => {
      const chip = document.createElement("div");
      chip.className = "categoryChip";

      const input = document.createElement("input");
      input.value = category;
      input.maxLength = 12;
      input.setAttribute("aria-label", `编辑分类 ${category}`);
      input.addEventListener("input", () => {
        state.settings.categories[index] = input.value.trim();
      });
      input.addEventListener("blur", normalizeCategoryList);

      const remove = document.createElement("button");
      remove.className = "chipRemove";
      remove.type = "button";
      remove.title = "删除分类";
      remove.setAttribute("aria-label", `删除分类 ${category}`);
      remove.textContent = "×";
      remove.disabled = state.settings.categories.length <= 1;
      remove.addEventListener("click", () => {
        state.settings.categories.splice(index, 1);
        normalizeCategoryList();
      });

      chip.append(input, remove);
      return chip;
    })
  );
}

function addCategory() {
  const value = els.newCategory.value.trim();
  if (!value) {
    return;
  }

  state.settings.categories.push(value);
  els.newCategory.value = "";
  normalizeCategoryList();
}

function normalizeCategoryList() {
  const categories = state.settings.categories
    .map((category) => String(category || "").trim())
    .filter(Boolean);

  state.settings.categories = Array.from(new Set(categories));

  if (!state.settings.categories.length) {
    state.settings.categories = [...utils.DEFAULT_CATEGORIES];
  }

  renderCategories();
}

function renderPageCount() {
  els.pageTotal.textContent = `已保存页面数：${state.pages.length}`;
}

async function saveSettings(event) {
  event.preventDefault();
  normalizeCategoryList();
  setSaving(true);

  try {
    const settings = {
      provider: els.provider.value,
      baseUrl: els.baseUrl.value.trim(),
      apiKey: els.apiKey.value.trim(),
      closeTabAfterSave: els.closeTabAfterSave.checked,
      autoSummary: els.autoSummary.checked,
      expiryDays: Math.max(1, Number.parseInt(els.expiryDays.value, 10) || utils.DEFAULT_SETTINGS.expiryDays),
      categories: normalizeCategories(state.settings.categories)
    };

    state.settings = await writeSettings(settings);
    fillForm();
    setHint("设置已保存");
  } catch (error) {
    console.error("[TabGuard] Failed to save settings.", error);
    setHint(error.message || "保存失败");
  } finally {
    setSaving(false);
  }
}

async function clearAllData() {
  const confirmed = window.confirm("确定清空所有已保存页面吗？这个操作无法撤销。");
  if (!confirmed) {
    return;
  }

  try {
    await clearPages();
    state.pages = [];
    renderPageCount();
    setHint("所有数据已清空");
  } catch (error) {
    console.error("[TabGuard] Failed to clear pages.", error);
    setHint(error.message || "清空失败");
  }
}

function setHint(text) {
  els.saveHint.textContent = text;
  window.clearTimeout(setHint.timer);
  setHint.timer = window.setTimeout(() => {
    els.saveHint.textContent = "TabGuard 1.0.0";
  }, 2200);
}

function setSaving(isSaving) {
  const saveButton = document.getElementById("saveSettings");
  saveButton.disabled = isSaving;
  saveButton.textContent = isSaving ? "保存中..." : "保存设置";
}

function normalizeCategories(categories) {
  const list = Array.isArray(categories) ? categories : utils.DEFAULT_CATEGORIES;
  const unique = Array.from(
    new Set(
      list
        .map((category) => String(category || "").trim())
        .filter(Boolean)
    )
  );

  return unique.length ? unique : [...utils.DEFAULT_CATEGORIES];
}

async function readSettings() {
  if (storage?.getSettings) {
    return storage.getSettings();
  }

  return sendMessage("GET_SETTINGS");
}

async function readPages() {
  if (storage?.getAllPages) {
    return storage.getAllPages();
  }

  return sendMessage("GET_PAGES");
}

async function writeSettings(settings) {
  const normalized = {
    ...utils.DEFAULT_SETTINGS,
    ...settings,
    categories: normalizeCategories(settings.categories)
  };

  if (storage?.setSettings) {
    await storage.setSettings(normalized);
    return normalized;
  }

  return sendMessage("SAVE_SETTINGS", normalized);
}

async function clearPages() {
  if (storage?.clearPages) {
    await storage.clearPages();
    return true;
  }

  return sendMessage("CLEAR_PAGES");
}

function sendMessage(type, payload = {}) {
  return new Promise((resolve, reject) => {
    if (!globalThis.chrome?.runtime?.sendMessage) {
      reject(new Error("扩展运行环境不可用"));
      return;
    }

    chrome.runtime.sendMessage({ type, payload }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (!response?.ok) {
        reject(new Error(response?.error || "操作失败"));
        return;
      }

      resolve(response.data);
    });
  });
}
