import { NextResponse } from "next/server";
import { seedDatabase } from "@/lib/seed";

export async function POST() {
  const result = await seedDatabase(true);
  return NextResponse.json(result);
}

