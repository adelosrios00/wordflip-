import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getTeacher } from "@/app/lib/auth";
import path from "path";
import fs from "fs/promises";

async function saveImage(file: File): Promise<string> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(file.name, file, { access: "public" });
    return blob.url;
  }
  // Local dev: save to filesystem
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });
  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const bytes = await file.arrayBuffer();
  await fs.writeFile(path.join(uploadDir, filename), Buffer.from(bytes));
  return `/uploads/${filename}`;
}

export async function POST(req: NextRequest) {
  try {
    const teacher = await getTeacher();
    if (!teacher) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const formData = await req.formData();
    const name = formData.get("name") as string;
    const groupType = (formData.get("type") as string) || "words";
    const targetLang = (formData.get("targetLang") as string) || "en";
    const wordCount = parseInt(formData.get("wordCount") as string, 10);

    const lastGroup = await prisma.wordGroup.findFirst({
      where: { teacherId: teacher.id },
      orderBy: { order: "desc" },
    });
    const nextOrder = (lastGroup?.order ?? 0) + 1;

    const group = await prisma.wordGroup.create({
      data: { name, groupType, targetLang, order: nextOrder, teacherId: teacher.id },
    });

    for (let i = 0; i < wordCount; i++) {
      const spanish = formData.get(`word_${i}_spanish`) as string;
      const english = formData.get(`word_${i}_english`) as string;
      const imageFile = formData.get(`word_${i}_image`) as File | null;

      let imageUrl: string | null = null;
      if (imageFile && imageFile.size > 0) {
        imageUrl = await saveImage(imageFile);
      }

      await prisma.word.create({
        data: { spanish, english, imageUrl, order: i + 1, groupId: group.id },
      });
    }

    return NextResponse.json({ id: group.id });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ error: err.message ?? "Error al crear el grupo" }, { status: 500 });
  }
}
