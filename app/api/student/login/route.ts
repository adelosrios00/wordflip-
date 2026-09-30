import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (!username || !password) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const student = await prisma.student.findUnique({ where: { username } });
  if (!student) {
    return NextResponse.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 });
  }

  const storedPassword = student.password ?? "";
  let valid = false;

  if (storedPassword.startsWith("$2")) {
    // Contraseña ya hasheada con bcrypt
    valid = await bcrypt.compare(password, storedPassword);
  } else {
    // Contraseña en texto plano (legacy) — comparar y migrar a hash
    valid = storedPassword === password;
    if (valid) {
      const hashed = await bcrypt.hash(password, 10);
      await prisma.student.update({ where: { id: student.id }, data: { password: hashed } });
    }
  }

  if (!valid) {
    return NextResponse.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("student_session", student.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });
  return res;
}
