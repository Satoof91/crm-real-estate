import "dotenv/config";
import { neon } from "@neondatabase/serverless";

async function fixSchema() {
    const dbUrl = process.env.DATABASE_URL;

    if (!dbUrl || !dbUrl.startsWith('postgres')) {
        console.error("ERROR: DATABASE_URL not set or not postgres");
        process.exit(1);
    }

    console.log("Connecting to Neon database...");
    const sql = neon(dbUrl);

    try {
        // Check if the column exists
        const result = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'units' AND column_name = 'electricity_number'
    `;

        if (result.length > 0) {
            console.log("✓ Column 'electricity_number' already exists in 'units' table.");
        } else {
            console.log("Column 'electricity_number' not found. Adding it now...");

            // Add the column
            await sql`ALTER TABLE units ADD COLUMN electricity_number TEXT`;

            console.log("✓ Successfully added 'electricity_number' column to 'units' table!");
        }

        // Verify the column now exists
        const verify = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'units'
    `;

        console.log("\nCurrent 'units' table columns:");
        verify.forEach(col => console.log(`  - ${col.column_name} (${col.data_type})`));

    } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
    }
}

fixSchema();
