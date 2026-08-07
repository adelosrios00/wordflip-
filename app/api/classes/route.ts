import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

function generatePassword(): string {
  const words = ["apple", "beach", "cloud", "dance", "eagle", "flame", "grape", "happy", "island", "lemon", "mango", "night", "ocean", "pizza", "queen", "river", "sugar", "tiger", "ultra", "vivid"];
  const word = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(Math.random() * 900) + 100;
  return `${word}${num}`;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 12);
}

export async function POST(req: NextRequest) {
  try {
    const { name, teacherId, studentNames } = await req.json() as {
      name: string;
      teacherId: string;
      studentNames: string[];
    };

    if (!name || !teacherId || !studentNames?.length) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const cls = await prisma.class.create({
      data: { name, teacherId },
    });

    // Get existing usernames to avoid duplicates
    const existingUsernames = new Set(
      (await prisma.student.findMany({ select: { username: true } }))
        .map((s) => s.username)
        .filter(Boolean) as string[]
    );

    const students = [];
    for (const studentName of studentNames) {
      if (!studentName.trim()) continue;

      let base = slugify(studentName.trim()) || "alumno";
      let username = base;
      let i = 1;
      while (existingUsernames.has(username)) {
        username = `${base}${i++}`;
      }
      existingUsernames.add(username);

      const password = generatePassword();
      const cleanName = studentName.trim();

      const student = await prisma.student.upsert({
        where: { name: cleanName },
        update: { username, password, classId: cls.id },
        create: { name: cleanName, username, password, classId: cls.id },
      });
      students.push({ id: student.id, name: cleanName, username, password });
    }

    return NextResponse.json({ classId: cls.id, students });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const teacherId = req.nextUrl.searchParams.get("teacherId");
  if (!teacherId) return NextResponse.json({ error: "Falta teacherId" }, { status: 400 });

  const classes = await prisma.class.findMany({
    where: { teacherId },
    include: {
      _count: { select: { students: true } },
      groups: { include: { wordGroup: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(classes);
}
