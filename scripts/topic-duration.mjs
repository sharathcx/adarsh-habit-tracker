/**
 * Inspect and correct topic durations when the course platform re-cuts a unit.
 *
 * Reads and writes the live database directly, so logged study sessions are
 * never touched — unlike POST /api/seed, which wipes them.
 *
 *   node scripts/topic-duration.mjs list   "Data Structures"
 *   node scripts/topic-duration.mjs set    "Data Structures" "Linked List" 3:23:08
 *   node scripts/topic-duration.mjs remove "Data Structures" "Heap Tree"
 *   node scripts/topic-duration.mjs add    "Data Structures" "Heap Tree" 6:18:52 --after "Tree Programming Questions"
 *
 * Durations accept H:MM:SS, H:MM, or a plain minute count. Seconds round the
 * same way lib/seed-data.ts does (>=30s rounds up), so values stay consistent.
 */
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set.\n  PowerShell:  $env:MONGODB_URI=\"mongodb+srv://...\"\n  bash:        export MONGODB_URI='mongodb+srv://...'");
  process.exit(1);
}

const [cmd, subjectName, ...rest] = process.argv.slice(2);
if (!cmd || (cmd !== "databases" && !subjectName)) {
  console.error("usage: topic-duration.mjs databases | list <subject>\n       topic-duration.mjs set <subject> <topic> <duration>\n       topic-duration.mjs add <subject> <topic> <duration> [--after <topic>] [--section <name>]");
  process.exit(1);
}

function parseDuration(raw) {
  if (/^\d+$/.test(raw)) return Number(raw);
  const parts = raw.split(":").map(Number);
  if (parts.some(Number.isNaN) || parts.length < 2 || parts.length > 3) return null;
  const [hh, mm, ss = 0] = parts;
  return hh * 60 + mm + (ss >= 30 ? 1 : 0);
}

const fmt = (min) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
};

await mongoose.connect(uri, { bufferCommands: false });
const db = mongoose.connection.db;

// The connection string may omit the database name, in which case mongoose
// lands on the default and finds nothing. This says where the data actually is.
if (cmd === "databases") {
  const { databases } = await db.admin().listDatabases();
  for (const entry of databases) {
    const target = mongoose.connection.getClient().db(entry.name);
    let names = [];
    try {
      names = (await target.listCollections().toArray()).map((c) => c.name);
    } catch {
      names = ["<no access>"];
    }
    const marker = names.includes("subjects") && names.includes("topics") ? "  <-- app data" : "";
    console.log(`${entry.name.padEnd(20)} ${names.join(", ") || "(empty)"}${marker}`);
  }
  await mongoose.disconnect();
  process.exit(0);
}

const subject = await db.collection("subjects").findOne({ name: subjectName });
if (!subject) {
  const all = await db.collection("subjects").find({}, { projection: { name: 1 } }).toArray();
  console.error(`No subject named "${subjectName}". Available:\n  ${all.map((s) => s.name).join("\n  ")}`);
  await mongoose.disconnect();
  process.exit(1);
}

const topics = await db
  .collection("topics")
  .find({ subjectId: subject._id })
  .sort({ order: 1 })
  .toArray();

const ids = topics.map((t) => t._id);
const logged = await db
  .collection("studysessions")
  .aggregate([{ $match: { topicId: { $in: ids } } }, { $group: { _id: "$topicId", min: { $sum: "$minutes" } } }])
  .toArray();
const loggedByTopic = new Map(logged.map((r) => [String(r._id), r.min]));

