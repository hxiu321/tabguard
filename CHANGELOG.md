# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- Search functionality for saved pages
- Category management (add/edit/delete custom categories)
- Batch operations (delete multiple pages)
- Export/Import data
- Firefox and Safari support

---

## [1.0.0] - 2026-06-15

### Added
- 📥 One-click page save with automatic Tab closing
- 📝 AI-powered summary generation
- 🏷️ Smart categorization (News/Work/Product/Tutorial)
- ✅ "Open and remove" - reading flow that removes page from list
- ⏰ Expiry time display for each saved page
- ⚙️ Settings page with:
  - AI model configuration (Provider, Base URL, API Key)
  - Tab close after save toggle
  - Auto-summary generation toggle
  - Default expiry days setting
- 🗂️ Category filter tabs in Dashboard
- 🔍 Search bar (UI ready, functionality pending)
- 🗑️ Delete single page
- 📋 Display saved pages with title, summary, category, and remaining days

### Tech Stack
- Chrome Extension Manifest V3
- Pure HTML + CSS + JavaScript (no frameworks)
- IndexedDB for local storage
- Coze API integration for AI summarization

### Documentation
- README.md with installation and usage guide
- LICENSE (MIT)
- CONTRIBUTING.md
- CHANGELOG.md

---

## Versioning

- **Major (X.0.0)**：Breaking changes, major new features
- **Minor (0.X.0)**：New features, backward compatible
- **Patch (0.0.X)**：Bug fixes, small improvements

---

## Links

- [GitHub Releases](https://github.com/heidyhuang/tabguard/releases)
- [Issues](https://github.com/heidyhuang/tabguard/issues)
- [Product Design Doc](https://www.feishu.cn/docx/Lj0AdvJMDoHqJsxrMi2ceDhtndf)