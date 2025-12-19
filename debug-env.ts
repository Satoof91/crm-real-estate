import "dotenv/config";
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Set" : "Not Set");
if (process.env.DATABASE_URL) {
    console.log("Starts with:", process.env.DATABASE_URL.substring(0, 10));
}
console.log("NODE_ENV:", process.env.NODE_ENV);
