import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Topic } from "@/lib/models/Topic";
import { Subject } from "@/lib/models/Subject";
import { uploadFile, NOTES_PREFIX } from "@/lib/s3";
import { slugify } from "@/lib/slug";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  await connectDB();

  const form = await req.formData();
  const topicId = form.get("topicId");
  const file = form.get("file");

  if (typeof topicId !== "string" || !(file instanceof File)) {
    return NextResponse.json({ error: "missing topicId or file" }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "empty file" }, { status: 400 });
  }

  const topic = await Topic.findById(topicId);
  if (!topic) return NextResponse.json({ error: "topic not found" }, { status: 404 });

  const subject = await Subject.findById(topic.subjectId).lean();
  if (!subject) return NextResponse.json({ error: "subject not found" }, { status: 404 });

  const ext = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "bin";
  const baseName = slugify(file.name.replace(/\.[^.]+$/, "")) || "note";
  const stamped = `${Date.now()}-${baseName}.${ext}`;
  const key = `${NOTES_PREFIX}${slugify(subject.name)}/${slugify(topic.name)}/${stamped}`;

  const arrayBuffer = await file.arrayBuffer();
  const contentType = file.type || "application/octet-stream";

  try {
    await uploadFile(key, arrayBuffer, contentType);

    topic.notes.push({
      filename: file.name,
      storageKey: key,
      contentType,
      sizeBytes: file.size,
      uploadedAt: new Date(),
    });
    await topic.save();

    const newNote = topic.notes[topic.notes.length - 1];
    return NextResponse.json({
      ok: true,
      note: {
        _id: String(newNote._id),
        filename: newNote.filename,
        contentType: newNote.contentType,
        sizeBytes: newNote.sizeBytes,
        uploadedAt: newNote.uploadedAt,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "upload failed" },
      { status: 500 },
    );
  }
}