if (cmd === "list") {
  let section = null;
  let total = 0;
  let sectionTotal = 0;
  const flushSection = () => {
    if (section !== null) console.log(`${"".padEnd(46)}${("— " + fmt(sectionTotal)).padStart(10)}`);
    sectionTotal = 0;
  };
  for (const t of topics) {
    if (t.section !== section) {
      flushSection();
      section = t.section;
      console.log(`\n  ${String(section ?? "(no section)").toUpperCase()}`);
    }
    const done = loggedByTopic.get(String(t._id)) ?? 0;
    const bar = done >= t.durationMin ? "done" : done > 0 ? `${fmt(done)} in` : "";
    console.log(`    ${t.name.slice(0, 42).padEnd(44)}${fmt(t.durationMin).padStart(8)}  ${bar}`);
    total += t.durationMin;
    sectionTotal += t.durationMin;
  }
  flushSection();
  const doneTotal = [...loggedByTopic.entries()].reduce((s, [id, m]) => {
    const t = topics.find((x) => String(x._id) === id);
    return s + Math.min(m, t?.durationMin ?? 0);
  }, 0);
  console.log(`\n  ${topics.length} topics · ${fmt(total)} total · ${fmt(doneTotal)} done (${((doneTotal / total) * 100).toFixed(0)}%)\n`);
} else if (cmd === "set") {
  const [topicName, rawDuration] = rest;
  if (!topicName || !rawDuration) {
    console.error('usage: topic-duration.mjs set <subject> <topic> <duration>   e.g. "Linked List" 3:23:08');
    await mongoose.disconnect();
    process.exit(1);
  }
  const minutes = parseDuration(rawDuration);
  if (minutes === null || minutes < 1) {
    console.error(`Could not parse duration "${rawDuration}". Use H:MM:SS, H:MM, or minutes.`);
    await mongoose.disconnect();
    process.exit(1);
  }
  const matches = topics.filter((t) => t.name.toLowerCase() === topicName.toLowerCase());
  if (matches.length !== 1) {
    console.error(
      matches.length === 0
        ? `No topic named "${topicName}" in ${subjectName}. Run "list" to see the names.`
        : `"${topicName}" matches ${matches.length} topics; names must be unique to update.`,
    );
    await mongoose.disconnect();
    process.exit(1);
  }
  const topic = matches[0];
  if (topic.durationMin === minutes) {
    console.log(`${topic.name} is already ${fmt(minutes)} — nothing to do.`);
  } else {
    await db.collection("topics").updateOne({ _id: topic._id }, { $set: { durationMin: minutes } });
    const done = loggedByTopic.get(String(topic._id)) ?? 0;
    console.log(`${topic.name}: ${fmt(topic.durationMin)} -> ${fmt(minutes)}`);
    if (done > minutes) console.log(`  note: ${fmt(done)} already logged, so it now reads as complete.`);
  }
} else if (cmd === "remove") {
  const [topicName] = rest;
  if (!topicName) {
    console.error('usage: topic-duration.mjs remove <subject> <topic> [--force]   e.g. "Heap Tree"');
    await mongoose.disconnect();
    process.exit(1);
  }
  const matches = topics.filter((t) => t.name.toLowerCase() === topicName.toLowerCase());
  if (matches.length !== 1) {
    console.error(
      matches.length === 0
        ? `No topic named "${topicName}" in ${subjectName}. Run "list" to see the names.`
        : `"${topicName}" matches ${matches.length} topics; names must be unique to remove.`,
    );
    await mongoose.disconnect();
    process.exit(1);
  }
  const topic = matches[0];
  const notes = topic.notes ?? [];
  const sessionCount = await db.collection("studysessions").countDocuments({ topicId: topic._id });
  const done = loggedByTopic.get(String(topic._id)) ?? 0;

  // Sessions reference the topic by id and notes point at S3 objects; deleting
  // the topic strands both, so make that a deliberate choice rather than a
  // silent side effect.
  if ((sessionCount > 0 || notes.length > 0) && !rest.includes("--force")) {
    console.error(`Refusing to remove "${topic.name}" — it still has data attached:`);
    if (sessionCount > 0) console.error(`  ${sessionCount} study session(s), ${fmt(done)} logged`);
    for (const n of notes) console.error(`  note "${n.filename}" -> ${n.storageKey}`);
    console.error("");
    console.error("Re-run with --force to remove it anyway.");
    await mongoose.disconnect();
    process.exit(1);
  }

  await db.collection("topics").deleteOne({ _id: topic._id });
  console.log(`Removed "${topic.name}" (${fmt(topic.durationMin)}) from ${subjectName}.`);
  if (sessionCount > 0) {
    console.log(`  ${sessionCount} session(s) totalling ${fmt(done)} are now orphaned — they still count`);
    console.log("  toward daily totals and the streak, but show as \"Unknown\" in today's list.");
  }
  for (const n of notes) console.log(`  orphaned S3 object (delete manually): ${n.storageKey}`);
  const remaining = topics.filter((t) => String(t._id) !== String(topic._id));
  const remainingMin = remaining.reduce((sum, t) => sum + t.durationMin, 0);
  console.log(`  ${subjectName} is now ${remaining.length} topics · ${fmt(remainingMin)}`);
} else if (cmd === "add") {
  const flagAt = rest.findIndex((a) => a.startsWith("--"));
  const [topicName, rawDuration] = flagAt === -1 ? rest : rest.slice(0, flagAt);
  const flags = flagAt === -1 ? [] : rest.slice(flagAt);
  const flagValue = (name) => {
    const i = flags.indexOf(name);
    return i === -1 ? undefined : flags[i + 1];
  };
  const afterName = flagValue("--after");
  let section = flagValue("--section");

  if (!topicName || !rawDuration) {
    console.error('usage: topic-duration.mjs add <subject> <topic> <duration> [--after <topic>] [--section <name>]');
    await mongoose.disconnect();
    process.exit(1);
  }
  const minutes = parseDuration(rawDuration);
  if (minutes === null || minutes < 1) {
    console.error(`Could not parse duration "${rawDuration}". Use H:MM:SS, H:MM, or minutes.`);
    await mongoose.disconnect();
    process.exit(1);
  }
  // set/remove match topics by name, so a duplicate would make them ambiguous.
  if (topics.some((t) => t.name.toLowerCase() === topicName.toLowerCase())) {
    console.error(`"${topicName}" already exists in ${subjectName}. Use "set" to change its duration.`);
    await mongoose.disconnect();
    process.exit(1);
  }

  let order;
  if (afterName === undefined) {
    order = topics.length ? topics[topics.length - 1].order + 1 : 1;
    if (section === undefined) section = topics.length ? topics[topics.length - 1].section : null;
  } else {
    const anchors = topics.filter((t) => t.name.toLowerCase() === afterName.toLowerCase());
    if (anchors.length !== 1) {
      console.error(
        anchors.length === 0
          ? `No topic named "${afterName}" in ${subjectName}. Run "list" to see the names.`
          : `"${afterName}" matches ${anchors.length} topics; --after needs a unique name.`,
      );
      await mongoose.disconnect();
      process.exit(1);
    }
    order = anchors[0].order + 1;
    if (section === undefined) section = anchors[0].section;
    // A prior "remove" often leaves the slot free; only shift when it is taken.
    if (topics.some((t) => t.order === order)) {
      await db.collection("topics").updateMany({ subjectId: subject._id, order: { $gte: order } }, { $inc: { order: 1 } });
    }
  }

  const now = new Date();
  await db.collection("topics").insertOne({
    subjectId: subject._id,
    name: topicName,
    durationMin: minutes,
    order,
    section: section ?? null,
    notes: [],
    revisions: [],
    createdAt: now,
    updatedAt: now,
    __v: 0,
  });

  const total = topics.reduce((sum, t) => sum + t.durationMin, 0) + minutes;
  console.log(`Added "${topicName}" (${fmt(minutes)}) to ${subjectName}${section ? ` under ${section}` : ""} at position ${order}.`);
  console.log(`  ${subjectName} is now ${topics.length + 1} topics · ${fmt(total)}`);
} else {
  console.error(`Unknown command "${cmd}". Use "databases", "list", "set", "add" or "remove".`);
  await mongoose.disconnect();
  process.exit(1);
}

await mongoose.disconnect();
