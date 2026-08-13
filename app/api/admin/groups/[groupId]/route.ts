import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import path from "path";
import fs from "fs/promises";

async function saveImage(file: File): Promise<string> {
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });
  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const bytes = await file.arrayBuffer();
  await fs.writeFile(path.join(uploadDir, filename), Buffer.from(bytes));
  return `/uploads/${filename}`;
}

interface Params {
  params: Promise<{ groupId: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { groupId } = await params;
  const group = await prisma.wordGroup.findUnique({
    where: { id: groupId },
    include: { words: { orderBy: { order: "asc" } } },
  });
  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(group);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { groupId } = await params;
  try {
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const wordCount = parseInt(formData.get("wordCount") as string, 10);

    await prisma.wordGroup.update({ where: { id: groupId }, data: { name } });

    // Delete old words and recreate
    await prisma.word.deleteMany({ where: { groupId } });

    for (let i = 0; i < wordCount; i++) {
      const spanish = formData.get(`word_${i}_spanish`) as string;
      const english = formData.get(`word_${i}_english`) as string;
      const imageFile = formData.get(`word_${i}_image`) as File | null;
      const existingImage = formData.get(`word_${i}_existingImage`) as string | null;

      let imageUrl: string | null = existingImage || null;
      if (imageFile && imageFile.size > 0) {
        imageUrl = await saveImage(imageFile);
      }

      await prisma.word.create({
        data: {
          spanish,
          english,
          imageUrl,
          order: i + 1,
          groupId,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { groupId } = await params;
  // Delete progress, words, class assignments, then the group
  await prisma.progress.deleteMany({ where: { wordGroupId: groupId } });
  await prisma.word.deleteMany({ where: { groupId } });
  await prisma.classWordGroup.deleteMany({ where: { wordGroupId: groupId } });
  await prisma.wordGroup.delete({ where: { id: groupId } });
  return NextResponse.json({ ok: true });
}
