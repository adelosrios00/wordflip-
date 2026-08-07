import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  const groups = await prisma.wordGroup.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { words: true } } },
  });
  return NextResponse.json(groups);
}
