import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getTeacher } from "@/app/lib/auth";

interface Params {
  params: Promise<{ groupId: string }>;
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const teacher = await getTeacher();
  if (!teacher) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { groupId } = await params;
  const classId = req.nextUrl.searchParams.get("classId");

  if (classId) {
    const cls = await prisma.class.findUnique({
      where: { id: classId },
      select: { students: { select: { id: true } } },
    });
    const studentIds = cls?.students.map((s) => s.id) ?? [];
    await prisma.progress.deleteMany({
      where: { wordGroupId: groupId, studentId: { in: studentIds } },
    });
    await prisma.groupCompletion.deleteMany({
      where: { wordGroupId: groupId, studentId: { in: studentIds } },
    });
  } else {
    await prisma.progress.deleteMany({ where: { wordGroupId: groupId } });
    await prisma.groupCompletion.deleteMany({ where: { wordGroupId: groupId } });
  }

  return NextResponse.json({ ok: true });
}
