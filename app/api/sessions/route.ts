import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { StudySession } from "@/lib/models/StudySession";
import { Topic } from "@/lib/models/Topic";

export async function POST(req: Request) {
  await connectDB();
  const { topicId, minutes } = await req.json();

  if (!topicId || typeof minutes !== "number" || minutes <= 0) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const topic = await Topic.findById(topicId).lean();
  if (!topic) return NextResponse.json({ error: "topic not found" }, { status: 404 });

  const doc = await StudySession.create({
    topicId,
    minutes,
    completedAt: new Date(),
  });

  return NextResponse.json({ ok: true, id: String(doc._id) });
}

export async function DELETE(req: Request) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  await StudySession.deleteOne({ _id: id });
  return NextResponse.json({ ok: true });
}
