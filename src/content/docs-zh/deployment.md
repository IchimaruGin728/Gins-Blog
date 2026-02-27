---
title: "部署指南"
description: "从零开始：将您的节点并入边缘网络"
order: 3
---

# 部署矩阵 (Deployment Matrix)

部署 Gins-Blog 非常的简单，唯一需要的就是一个 Cloudflare 账号，以及在本地安装好 Node.js 和 Wrangler 命令行工具。

## 准备工作

请确保您的本地开发环境已经配置了以下基础环境：
- `Node.js >= 24.0.0`
- `npm` 或 `pnpm`
- Cloudflare Wrangler CLI (`npm i -g wrangler`)

> [!IMPORTANT]
> 在开始任何部署或创建资源之前，请务必先在终端运行 `wrangler login`。这会弹出一个浏览器窗口让您授权终端访问您的 Cloudflare 架构资产。

## 自动初始化体系 (✨ 推荐)

我们为您准备了简单、符合直觉的全自动引导脚本。

您只需要在项目根目录下运行：

```bash
npm run setup
```

该引导程序会以对话的形式，自动协助您完成以下繁杂的配置工作：
1. **自动调配基础云资源池**：配置 D1 (数据库持久化存储), KV (键值对高频缓存), 以及选择性启用的 Vectorize (AI 语义向量库)。
2. **连接绑定**：它会自动扫描生成的系统 ID，并一键写入您的 `wrangler.jsonc` 配置文件。
3. **架构同步**：全自动执行 `npm run db:push` 初始化并将您的表单结构同步至刚创建好的 D1 数据库中。
4. **媒体高级托管向导**：最后，如果您购买了 Cloudflare Media Bundle（可选，非强制），脚本会引导您配置对应的 API Token（需要 `Images: Edit` 以及 `Stream: Edit` 权限），从而开启流畅的多媒体体验。


## 原生部署引擎与手工覆盖

如果您需要介入底层环境进行开发和纯手工操作：

您随时可以使用下面的命令直接将结构体推送拉取至 D1：

```bash
# 将本地 Schema 推送到生产环境 D1 (注意风险)
wrangler d1 execute gins-db --file=./db/migrations/0000_schema.sql --remote
```

### 点火升空 (Ignition)

一旦以上设置都通过 `npm run setup` 顺利敲定，直接执行部署指令，即可将这串庞大的渲染引擎分发到全球各地的节点：

```bash
npm run deploy
```

不出几秒，代码就会化为比特流倾注在 Cloudflare 边缘网络上。您可以在终端里直接获得一个 `<name>.workers.dev` 结尾的原始启动域名，之后即可在 Cloudflare 设置面板随意绑定您喜欢的自定义顶级骨干根域名了。
