export const dynamic = 'force-dynamic';
import { prisma } from "@/app/lib/prisma";
import { getTeacher } from "@/app/lib/auth";
import { redirect, notFound } from "next/navigation";
import { DemoSession } from "./DemoSession";

interface Props {
  params: Promise<{ groupId: string }>;
}

export default async function DemoPage({ params }: Props) {
  const teacher = await getTeacher();
  if (!teacher) redirect("/teacher/login");

  const { groupId } = await params;

  const group = await prisma.wordGroup.findUnique({
    where: { id: groupId },
    include: { words: { orderBy: { order: "asc" } } },
  });

  if (!group) notFound();

  if (group.words.length === 0) {
    return (
      <main className="max-w-lg mx-auto p-8 text-center mt-20">
        <h1 className="text-2xl font-bold text-gray-700 mb-4">{group.name}</h1>
        <p className="text-xl text-gray-400">This set has no words yet.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-6">
      <DemoSession
        words={group.words.map((w) => ({
          id: w.id,
          spanish: w.spanish,
          english: w.english,
          imageUrl: w.imageUrl ?? null,
        }))}
        groupId={groupId}
        groupName={group.name}
        groupType={group.groupType as "words" | "phrases"}
        targetLang={group.targetLang}
      />
    </main>
  );
}
