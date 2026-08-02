// One-time/idempotent seed for the admin panel's AdminUser collection.
// Reads credentials from env vars — never hardcode them here.
//
// Usage: node scripts/seed-admin.js
// Requires (in .env or the environment): MONGODB_URI, ADMIN_SEED_EMAIL,
// ADMIN_SEED_PASSWORD, ADMIN_SEED_PASSWORD2.

const fs = require("fs");
const path = require("path");
const dns = require("dns");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Some hosts' default DNS resolver can't answer the SRV queries that
// mongodb+srv:// needs — same fix as src/lib/db.ts.
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const envPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
        const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
        if (match && !process.env[match[1]]) {
            process.env[match[1]] = match[2].trim();
        }
    }
}

const { MONGODB_URI, ADMIN_SEED_EMAIL, ADMIN_SEED_PASSWORD, ADMIN_SEED_PASSWORD2 } = process.env;

async function main() {
    if (!MONGODB_URI) throw new Error("Missing MONGODB_URI");
    if (!ADMIN_SEED_EMAIL || !ADMIN_SEED_PASSWORD || !ADMIN_SEED_PASSWORD2) {
        throw new Error("Missing ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD / ADMIN_SEED_PASSWORD2");
    }

    await mongoose.connect(MONGODB_URI);

    const AdminUser =
        mongoose.models.AdminUser ||
        mongoose.model(
            "AdminUser",
            new mongoose.Schema(
                {
                    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
                    passwordHash: { type: String, required: true },
                    password2Hash: { type: String, required: true },
                    name: { type: String },
                    lastLoginAt: { type: Date },
                },
                { timestamps: true }
            )
        );

    const email = ADMIN_SEED_EMAIL.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(ADMIN_SEED_PASSWORD, 12);
    const password2Hash = await bcrypt.hash(ADMIN_SEED_PASSWORD2, 12);

    const result = await AdminUser.findOneAndUpdate(
        { email },
        { $set: { passwordHash, password2Hash } },
        { upsert: true, returnDocument: "after" }
    );

    console.log(`AdminUser ready: ${result.email} (_id: ${result._id})`);
    await mongoose.disconnect();
}

main().catch((err) => {
    console.error("Seed failed:", err.message);
    process.exit(1);
});
