---
title: "架构设计"
description: "系统模块划分与边缘原生演进"
order: 2
---

# 边缘原生架构 (Edge-Native Architecture)

Gins-Blog 不仅仅是“被托管”的；它同时存在于全球数百个数据中心的内存节点中。通过将系统完全落户于 Cloudflare 生态，我们实现了极速且流畅的渲染响应体验（首字节时间通常在亚毫秒级别）。

## Astro 与 Hono 共生宿主

我们在服务端渲染 (SSR) 当中采用了一种非常特别的混合模型：
- **[Astro](https://astro.build/)**：承担起核心的渲染工作，它将组件转换为极致轻量级的 HTML/CSS，并在客户端实现局部水合交互（Island Architecture）。这种基于标准 Web 接口编译的产物非常契合 V8 Isolates（Cloudflare Workers 的底层沙盒）的执行环境。
- **[Hono](https://hono.dev/)**：作为一个内嵌框架，直接被挂载到 Astro 的 Server Execution Context 当中。Hono 负责承接所有的基础 API 路由、提供统一接口类型校验（利用 Zod），并暴露非常轻量的 RPC (Remote Procedure Calls) 供前端安全调用。

### D1 数据引擎与 Drizzle

系统所有的关系型数据全部存储在 **Cloudflare D1** (Serverless SQLite) 中。

```typescript
// 示例：文章的数据模型定义
export const posts = sqliteTable("posts", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  content: text("content"),
  publishedAt: integer("published_at"),
});
```

因为 D1 是基于原生 HTTP API 向外暴露能力的，而不是传统的长连接 TCP Sockets，这意味着在 Serverless 爆发式扩容下，我们**永远不用担心数据库连接数打满 (Connection Pooling Limits)**。结合 Drizzle ORM，我们实现了从数据库查询一直到前端表单 UI 的 100% 绝对类型安全 (End-to-end Type Safety)。

> [!TIP]
> 针对主页极度频繁的读取查询（例如展示最新文章），后端 API 采用了双层防御缓存策略：首先尝试内存缓存 (`Map`) 快速拦截，如果失效则回退至 Cloudflare KV 分布式缓存节点取数据，最后才击穿到 D1 查询。

## AI 与语义级搜索

现在的博客不再局限于传统的 SQL `LIKE` 匹配：

通过挂载 Cloudflare Vectorize，每一次博文的发布，文章主体内容都会被动态切片，传送给边缘部署的大语言模型（内置默认配置为 `@cf/baai/bge-small-en-v1.5`）进行矢量化 Embedding 提取，并存入向量型数据库。

这意味着：
- **语义搜索感知**：即使用户在右上角的搜索框搜索“如何上线”，我们的引擎也能找到只写了“部署配置和基建”为关键词的文章页面（抛弃了对绝对字词匹配的依赖）。
- **动态知识映射**：系统已经做好了知识关联准备，后期能够极其轻易地为每篇文章推荐出本质上逻辑相关（而并非仅仅单纯拥有相同硬标签）的相似内容。

## 媒体托管：Images 与 Stream

为了优化代码仓库体积，并避免将媒体文件直接转换为 Base64 存入 SQLite，Gins-Blog 支持接驳高级版 Cloudflare Media Bundle：

1. **CF Images**: 借助内置编写好的 `<CloudflareImage />` 组件重构博客里的图片路径，图片将动态获取请求者设备的最新浏览器类型并动态返回最合适的格式（如 AVIF 或 WEBP），从而让本地服务端专注于业务逻辑。
2. **CF Stream**: 直接使用 `<CloudflareVideo />` 获取针对客户端当前真实网速动态码率自适应下发 (HLS/DASH) 的高清视频媒体。
