<div id="top"></div>

# Gin's Blog ✨

<div align="center">

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat) 
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Astro](https://img.shields.io/badge/Astro-BC52EE?style=flat&logo=astro&logoColor=white)
![Preact](https://img.shields.io/badge/Preact-673AB8?style=flat&logo=preact&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=flat&logo=cloudflare&logoColor=white)
![Hono](https://img.shields.io/badge/Hono-E36002?style=flat&logo=hono&logoColor=white)
![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-C5F74F?style=flat&logo=drizzle&logoColor=black)
![UnoCSS](https://img.shields.io/badge/UnoCSS-333333?style=flat&logo=unocss&logoColor=white)
![Biome](https://img.shields.io/badge/Biome-60A5FA?style=flat&logo=biome&logoColor=white)
![Arctic](https://img.shields.io/badge/Arctic-4FC3F7?style=flat&logo=oauth&logoColor=white)
![OpenClaw](https://img.shields.io/badge/%F0%9F%A6%9E_OpenClaw-Compatible-00CDAC)
![MCP](https://img.shields.io/badge/MCP-Ready-7D56F4)

**A high-performance, edge-first blog platform built with modern web technologies**

[🌐 Live Demo](https://blog.ichimarugin728.com) • [📖 中文文档](./README.zh.md) • [📚 Documentation](/docs)
[🦞 OpenClaw Users](./AGENT_GUIDE.md): Just tell your agent: "Read AGENT_GUIDE.md and deploy this for me."

![Gins Blog Home Preview](media/home.png)

</div>

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [🎨 Gallery](#-gallery)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Quick Start](#-quick-start)
- [📦 Deployment](#-deployment)
- [🎨 Customization](#-customization)
- [📜 License](#-license)

---

## ✨ Features

### 🎨 **Neo-Aesthetics Design**
- **Glassmorphism UI** - Frosted glass effects with backdrop blur
- **Fluid Animations** - Smooth transitions and micro-interactions
- **Safari-Style Mobile Nav** - Shrinking navigation bar with holographic text effects

### 📚 **Interactive Documentation Hub**
- **MDX Powered** - Write documentation with embedded interactive components
- **Bilingual Structure** - Dedicated `/docs` and `/zh/docs` routing identical to the main app
- **Animated Architecture** - View Transition API support for seamless navigation between guides

### 🌐 **Internationalization (i18n)**
- **Multi-Language Support** - Seamless English and Chinese (Simplified) experience
- **Dynamic Routing** - Smart routing for smooth language switching
- **Localized 404** - Client-side detected 404 pages that adapt to the user's language path (e.g. `/zh/*`)
- **Localized RSS** - Dedicated feeds for each language

### 🔍 **Advanced SEO**
- **Bilingual indexing** - `sitemap.xml` covers full English and Chinese content trees
- **Hreflang Support** - Precise language targeting (`en-SG`, `zh`) for search engines
- **Meta Optimization** - Dynamic `og:locale`, `keywords`, and rich social cards

### 🔐 **Authentication & Security**
- **OAuth Integration** - GitHub, Google, Discord via Arctic + Oslo
- **Active Session Management** - View and revoke active sessions across devices
- **Smart Sessions** - Device-aware tracking with automatic deduplication
- **Zero Trust Admin** - Protected admin routes with Cloudflare Access integration

### 📝 **Content Management**
- **Rich Markdown Editor** - Full CMS with live preview and media upload
- **File Upload Publishing** - Direct `.md` or `.rtf` file upload for quick publishing
- **Automatic Slug Generation** - SEO-friendly URL generation from titles
- **Scheduled Publishing** - Set publication dates for future posts
- **Music Manager** - Dedicated console for managing music/playlist data

### 🚀 **Performance & Infrastructure**
- **Edge-First Architecture** - Runs entirely on Cloudflare Workers/Pages
- **Smart Caching** - KV-based caching for API responses and homepage data
- **Prefetching** - Hover-to-load mechanics for instant page navigation
- **PWA Support** - Installable as a native app on mobile and desktop
- **Smart Routing** - Cloudflare Smart Placement for optimal latency

### 🎥 **Edge-Native Media Integration (Optional)**
- **Cloudflare Images** - Zero-latency, auto-optimized WebP/AVIF delivery via the `<CloudflareImage />` component.
- **Cloudflare Stream** - Adaptive bitrate (HLS) streaming player for videos via the `<CloudflareVideo />` component.
- **Integrated Admin Editor** - Securely upload Edge-Native media directly within your Markdown editor workspace without bloating your database or repo.
### 🤖 **AI-Powered Search**
- **Semantic Search** - Cloudflare Vectorize + Workers AI for intelligent content discovery
- **Multi-Language Support** - Search across both English and Chinese content
- **Instant Results** - Fast, edge-based vector search

### 📊 **Analytics & Insights**
- **Real-time View Counts** - Hybrid D1+KV architecture using `UPDATE ... RETURNING` for zero-latency, fresh view stats.
- **Edge Analytics Dashboard** - Monitor **100+ global Cloudflare nodes** with real-time RTT metrics.
  - 🌍 **Global Coverage**
    - **North America**: 35+ nodes (SJC, LAX, SEA, ORD, IAD...)
    - **Europe**: 35+ nodes (LHR, FRA, CDG, AMS...)
    - **Asia-Pacific**: 20+ nodes (NRT, SIN, HKG, SYD...)
  - ⚡ **Performance Monitoring** - Automatic routing anomaly detection (e.g., Singapore users routed to US West).
  - 📋 **Visual Data Grid** - Interactive tables with location flags, session counts, avg RTT, and performance ratings.
  - 🟢 **Real-time Metrics** - Live connection quality indicators:
    - **Excellent**: < 50ms
    - **Good**: < 150ms
    - **Poor**: > 150ms
  - 🔍 **Use Case**: Identify ISP routing issues (e.g., StarHub routing to wrong colo).
- **Enhanced Session Tracking** - Metadata includes:
  - **Network**: ISP name, ASN, HTTP Protocol (h2/h3), TCP RTT
  - **Security**: TLS Version (1.2/1.3), Client Trust Score
  - **Location**: City, Country, Coordinates
- **Adaptive UX Metrics** - Captures basic client capabilities (Network Type, Screen Size) to optimize content delivery.
  - *Privacy Note*: All analytics data is **self-hosted and private**, never shared with third parties.
- **Unified Modal UX** - Backdrop click-to-close, 300ms fade+scale animations, consistent red-hover close buttons.

### 🎨 **Icon System Optimization**
- ✨ **Sharp Rendering** - `shape-rendering: geometricPrecision` for crisp SVG edges.
- 🚀 **Zero Latency** - Local inline SVGs with **Safelist Preloading** (No FOUC).
- 💨 **Optimized Loading** - Pre-compiled icons for instant display without external network requests.

### 🧠 **Agentic Core: The First-Class AI Interface**

**Gins Blog is not just a static site; it is a fully compliant Agentic Interface via the Model Context Protocol (MCP).**

Built with an Edge-First MCP Server, you can connect **Claude Desktop**, **OpenClaw**, or **Cursor** to your deployed blog, effectively turning your chat window into a **Headless CMS**.

- 📝 **Conversational Drafting** - *"Draft a new post about my coding session today and save it."*
- 🕵️ **Intelligent Insights** - *"Analyze traffic from the last 24 hours and identify trends."*
- 🛡️ **Auto-Moderation** - *"Scan recent comments for spam or sentiment analysis."*

✅ **Zero-Config Ready**: Includes `openclaw.json` and standard MCP client scripts for instant connection.

> 🔗 **Get Started:** Check the [MCP Usage Guide](./MCP_GUIDE.md) to unlock agentic capabilities.
> 🦞 **Zero-Touch Deployment:** Just tell OpenClaw to "Read [AGENT_GUIDE.md](./AGENT_GUIDE.md) and deploy this for me."

---

## 🎨 Gallery

<details>
<summary>Click to expand gallery</summary>

### 🌐 Core Experience
| Blog Index | About Page |
| :---: | :---: |
| ![Blog Page](media/blog.png) | ![About Page](media/about.png) |

### � Documentation Hub
| Docs Landing | Content Layout |
| :---: | :---: |
| ![Docs Landing](media/docs_landing.png) | ![Docs Content](media/docs_content.png) |

### �👤 User System
| Profile Customization | Identity Switching |
| :---: | :---: |
| ![Profile Page](media/profile.png) | ![Profile Switching](media/switch-profile.png) |

### 🛡️ Admin Suite
| Dashboard | CMS Editor |
| :---: | :---: |
| ![Admin Panel](media/admin.png) | ![Editor Interface](media/editor.png) |

### 📱 Mobile Experience
| Music Manager | Mobile View |
| :---: | :---: |
| ![Music Console](media/music-manager.png) | <img src="media/mobile.jpg" width="300" /> |

</details>

---

## 🛠️ Tech Stack

### **Frontend**
| Technology | Version | Purpose |
|------------|---------|---------|
| [Astro](https://astro.build) | `v5.17.1` | Static site generator with Server Actions & Server Islands |
| [Preact](https://preactjs.com) | Latest | Lightweight React alternative for interactive components |
| [UnoCSS](https://unocss.dev) | Latest | Instant on-demand atomic CSS engine (Replaces Tailwind) |
| [Satori](https://github.com/vercel/satori) | ^0.19.1 | SVG-based OG image generation |
| [Biome](https://biomejs.dev) | Latest | Fast All-in-One Formatter & Linter (Replaces ESLint/Prettier) |

### **Backend & Edge**
| Technology | Version | Purpose |
|------------|---------|---------|
| [Cloudflare Workers](https://workers.cloudflare.com) | - | Serverless edge compute platform |
| [GitHub Actions](https://github.com/features/actions) | - | Automated CI/CD deployment pipeline |
| [Hono](https://hono.dev) | Latest | Ultrafast web framework for robust API Routes (`/api/*`) |
| [Drizzle ORM](https://orm.drizzle.team) | Latest | Type-safe SQL ORM for Cloudflare D1 |

### **Database & Storage**
| Technology | Purpose |
|------------|---------|
| [Cloudflare D1](https://developers.cloudflare.com/d1) | SQLite-based serverless SQL database |
| [Cloudflare R2](https://developers.cloudflare.com/r2) | S3-compatible object storage for media |
| [Cloudflare KV](https://developers.cloudflare.com/kv) | Low-latency key-value store for caching & sessions |
| [Cloudflare Vectorize](https://developers.cloudflare.com/vectorize) | Vector database for AI-powered search |
| [Cloudflare Images](https://developers.cloudflare.com/images/) | Image optimization and delivery |
| [Cloudflare Stream](https://developers.cloudflare.com/stream/) | Video streaming and encoding |

### **AI & Search**
| Technology | Purpose |
|------------|---------|
| [Workers AI](https://developers.cloudflare.com/workers-ai) | Serverless AI models for embeddings |
| [Vectorize](https://developers.cloudflare.com/vectorize) | Vector similarity search (768-dim, cosine) |

### **Authentication**
| Technology | Purpose | Version |
|------------|---------|---------|
| [Arctic](https://arctic.js.org) | OAuth 2.0 client library | Latest |
| [Oslo](https://oslo.js.org) | Auth utilities (sessions, PKCE, etc.) | Latest |

### **Utilities**
| Technology | Purpose | Version |
|------------|---------|---------|
| [Marked](https://marked.js.org) | Markdown parser for content | ^17.0.1 |
| [Zod](https://zod.dev) | TypeScript-first schema validation | ^3.25.76 |
| [TypeScript](https://www.typescriptlang.org) | Type-safe JavaScript | ^5.9.3 |

---

## 🚀 Quick Start

### **Prerequisites**

Before you begin, ensure you have the following installed:

- **Node.js** `24+` ([Download](https://nodejs.org))
- **npm** or **pnpm** (comes with Node.js)
- **Cloudflare Account** ([Sign up for free](https://dash.cloudflare.com/sign-up))
- **Wrangler CLI** (Cloudflare's command-line tool)

```bash
npm install -g wrangler
```

---

### **Step 1: Clone the Repository**

```bash
git clone https://github.com/your-username/gins-blog.git
cd gins-blog
npm install
```

---

### **Step 2: Automated Cloudflare Setup**
Select the method that best suits your workflow:

#### **Method A: Interactive Setup Script (✨ Highly Recommended)**
The fastest way to get started. Just run the command below and the interactive wizard will guide you through connecting your Cloudflare DB, Storage, and explicitly prompt you for optional Edge Media configurations (Images/Stream) step-by-step.
```bash
npm run setup
```

#### **Method B: AI / CI Agent Mode**
For OpenClaw, Cursor, or CI pipelines.
```bash
node scripts/setup.js --suffix=prod --setup-ai=false
```

#### **Method C: Manual Mode**
For advanced users. Refer to `scripts/setup.js` logic to execute `wrangler` commands and update `wrangler.jsonc` manually.

---

The setup script handles:
1. **Environment Check** - Verifies Wrangler login status.
2. **Resource Creation** - Creates D1 Database, KV Namespaces, and R2 Bucket.
3. **Configuration** - Automatically updates `wrangler.jsonc`.
4. **Initialization** - Pushes the database schema.

### **Step 2.1: (Optional) Configure AI Search**

If you want to enable AI Semantic Search:

1. Create a Vectorize Index:
   ```bash
   wrangler vectorize create gins-vector --dimensions=768 --metric=cosine
   ```
2. Uncomment the `vectorize` and `ai` sections in `wrangler.jsonc` and update the `index_name` if needed.

### **Step 3: Configure OAuth Providers**

Create a `.dev.vars` file in the root directory:

```env
# GitHub OAuth (https://github.com/settings/developers)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Google OAuth (https://console.cloud.google.com/apis/credentials)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:4321/login/google/callback

# Discord OAuth (https://discord.com/developers/applications)
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_REDIRECT_URI=http://localhost:4321/login/discord/callback
```

> **⚠️ IMPORTANT:** Add `.dev.vars` to your `.gitignore` to prevent committing secrets!

---

### **Step 4: Secure Your Admin Panel**

The admin panel is currently located at `/IchimaruGin728/admin`. **You must rename this folder** to something unique:

```bash
mv src/pages/IchimaruGin728 src/pages/YOUR_SECRET_ROUTE
```

For example:
```bash
mv src/pages/IchimaruGin728 src/pages/my-secret-admin-panel
```

> **🔒 Pro Tip:** Enable [Cloudflare Access (Zero Trust)](https://developers.cloudflare.com/cloudflare-one/applications/) for your admin route for maximum security.

---

### **Step 5: Run Locally**

```bash
npm run dev
```

Visit `http://localhost:4321` 🎉

---

## 📦 Deployment

### **Deploy to Cloudflare Workers via GitHub Actions**

1. **Set up GitHub Secrets:**

Go to your GitHub Repository → Settings → Secrets and variables → Actions. Add the following secrets:
- `CLOUDFLARE_API_TOKEN`: Your Cloudflare API Token (with Workers deployment permissions)
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare Account ID

2. **Configure Environment Variables:**

Environment variables should be configured via `wrangler.jsonc` for production or set in the Cloudflare Dashboard for the Worker.

3. **Automatic Deployment:**

Pushing to the `main` branch will automatically trigger the GitHub Action defined in `.github/workflows/deploy.yml` to build and deploy your blog.

```bash
git push origin main
```

---

## 🎨 Customization

### **Update Personal Information**

Edit `src/pages/about.astro` and `src/pages/zh-SG/about.astro` to update:
- Bio and timeline
- Social links
- Cloudflare Image ID & Account Hash

### **Change Site Configuration**

Update `astro.config.mjs`:

```js
export default defineConfig({
  site: 'https://your-domain.com', // Your production URL
  // ...
});
```

### **Customize Branding**

**Colors:** Edit `uno.config.ts`

```ts
export default defineConfig({
  theme: {
    colors: {
      brand: {
        primary: '#8b5cf6',    // Your primary color
        accent: '#a78bfa',     // Your accent color
        // ...
      }
    }
  }
});
```

**Fonts:** Edit `src/styles/global.css` or update font imports in `uno.config.ts`.

---

## 📜 License

- **Code**: Licensed under the [MIT License](LICENSE).
- **Content & Design**: All articles, media, and unique **Neo-Aesthetics UI designs** are licensed under. [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).
- **Privacy**: Please refer to our [Privacy Policy](PRIVACY.md).

You're free to use the code, but please credit me if you reference my articles or design work. Commercial use of the visual identity requires permission.

---

## 🙏 Acknowledgments

Built with ❤️ using modern web technologies. Special thanks to:
- The Astro team for an amazing framework
- Cloudflare for making edge computing accessible
- The open-source community

---

<div align="center">

**[⬆ Back to Top](#top)**

Made with 💜 by [Ichimaru Gin](https://github.com/IchimaruGin728)

</div>
