import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getTeacher } from "@/app/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const teacher = await getTeacher();
    if (!teacher) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { id: classId } = await params;
    const { wordGroupId } = await req.json();

    await prisma.classWordGroup.upsert({
      where: { classId_wordGroupId: { classId, wordGroupId } },
      update: {},
      create: { classId, wordGroupId },
    });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const teacher = await getTeacher();
    if (!teacher) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { id: classId } = await params;
    const { wordGroupId } = await req.json();

    await prisma.classWordGroup.delete({
      where: { classId_wordGroupId: { classId, wordGroupId } },
    });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
