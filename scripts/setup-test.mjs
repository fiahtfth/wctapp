import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import path from "path";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "url";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Construct absolute paths
const schemaPath = path.resolve(__dirname, "../src/lib/database/schema.ts");
const schema = await import(schemaPath);

const dbPath = process.env.DATABASE_URL?.replace("file:", "") || "./dev.db";
const sqlite = new Database(dbPath);
const db = drizzle(sqlite, { schema });

async function setupTest() {
  try {
    console.log("Starting database and admin user setup test...");

    // Check if database connection works
    console.log("Checking database connection...");
    const testQuery = await db.query.users.findFirst();
    console.log("Database connection successful");

    // Check for existing admin user
    const existingAdmin = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.role, "admin"),
    });

    if (!existingAdmin) {
      console.log("No admin user found. Creating admin user...");

      // Hash password
      const hashedPassword = await bcrypt.hash("admin123", 10);

      // Create admin user
      const [newAdmin] = await db
        .insert(schema.users)
        .values({
          email: "admin@example.com",
          password: hashedPassword,
          role: "admin",
        })
        .returning();

      console.log("Admin user created successfully:", newAdmin);
    } else {
      console.log("Admin user already exists:", existingAdmin);
    }

    // Verify password
    const passwordVerification = existingAdmin
      ? await bcrypt.compare("admin123", existingAdmin.password)
      : false;

    console.log(
      "Password verification:",
      passwordVerification ? "Successful" : "Failed",
    );

    // Optional: List all users
    const allUsers = await db.query.users.findMany();
    console.log("All users:", allUsers);
  } catch (error) {
    console.error("Setup test failed:", error);
    process.exit(1);
  } finally {
    sqlite.close();
  }
}

setupTest();
