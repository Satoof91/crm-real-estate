import "dotenv/config";
import { storage } from "./server/storage";

async function listUsers() {
    console.log("Fetching users...");
    try {
        const users = await storage.getUsers();
        console.log(`Found ${users.length} users.`);
        for (const user of users) {
            console.log(`Username: ${user.username}, Role: ${user.role}, Email: ${user.email}`);
        }
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

listUsers();
