import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { username, password, code } = await req.json();

  if (!username || !password || !code) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  const invite = await prisma.teacherInvite.findUnique({ where: { code } });
  if (!invite) return NextResponse.json({ error: "Código de invitación inválido" }, { status: 400 });
  if (invite.usedAt) return NextResponse.json({ error: "Este enlace ya ha sido usado" }, { status: 400 });

  const existing = await prisma.teacher.findUnique({ where: { username } });
  if (existing) return NextResponse.json({ error: "Ese nombre de usuario ya está en uso" }, { status: 400 });

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.teacher.create({ data: { username, passwordHash } }),
    prisma.teacherInvite.update({ where: { code }, data: { usedAt: new Date() } }),
  ]);

  return NextResponse.json({ ok: true });
}
