import bcryptjs from "bcryptjs";
import pool from "./src/common/config/db.js";

/**
 * This utility script hashes any plain text passwords in the database
 * Run this once to fix existing users with plain text passwords
 * 
 * Usage: node fix-passwords.js
 */

async function fixPlainTextPasswords() {
    try {
        console.log("🔐 Starting password hashing process...\n");

        // Get all users with plain text passwords (shorter than 60 chars or not bcrypt format)
        const query = `
            SELECT id, email, name, password_hash 
            FROM users 
            WHERE LENGTH(password_hash) < 60 
               OR password_hash NOT LIKE '$2%'
        `;

        const result = await pool.query(query);
        const usersToFix = result.rows;

        if (usersToFix.length === 0) {
            console.log("✅ All passwords are already hashed! Nothing to do.");
            process.exit(0);
        }

        console.log(`Found ${usersToFix.length} user(s) with plain text passwords:\n`);

        for (const user of usersToFix) {
            console.log(`Processing: ${user.email}`);
            const plainPassword = user.password_hash; // This is actually plain text

            // Hash the password
            const salt = await bcryptjs.genSalt(10);
            const hashedPassword = await bcryptjs.hash(plainPassword, salt);

            // Update the database
            await pool.query(
                "UPDATE users SET password_hash = $1 WHERE id = $2",
                [hashedPassword, user.id]
            );

            console.log(`  ✓ Password hashed and updated`);
        }

        console.log(`\n✅ Successfully hashed ${usersToFix.length} password(s)!`);
        console.log("You can now log in with your credentials.");

        process.exit(0);
    } catch (error) {
        console.error("❌ Error fixing passwords:", error.message);
        process.exit(1);
    }
}

fixPlainTextPasswords();
