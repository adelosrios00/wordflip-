import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getTeacher } from "@/app/lib/auth";

export async function GET() {
  const teacher = await getTeacher();
  if (!teacher) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const groups = await prisma.wordGroup.findMany({
    where: { OR: [{ teacherId: teacher.id }, { teacherId: null }] },
    orderBy: { order: "asc" },
    include: { _count: { select: { words: true } } },
  });
  return NextResponse.json(groups);
}
