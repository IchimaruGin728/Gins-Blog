<a name="top"></a>

# Gin 的博客 💎

<div align="center">

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg) 
![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)
![Astro](https://img.shields.io/badge/Astro-6.1-orange.svg)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-F38020.svg)
![pnpm](https://img.shields.io/badge/pnpm-10.33-F69220.svg)
![JSR](https://img.shields.io/badge/JSR-F7DF1E?style=flat&logo=jsr&logoColor=black)
![OpenClaw](https://img.shields.io/badge/%F0%9F%A6%9E_OpenClaw-Compatible-00CDAC)
![MCP](https://img.shields.io/badge/MCP-Ready-7D56F4)

**一个基于现代 Web 技术构建的高性能边缘优先博客平台**

[🌐 在线演示](https://blog.ichimarugin728.com) • [📖 English Documentation](./README.md) • [📚 官方文档](/docs)
[🦞 OpenClaw 用户](./AGENT_GUIDE.md): 直接告诉你的 Agent: "Read AGENT_GUIDE.md and deploy this for me."

![Gins Blog 首页预览](media/home.png)

</div>

---

## 📋 目录

- [✨ 特性](#-特性)
- [🎨 界面展示](#-界面展示)
- [🛠️ 技术栈](#️-技术栈)
- [🚀 快速开始](#-快速开始)
- [📦 部署](#-部署)
- [🎨 自定义配置](#-自定义配置)
- [📜 开源协议](#-开源协议)

---

## ✨ 特性

### 🎨 **新美学设计**
- **玻璃态拟物化 UI** - 磨砂玻璃效果与背景模糊
- **流畅动画** - 平滑的过渡效果和微交互
- **Safari 风格移动导航** - 滚动时收缩的导航栏，带全息文字效果

### 📚 **交互式文档中心**
- **MDX 驱动** - 使用嵌入交互式组件编写文档
- **双语结构** - 独立的 `/docs` 和 `/zh/docs` 路由，结构与主应用一致
- **动效架构** - 支持 View Transition API，实现指南之间的无缝导航

### 🌐 **国际化 (i18n)**
- **多语言支持** - 无缝的英语与简体中文体验
- **动态路由** - 智能路由逻辑实现流畅语言切换
- **本地化 RSS** - 每种语言独立的订阅源

### 🔍 **SEO 深度优化**
- **双语索引** - `sitemap.xml` 完整覆盖中英文内容树
- **Hreflang 支持** - 精准的语言目标定位 (`en-SG`, `zh`)，助力搜索引擎识别
- **Meta 增强** - 动态 `og:locale`、关键词支持及丰富的社交分享卡片

### 🔐 **认证与安全**
- **OAuth 集成** - 通过 Arctic + Oslo 支持 GitHub、Google、Discord
- **智能会话** - 支持设备感知的会话追踪与自动去重
- **零信任管理员** - 受 Cloudflare Access 保护的管理路由

### 📝 **内容管理**
- **富文本 Markdown 编辑器** - 完整的 CMS，支持实时预览和媒体上传
- **文件上传发布** - 直接上传 `.md` 或 `.rtf` 文件快速发布
- **自动生成 Slug** - 从标题自动生成 SEO 友好的 URL
- **定时发布** - 为未来的文章设置发布日期
- **音乐管理器** - 专用控制台管理音乐/播放列表数据

### 🚀 **性能与基础设施**
- **边缘优先架构** - 完全在 Cloudflare Workers/Pages 上运行
- **智能缓存** - 基于 KV 的 API 响应和主页数据缓存
- **预取加载** - 鼠标悬停即加载，实现即时页面导航
- **PWA 支持** - 可在移动端和桌面端作为原生应用安装
- **智能路由** - Cloudflare Smart Placement 优化延迟

### 🎥 **边缘原生多媒体集成 (可选)**
- **Cloudflare Images** - 零延迟、自动优化的 WebP/AVIF 图像分发（通过 `<CloudflareImage />` 组件）。可选功能，需要单独购买。
- **Cloudflare Stream** - 自适应码率 (HLS) 视频流媒体播放器（通过 `<CloudflareVideo />` 组件）。可选功能，需要单独购买。
- **编辑器原生直传** - 在 Markdown 编辑器中极其安全地直传图片和视频并挂载至边缘节点，不占用数据库与代码仓库空间。

### 🤖 **AI 驱动搜索**
- **语义搜索** - 使用 Cloudflare Vectorize + Workers AI 实现智能内容发现
- **多语言支持** - 跨英文和中文内容搜索
- **即时结果** - 快速的边缘向量搜索

### 📊 **分析与洞察 (Analytics & Insights)**
- **实时浏览量统计** - 采用混合 D1+KV 架构，利用 `UPDATE ... RETURNING` 实现零延迟统计。
- **边缘节点分析仪表板** - 实时监控 **100+ 全球 Cloudflare 节点** 的性能指标。
  - 🌍 **全球覆盖**
    - **北美**: 35+ 节点 (SJC, LAX, SEA...)
    - **欧洲**: 35+ 节点 (LHR, FRA, CDG...)
    - **亚太**: 20+ 节点 (NRT, SIN, HKG...)
  - ⚡ **性能监控** - 自动检测路由异常（例如：新加坡用户被错误路由至美国节点）。
  - 📋 **可视化数据** - 带国旗标识的交互式列表，显示会话数、平均 RTT 及性能评级。
  - 🟢 **实时指标** - 连接质量分级：
    - **极佳 (Excellent)**: < 50ms
    - **良好 (Good)**: < 150ms
    - **较差 (Poor)**: > 150ms
- **增强型会话追踪** - 完整元数据记录：
  - **网络**: ISP, ASN, HTTP 协议 (h2/h3), TCP RTT
  - **安全**: TLS 版本 (1.2/1.3), 信任评分
  - **位置**: 城市, 国家, 经纬度
- **体验优化指标** - 记录基础客户端能力（网络类型、屏幕尺寸）以优化内容分发。
  - *隐私说明*: 所有分析数据**仅私有部署**，绝不与第三方共享。
- **统一弹窗 UX** - 背景点击关闭、300ms 淡入淡出动画、统一的红色悬停关闭按钮。

### 🧠 **Agentic Core: 博客即是智能体接口**

**Gins Blog 不仅仅是一个静态网站，它是一个符合 Model Context Protocol (MCP) 标准的智能体接口。**

您的博客内置了以 Edge-First 为核心的 MCP Server，这意味着您可以直接使用 **Claude Desktop**, **OpenClaw**, 或 **Cursor** 连接到您的博客，把聊天窗口变成您的 **"无头 CMS"**。

- 📝 **自然语言写作** - *"帮我根据最近的科技新闻写一篇草稿，并保存到数据库。"*
- 🕵️ **智能数据透视** - *"查看过去24小时的流量，并分析哪篇文章最受欢迎。"*
- 🛡️ **自动化运维** - *"扫描最新的评论，告诉我有没有需要处理的垃圾信息。"*

✅ **零配置对接**：根目录内置 `openclaw.json` 和标准 MCP 客户端脚本，一键连接您的 AI 助手。

> 🔗 **开始使用：** 阅读 [MCP 使用指南](./MCP_GUIDE.md) 解锁 AI 操作能力。
> 🦞 **零人工部署：** 让 OpenClaw 阅读 [AGENT_GUIDE.md](./AGENT_GUIDE.md) 即可全自动部署本项目。

## 🎨 界面展示

<details>
<summary>点击展开图库</summary>

### 🌐 核心体验
| 博客索引 | 关于页面 |
| :---: | :---: |
| ![博客页面](media/blog.png) | ![关于页面](media/about.png) |

### 🔍 探索与学习
| AI 向量搜索 | 官方文档 | 多语言支持 |
| :---: | :---: | :---: |
| ![搜索](media/search.png) | ![文档](media/docs.png) | ![多语言](media/i18n.png) |

### 👤 用户系统
| 授权登录 | 资料自定义 | 身份切换 |
| :---: | :---: | :---: |
| ![登录页面](media/login.png) | ![个人资料](media/profile.png) | ![账号切换](media/switch-profile.png) |

### 🛡️ 管理与内容
| 后台仪表盘 | CMS 编辑器 | 音乐管理器 |
| :---: | :---: | :---: |
| ![仪表盘](media/admin.png) | ![编辑与发布](media/editor&publish.png) | ![音乐控制台](media/music-manager.png) |

### 📱 响应式设计
| 移动端视图 |
| :---: |
| <img src="media/mobile.jpeg" width="300" /> |

</details>

---

## 🛠️ 技术栈

### **前端**
| 技术 | 用途 | 版本 |
|------|------|------|
| [Astro](https://astro.build) | Cloudflare 原生服务端输出的站点框架 | `v6.1.x` |
| [Preact](https://preactjs.com) | 用于交互组件的轻量级 React 替代品 | `v10.29.x` |
| [UnoCSS](https://unocss.dev) | 即时按需原子化 CSS 引擎 | `v66.6.x` |
| [Satori](https://github.com/vercel/satori) | 基于 SVG 的 OG 图片生成 | `v0.26.x` |

| [Arctic](https://arctic.js.org) | OAuth 2.0 客户端库 | Latest |
| [Oslo](https://oslo.js.org) | 认证工具（会话、PKCE 等）| Latest |

### **工具与运行时**
| 技术 | 用途 | 版本 |
|------|------|------|
| [Node.js](https://nodejs.org) | 运行时 | `v25.9.0+` |
| [pnpm](https://pnpm.io) | 包管理器 | `v10.33+` |
| [JSR](https://jsr.io) | 现代开源包注册中心 | Latest |
| [Marked](https://marked.js.org) | 内容的 Markdown 解析器 | `v18.x` |
| [Zod](https://zod.dev) | TypeScript 优先的模式验证 | ^4.3.6 |
| [TypeScript](https://www.typescriptlang.org) | 类型安全的 JavaScript | `v5.9.x` |

---

## 🚀 快速开始

### **前置要求**

开始之前，请确保已安装以下内容：

- **Node.js** `25.9.0+`
- **pnpm** `10.33+`
- **Cloudflare 账户** ([免费注册](https://dash.cloudflare.com/sign-up))
- **Wrangler CLI**（Cloudflare 的命令行工具）

```bash
corepack enable
corepack prepare pnpm@10.33.0 --activate
pnpm add -g wrangler
```

如果你使用 `nvm`，仓库已包含 `.nvmrc`：

```bash
nvm use
```

---

### **步骤 1：克隆仓库**

```bash
git clone https://github.com/your-username/gins-blog.git
cd gins-blog
pnpm install
```

---

### **步骤 2：自动设置 Cloudflare 资源**
请选择适合您的部署方式：

#### **方式 A：交互式引导安装脚本 (✨ 强烈推荐)**
最快的首次部署方式。它会自动创建 D1、KV、R2，回写 `wrangler.jsonc`，写入 `.env` / `.dev.vars`，并推送数据库结构。
```bash
pnpm run bootstrap
```

如果你已经装好依赖，只想初始化 Cloudflare 资源：

```bash
pnpm run setup
```

#### **方式 B：AI / CI Agent 模式**
适合 OpenClaw、Cursor 或 CI：

```bash
pnpm run setup -- --suffix=prod --setup-ai=false
```

#### **方式 C：手动模式**
如果你要自己控制资源命名和 Wrangler 操作，可以参考 `scripts/setup.js` 里的逻辑手动执行。

设置脚本会自动完成：

1. 环境检查
2. 创建 D1 / KV / R2
3. 回写 `wrangler.jsonc` 中的资源 ID、路由模式和 OAuth 回调地址
4. 写入 `.env` 中的 `SITE_URL`
5. 执行 `pnpm run db:push`

### **步骤 3：配置 OAuth**

在项目根目录创建 `.env` 和 `.dev.vars`：

```env
SITE_URL=https://blog.example.com

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:4321/login/google/callback

DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_REDIRECT_URI=http://localhost:4321/login/discord/callback

CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_ACCOUNT_HASH=your_cloudflare_account_hash
CLOUDFLARE_MEDIA_API_TOKEN=your_media_api_token
PUBLIC_CF_AVATAR_ID=your_avatar_image_id_or_r2_path
PUBLIC_ASSETS_DOMAIN=assets.yourdomain.com
```

说明：

- `SITE_URL` 放在 `.env`
- OAuth / 媒体相关敏感信息放在 `.dev.vars`
- `.env` 与 `.dev.vars` 都不应该提交到仓库

### **步骤 4：本地运行**

```bash
pnpm run dev
```

访问 `http://localhost:4321`

## 📦 部署

推荐生产流程：

```bash
pnpm install
pnpm run setup -- --suffix=prod
pnpm run build
pnpm run deploy
```

运行时 secret 用 `wrangler secret put` 单独配置：

```bash
wrangler secret put GITHUB_CLIENT_SECRET
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put DISCORD_CLIENT_SECRET
wrangler secret put CLOUDFLARE_MEDIA_API_TOKEN
```

如果使用 GitHub Actions，再添加：

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `SITE_URL`（Repository Variable）

---

## 🎨 自定义配置

### **更新个人信息**

编辑 `src/pages/about.astro` 和 `src/pages/zh/about.astro` 以更新：
- 简介和时间轴
- 社交链接
- Cloudflare 图片 ID 与账户哈希 (Account Hash)

### **更改站点配置**

更新 `.env` 或 CI 里的 `SITE_URL` 变量：

```bash
SITE_URL=https://your-domain.com
```

### **自定义品牌**

**颜色：** 编辑 `uno.config.ts`

```ts
export default defineConfig({
  theme: {
    colors: {
      brand: {
        primary: '#8b5cf6',    // 您的主色
        accent: '#a78bfa',     // 您的强调色
        // ...
      }
    }
  }
});
```

**字体：** 编辑 `src/styles/global.css` 或更新 `uno.config.ts` 中的字体导入。

---

## 📜 开源协议

- **代码**：根据 [MIT 许可证](LICENSE) 授权。
- **内容与设计**：所有文章、媒体和独特的**新美学 UI 设计**根据 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) 授权。
- **隐私**：请参阅我们的 [隐私政策](PRIVACY.md)。

您可以自由使用代码，但如果引用我的文章或设计作品，请注明出处。视觉标识的商业用途需要许可。

---

## 🙏 致谢

使用 ❤️ 和现代 Web 技术构建。特别感谢：
- Astro 团队提供的出色框架
- Cloudflare 让边缘计算变得易于访问
- 开源社区

---

<div align="center">

**[⬆ 返回顶部](#top)**

用 💜 制作 by [Ichimaru Gin](https://github.com/IchimaruGin728)

</div>
