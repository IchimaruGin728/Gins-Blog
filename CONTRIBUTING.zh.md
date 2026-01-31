# 参与贡献 (Contributing to Gins Blog)

[English Version](./CONTRIBUTING.md)

感谢你有兴趣参与贡献！本文档提供了参与该项目的相关指南。

## 分支策略 (Branching Strategy)

我们使用严格的分支工作流来确保稳定性：

- **`main`**：稳定部署分支。**请勿直接推送到 main 分支。**
- **`dev`**：活跃开发分支。所有新功能和修复都应先合并到这里。

## 快速开始 (Getting Started)

1. **Fork 和 Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/gins-blog.git
   cd gins-blog
   ```

2. **切换到 Dev 分支**
   始终从 `dev` 分支开始工作，而不是 `main`。
   ```bash
   git checkout dev
   git checkout -b feature/your-feature-name
   ```

3. **安装依赖**
   我们使用 `npm` 进行依赖管理。
   ```bash
   npm install
   ```

4. **环境设置**
   复制 `.dev.vars.example`（如果有）或创建 `.dev.vars` 并填入必要的密钥：
   ```
   # 本地开发所需
   DB=...
   GIN_KV=...
   GINS_CACHE=...
   BUCKET=...
   ...
   ```

5. **运行本地服务器**
   ```bash
   npm run dev
   ```

## 开发工作流 (Development Workflow)

1. **修改代码**：实现你的功能或修复。
2. **数据库变更**：如果你修改了 schema (`db/schema.ts`)，请生成迁移文件：
   ```bash
   npm run db:generate
   ```
   *注意：对于使用 D1 的本地测试，请使用 `npm run db:migrate:local` 或 `wrangler d1 execute`。*

3. **测试**：确保你的更改在本地工作正常，且没有破坏现有功能。

## 提交更改 (Submitting Changes)

1. **提交 (Commit)**：使用描述性的提交信息。
   ```bash
   git commit -m "feat: add amazing new feature"
   ```

2. **推送 (Push)**：
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Pull Request**：
   - 提交 Pull Request 到 **`dev`** 分支。
   - **切勿**直接提交到 `main`。
   - 描述你的更改并链接到相关 issue。

## 技术栈与代码规范 (Tech Stack & Code Style)

- **框架**：Astro + Preact
- **样式**：UnoCSS (原子化 CSS 引擎) & Vanilla CSS (用于自定义效果)
- **运行时**：Cloudflare Workers
- **数据库**：Drizzle ORM + Cloudflare D1
- **语言**：TypeScript (严格模式)

请确保满足严格的类型检查 (Strict Type Checking)，并遵循现有的项目结构。

## 部署 (Deployment)

- 合并到 `main` 的提交会自动部署到生产环境。
- `dev` 分支作为集成测试的预发布区域。

祝编程愉快！
