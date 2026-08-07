import { getStudent } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogoutStudentButton } from "./LogoutStudentButton";

export default async function StudentHome() {
  const student = await getStudent();
  if (!student) redirect("/student/login");
  if (!student.classId) {
    return (
      <main className="max-w-lg mx-auto p-8 pt-16 text-center">
        <div className="text-6xl mb-4">😕</div>
        <h1 className="text-2xl font-bold text-gray-700 mb-3">Sin clase asignada</h1>
        <p className="text-gray-400">Tu profesor todavía no te ha asignado a ninguna clase. Vuelve más tarde.</p>
      </main>
    );
  }

  const cls = await prisma.class.findUnique({
    where: { id: student.classId },
    include: {
      groups: {
        include: {
          wordGroup: {
            include: { _count: { select: { words: true } } },
          },
        },
      },
    },
  });

  if (!cls) redirect("/student/login");

  const progress = await prisma.progress.groupBy({
    by: ["wordGroupId"],
    _count: { _all: true },
    where: { studentId: student.id },
  });

  const progressMap = new Map(progress.map((p) => [p.wordGroupId, p._count._all]));

  function getMastery(wordGroupId: string, wordCount: number) {
    const count = progressMap.get(wordGroupId) ?? 0;
    return Math.min(100, Math.round((count / (wordCount * 5)) * 100));
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Hola, {student.name} 👋</h1>
          <p className="text-gray-400 text-sm mt-0.5">Clase: {cls.name}</p>
        </div>
        <LogoutStudentButton />
      </div>

      {cls.groups.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-gray-400 text-xl">Tu profesor todavía no ha asignado grupos a tu clase.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {cls.groups.map(({ wordGroup: g }) => {
            const mastery = getMastery(g.id, g._count.words);
            const isComplete = mastery >= 100;
            const isStarted = mastery > 0;
            return (
              <Link
                key={g.id}
                href={`/practice/${g.id}`}
                className="block bg-white rounded-2xl border-2 border-gray-200 p-5 hover:border-blue-400 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      g.groupType === "phrases" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {g.groupType === "phrases" ? "💬 Frases" : "📝 Palabras"}
                    </span>
                    <h2 className="text-xl font-bold text-gray-800">{g.name}</h2>
                  </div>
                  <span className={`text-2xl font-bold ${
                    isComplete ? "text-green-600" : isStarted ? "text-blue-600" : "text-gray-300"
                  }`}>
                    {isComplete ? "✅" : `${mastery}%`}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      isComplete ? "bg-green-500" : isStarted ? "bg-blue-500" : "bg-gray-200"
                    }`}
                    style={{ width: `${mastery}%` }}
                  />
                </div>
                <p className="text-gray-400 text-sm mt-2">
                  {isComplete ? "¡Completado! Puedes volver a practicar" : isStarted ? "Continúa practicando" : "Empieza a practicar →"}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
