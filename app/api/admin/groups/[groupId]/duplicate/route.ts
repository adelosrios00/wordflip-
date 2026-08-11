import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getTeacher } from "@/app/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  const teacher = await getTeacher();
  if (!teacher) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { groupId } = await params;

  const original = await prisma.wordGroup.findUnique({
    where: { id: groupId },
    include: { words: { orderBy: { order: "asc" } } },
  });

  if (!original) return NextResponse.json({ error: "Grupo no encontrado" }, { status: 404 });

  const last = await prisma.wordGroup.findFirst({ orderBy: { order: "desc" } });
  const nextOrder = (last?.order ?? 0) + 1;

  const newGroup = await prisma.wordGroup.create({
    data: {
      name: `${original.name} (copia)`,
      groupType: original.groupType,
      targetLang: original.targetLang,
      order: nextOrder,
    },
  });

  for (const word of original.words) {
    await prisma.word.create({
      data: {
        spanish: word.spanish,
        english: word.english,
        imageUrl: word.imageUrl,
        order: word.order,
        groupId: newGroup.id,
      },
    });
  }

  return NextResponse.json({ id: newGroup.id, name: newGroup.name });
}
