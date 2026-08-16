import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getTeacher } from "@/app/lib/auth";

function makeUsername(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9.]/g, "");
}

function makePassword(): string {
  const words = ["sol","mar","rio","pan","luz","flor","rex","leo","oso","pez"];
  const w1 = words[Math.floor(Math.random() * words.length)];
  const n = Math.floor(Math.random() * 90) + 10;
  return `${w1}${n}`;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const teacher = await getTeacher();
  if (!teacher) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: classId } = await params;
  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls || cls.teacherId !== teacher.id) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });

  const baseUsername = makeUsername(name.trim());
  let username = baseUsername;
  let suffix = 1;
  while (await prisma.student.findUnique({ where: { username } })) {
    username = `${baseUsername}${suffix++}`;
  }

  const password = makePassword();

  const student = await prisma.student.create({
    data: { name: name.trim(), username, password, classId },
  });

  return NextResponse.json({ id: student.id, name: student.name, username, password });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const teacher = await getTeacher();
  if (!teacher) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: classId } = await params;
  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls || cls.teacherId !== teacher.id) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { studentId, name, username, password } = await req.json();
  if (!studentId) return NextResponse.json({ error: "Falta studentId" }, { status: 400 });

  const data: Record<string, string> = {};
  if (name?.trim()) data.name = name.trim();
  if (username?.trim()) data.username = username.trim().toLowerCase().replace(/\s+/g, ".");
  if (password?.trim()) data.password = password.trim();

  try {
    const updated = await prisma.student.update({ where: { id: studentId }, data });
    return NextResponse.json({ id: updated.id, name: updated.name, username: updated.username, password: updated.password });
  } catch {
    return NextResponse.json({ error: "El usuario ya existe" }, { status: 409 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const teacher = await getTeacher();
  if (!teacher) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: classId } = await params;
  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls || cls.teacherId !== teacher.id) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { studentId } = await req.json();
  await prisma.student.delete({ where: { id: studentId } });
  return NextResponse.json({ ok: true });
}
