/**
 * MCP Verification Script
 *
 * Usage:
 * 1. Ensure your local server is running: `npm run dev`
 * 2. Run this script: `node scripts/test-mcp.js`
 */

async function testMcp() {
	const port = process.argv[2] || 4321;
	const endpoint = `http://localhost:${port}/api/mcp`;
	console.log(`🔌 Connecting to MCP Endpoint: ${endpoint}...`);

	// 1. Test: Initialize / List Tools
	console.log("\n1️⃣  Testing 'initialize' (List Tools)...");
	try {
		const initResponse = await fetch(endpoint, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				jsonrpc: "2.0",
				method: "initialize",
				id: 1,
			}),
		});
		const initResult = await initResponse.json();
		console.log(
			"✅ Tools Found:",
			initResult.result.tools.map((t) => t.name).join(", "),
		);
	} catch {
		console.error("❌ Failed to list tools. Is the server running?");
		process.exit(1);
	}

	// 2. Test: Check Analytics
	console.log("\n2️⃣  Testing 'check_analytics' tool...");
	try {
		const analyticsResponse = await fetch(endpoint, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				jsonrpc: "2.0",
				method: "tools/call",
				params: {
					name: "check_analytics",
					arguments: {},
				},
				id: 2,
			}),
		});
		const analyticsResult = await analyticsResponse.json();
		console.log("✅ Analytics Result:", analyticsResult.result.content[0].text);
	} catch (e) {
		console.error("❌ Failed to check analytics:", e);
	}

	// 3. Test: Search Posts
	console.log("\n3️⃣  Testing 'search_posts' tool (Query: 'blog')...");
	try {
		const searchResponse = await fetch(endpoint, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				jsonrpc: "2.0",
				method: "tools/call",
				params: {
					name: "search_posts",
					arguments: { query: "blog" },
				},
				id: 3,
			}),
		});
		const searchResult = await searchResponse.json();
		console.log("✅ Search Result:", searchResult.result.content[0].text);
	} catch (e) {
		console.error("❌ Failed to search posts:", e);
	}
}

testMcp();
