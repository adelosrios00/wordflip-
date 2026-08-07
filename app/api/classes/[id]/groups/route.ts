import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: classId } = await params;
  const { wordGroupId } = await req.json();

  await prisma.classWordGroup.upsert({
    where: { classId_wordGroupId: { classId, wordGroupId } },
    update: {},
    create: { classId, wordGroupId },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: classId } = await params;
  const { wordGroupId } = await req.json();

  await prisma.classWordGroup.delete({
    where: { classId_wordGroupId: { classId, wordGroupId } },
  });

  return NextResponse.json({ ok: true });
}
