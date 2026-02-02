import { drizzle } from "drizzle-orm/d1";
import * as schema from "../../db/schema";

export function getDb(env: Env) {
	if (!env.DB) {
		console.warn("[getDb] env.DB is missing. Returning null mock or throwing.");
		// throw new Error("Database binding (DB) not found in environment.");
		// Better to throw so we catch it in try/catch blocks, rather than crashing with "cannot read prop of undefined" later
		throw new Error("DB_BINDING_MISSING");
	}
	return drizzle(env.DB, { schema });
}
