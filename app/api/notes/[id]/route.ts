import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Topic } from "@/lib/models/Topic";
import { deleteFile } from "@/lib/s3";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: noteId } = await ctx.params;
  await connectDB();

  const topic = await Topic.findOne({ "notes._id": noteId });
  if (!topic) return NextResponse.json({ error: "note not found" }, { status: 404 });

  const note = topic.notes.id(noteId);
  if (!note) return NextResponse.json({ error: "note not found" }, { status: 404 });

  try {
    await deleteFile(note.storageKey);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "delete failed" },
      { status: 500 },
    );
  }

  topic.notes.pull({ _id: noteId });
  await topic.save();

  return NextResponse.json({ ok: true });
}
