import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getTeacher } from "@/app/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const teacher = await getTeacher();
  if (!teacher) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: classId } = await params;
  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      students: { orderBy: { name: "asc" } },
      groups: { include: { wordGroup: { include: { _count: { select: { words: true } } } } } },
    },
  });

  if (!cls || cls.teacherId !== teacher.id) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const allProgress = cls.students.length > 0 && cls.groups.length > 0
    ? await prisma.progress.groupBy({
        by: ["studentId", "wordGroupId"],
        _count: { _all: true },
        where: {
          studentId: { in: cls.students.map((s) => s.id) },
          wordGroupId: { in: cls.groups.map((g) => g.wordGroupId) },
        },
      })
    : [];

  const progressMap = new Map(allProgress.map((p) => [`${p.studentId}:${p.wordGroupId}`, p._count._all]));

  function getMastery(studentId: string, wordGroupId: string, wordCount: number) {
    const count = progressMap.get(`${studentId}:${wordGroupId}`) ?? 0;
    return Math.min(100, Math.round((count / (wordCount * 5)) * 100));
  }

  const groupNames = cls.groups.map((g) => g.wordGroup.name);
  const header = ["Alumno", "Usuario", ...groupNames, "Media"].join(",");

  const rows = cls.students.map((s) => {
    const masteries = cls.groups.map((g) => getMastery(s.id, g.wordGroupId, g.wordGroup._count.words));
    const avg = masteries.length > 0
      ? Math.round(masteries.reduce((a, b) => a + b, 0) / masteries.length)
      : 0;
    return [s.name, s.username ?? "", ...masteries.map((m) => `${m}%`), `${avg}%`].join(",");
  });

  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${cls.name}-resultados.csv"`,
    },
  });
}
