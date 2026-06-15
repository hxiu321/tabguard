# GitHub 开源指南

## 📋 开源前检查清单

### 必备项（必须完成）

- [ ] **LICENSE 文件**：MIT 或 Apache-2.0
- [ ] **README.md**：完整的项目说明
- [ ] **.gitignore**：过滤不需要提交的文件
- [ ] **清理敏感信息**：删除 API Key、个人配置、测试数据
- [ ] **代码规范**：统一缩进、注释风格
- [ ] **代码提交**：git commit 所有更改

### 建议项（推荐完成）

- [ ] **截图**：产品使用截图或动图（放在 `assets/` 或 `images/`）
- [ ] **CONTRIBUTING.md**：贡献指南
- [ ] **CHANGELOG.md**：版本变更记录
- [ ] **GitHub Topics**：仓库标签

---

## 🚀 GitHub 操作步骤

### 1. 创建 GitHub 仓库

```bash
# 访问 GitHub.com，点击右上角 "+" → "New repository"
# 填写以下信息：
#   - Repository name: tabguard
#   - Description: A browser extension for managing your "read later" list with AI-powered summaries
#   - Public/Private: 选择 Public（开源）
#   - 不要勾选 "Add a README file"（本地已有）
#   - 不要勾选 "Add .gitignore"（本地已有）
#   - 不要勾选 "Choose a license"（本地已有）

# 点击 "Create repository"
```

### 2. 本地关联远程仓库

```bash
# 进入项目目录
cd /path/to/TabGuard

# 初始化 Git 仓库（如果还没有）
git init

# 添加所有文件
git add .

# 第一次提交
git commit -m "Initial commit: TabGuard v1.0.0"

# 添加远程仓库
git remote add origin https://github.com/your-username/tabguard.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

> 💡 **提示**：将 `your-username` 替换成你的 GitHub 用户名

### 3. 验证推送成功

```bash
# 查看远程仓库
git remote -v

# 应该看到：
# origin  https://github.com/your-username/tabguard.git (fetch)
# origin  https://github.com/your-username/tabguard.git (push)
```

---

## 🎨 GitHub 仓库美化

### 1. 添加仓库封面

- 准备一张 1280x640 的图片（可以是 Dashboard 截图 + 产品名称）
- 文件名：`assets/cover.png` 或 `images/cover.png`
- 上传后，GitHub 会自动显示在仓库首页

### 2. 添加 Topics（标签）

在仓库页面：
1. 点击 "Settings" 标签
2. 滚动到 "Topics" 部分
3. 添加以下标签：
   ```
   chrome-extension
   browser-extension
   read-later
   productivity
   ai
   coze-api
   javascript
   manifest-v3
   ```

### 3. 优化仓库描述

```
Short description（简介）：
A browser extension for managing your "read later" list with AI-powered summaries

About（关于）：
TabGuard is a Chrome extension that helps you manage your "read later" list efficiently.

Features:
- One-click save with automatic tab closing
- AI-powered summaries and smart categorization
- "Open and remove" - reading flow that keeps your list clean
- Expiry management for saved pages

Built with Chrome Extension Manifest V3, pure HTML/CSS/JS, and Coze API.

```

### 4. 开启 Features（功能）

在仓库 Settings → Features 中开启：

- [ ] **Issues**：用于 Bug 反馈、功能建议
- [ ] **Pull Requests**：接受社区贡献
- [ ] **Actions**：用于 CI/CD（可选）
- [ ] **Wiki**：用于补充文档（可选）
- [ ] **Projects**：用于项目管理（可选）
- [ ] **Security**：用于安全报告（可选）

---

## 📦 发布 Release

### 1. 创建 Git Tag

```bash
# 打 Tag
git tag v1.0.0

# 推送 Tag
git push origin v1.0.0
```

### 2. 在 GitHub 创建 Release

1. 访问仓库的 "Releases" 页面
2. 点击 "Create a new release"
3. 填写：
   - **Tag version**: 选择 `v1.0.0`
   - **Release title**: `TabGuard v1.0.0`
   - **Description**: 复制 CHANGELOG.md 中的 v1.0.0 部分
4. 上传附件：
   - 打包插件为 `.zip` 文件（不含 node_modules 等）
   - 上传供用户下载
5. 点击 "Publish release"

---

## 🌐 Chrome Web Store 发布

### 发布前准备

| 准备项 | 状态 | 说明 |
|--------|------|------|
| Chrome 开发者账号 | | 需要 $5 一次性费用 |
| 打包文件 (.zip) | | 手动安装版本 |
| 商店截图 | | 至少 2 张（1280x800 或 640x400）|
| 商店图标 | | 128x128 |
| 商店横幅 | | 440x280（可选）|
| 隐私政策 | | 说明"不收集用户数据"|

### 隐私政策模板

```
TabGuard 隐私政策

