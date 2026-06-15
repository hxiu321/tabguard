const utils = globalThis.TabGuardUtils;

const state = {
  pages: [],
  settings: utils.DEFAULT_SETTINGS,
  category: "全部",
  query: "",
  selectedIds: new Set()
};

const els = {
  bulkBar: document.querySelector(".bulkBar"),
  categoryTabs: document.getElementById("categoryTabs"),
  clearExpired: document.getElementById("clearExpired"),
  deleteSelected: document.getElementById("deleteSelected"),
  emptyState: document.getElementById("emptyState"),
  openSettings: document.getElementById("openSettings"),
  pageCount: document.getElementById("pageCount"),
  pageList: document.getElementById("pageList"),
  saveCurrent: document.getElementById("saveCurrent"),
  searchInput: document.getElementById("searchInput"),
  selectAll: document.getElementById("selectAll"),
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  bindEvents();
  await loadData();
}

function bindEvents() {
  els.saveCurrent.addEventListener("click", saveCurrentPage);
  els.openSettings.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
    window.close();
  });

  els.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value.trim().toLowerCase();
    state.selectedIds.clear();
    render();
  });

  els.selectAll.addEventListener("change", () => {
    const filtered = getFilteredPages();
    state.selectedIds.clear();
    if (els.selectAll.checked) {
      filtered.forEach((page) => state.selectedIds.add(page.id));
    }
    render();
  });

  els.deleteSelected.addEventListener("click", deleteSelectedPages);
  els.clearExpired.addEventListener("click", clearExpiredPages);
}

async function loadData() {
  const [settingsResponse, pagesResponse] = await Promise.all([
    sendMessage("GET_SETTINGS"),
    sendMessage("GET_PAGES")
  ]);

  state.settings = settingsResponse || utils.DEFAULT_SETTINGS;
  state.pages = pagesResponse || [];
  render();
}

async function saveCurrentPage() {
  setSaveButtonLoading(true);
  els.saveCurrent.disabled = true;

  try {
    await sendMessage("SAVE_ACTIVE_TAB");
    await loadData();
  } catch (error) {
    console.error("[TabGuard] Save failed.", error);
  } finally {
    els.saveCurrent.disabled = false;
    setSaveButtonLoading(false);
  }
}

function setSaveButtonLoading(isLoading) {
  const label = els.saveCurrent.querySelector("span");
  label.textContent = isLoading ? "保存中" : "保存页面";
}

function render() {
  renderCategoryTabs();
  renderPages();
  renderBulkBar();
}

function renderCategoryTabs() {
  const counts = countByCategory();
  const pageCategories = state.pages.map((page) => page.category).filter(Boolean);
  const categories = [
    "全部",
    ...new Set([
      ...state.settings.categories.filter((category) => category !== "全部"),
      ...pageCategories
    ])
  ];

  els.categoryTabs.replaceChildren(
    ...categories.map((category) => {
      const button = document.createElement("button");
      button.className = `categoryTab${state.category === category ? " active" : ""}`;
      button.type = "button";
      button.role = "tab";
      button.textContent = `${category}${counts[category] ? ` (${counts[category]})` : ""}`;
      button.addEventListener("click", () => {
        state.category = category;
        state.selectedIds.clear();
        render();
      });
      return button;
    })
  );
}

function countByCategory() {
  return state.pages.reduce(
    (counts, page) => {
      counts["全部"] += 1;
      counts[page.category] = (counts[page.category] || 0) + 1;
      return counts;
    },
    { 全部: 0 }
  );
}

function renderPages() {
  const pages = getFilteredPages();

  els.pageCount.textContent = String(state.pages.length);
  els.emptyState.hidden = pages.length > 0;
  els.pageList.hidden = pages.length === 0;

  els.pageList.replaceChildren(...pages.map(createPageCard));
}

function getFilteredPages() {
  return state.pages.filter((page) => {
    const matchesCategory = state.category === "全部" || page.category === state.category;
    const haystack = `${page.title} ${page.summary} ${page.url} ${page.domain}`.toLowerCase();
    const matchesQuery = !state.query || haystack.includes(state.query);
    return matchesCategory && matchesQuery;
  });
}

