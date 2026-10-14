import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Topic } from "@/lib/models/Topic";
import { getFile } from "@/lib/s3";

export const dynamic = "force-dynamic";

type LeanNote = {
  _id: unknown;
  filename: string;
  storageKey: string;
  contentType: string;
  sizeBytes: number;
  uploadedAt: Date;
};

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: noteId } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const forceDownload = searchParams.get("download") === "1";
  await connectDB();

  const topic = await Topic.findOne({ "notes._id": noteId }).lean<{ notes: LeanNote[] }>();
  if (!topic) return NextResponse.json({ error: "note not found" }, { status: 404 });

  const note = topic.notes.find((n) => String(n._id) === noteId);
  if (!note) return NextResponse.json({ error: "note not found" }, { status: 404 });

  try {
    const buffer = await getFile(note.storageKey);
    if (!buffer) return NextResponse.json({ error: "file missing in storage" }, { status: 404 });

    const disposition = forceDownload ? "attachment" : "inline";
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": note.contentType || "application/octet-stream",
        "Content-Length": String(buffer.length),
        "Content-Disposition": `${disposition}; filename="${encodeURIComponent(note.filename)}"`,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "fetch failed" },
      { status: 500 },
    );
  }
}
