import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getStudent } from "@/app/lib/auth";

export async function POST(req: NextRequest) {
  const student = await getStudent();
  if (!student) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { studentId, wordGroupId } = await req.json();
  if (!studentId || !wordGroupId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (student.id !== studentId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  await prisma.groupCompletion.create({ data: { studentId, wordGroupId } });
  return NextResponse.json({ ok: true });
}
