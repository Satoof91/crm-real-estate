
import "dotenv/config";
import fs from "fs";

const out = [];
out.push("Checking environment...");
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    out.push("ERROR: DATABASE_URL is not set.");
} else {
    out.push("DATABASE_URL is set.");
    out.push(`Starts with: ${dbUrl.substring(0, 15)}...`);
    const isPostgres = dbUrl.startsWith('postgres');
    out.push(`Is Postgres: ${isPostgres}`);
}

const useSqlite = !dbUrl || dbUrl === 'sqlite';
out.push(`Config would use: ${useSqlite ? 'SQLite' : 'Postgres'}`);

fs.writeFileSync("debug_output.txt", out.join("\n"));
console.log("Debug info written to debug_output.txt");
