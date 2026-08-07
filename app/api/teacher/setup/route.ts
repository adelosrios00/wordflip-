import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const count = await prisma.teacher.count();
  if (count > 0) {
    return NextResponse.json({ error: "Ya existe un profesor" }, { status: 403 });
  }

  const { username, password } = await req.json();
  if (!username || !password || password.length < 4) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const teacher = await prisma.teacher.create({ data: { username, passwordHash } });

  const res = NextResponse.json({ ok: true });
  res.cookies.set("teacher_session", teacher.id, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
    path: "/",
  });
  return res;
}
