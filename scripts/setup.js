import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import inquirer from "inquirer";
import minimist from "minimist";

// Helper to run shell commands
function run(cmd) {
	try {
		return execSync(cmd, {
			encoding: "utf8",
			stdio: ["ignore", "pipe", "pipe"],
		}).trim();
	} catch (error) {
		if (error.status === 127) {
			console.error(`Error: Command not found: ${cmd.split(" ")[0]}`);
		}
		throw error;
	}
}

// Validation helper for resource names
const validateName = (input) => {
	if (/^[a-z0-9-]+$/.test(input)) {
		return true;
	}
	return "Name must only contain lowercase letters, numbers, and hyphens.";
};

async function main() {
	console.log("\x1b[36m%s\x1b[0m", "🚀 Starting Gins Blog Setup...");

	const args = minimist(process.argv.slice(2));
	const isInteractive = Object.keys(args).length === 1 && args._.length === 0;

	// 1. Check for wrangler
	try {
		run("wrangler --version");
	} catch (e) {
		console.error("❌ Wrangler not found. Please run: npm install -g wrangler");
		process.exit(1);
	}

	// 2. Check login status
	try {
		const whoami = run("wrangler whoami");
		if (whoami.includes("You are not authenticated")) {
			console.log("⚠️  You are not logged in. Please login to Cloudflare...");
			execSync("wrangler login", { stdio: "inherit" });
		} else {
			// Extract user email for better UX
			const emailMatch = whoami.match(
				/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/m,
			);
			if (emailMatch) {
				console.log(`✅ Logged in as: \x1b[32m${emailMatch[0]}\x1b[0m`);
			}
		}
	} catch (e) {
		// Proceed if cannot determine
	}

	// Generate a default suffix
	const defaultSuffix = Math.random().toString(36).substring(2, 8);
	let answers = {};

	// 3. Collect User Inputs
	if (!isInteractive) {
		console.log("🤖 Running in Non-Interactive Mode (AI/CI)...");
		const suffix = args.suffix || defaultSuffix;
		answers = {
			suffix,
			dbName: args["db-name"] || `gins-blog-db-${suffix}`,
			kvCache: args["kv-cache"] || `gins-cache-${suffix}`,
			kvSession: args["kv-session"] || `gins-session-${suffix}`,
			kvGeneral: args["kv-general"] || `gins-kv-${suffix}`,
			r2Bucket: args["r2-bucket"] || `gins-media-${suffix}`,
			setupAi: args["setup-ai"] === true || args["setup-ai"] === "true",
			vectorIndex: args["vector-index"] || `gins-vector-${suffix}`,
		};
	} else {
		answers = await inquirer.prompt([
			{
				type: "input",
				name: "suffix",
				message:
					"Enter a suffix for your resources (e.g. dev, prod) or leave blank for random:",
				default: defaultSuffix,
				validate: validateName,
			},
			{
				type: "input",
				name: "dbName",
				message: "D1 Database Name:",
				default: (answers) => `gins-blog-db-${answers.suffix}`,
				validate: validateName,
			},
			{
				type: "input",
				name: "kvCache",
				message: "KV Namespace (Cache) Name:",
				default: (answers) => `gins-cache-${answers.suffix}`,
				validate: validateName,
			},
			{
				type: "input",
				name: "kvSession",
				message: "KV Namespace (Session) Name:",
				default: (answers) => `gins-session-${answers.suffix}`,
				validate: validateName,
			},
			{
				type: "input",
				name: "kvGeneral",
				message: "KV Namespace (General) Name:",
				default: (answers) => `gins-kv-${answers.suffix}`,
				validate: validateName,
			},
			{
				type: "input",
				name: "r2Bucket",
				message: "R2 Media Bucket Name:",
				default: (answers) => `gins-media-${answers.suffix}`,
				validate: validateName,
			},
			{
				type: "confirm",
				name: "setupAi",
				message: "Do you want to set up Vectorize for AI Search (Optional)?",
				default: false,
			},
			{
				type: "input",
				name: "vectorIndex",
				message: "Vectorize Index Name:",
				default: (answers) => `gins-vector-${answers.suffix}`,
				when: (answers) => answers.setupAi,
				validate: validateName,
			},
		]);

		// Confirmation Step
		console.log("\n📋 \x1b[1mConfiguration Summary:\x1b[0m");
		console.log("--------------------------------");
		console.log(`Database:     \x1b[32m${answers.dbName}\x1b[0m`);
		console.log(`KV (Cache):   \x1b[32m${answers.kvCache}\x1b[0m`);
		console.log(`KV (Session): \x1b[32m${answers.kvSession}\x1b[0m`);
		console.log(`KV (General): \x1b[32m${answers.kvGeneral}\x1b[0m`);
		console.log(`R2 Bucket:    \x1b[32m${answers.r2Bucket}\x1b[0m`);
		console.log(
			`AI Search:    \x1b[32m${answers.setupAi ? "Enabled (" + answers.vectorIndex + ")" : "Disabled"}\x1b[0m`,
		);
		console.log("--------------------------------");

		const { confirm } = await inquirer.prompt([
			{
				type: "confirm",
				name: "confirm",
				message: "Ready to create these resources via Wrangler?",
				default: true,
			},
		]);

		if (!confirm) {
			console.log("❌ Setup Aborted.");
			process.exit(0);
		}
	}

	console.log("\n⚙️  Applying configuration...");
	if (!isInteractive) {
		console.log(JSON.stringify(answers, null, 2));
	}

	// 4. Create D1 Database
	let dbId = "";
	console.log(`📦 Creating D1 Database: ${answers.dbName}...`);
	try {
		const output = run(`wrangler d1 create ${answers.dbName}`);
		const match = output.match(/database_id\s*=\s*"([^"]+)"/);
		if (match) dbId = match[1];
	} catch (e) {
		if (e.stderr && e.stderr.includes("already exists")) {
			console.log(
				`⚠️  Database ${answers.dbName} already exists. Attempting to fetch ID...`,
			);
			console.warn(
				"⚠️  Could not create DB (already exists). Automatic update of ID might fail if you do not update wrangler.jsonc manually.",
			);
		} else {
			console.error("❌ Failed to create D1 database.");
		}
	}

	// 5. Create KV Namespaces
	const kvConfig = {
		GINS_CACHE: answers.kvCache,
		SESSION: answers.kvSession,
		GIN_KV: answers.kvGeneral,
	};
	const kvIds = {};

	for (const [binding, name] of Object.entries(kvConfig)) {
		console.log(`📦 Creating KV Namespace for ${binding}: ${name}...`);
		try {
			const output = run(
				`wrangler kv namespace create ${binding} --title=${name}`,
			);
			const match = output.match(/id\s*=\s*"([^"]+)"/);
			if (match) kvIds[binding] = match[1];
		} catch (e) {
			console.error(`❌ Failed to create KV: ${binding}`);
		}
	}

	// 6. Create R2 Bucket
	console.log(`📦 Creating R2 Bucket: ${answers.r2Bucket}...`);
	try {
		run(`wrangler r2 bucket create ${answers.r2Bucket}`);
		console.log(`✅ R2 Bucket Created`);
	} catch (e) {
		console.warn("⚠️  Failed to create R2 bucket (it might already exist).");
	}

	// 7. Create Vectorize (Optional)
	if (answers.setupAi) {
		console.log(`📦 Creating Vectorize Index: ${answers.vectorIndex}...`);
		try {
			run(
				`wrangler vectorize create ${answers.vectorIndex} --dimensions=768 --metric=cosine`,
			);
			console.log(`✅ Vectorize Index Created`);
		} catch (e) {
			console.warn("⚠️  Failed to create Vectorize Index.");
		}
	}

	// 8. Update wrangler.jsonc
	const wranglerPath = path.resolve(process.cwd(), "wrangler.jsonc");
	if (fs.existsSync(wranglerPath)) {
		console.log("📝 Updating wrangler.jsonc...");
		let content = fs.readFileSync(wranglerPath, "utf8");

		// Update D1
		if (dbId) {
			content = content.replace(
				/("binding":\s*"DB"[\s\S]*?"database_id":\s*")[^"]+"/g,
				`$1${dbId}"`,
			);
			content = content.replace(
				/("binding":\s*"DB"[\s\S]*?"database_name":\s*")[^"]+"/g,
				`$1${answers.dbName}"`,
			);
		}

		// Update KVs
		for (const [binding, id] of Object.entries(kvIds)) {
			if (id) {
				const idRegex = new RegExp(
					`("binding":\\s*"${binding}"[\\s\\S]*?"id":\\s*")[^"]+"`,
					"g",
				);
				content = content.replace(idRegex, `$1${id}"`);

				const previewRegex = new RegExp(
					`("binding":\\s*"${binding}"[\\s\\S]*?"preview_id":\\s*")[^"]+"`,
					"g",
				);
				content = content.replace(previewRegex, `$1${id}"`);
			}
		}

		// Update R2
		content = content.replace(
			/("binding":\s*"BUCKET"[\s\S]*?"bucket_name":\s*")[^"]+"/g,
			`$1${answers.r2Bucket}"`,
		);

		// Handle AI/Vectorize Uncommenting
		if (answers.setupAi) {
			const lines = content.split("\n");
			const newLines = [];

			// Flags to track if we are inside commented blocks
			let insideVectorize = false;
			let insideAi = false;

			for (let line of lines) {
				const trimmed = line.trim();

				// Vectorize Block Start
				if (trimmed.startsWith('// "vectorize":')) {
					line = line.replace("// ", ""); // Uncomment start
					insideVectorize = true;
					newLines.push(line);
					continue;
				}

				if (insideVectorize) {
					if (trimmed.startsWith("//")) {
						// Uncomment lines inside
						line.replace("//", "");
						// Check if we need to fix indentation (replace often leaves a space if strictly '// ')
						// But simple replace works if we trust consistency.
						// Let's use a regex to replace the first comment marker and optional space
						line = line.replace(/\s*\/\/\s?/, (match) =>
							match.replace(/\/\/\s?/, ""),
						);

						// Update index_name specifically
						if (line.includes('"index_name":')) {
							const indent = line.substring(0, line.indexOf('"'));
							line = `${indent}"index_name": "${answers.vectorIndex}"`;
							// Add comma if it was there? No, usually jsonc last item doesn't need it but standard json might.
							// The original file: "index_name": "gins-vector" (no comma if last in obj)
						}
					}

					if (trimmed.includes("],")) {
						insideVectorize = false;
					}
				}

				// AI Block Start
				if (trimmed.startsWith('// "ai":')) {
					line = line.replace("// ", "");
					insideAi = true;
					newLines.push(line);
					continue;
				}

				if (insideAi) {
					if (trimmed.startsWith("//")) {
						line = line.replace(/\s*\/\/\s?/, (match) =>
							match.replace(/\/\/\s?/, ""),
						);
					}
					if (trimmed.includes("}")) {
						insideAi = false;
					}
				}

				newLines.push(line);
			}
			content = newLines.join("\n");
		}

		fs.writeFileSync(wranglerPath, content);
		console.log("✅ wrangler.jsonc updated!");
	}

	// 9. Initialize Schema
	if (dbId) {
		console.log("🔄 Initializing Database Schema...");
		try {
			execSync("npm run db:push", { stdio: "inherit" });
			console.log("✅ Database initialized!");
		} catch (e) {
			console.error("❌ Failed to push schema.");
		}
	}

	console.log("\n🎉 Setup Complete!");
	console.log("👉 Next Steps:");
	console.log("1. Configure OAuth secrets in .dev.vars");
	if (answers.setupAi) {
		console.log("2. (AI Enabled) Ensure your account has Workers AI enabled.");
	}
	console.log('3. Run "npm run deploy"');
}

main();
