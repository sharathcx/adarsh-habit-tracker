import fs from "fs";
import mongoose from "mongoose";

let uri = process.env.MONGODB_URI;
if (!uri && fs.existsSync(".env.local")) {
  const envContent = fs.readFileSync(".env.local", "utf8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^\s*MONGODB_URI\s*=\s*(.*)\s*$/);
    if (match) { uri = match[1].trim(); break; }
  }
}
if (!uri) { console.error("No MONGODB_URI found"); process.exit(1); }

await mongoose.connect(uri);
const db = mongoose.connection.db;

// Yesterday at noon IST (UTC+5:30) → UTC 06:30
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
yesterday.setHours(6, 30, 0, 0); // noon IST = 06:30 UTC

// Update the most recently inserted session (the 600-min one added just now)
const result = await db.collection("studysessions").updateOne(
  { minutes: 600 },
  { $set: { completedAt: yesterday, updatedAt: new Date() } },
  { sort: { createdAt: -1 } }
);

console.log(`✓ Updated ${result.modifiedCount} session(s) to yesterday (${yesterday.toISOString()})`);

await mongoose.disconnect();
