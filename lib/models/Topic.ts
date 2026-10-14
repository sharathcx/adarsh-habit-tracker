import { Schema, model, models, type InferSchemaType, Types } from "mongoose";

const NoteSchema = new Schema(
  {
    filename: { type: String, required: true },
    storageKey: { type: String, required: true },
    contentType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    uploadedAt: { type: Date, required: true, default: Date.now },
  },
  { _id: true },
);

const RevisionSchema = new Schema(
  {
    revisedAt: { type: Date, required: true, default: Date.now },
  },
  { _id: true },
);

const TopicSchema = new Schema(
  {
    subjectId: { type: Types.ObjectId, ref: "Subject", required: true, index: true },
    name: { type: String, required: true },
    durationMin: { type: Number, required: true },
    order: { type: Number, required: true },
    section: { type: String, default: null },
    notes: { type: [NoteSchema], default: [] },
    revisions: { type: [RevisionSchema], default: [] },
  },
  { timestamps: true },
);

export type TopicDoc = InferSchemaType<typeof TopicSchema> & { _id: string };

if (process.env.NODE_ENV !== "production" && models.Topic) {
  delete (models as Record<string, unknown>).Topic;
}
export const Topic = models.Topic || model("Topic", TopicSchema);
