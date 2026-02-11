# 🤖 Gins Blog MCP Usage Guide

This blog implements the **Model Context Protocol (MCP)**, allowing AI agents (like Claude Desktop, OpenClaw, or Cursor) to directly interact with your blog's content and data.

## 🚀 Capabilities

Once connected, your AI agent can:
- **Search Posts**: Find articles by keywords (`search_posts`).
- **Draft Content**: Create new post drafts directly in your database (`draft_post`).
- **Analyze Comments**: Fetch recent comments for moderation or sentiment analysis (`analyze_comments`).
- **Check Analytics**: View improved traffic stats (`check_analytics`).

---

## 🔌 Connection Setup

### Option 1: Claude Desktop

To use this with the [Claude Desktop App](https://claude.ai/download):

1.  Locate your Claude config file:
    -   **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
    -   **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

2.  Add the following configuration (replace `/absolute/path/to/...` with your actual path):

    ```json
    {
      "mcpServers": {
        "gins-blog": {
          "command": "node",
          "args": ["/Users/your-username/path/to/gins-blog/scripts/mcp-client.js"],
          "env": {
            "BLOG_URL": "https://your-deployed-blog.com"
          }
        }
      }
    }
    ```

3.  Restart Claude Desktop. You should see a 🔌 icon indicating the tool is connected.

---

### Option 2: OpenClaw / Cursor

For agents that support `openclaw.json` or standard MCP over stdio:

1.  Ensure you have `openclaw.json` in your project root.
2.  Edit `openclaw.json` to point `BLOG_URL` to your production URL:

    ```json
    {
      "mcpServers": {
        "gins-blog": {
          "command": "node",
          "args": ["scripts/mcp-client.js"],
          "env": {
            "BLOG_URL": "https://your-deployed-blog.com" 
          }
        }
      }
    }
    ```

3.  Instruct your agent: *"Load the MCP server defined in openclaw.json"*.

---

## ✅ How to Verify Locally

Before connecting to an external agent, you can verify your MCP server is working correctly using the provided test script.

1.  **Start your local server**:
    ```bash
    npm run dev
    ```

2.  **Run the test script** in a new terminal:
    ```bash
    node scripts/test-mcp.js
    ```

    You should see output similar to:
    ```
    🔌 Connecting to MCP Endpoint: http://localhost:4321/api/mcp...
    1️⃣  Testing 'initialize' (List Tools)...
    ✅ Tools Found: search_posts, draft_post, analyze_comments, check_analytics
    ...
    ```

---

## 🗣️ Example Prompts

Here are some things you can ask your connected AI:

#### **Content Creation**
> "Check my recent posts using `search_posts`. Based on topics I haven't covered lately, draft a new blog post title and outline about 'The Future of Edge Computing'."

> "Write a draft post about my trip to Kyoto using the `draft_post` tool. Title it 'Kyoto Diaries'."

#### **Analytics & Management**
> "Use `check_analytics` to tell me how my blog is performing today. Which post is the most popular?"

> "Analyze the last 10 comments with `analyze_comments`. Are there any spam or negative comments I should be worried about?"

---

## 🛠️ Troubleshooting

-   **Connection Refused**: Ensure `BLOG_URL` in your config points to the **deployed** version of your blog (e.g., `https://blog.ichimarugin728.com`), not `localhost`, unless you are running `npm run dev` locally.
-   **Method Not Found**: Ensure you have redeployed your blog *after* adding the MCP endpoint code.
