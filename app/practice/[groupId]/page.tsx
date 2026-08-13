export const dynamic = 'force-dynamic';
import { prisma } from "@/app/lib/prisma";
import { getStudent } from "@/app/lib/auth";
import { redirect, notFound } from "next/navigation";
import { PracticeSession } from "./PracticeSession";

interface Props {
  params: Promise<{ groupId: string }>;
}

export default async function PracticePage({ params }: Props) {
  const student = await getStudent();
  if (!student) redirect("/student/login");

  const { groupId } = await params;

  // Verify this group is assigned to the student's class
  if (student.classId) {
    const classGroup = await prisma.classWordGroup.findUnique({
      where: { classId_wordGroupId: { classId: student.classId, wordGroupId: groupId } },
    });
    if (!classGroup) notFound();
  }

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
        targetLang={group.targetLang}
        initialProgress={progress}
      />
    </main>
  );
}
