# Agent Deployment Guide

This document is specifically designed for AI Agents (OpenClaw, Cursor, etc.) to understand how to deploy this Astro Blog to Cloudflare.

## 🦞 OpenClaw Users
Just tell your agent: **"Read AGENT_GUIDE.md and execute the deployment steps."**

## Prerequisite Checks
1.  **Node.js**: Verify `node` and `npm` are installed (`node -v`, `npm -v`).
2.  **Cloudflare Auth**: Run `npx wrangler whoami`.
    -   If unauthorized, STOP and ask the user to run `npx wrangler login`.
    -   If authorized, proceed.

## Step-by-Step Deployment Strategy

### Phase 1: Interactive Infrastructure Setup
We have created a robust, interactive setup script that handles all resource creation (D1, KV, R2) and configuration updates.

1.  **Install Dependencies:**
    -   Command: `npm install`

2.  **Run Setup Script:**
    -   **Interactive (For Humans):** `npm run setup`
    -   **Non-Interactive (For Agents):**
        ```bash
        node scripts/setup.js --suffix=prod --setup-ai=false
        ```
    -   **Supported Flags:**
        -   `--suffix`: Suffix for all resource names (required for non-interactive mode).
        -   `--setup-ai`: `true` or `false` (default: false).
        -   `--db-name`, `--kv-cache`, `--r2-bucket`, etc.: Override specific names if needed.

    -   **Agent Action:**
        -   Start by running the non-interactive command above with a random or project-specific suffix.
        -   Verify the output says "Setup Complete".

### Phase 2: Build & Deploy
Once resources are set up and `wrangler.jsonc` is configured:

1.  **Build the Project:**
    -   Command: `npm run build`

2.  **Deploy to Cloudflare:**
    -   Command: `npm run deploy`
    -   **Note:** This runs `astro build && wrangler deploy`.

## Troubleshooting
-   **"Unauthorized"**: The user must log in to Cloudflare (`npx wrangler login`).
-   **"Database not found"**: Ensure `setup` was run and `wrangler.jsonc` contains the correct `database_id`.
-   **"Command not found"**: Ensure `npm install` was run to install local `wrangler`.

## Advanced: MCP Integration
This project is **MCP Ready**. It exposes an MCP server for agents to manage content.

-   **Documentation**: Refer to `MCP_GUIDE.md` for connection details.
-   **Capabilities**: Search posts, draft content, and check analytics via the `/api/mcp` endpoint.
-   **Architecture & Logic**: Agents modifying this project should refer to the interactive documentation located in `src/pages/docs` (English) or `src/pages/zh/docs` (Chinese) for deeper architectural guidelines.
