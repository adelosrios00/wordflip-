import { NextResponse } from "next/server";
import { getTeacher } from "@/app/lib/auth";

export async function GET() {
  const teacher = await getTeacher();
  if (!teacher) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  return NextResponse.json({ teacherId: teacher.id, username: teacher.username });
}
