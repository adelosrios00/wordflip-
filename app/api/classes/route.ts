import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getTeacher } from "@/app/lib/auth";

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
    const teacher = await getTeacher();
    if (!teacher) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { name, studentNames } = await req.json() as {
      name: string;
      teacherId?: string;
      studentNames: string[];
    };

    if (!name || !studentNames?.length) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const cls = await prisma.class.create({
      data: { name, teacherId: teacher.id },
    });

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

      // Neon HTTP no soporta upsert — findUnique + create/update
      const existing = await prisma.student.findUnique({ where: { name: cleanName } });
      let student;
      if (existing) {
        student = await prisma.student.update({
          where: { name: cleanName },
          data: { username, password, classId: cls.id },
        });
      } else {
        student = await prisma.student.create({
          data: { name: cleanName, username, password, classId: cls.id },
        });
      }
      students.push({ id: student.id, name: cleanName, username, password });
    }

    return NextResponse.json({ classId: cls.id, students });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  const teacher = await getTeacher();
  if (!teacher) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const classes = await prisma.class.findMany({
    where: { teacherId: teacher.id },
    include: {
      _count: { select: { students: true } },
      groups: { include: { wordGroup: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(classes);
}
