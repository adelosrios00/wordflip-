import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");
  const wordGroupId = searchParams.get("wordGroupId");

  if (!studentId || !wordGroupId) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const progress = await prisma.progress.findMany({
    where: { studentId, wordGroupId },
    select: { phase: true, wordId: true },
  });

  return NextResponse.json(progress);
}

export async function POST(req: NextRequest) {
  const { studentId, wordGroupId, phase, wordId } = await req.json();

  if (!studentId || !wordGroupId || !phase || !wordId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Avoid upsert (uses transactions, not supported in Neon HTTP)
  const existing = await prisma.progress.findUnique({
    where: { studentId_wordGroupId_phase_wordId: { studentId, wordGroupId, phase, wordId } },
  });

  if (!existing) {
    await prisma.progress.create({
      data: { studentId, wordGroupId, phase, wordId },
    });
  }

  return NextResponse.json({ ok: true });
}