function createPageCard(page) {
  const expired = Number(page.expiresAt) < Date.now();
  const dueSoon = !expired && utils.daysUntil(page.expiresAt) <= 1;
  const article = document.createElement("article");
  article.className = `pageCard${expired ? " expired" : ""}`;

  const checkbox = document.createElement("input");
  checkbox.className = "pageCheck";
  checkbox.type = "checkbox";
  checkbox.checked = state.selectedIds.has(page.id);
  checkbox.setAttribute("aria-label", `选择 ${page.title}`);
  checkbox.addEventListener("change", () => {
    if (checkbox.checked) {
      state.selectedIds.add(page.id);
    } else {
      state.selectedIds.delete(page.id);
    }
    renderBulkBar();
  });

  const main = document.createElement("div");
  main.className = "pageMain";

  const titleRow = document.createElement("div");
  titleRow.className = "titleRow";

  const favicon = document.createElement("img");
  favicon.className = "favicon";
  favicon.alt = "";
  favicon.src = page.favicon || utils.faviconFallback(page.url);
  favicon.addEventListener("error", () => {
    favicon.removeAttribute("src");
  });

  const title = document.createElement("div");
  title.className = "pageTitle";
  title.textContent = page.title || "未命名页面";

  titleRow.append(favicon, title);

  const domain = document.createElement("div");
  domain.className = "domain";
  domain.textContent = `${page.domain || utils.getDomain(page.url)} · ${utils.formatSavedAt(page.savedAt)}`;

  const summary = document.createElement("p");
  summary.className = "summary";
  summary.textContent = page.summary || "暂无摘要";

  const meta = document.createElement("div");
  meta.className = "metaRow";
  meta.append(
    createPill(page.category || "其他"),
    createPill(utils.formatExpiry(page.expiresAt), expired ? "expiredPill" : dueSoon ? "dueSoon" : "")
  );

  const actions = document.createElement("div");
  actions.className = "actions";

  const openButton = createActionButton("打开", "smallButton", (event) => openPage(page, event.currentTarget));
  const deleteButton = createActionButton("删除", "ghost", (event) => deletePage(page.id, event.currentTarget));
  actions.append(openButton, deleteButton);

  if (expired) {
    actions.prepend(createActionButton("重置", "smallButton", () => resetExpiry(page.id)));
  }

  main.append(titleRow, domain, summary, meta, actions);
  article.append(checkbox, main);
  return article;
}

function createPill(text, extraClass = "") {
  const pill = document.createElement("span");
  pill.className = `pill ${extraClass}`.trim();
  pill.textContent = text;
  return pill;
}

function createActionButton(text, className, onClick) {
  const button = document.createElement("button");
  button.className = className;
  button.type = "button";
  button.textContent = text;
  button.addEventListener("click", onClick);
  return button;
}

function renderBulkBar() {
  const filtered = getFilteredPages();
  const selectedCount = state.selectedIds.size;
  const allSelected = filtered.length > 0 && filtered.every((page) => state.selectedIds.has(page.id));

  els.selectAll.checked = allSelected;
  els.selectAll.indeterminate = selectedCount > 0 && !allSelected;
  els.deleteSelected.disabled = selectedCount === 0;
  els.deleteSelected.textContent = selectedCount ? `删除 ${selectedCount} 个` : "删除选中";
  els.clearExpired.disabled = !state.pages.some((page) => Number(page.expiresAt) < Date.now());
}

async function openPage(page, trigger) {
  await playFireworks(trigger);
  await sendMessage("OPEN_AND_REMOVE", { id: page.id, url: page.url });
  state.selectedIds.delete(page.id);
  await loadData();
}

async function deletePage(id, trigger) {
  await playFireworks(trigger);
  await sendMessage("DELETE_PAGE", { id });
  state.selectedIds.delete(id);
  await loadData();
}

async function resetExpiry(id) {
  await sendMessage("RESET_EXPIRY", { id });
  await loadData();
}

async function deleteSelectedPages() {
  const ids = Array.from(state.selectedIds);
  await Promise.all(ids.map((id) => sendMessage("DELETE_PAGE", { id })));
  state.selectedIds.clear();
  await loadData();
}

async function clearExpiredPages() {
  const expiredIds = state.pages
    .filter((page) => Number(page.expiresAt) < Date.now())
    .map((page) => page.id);

  await Promise.all(expiredIds.map((id) => sendMessage("DELETE_PAGE", { id })));
  expiredIds.forEach((id) => state.selectedIds.delete(id));
  await loadData();
}

function sendMessage(type, payload = {}) {
  return new Promise((resolve, reject) => {
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

function playFireworks(trigger) {
  return new Promise((resolve) => {
    const origin = getFireworkOrigin(trigger);
    const colors = ["#1a73e8", "#34a853", "#fbbc04", "#ea4335", "#a142f4"];
    const stage = document.createElement("div");
    stage.className = "fireworkStage";
    stage.setAttribute("aria-hidden", "true");

    const particleCount = 18;
    for (let index = 0; index < particleCount; index += 1) {
      const particle = document.createElement("span");
      const angle = (Math.PI * 2 * index) / particleCount;
      const distance = 34 + Math.random() * 28;
      particle.className = "fireworkParticle";
      particle.style.left = `${origin.x}px`;
      particle.style.top = `${origin.y}px`;
      particle.style.setProperty("--tx", `${Math.cos(angle) * distance}px`);
      particle.style.setProperty("--ty", `${Math.sin(angle) * distance}px`);
      particle.style.background = colors[index % colors.length];
      stage.append(particle);
    }

    document.body.append(stage);
    window.setTimeout(() => {
      stage.remove();
      resolve();
    }, 520);
  });
}

function getFireworkOrigin(trigger) {
  if (!trigger) {
    return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  }

  const rect = trigger.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}
