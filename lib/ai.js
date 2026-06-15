(function (global) {
  const {
    buildLocalSummary,
    clampText,
    inferCategory,
    parseAIText
  } = global.TabGuardUtils || {};

  class AISummarizer {
    constructor(config = {}) {
      this.provider = config.provider || "coze";
      this.baseUrl = String(config.baseUrl || "").replace(/\/+$/, "");
      this.apiKey = config.apiKey || "";
      this.model = config.model || "claude-3.5-sonnet";
      this.categories = config.categories || [];
    }

    async summarize(page) {
      if (!this.apiKey || !this.baseUrl) {
        return this.summarizeLocally(page);
      }

      try {
        const prompt = this.buildPrompt(page);
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: this.model,
            messages: [{ role: "user", content: prompt }],
            max_tokens: 200,
            temperature: 0.2
          })
        });

        if (!response.ok) {
          throw new Error(`AI API failed: ${response.status}`);
        }

        const data = await response.json();
        const text = this.extractText(data);
        const parsed = parseAIText(text, this.categories);

        return {
          summary: parsed.summary,
          category: parsed.category,
          source: "ai"
        };
      } catch (error) {
        console.warn("[TabGuard] AI summary failed, using local fallback.", error);
        return this.summarizeLocally(page);
      }
    }

    buildPrompt({ url, title, content }) {
      const categories = this.categories.length ? this.categories.join("/") : "新闻/工作/产品/教程/其他";
      const trimmedContent = clampText(content || "", 1600);

      return `请生成这个网页的一句话摘要（50字内），并从这些分类中推荐一个：${categories}。

网页标题：${title || "未命名页面"}
网页URL：${url}
网页正文摘录：${trimmedContent || "无"}

输出格式：
摘要：[摘要内容]
分类：[分类名]`;
    }

    extractText(data) {
      if (data?.choices?.[0]?.message?.content) {
        return data.choices[0].message.content;
      }

      if (data?.messages?.[0]?.content) {
        return data.messages[0].content;
      }

      if (data?.data?.content) {
        return data.data.content;
      }

      return "";
    }

    summarizeLocally(page) {
      const combined = `${page.title || ""} ${page.url || ""} ${page.content || ""}`;
      const summary = buildLocalSummary(page);
      const category = inferCategory(combined, this.categories);

      return {
        summary,
        category,
        source: "local"
      };
    }
  }

  global.TabGuardAI = {
    AISummarizer
  };
})(globalThis);
