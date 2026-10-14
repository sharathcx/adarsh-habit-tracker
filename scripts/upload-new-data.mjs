import fs from "fs";
import mongoose from "mongoose";

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
  console.error("Error: MONGODB_URI not found");
  process.exit(1);
}

const dbName = uri.split("/").pop()?.split("?")[0];
console.log(`Connecting to MongoDB...`);
console.log(`Target database: [${dbName}]`);

if (dbName === "gate-da") {
  console.error("SAFETY ERROR: Database is 'gate-da'. Aborting to protect original data.");
  process.exit(1);
}

await mongoose.connect(uri, { bufferCommands: false });
const db = mongoose.connection.db;

const subjectsCollection = db.collection("subjects");
const topicsCollection = db.collection("topics");
const sessionsCollection = db.collection("studysessions");

// Clear existing collections in adarsh database
await Promise.all([
  subjectsCollection.deleteMany({}),
  topicsCollection.deleteMany({}),
  sessionsCollection.deleteMany({}),
]);
console.log("✓ Cleared existing records in adarsh database");

const h = (hours, minutes = 0) => hours * 60 + minutes;

const NEW_DATA = [
  {
    name: "CAL",
    order: 1,
    color: "#18181b",
    topics: [{ name: "CAL", durationMin: h(28, 0) }],
  },
  {
    name: "LA + POST",
    order: 2,
    color: "#27272a",
    topics: [{ name: "LA + POST", durationMin: h(61, 34) }],
  },
  {
    name: "DSA",
    order: 3,
    color: "#09090b",
    topics: [{ name: "DSA", durationMin: h(106, 0) }],
  },
  {
    name: "DBMS",
    order: 4,
    color: "#3f3f46",
    topics: [{ name: "DBMS", durationMin: h(34, 0) }],
  },
  {
    name: "ML",
    order: 5,
    color: "#18181b",
    topics: [{ name: "ML", durationMin: h(83, 52) }],
  },
  {
    name: "AI",
    order: 6,
    color: "#27272a",
    topics: [{ name: "AI", durationMin: h(39, 30) }],
  },
  {
    name: "APT",
    order: 7,
    color: "#09090b",
    topics: [{ name: "APT", durationMin: h(132, 2) }],
  },
];

let totalMinutes = 0;
let totalTopics = 0;

for (const item of NEW_DATA) {
  const subjectResult = await subjectsCollection.insertOne({
    name: item.name,
    order: item.order,
    color: item.color,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const subjectId = subjectResult.insertedId;

  for (let i = 0; i < item.topics.length; i++) {
    const t = item.topics[i];
    await topicsCollection.insertOne({
      subjectId: subjectId,
      name: t.name,
      durationMin: t.durationMin,
      order: i + 1,
      section: null,
      notes: [],
      revisions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    totalMinutes += t.durationMin;
    totalTopics++;
  }

  const hours = Math.floor(item.topics[0].durationMin / 60);
  const mins = item.topics[0].durationMin % 60;
  console.log(`✓ Added Subject: ${item.name.padEnd(12)} -> ${hours}h ${mins ? mins + 'm' : ''}`);
}

const totalHours = Math.floor(totalMinutes / 60);
const remainingMins = totalMinutes % 60;
console.log(`\nSuccessfully uploaded all 7 subjects and ${totalTopics} topics into [${dbName}]:`);
console.log(`Total duration: ${totalHours}h ${remainingMins}m (${totalMinutes} minutes)`);

await mongoose.disconnect();
process.exit(0);
