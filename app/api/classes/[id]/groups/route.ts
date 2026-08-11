import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getTeacher } from "@/app/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const teacher = await getTeacher();
    if (!teacher) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { id: classId } = await params;
    const { wordGroupId, deadline } = await req.json();

    const existing = await prisma.classWordGroup.findUnique({
      where: { classId_wordGroupId: { classId, wordGroupId } },
    });
    if (!existing) {
      await prisma.classWordGroup.create({
        data: { classId, wordGroupId, deadline: deadline ? new Date(deadline) : null },
      });
    } else if (deadline !== undefined) {
      await prisma.classWordGroup.update({
        where: { classId_wordGroupId: { classId, wordGroupId } },
        data: { deadline: deadline ? new Date(deadline) : null },
      });
    }

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
