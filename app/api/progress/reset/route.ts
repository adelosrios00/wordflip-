import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(req: NextRequest) {
  const { studentId, wordGroupId } = await req.json();
  if (!studentId || !wordGroupId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  await prisma.progress.deleteMany({ where: { studentId, wordGroupId } });
  return NextResponse.json({ ok: true });
}
