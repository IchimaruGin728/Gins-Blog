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

function upsertEnvVar(content, key, value) {
	const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const line = `${key}=${value}`;
	const regex = new RegExp(`^${escapedKey}=.*$`, "m");

	if (regex.test(content)) {
		return content.replace(regex, line);
	}

	if (!content.endsWith("\n") && content.length > 0) {
		content += "\n";
	}

	return `${content}${line}\n`;
}

async function main() {
	console.log("\x1b[36m%s\x1b[0m", "🚀 Starting Gins Blog Setup...");

	const args = minimist(process.argv.slice(2));
	const isInteractive = args._.length === 0 && Object.keys(args).filter((k) => k !== "_").length === 0;

	// 1. Check for wrangler
	try {
		run("wrangler --version");
	} catch (_error) {
		console.error("❌ Wrangler not found. Please run: pnpm add -g wrangler");
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
	} catch (_error) {
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
			setupMedia:
				args["setup-media"] === true || args["setup-media"] === "true",
			cfAccountId: args["cf-account-id"] || "",
			cfAccountHash: args["cf-account-hash"] || "",
			cfAvatarId: args["cf-avatar-id"] || "",
			assetsDomain: args["assets-domain"] || "",
			cfMediaApiToken: args["cf-media-api-token"] || "",
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
			{
				type: "confirm",
				name: "setupMedia",
				message:
					"Did you purchase the optional Cloudflare Images + Stream add-on? (Skip if not purchased)",
				default: false,
			},
			{
				type: "input",
				name: "cfAccountId",
				message:
					"Enter your Cloudflare Account ID (found on the right sidebar of CF Dashboard):",
				when: (answers) => answers.setupMedia,
				validate: (input) =>
					input ? true : "Account ID is required for Media uploads.",
			},
			{
				type: "input",
				name: "cfAccountHash",
				message:
					"Enter your Cloudflare Account Hash (found in Images dashboard Delivery URL):",
				when: (answers) => answers.setupMedia,
				validate: (input) =>
					input ? true : "Account Hash is required for Images.",
			},
			{
				type: "input",
				name: "cfAvatarId",
				message:
					"Enter your primary Avatar ID (can be an Image ID or R2 path like 'Avatars/me.jpg'):",
				when: (answers) => answers.setupMedia,
				validate: (input) => (input ? true : "Avatar ID/Path is required."),
			},
			{
				type: "input",
				name: "assetsDomain",
				message:
					"Enter your R2 Assets Custom Domain (optional, e.g., assets.yourdomain.com):",
				when: (answers) => answers.setupMedia,
			},
			{
				type: "password",
				name: "cfMediaApiToken",
				message:
					"Enter your Media API Token (Account.Images:Edit + Account.Stream:Edit, separate from deploy token):",
				when: (answers) => answers.setupMedia,
				validate: (input) =>
					input ? true : "Media API Token is required for uploads.",
				mask: "*",
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
			`AI Search:    \x1b[32m${answers.setupAi ? `Enabled (${answers.vectorIndex})` : "Disabled"}\x1b[0m`,
		);
		console.log(
			`Media Optimized:\x1b[32m${answers.setupMedia ? "Enabled (Pro Bundle)" : "Disabled"}\x1b[0m`,
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

	if (answers.setupMedia) {
		const requiredMediaFields = [
			["cfAccountId", "Cloudflare Account ID"],
			["cfAccountHash", "Cloudflare Account Hash"],
			["cfAvatarId", "Primary Avatar ID"],
			["cfMediaApiToken", "Cloudflare Media API Token"],
		];

		for (const [field, label] of requiredMediaFields) {
			if (!answers[field]) {
				console.error(`❌ Missing required media setup field: ${label}`);
				process.exit(1);
			}
		}
	}

	// 4. Create D1 Database
	let dbId = "";
	console.log(`📦 Creating D1 Database: ${answers.dbName}...`);
	try {
		const output = run(`wrangler d1 create ${answers.dbName}`);
		const match = output.match(/database_id\s*=\s*"([^"]+)"/);
		if (match) dbId = match[1];
	} catch (error) {
		if (error.stderr?.includes("already exists")) {
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
			const output = run(`wrangler kv namespace create ${name}`);
			// wrangler v4 outputs JSON: "id": "abc123"
			const match = output.match(/"id":\s*"([^"]+)"/);
			if (match) kvIds[binding] = match[1];
		} catch (_error) {
			console.error(`❌ Failed to create KV: ${binding}`);
		}
	}

	// 6. Create R2 Bucket
	console.log(`📦 Creating R2 Bucket: ${answers.r2Bucket}...`);
	try {
		run(`wrangler r2 bucket create ${answers.r2Bucket}`);
		console.log(`✅ R2 Bucket Created`);
	} catch (_error) {
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
		} catch (_error) {
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
						// Uncomment lines inside by stripping leading '// '
						line = line.replace(/^(\s*)\/\/\s?/, "$1");

						// Update index_name specifically
						if (line.includes('"index_name":')) {
							const indent = line.substring(0, line.indexOf('"'));
							line = `${indent}"index_name": "${answers.vectorIndex}"`;
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
			execSync("pnpm run db:push", { stdio: "inherit" });
			console.log("✅ Database initialized!");
		} catch (_error) {
			console.error("❌ Failed to push schema.");
		}
	}

	// 10. Handle Secrets & Config
	if (answers.setupMedia) {
		console.log("🔐 Designing secrets for the optional media add-on...");
		// We append/update .dev.vars for local dev
		try {
			let envContent = "";
			const envPath = path.resolve(process.cwd(), ".dev.vars");
			if (fs.existsSync(envPath)) {
				envContent = fs.readFileSync(envPath, "utf8");
			}

			envContent = upsertEnvVar(
				envContent,
				"CLOUDFLARE_ACCOUNT_ID",
				answers.cfAccountId,
			);
			envContent = upsertEnvVar(
				envContent,
				"CLOUDFLARE_MEDIA_API_TOKEN",
				answers.cfMediaApiToken,
			);
			envContent = upsertEnvVar(
				envContent,
				"CLOUDFLARE_ACCOUNT_HASH",
				answers.cfAccountHash,
			);
			envContent = upsertEnvVar(
				envContent,
				"PUBLIC_CF_AVATAR_ID",
				answers.cfAvatarId,
			);
			if (answers.assetsDomain) {
				envContent = upsertEnvVar(
					envContent,
					"PUBLIC_ASSETS_DOMAIN",
					answers.assetsDomain,
				);
			}

			fs.writeFileSync(envPath, envContent);
			console.log("✅ Media credentials saved to .dev.vars (local)");

			console.log("ℹ️  Production placement:");
			console.log(
				"   Worker secret: CLOUDFLARE_MEDIA_API_TOKEN (secret, keep separate from deploy token)",
			);
			console.log(
				"   Worker vars: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_ACCOUNT_HASH, PUBLIC_CF_AVATAR_ID",
			);
			if (answers.assetsDomain) {
				console.log("   Worker var: PUBLIC_ASSETS_DOMAIN");
			}
		} catch (_error) {
			console.warn("⚠️  Could not save secrets automatically.");
		}
	}

	console.log("\n🎉 Setup Complete!");
	console.log("👉 Next Steps:");
	console.log("1. Configure OAuth secrets in .dev.vars");
	if (answers.setupAi) {
		console.log("2. (AI Enabled) Ensure your account has Workers AI enabled.");
	}
	if (answers.setupMedia) {
		console.log("3. (Media Enabled) Configure these in production:");
		console.log(
			`   Worker secret: CLOUDFLARE_MEDIA_API_TOKEN (Value: ${answers.cfMediaApiToken.substring(0, 5)}...)`,
		);
		console.log(
			`   Worker vars: CLOUDFLARE_ACCOUNT_ID=${answers.cfAccountId}, CLOUDFLARE_ACCOUNT_HASH=${answers.cfAccountHash}, PUBLIC_CF_AVATAR_ID=${answers.cfAvatarId}`,
		);
		if (answers.assetsDomain) {
			console.log(
				`   Worker var: PUBLIC_ASSETS_DOMAIN=${answers.assetsDomain}`,
			);
		}
	}
	console.log('4. Run "pnpm run deploy"');
}

main();
