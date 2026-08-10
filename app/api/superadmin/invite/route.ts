import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "WF-";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function getSuperadmin() {
  const jar = await cookies();
  return jar.get("superadmin_session")?.value === "1";
}

export async function POST(req: NextRequest) {
  const ok = await getSuperadmin();
  if (!ok) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { teacherId } = await req.json();

  // Buscar cualquier teacher para asociar el invite (usamos el primero si no se especifica)
  let teacher = teacherId
    ? await prisma.teacher.findUnique({ where: { id: teacherId } })
    : await prisma.teacher.findFirst();

  if (!teacher) return NextResponse.json({ error: "No hay profesores en el sistema" }, { status: 400 });

  const code = generateCode();
  await prisma.teacherInvite.create({ data: { code, createdBy: teacher.id } });
  return NextResponse.json({ code });
}

export async function GET() {
  const ok = await getSuperadmin();
  if (!ok) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const invites = await prisma.teacherInvite.findMany({
    orderBy: { createdAt: "desc" },
    include: { teacher: { select: { username: true } } },
  });
  return NextResponse.json(invites);
}
