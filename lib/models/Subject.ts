import { Schema, model, models, type InferSchemaType } from "mongoose";

const SubjectSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    order: { type: Number, required: true },
    color: { type: String, required: true },
  },
  { timestamps: true },
);

export type SubjectDoc = InferSchemaType<typeof SubjectSchema> & { _id: string };

export const Subject = models.Subject || model("Subject", SubjectSchema);
