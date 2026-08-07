import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  const count = await prisma.teacher.count();
  return NextResponse.json({ exists: count > 0 });
}
