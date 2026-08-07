import { cookies } from "next/headers";
import { prisma } from "./prisma";

export async function getTeacher() {
  const jar = await cookies();
  const id = jar.get("teacher_session")?.value;
  if (!id) return null;
  return prisma.teacher.findUnique({ where: { id } });
}

export async function getStudent() {
  const jar = await cookies();
  const id = jar.get("student_session")?.value;
  if (!id) return null;
  return prisma.student.findUnique({ where: { id }, include: { class: true } });
}
