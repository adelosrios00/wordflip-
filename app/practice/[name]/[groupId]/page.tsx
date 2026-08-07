import { prisma } from "@/app/lib/prisma";
import { notFound } from "next/navigation";
import { PracticeSession } from "./PracticeSession";

interface Props {
  params: Promise<{ name: string; groupId: string }>;
}

export default async function PracticePage({ params }: Props) {
  const { name: encodedName, groupId } = await params;
  const name = decodeURIComponent(encodedName);

  const [student, group] = await Promise.all([
    prisma.student.findUnique({ where: { name } }),
    prisma.wordGroup.findUnique({
      where: { id: groupId },
      include: { words: { orderBy: { order: "asc" } } },
    }),
  ]);

  if (!student || !group) notFound();
  if (group.words.length === 0) {
    return (
      <main className="max-w-lg mx-auto p-8 text-center mt-20">
        <h1 className="text-2xl font-bold text-gray-700 mb-4">{group.name}</h1>
        <p className="text-xl text-gray-400">Este grupo no tiene palabras todavía.</p>
      </main>
    );
  }

  const progress = await prisma.progress.findMany({
    where: { studentId: student.id, wordGroupId: groupId },
    select: { phase: true, wordId: true },
  });

  return (
    <main className="min-h-screen bg-gray-50 py-6">
      <PracticeSession
        words={group.words.map((w) => ({
          id: w.id,
          spanish: w.spanish,
          english: w.english,
          imageUrl: w.imageUrl ?? null,
        }))}
        studentId={student.id}
        groupId={groupId}
        groupName={group.name}
        groupType={group.groupType as "words" | "phrases"}
        encodedName={encodedName}
        initialProgress={progress}
      />
    </main>
  );
}
