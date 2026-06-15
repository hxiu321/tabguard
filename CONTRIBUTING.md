# Contributing to TabGuard

感谢你考虑为 TabGuard 做贡献！

---

## 🤝 如何贡献

### 报告 Bug

如果你发现了 Bug，请：

1. 先查看 [现有 Issues](https://github.com/heidyhuang/tabguard/issues)，确保没有被报告过
2. 创建一个新 Issue，使用 `bug` 标签
3. 在 Issue 中提供：
   - Bug 的详细描述
   - 重现步骤
   - 预期行为 vs 实际行为
   - 截图或录屏（如果适用）
   - 你的浏览器版本和操作系统

### 提出新功能

如果你有新功能建议，请：

1. 先查看 [现有 Issues](https://github.com/heidyhuang/tabguard/issues) 和 [Pull Requests](https://github.com/heidyhuang/tabguard/pulls)
2. 创建一个新 Issue，使用 `enhancement` 标签
3. 描述新功能的：
   - 使用场景
   - 预期效果
   - 可能的实现方式

### 提交代码

如果你想提交代码，请遵循以下步骤：

#### 1. Fork 仓库

1. 点击页面右上角的 "Fork" 按钮
2. 等待 Fork 完成

#### 2. 克隆你的 Fork

```bash
git clone https://github.com/heidyhuang/tabguard.git
cd tabguard
```

#### 3. 创建特性分支

```bash
git checkout -b feature/your-feature-name
```

分支命名规范：
- `feature/xxx`：新功能
- `fix/xxx`：Bug 修复
- `docs/xxx`：文档更新
- `style/xxx`：代码格式调整（不影响功能）
- `refactor/xxx`：重构
- `test/xxx`：测试相关

#### 4. 编写代码

- 遵循现有代码风格
- 添加必要的注释
- 确保 ES6+ 语法兼容性

#### 5. 提交更改

```bash
git add .
git commit -m "feat: add new feature"
```

提交信息规范（约定式提交）：

```
<type>(<scope>): <subject>

<body>

<footer>
```

Type 类型：
- `feat`：新功能
- `fix`：Bug 修复
- `docs`：文档更新
- `style`：代码格式调整
- `refactor`：重构
- `test`：测试
- `chore`：构建过程或辅助工具的变动

示例：
```
feat(settings): add option to customize expiry days

Add a new setting that allows users to customize the default
expiry days for saved pages. Default is 7 days.

Closes #123
```

#### 6. 推送到 GitHub

```bash
git push origin feature/your-feature-name
```

#### 7. 创建 Pull Request

1. 访问你的 Fork 仓库页面
2. 点击 "New Pull Request"
3. 选择你的特性分支
4. 填写 PR 描述：
   - 标题：简短描述这个 PR 做了什么
   - 描述：详细说明变更内容、解决的问题、测试情况
   - 关联 Issue：如果有对应的 Issue，用 `Closes #123` 或 `Fixes #123` 关联
5. 提交 PR

---

## 📋 代码规范

### JavaScript

- 使用 **ES6+** 语法
- 使用 **const** 和 **let**，避免使用 **var**
- 函数使用 **箭头函数**（除非需要绑定 `this`）
- 使用 **模板字符串** 拼接字符串
- 代码缩进使用 **2 个空格**

示例：

```javascript
// ✅ 好的写法
const savePage = async (tab) => {
  const { url, title } = tab;
  const summary = await aiSummarizer.summarize(url, title);
  return storage.pages.add({ url, title, summary });
};

// ❌ 避免的写法
function savePage(tab) {
  var url = tab.url;
  var summary = aiSummarizer.summarize(url, tab.title);
  return storage.pages.add({ url: url, title: tab.title, summary: summary });
}
```

### CSS

- 使用 **2 个空格** 缩进
- 使用 **小写** 属性名和选择器
- 使用 **短格式**（如 `margin: 0` 而不是 `margin: 0px 0px 0px 0px`）

### HTML

- 使用 **语义化标签**
- 使用 **小写** 标签名和属性名
- 使用 **双引号** 包裹属性值

---

## 🧪 测试

提交代码前，请确保：

1. 在 Chrome 中测试插件功能
2. 检查控制台是否有错误
3. 测试不同场景：
   - 保存页面
   - 打开页面
   - 删除页面
   - 设置保存/读取
   - 不同分类筛选

---

## 📝 文档

如果你添加了新功能或修改了现有功能，请更新相应的文档：

- README.md
- CONTRIBUTING.md
- 代码注释

---

## 💬 沟通

如果你在贡献过程中有任何问题：

- 提交 Issue 提问
- 在 Pull Request 中讨论
- 通过 Email 联系维护者

---

## 📄 许可证

所有贡献都将采用 [MIT License](LICENSE) 开源协议。

---

再次感谢你的贡献！🎉