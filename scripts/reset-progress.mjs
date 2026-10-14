import fs from "fs";
import mongoose from "mongoose";

// Load MONGODB_URI from process.env or .env.local
let uri = process.env.MONGODB_URI;
if (!uri && fs.existsSync(".env.local")) {
  const envContent = fs.readFileSync(".env.local", "utf8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^\s*MONGODB_URI\s*=\s*(.*)\s*$/);
    if (match) {
      uri = match[1].trim();
      break;
    }
  }
}

if (!uri) {
  console.error("Error: MONGODB_URI is not set and could not be found in .env.local");
  process.exit(1);
}

// Extract database name from connection URI
const dbName = uri.split("/").pop()?.split("?")[0];
console.log(`Connecting to MongoDB...`);
console.log(`Target database: [${dbName}]`);

// Safety guard: ensure we never accidentally wipe the original gate-da database
if (dbName === "gate-da") {
  console.error("SAFETY ERROR: Database is 'gate-da'. Aborting to protect original data.");
  process.exit(1);
}

await mongoose.connect(uri, { bufferCommands: false });
const db = mongoose.connection.db;

// 1. Delete all logged study sessions
const sessionResult = await db.collection("studysessions").deleteMany({});
console.log(`✓ Deleted ${sessionResult.deletedCount} study sessions.`);

// 2. Clear notes and revisions from topics
const topicResult = await db.collection("topics").updateMany(
  {},
  { $set: { notes: [], revisions: [] } }
);
console.log(`✓ Reset progress (notes & revisions) on ${topicResult.matchedCount} topics.`);

console.log("\nAll progress has been completely removed from the database!");
console.log("Your streak, heatmap, and study minutes are now reset to 0.\n");

await mongoose.disconnect();
process.exit(0);
