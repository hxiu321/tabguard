(function (global) {
  const DAY_MS = 24 * 60 * 60 * 1000;

  const DEFAULT_CATEGORIES = ["新闻", "工作", "产品", "教程", "其他"];

  const DEFAULT_SETTINGS = {
    provider: "coze",
    baseUrl: "https://api.coze.cn",
    apiKey: "",
    model: "claude-3.5-sonnet",
    closeTabAfterSave: true,
    autoSummary: true,
    expiryDays: 7,
    categories: DEFAULT_CATEGORIES
  };

  const CATEGORY_RULES = [
    {
      category: "新闻",
      keywords: [
        "新闻",
        "快讯",
        "发布",
        "报道",
        "财经",
        "政策",
        "news",
        "breaking",
        "report",
        "launch"
      ]
    },
    {
      category: "工作",
      keywords: [
        "方案",
        "会议",
        "路线图",
        "项目",
        "招聘",
        "日报",
        "周报",
        "okr",
        "roadmap",
        "meeting",
        "project"
      ]
    },
    {
      category: "产品",
      keywords: [
        "产品",
        "设计",
        "体验",
        "增长",
        "用户",
        "需求",
        "prd",
        "product",
        "design",
        "ux",
        "growth"
      ]
    },
    {
      category: "教程",
      keywords: [
        "教程",
        "指南",
        "入门",
        "实践",
        "文档",
        "如何",
        "guide",
        "tutorial",
        "docs",
        "how to",
        "learn"
      ]
    }
  ];

  function clampText(text, maxLength) {
    const value = String(text || "").replace(/\s+/g, " ").trim();
    if (value.length <= maxLength) {
      return value;
    }
    return `${value.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
  }

  function normalizeUrl(url) {
    try {
      const parsed = new URL(url);
      parsed.hash = "";
      return parsed.toString();
    } catch (error) {
      return url;
    }
  }

  function isSavableUrl(url) {
    if (!url) {
      return false;
    }

    return /^(https?:|file:)/i.test(url);
  }

  function faviconFallback(url) {
    try {
      const parsed = new URL(url);
      if (!/^https?:$/i.test(parsed.protocol)) {
        return "";
      }
      return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(parsed.hostname)}&sz=64`;
    } catch (error) {
      return "";
    }
  }

  function daysFromNow(days) {
    const numericDays = Number.parseInt(days, 10);
    return Date.now() + Math.max(1, Number.isFinite(numericDays) ? numericDays : 7) * DAY_MS;
  }

  function daysUntil(timestamp) {
    return Math.ceil((Number(timestamp) - Date.now()) / DAY_MS);
  }

  function formatExpiry(expiresAt) {
    const days = daysUntil(expiresAt);
    if (days < 0) {
      return "已过期";
    }
    if (days === 0) {
      return "今天到期";
    }
    return `${days}天后到期`;
  }

  function formatSavedAt(savedAt) {
    if (!savedAt) {
      return "";
    }

    const date = new Date(savedAt);
    const now = new Date();
    const sameYear = date.getFullYear() === now.getFullYear();
    return new Intl.DateTimeFormat("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      ...(sameYear ? {} : { year: "numeric" })
    }).format(date);
  }

  function getDomain(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch (error) {
      return "";
    }
  }

  function inferCategory(input, categories = DEFAULT_CATEGORIES) {
    const haystack = String(input || "").toLowerCase();
    const normalizedCategories = Array.isArray(categories) && categories.length ? categories : DEFAULT_CATEGORIES;
    const allowed = new Set(normalizedCategories);

    for (const rule of CATEGORY_RULES) {
      if (!allowed.has(rule.category)) {
        continue;
      }

      if (rule.keywords.some((keyword) => haystack.includes(keyword.toLowerCase()))) {
        return rule.category;
      }
    }

    return allowed.has("其他") ? "其他" : normalizedCategories[0] || "其他";
  }

  function buildLocalSummary({ title, url, content }) {
    const cleanContent = clampText(content, 120);
    if (cleanContent) {
      return cleanContent;
    }

    const domain = getDomain(url);
    const cleanTitle = clampText(title || "未命名页面", 42);
    return domain ? `${cleanTitle}，来自 ${domain}。` : cleanTitle;
  }

  function parseAIText(text, categories = DEFAULT_CATEGORIES) {
    const output = String(text || "").trim();
    const summaryMatch = output.match(/摘要[:：]\s*(.+)/);
    const categoryMatch = output.match(/分类[:：]\s*(.+)/);

    const summary = clampText(summaryMatch?.[1] || output.split(/\n/)[0] || "摘要生成失败", 80);
    let category = clampText(categoryMatch?.[1] || inferCategory(output, categories), 12);

    if (!categories.includes(category)) {
      category = inferCategory(`${output} ${category}`, categories);
    }

    return { summary, category };
  }

  function createId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  global.TabGuardUtils = {
    DAY_MS,
    DEFAULT_CATEGORIES,
    DEFAULT_SETTINGS,
    buildLocalSummary,
    clampText,
    createId,
    daysFromNow,
    daysUntil,
    faviconFallback,
    formatExpiry,
    formatSavedAt,
    getDomain,
    inferCategory,
    isSavableUrl,
    normalizeUrl,
    parseAIText
  };
})(globalThis);
