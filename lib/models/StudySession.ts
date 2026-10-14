import { Schema, model, models, type InferSchemaType, Types } from "mongoose";

const StudySessionSchema = new Schema(
  {
    topicId: { type: Types.ObjectId, ref: "Topic", required: true, index: true },
    minutes: { type: Number, required: true, min: 1 },
    completedAt: { type: Date, required: true, default: Date.now, index: true },
  },
  { timestamps: true },
);

export type StudySessionDoc = InferSchemaType<typeof StudySessionSchema> & { _id: string };

export const StudySession = models.StudySession || model("StudySession", StudySessionSchema);
