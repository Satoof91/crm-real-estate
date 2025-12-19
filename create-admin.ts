import "dotenv/config";
import { storage } from "./server/storage";
import bcrypt from "bcrypt";

async function createAdmin() {
  console.log("Creating admin user...");
  try {
    const existingAdmin = await storage.getUserByUsername("admin");
    if (existingAdmin) {
      console.log("Admin user already exists.");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);
    const admin = await storage.createUser({
      username: "admin",
      password: hashedPassword,
      fullName: "System Admin",
      email: "admin@example.com",
      role: "admin",
    });

    console.log("Admin user created successfully.");
    console.log("Username: admin");
    console.log("Password: admin123");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

createAdmin();
