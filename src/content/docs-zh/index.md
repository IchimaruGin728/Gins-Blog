---
title: "简介"
description: "从零开始认识 Gins-Blog 的全栈架构"
order: 1
---

# Gins-Blog 官方文档

欢迎来到 Gins-Blog 的技术文档中心！本指南将帮助您理解项目背后的架构设计，指导您的私有化部署，并解锁系统内置的高阶使用技巧。

## 什么是 Gins-Blog？

Gins-Blog 不是一个传统的 WordPress 或基于服务端的动态博客。它是一个采用 **Edge-Native (边缘原生)** 架构的现代化全栈应用。

这意味着整个博客系统（包括数据库、API 后端、身份验证、静态页面托管和图像处理逻辑）全部都运行在 Cloudflare 全球数百个分布式的边缘节点上。

### 核心特性

- ⚡ **极致速度**: 完全没有“冷启动”烦恼，全球任何地方的用户都能享受到毫秒级的首字节响应时间 (TTFB)。
- 🧩 **全栈自闭环**: 不依赖任何第三方数据库提供商 (如 Supabase, Vercel Postgres)。利用 Cloudflare 的 **D1** (分布式 SQLite), **R2** (对象存储) 和 **KV** (键值缓存) 完成所有数据落盘。
- 🤖 **原生 AI 驱动**: 内置向量数据库 (Vectorize)，支持强大的语义搜索。博客不仅是展示页，更是直接接入 AI 大模型的 Agentic 知识库终端（MCP 支持）。
- 🛡️ **内网零信任**: 管理后台支持接入 Cloudflare Access 实现企业级的 Zero-Trust 安全认证策略。
- 💎 **Liquid Glass UI**: 精心打造的高端硬件加速玻璃拟态风格与液体无缝转场动画，重新定义“极简而高级”的视觉体验。

## 文档导览

在左侧导航栏中，您可以找到：
1. **[简介](/zh/docs/introduction)**：带您快速浏览本生态的核心概念。
2. **[架构设计](/zh/docs/architecture)**：深度解析 Astro + Hono + D1 的混合渲染如何协同工作。
3. **[部署指南](/zh/docs/deployment)**：涵盖从拉取代码到全自动上线 Cloudflare 的完整向导式教程。

> [!TIP]
> 如果您在部署过程中遇到任何环境配置的问题，建议首先查阅自动部署脚本 `npm run setup` 的日志输出。
