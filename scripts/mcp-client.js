#!/usr/bin/env node

/**
 * Gins Blog MCP Client Bridge
 *
 * This script runs locally (e.g., inside Claude Desktop or OpenClaw)
 * and forwards requests to your deployed blog's /api/mcp endpoint.
 */

const BLOG_URL = process.env.BLOG_URL || "http://localhost:4321"; // Default to local dev
const MCP_ENDPOINT = `${BLOG_URL}/api/mcp`;

async function main() {
	process.stdin.setEncoding("utf8");

	// Simple JSON-RPC over Stdio loop
	let buffer = "";

	process.stdin.on("data", async (chunk) => {
		buffer += chunk;

		// Process complete JSON messages (newline delimited usually for simple streams or just raw parsing)
		// For simplicity, we assume one-shot messages or line-delimited
		const lines = buffer.split("\n");
		buffer = lines.pop(); // Keep incomplete line

		for (const line of lines) {
			if (!line.trim()) continue;

			try {
				const request = JSON.parse(line);

				// Forward to Remote API
				try {
					const response = await fetch(MCP_ENDPOINT, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(request),
					});

					if (!response.ok) {
						throw new Error(`HTTP Error: ${response.status}`);
					}

					const result = await response.json();
					console.log(JSON.stringify(result));
				} catch (netError) {
					console.error(
						JSON.stringify({
							jsonrpc: "2.0",
							id: request.id,
							error: {
								code: -32603,
								message: "Network Error",
								data: netError.toString(),
							},
						}),
					);
				}
			} catch (parseError) {
				// Ignore invalid JSON lines
			}
		}
	});

	// Send startup message if needed, but standard MCP waits for client request 'initialize'
}

main().catch(console.error);
