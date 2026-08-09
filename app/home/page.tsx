export const dynamic = 'force-dynamic';
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
      <main className="max-w-lg mx-auto px-6 py-20 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
          <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-800 mb-2">Sin clase asignada</h1>
        <p className="text-slate-500 text-sm">Tu profesor todavía no te ha asignado a ninguna clase. Vuelve más tarde.</p>
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
    <main className="max-w-xl mx-auto px-5 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">{cls.name}</p>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Hola, {student.name}</h1>
        </div>
        <LogoutStudentButton />
      </div>

      {cls.groups.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
          <p className="text-slate-400 text-sm">Tu profesor todavía no ha asignado grupos a tu clase.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {cls.groups.map(({ wordGroup: g }) => {
            const mastery = getMastery(g.id, g._count.words);
            const isComplete = mastery >= 100;
            const isStarted = mastery > 0;
            return (
              <Link
                key={g.id}
                href={`/practice/${g.id}`}
                className="block bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      g.groupType === "phrases"
                        ? "bg-violet-50 text-violet-600"
                        : "bg-blue-50 text-blue-600"
                    }`}>
                      {g.groupType === "phrases" ? "Frases" : "Palabras"}
                    </span>
                    <h2 className="font-semibold text-slate-800">{g.name}</h2>
                  </div>
                  <span className={`text-sm font-bold ${
                    isComplete ? "text-emerald-600" : isStarted ? "text-blue-600" : "text-slate-300"
                  }`}>
                    {isComplete ? "Completado" : `${mastery}%`}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      isComplete ? "bg-emerald-500" : isStarted ? "bg-blue-500" : "bg-slate-200"
                    }`}
                    style={{ width: `${mastery}%` }}
                  />
                </div>
                <p className="text-slate-400 text-xs mt-2.5">
                  {isComplete
                    ? "Puedes volver a practicar"
                    : isStarted
                    ? "Continúa practicando"
                    : "Empieza a practicar"}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
