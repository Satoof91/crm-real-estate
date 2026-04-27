import "dotenv/config";
import { storage } from "./server/storage";
import bcrypt from "bcrypt";

async function createDemo() {
    console.log("Creating demo user...");
    try {
        const existingDemo = await storage.getUserByUsername("demo");
        if (existingDemo) {
            console.log("Demo user already exists.");
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash("demo123", 10);
        await storage.createUser({
            username: "demo",
            password: hashedPassword,
            fullName: "Demo User",
            email: "demo@example.com",
            role: "user",
        });

        console.log("Demo user created successfully.");
        console.log("Username: demo");
        console.log("Password: demo123");
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

createDemo();
