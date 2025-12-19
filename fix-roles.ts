import "dotenv/config";
import { storage } from "./server/storage";

async function fixRoles() {
    console.log("Fetching users...");
    try {
        const users = await storage.getUsers();
        console.log(`Found ${users.length} users.`);

        for (const user of users) {
            console.log(`User: ${user.username}, Role: ${user.role}`);
            if (user.role !== 'manager' && user.role !== 'admin') {
                console.log(`Updating user ${user.username} to manager role...`);
                await storage.updateUserRole(user.id, 'manager');
                console.log(`Updated ${user.username}.`);
            }
        }
        console.log("Done.");
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

fixRoles();