TabGuard 不会收集、存储或传输任何用户的个人数据。

数据存储：
- 所有数据都存储在用户的本地浏览器中（使用 IndexedDB）
- 包括：保存的页面 URL、标题、AI 摘要、分类信息
- 这些数据不会上传到任何服务器

数据访问：
- 只有用户本人可以访问这些数据
- 卸载插件后，所有本地数据会被删除

第三方服务：
- TabGuard 使用 Coze API 生成 AI 摘要
- 用户的 API Key 只存储在本地浏览器
- API 调用产生的数据不会被 TabGuard 存储

联系方式：
如有疑问，请联系：your-email@example.com

最后更新：2026-06-15
```

### 发布步骤

1. 访问 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/dev/dashboard)
2. 注册账号（需要 $5）
3. 新建项目（"New item"）
4. 上传 `.zip` 包
5. 填写商店信息：
   - **Store listing**
     - 名称：TabGuard
     - 简短描述：一键保存页面，AI 摘要，清爽的"稍后读"清单
     - 详细描述：用 README.md 的内容
   - **Privacy**
     - 隐私政策 URL：可以链接到 GitHub README 或单独页面
   - **Images & assets**
     - 图标：128x128
     - 截图：至少 2 张
     - 横幅：440x280（可选）
   - **Category**
     - 选择：Productivity
   - **Language**
     - 选择：Chinese (Simplified) / English
6. 提交审核（通常 1-3 天）

---

## 📊 开源后的维护

### 监控 Issues

- 定期查看 [Issues](https://github.com/your-username/tabguard/issues)
- 及时回复用户反馈
- 标记 Issue 类型（bug/feature/question）

### 发布 Release

```bash
# 每次版本更新时
git tag v1.1.0
git push origin v1.1.0

# 在 GitHub 创建 Release
```

### 更新 CHANGELOG

每次发布新版本时，更新 CHANGELOG.md：

```markdown
## [1.1.0] - 2026-MM-DD

### Added
- New feature 1
- New feature 2

### Fixed
- Bug fix 1
- Bug fix 2

### Changed
- Changed something

### Deprecated
- Deprecated feature

### Removed
- Removed feature

```

### 版本号规范

遵循 [Semantic Versioning](https://semver.org/)：

- **Major (X.0.0)**：不兼容的 API 变更、重大架构调整
- **Minor (0.X.0)**：新功能，向后兼容
- **Patch (0.0.X)**：Bug 修复、小改进

示例：
```
v1.0.0 → v1.0.1（Bug 修复）
v1.0.1 → v1.1.0（新功能）
v1.1.0 → v2.0.0（重大更新，不兼容）
```

---

## 🔐 安全考虑

### 不要提交的内容

- [ ] API Key
- [ ] 个人配置文件
- [ ] 测试账号密码
- [ ] 数据库凭证
- [ ] 任何敏感信息

### 如果意外提交了敏感信息

```bash
# 1. 立即修改该文件（删除敏感信息）
# 2. 提交更改
git add sensitive-file.js
git commit -m "fix: remove sensitive information"

# 3. 如果已经推送到 GitHub
git push origin main

# 4. 考虑强制删除历史（谨慎使用）
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch sensitive-file.js" \
  --prune-empty --tag-name-filter cat -- --all

# 5. 强制推送
git push origin --force --all
```

> ⚠️ **注意**：强制推送会修改历史，如果已经有其他人 fork 了仓库，会造成问题。最好的做法是尽快更改被泄露的 API Key。

---

## 📞 联系方式

- **Issues**: [GitHub Issues](https://github.com/your-username/tabguard/issues)
- **Email**: your-email@example.com
- **Twitter**: @your-twitter（可选）

---

## 📚 参考资源

- [GitHub 官方文档](https://docs.github.com/)
- [Chrome Extension 开发指南](https://developer.chrome.com/docs/extensions/)
- [语义化版本控制](https://semver.org/lang/zh-CN/)
- [约定式提交](https://www.conventionalcommits.org/zh-hans/)

---

**祝你开源顺利！** 🎉