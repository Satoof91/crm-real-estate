import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import fs from "fs";

async function checkCustomerData() {
    const dbUrl = process.env.DATABASE_URL;

    if (!dbUrl || !dbUrl.startsWith('postgres')) {
        console.error("ERROR: DATABASE_URL not set or not postgres");
        process.exit(1);
    }

    const sql = neon(dbUrl);
    const output = [];

    try {
        // Check contacts table structure
        const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'contacts'
      ORDER BY ordinal_position
    `;

        output.push("'contacts' table columns:");
        columns.forEach(col => output.push(`  - ${col.column_name} (${col.data_type})`));

        // Count contacts
        const countResult = await sql`SELECT COUNT(*) as count FROM contacts`;
        output.push(`\nTotal contacts in Neon: ${countResult[0].count}`);

        // Show sample contacts (without sensitive data)
        if (countResult[0].count > 0) {
            const sample = await sql`SELECT id, full_name, status, user_id FROM contacts LIMIT 10`;
            output.push("\nSample contacts:");
            sample.forEach(c => output.push(`  - ${c.full_name} (status: ${c.status}, user_id: ${c.user_id})`));
        }

        // Check users
        const users = await sql`SELECT id, username, role FROM users`;
        output.push("\nUsers in Neon:");
        users.forEach(u => output.push(`  - ${u.username} (role: ${u.role}, id: ${u.id})`));

        fs.writeFileSync("customer_check_output.txt", output.join("\n"));
        console.log("Output written to customer_check_output.txt");

    } catch (error) {
        output.push(`Error: ${error.message}`);
        fs.writeFileSync("customer_check_output.txt", output.join("\n"));
        console.error("Error:", error.message);
        process.exit(1);
    }
}

checkCustomerData();
