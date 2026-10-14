import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Topic } from "@/lib/models/Topic";

// Append a revision (one "I revised this topic" pass) to a topic.
export async function POST(req: Request) {
  await connectDB();
  const { topicId } = await req.json();

  if (!topicId) {
    return NextResponse.json({ error: "missing topicId" }, { status: 400 });
  }

  const res = await Topic.updateOne(
    { _id: topicId },
    { $push: { revisions: { revisedAt: new Date() } } },
  );

  if (res.matchedCount === 0) {
    return NextResponse.json({ error: "topic not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

// Undo the most recent revision (uncheck the last box).
export async function DELETE(req: Request) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const topicId = searchParams.get("topicId");
  if (!topicId) {
    return NextResponse.json({ error: "missing topicId" }, { status: 400 });
  }

  // $pop with 1 removes the last element of the array — the latest revision.
  const res = await Topic.updateOne({ _id: topicId }, { $pop: { revisions: 1 } });

  if (res.matchedCount === 0) {
    return NextResponse.json({ error: "topic not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
