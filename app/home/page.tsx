export const dynamic = 'force-dynamic';
import { getStudent } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogoutStudentButton } from "./LogoutStudentButton";

function formatDeadline(deadline: Date): { label: string; urgent: boolean } {
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: "Plazo vencido", urgent: true };
  if (days === 0) return { label: "Vence hoy", urgent: true };
  if (days === 1) return { label: "Vence mañana", urgent: true };
  if (days <= 3) return { label: `${days} días`, urgent: true };
  return { label: `${days} días`, urgent: false };
}

export default async function StudentHome() {
  const student = await getStudent();
  if (!student) redirect("/student/login");

  if (!student.classId) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6" style={{ background: "#f1f5f9" }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-200 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-black text-slate-800 mb-2">Sin clase asignada</h1>
          <p className="text-slate-500 text-sm">Tu profesor todavía no te ha asignado a ninguna clase.</p>
        </div>
      </main>
    );
  }

  const cls = await prisma.class.findUnique({
    where: { id: student.classId },
    include: {
      students: { orderBy: { name: "asc" } },
      groups: {
        include: { wordGroup: { include: { _count: { select: { words: true } } } } },
      },
    },
  });

  if (!cls) redirect("/student/login");

  const allStudentIds = cls.students.map((s) => s.id);
  const allGroupIds = cls.groups.map((g) => g.wordGroupId);

  const allProgress = allStudentIds.length > 0 && allGroupIds.length > 0
    ? await prisma.progress.groupBy({
        by: ["studentId", "wordGroupId"],
        _count: { _all: true },
        where: { studentId: { in: allStudentIds }, wordGroupId: { in: allGroupIds } },
      })
    : [];

  const progressMap = new Map(allProgress.map((p) => [`${p.studentId}:${p.wordGroupId}`, p._count._all]));

  function getMastery(studentId: string, wordGroupId: string, wordCount: number) {
    const count = progressMap.get(`${studentId}:${wordGroupId}`) ?? 0;
    return Math.min(100, Math.round((count / (wordCount * 5)) * 100));
  }

  const myMasteries = cls.groups.map(({ wordGroup: g }) => getMastery(student.id, g.id, g._count.words));
  const completed = myMasteries.filter((m) => m >= 100).length;
  const overallPct = myMasteries.length > 0
    ? Math.round(myMasteries.reduce((a, b) => a + b, 0) / myMasteries.length)
    : 0;

  // Ranking
  const ranking = cls.students.map((s) => {
    const masteries = cls.groups.map(({ wordGroup: g }) => getMastery(s.id, g.id, g._count.words));
    const avg = masteries.length > 0
      ? Math.round(masteries.reduce((a, b) => a + b, 0) / masteries.length)
      : 0;
    return { id: s.id, name: s.name, avg };
  }).sort((a, b) => b.avg - a.avg);

  return (
    <main className="min-h-screen" style={{ background: "#f1f5f9" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1e40af 0%, #2563eb 60%, #3b82f6 100%)" }} className="px-6 pt-10 pb-16">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">{cls.name}</p>
              <h1 className="text-3xl font-black text-white">Hola, {student.name}</h1>
            </div>
            <LogoutStudentButton />
          </div>

          <div className="flex gap-3 mt-8">
            <div className="flex-1 bg-white/15 backdrop-blur rounded-2xl px-4 py-3 text-center">
              <p className="text-2xl font-black text-white">{cls.groups.length}</p>
              <p className="text-blue-200 text-xs font-semibold mt-0.5">Grupos</p>
            </div>
            <div className="flex-1 bg-white/15 backdrop-blur rounded-2xl px-4 py-3 text-center">
              <p className="text-2xl font-black text-white">{completed}</p>
              <p className="text-blue-200 text-xs font-semibold mt-0.5">Completados</p>
            </div>
            <div className="flex-1 bg-white/15 backdrop-blur rounded-2xl px-4 py-3 text-center">
              <p className="text-2xl font-black text-white">{overallPct}%</p>
              <p className="text-blue-200 text-xs font-semibold mt-0.5">Progreso</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6" style={{ marginTop: -24 }}>
        {cls.groups.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 text-center">
            <p className="text-slate-400 text-sm font-semibold">Tu profesor todavía no ha asignado grupos a tu clase.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-4">
            {cls.groups.map(({ wordGroup: g, deadline }) => {
              const mastery = getMastery(student.id, g.id, g._count.words);
              const isComplete = mastery >= 100;
              const isStarted = mastery > 0;
              const dl = deadline ? formatDeadline(new Date(deadline)) : null;

              return (
                <div key={g.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <Link
                    href={`/practice/${g.id}`}
                    className="block p-5 hover:bg-slate-50 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isComplete ? "bg-emerald-100" : isStarted ? "bg-blue-100" : "bg-slate-100"
                        }`}>
                          {isComplete ? (
                            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : g.groupType === "phrases" ? (
                            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <h2 className="font-black text-slate-800">{g.name}</h2>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {g.groupType === "phrases" ? "Frases" : "Palabras"} · {g._count.words} entradas
                          </p>
                        </div>
                      </div>
                      <span className={`text-sm font-black ${
                        isComplete ? "text-emerald-600" : isStarted ? "text-blue-600" : "text-slate-300"
                      }`}>
                        {mastery}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-700 ${
                          isComplete ? "bg-emerald-500" : isStarted ? "bg-blue-500" : "bg-slate-200"
                        }`}
                        style={{ width: `${mastery}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <p className={`text-xs font-semibold ${
                        isComplete ? "text-emerald-500" : isStarted ? "text-blue-500" : "text-slate-400"
                      }`}>
                        {isComplete ? "Completado" : isStarted ? "Continúa practicando" : "Empieza a practicar"}
                      </p>
                      {dl && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          dl.urgent ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500"
                        }`}>
                          {dl.label}
                        </span>
                      )}
                    </div>
                  </Link>

                  {/* Repaso rápido — solo si hay progreso pero no está al 100% */}
                  {isStarted && !isComplete && (
                    <div className="border-t border-slate-100 px-5 py-2.5">
                      <Link
                        href={`/practice/${g.id}?repaso=1`}
                        className="text-xs font-bold text-violet-600 hover:text-violet-800 transition-colors"
                      >
                        Repaso rápido — solo palabras pendientes →
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Ranking de clase */}
        {ranking.length > 1 && (
          <section className="mb-8">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Ranking de la clase</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              {ranking.map((s, i) => {
                const isMe = s.id === student.id;
                const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
                return (
                  <div
                    key={s.id}
                    className={`flex items-center justify-between px-5 py-3.5 ${
                      isMe ? "bg-blue-50 border-l-4 border-blue-500" : ""
                    } ${i < ranking.length - 1 ? "border-b border-slate-50" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 text-sm font-bold w-5">
                        {medal ?? `${i + 1}`}
                      </span>
                      <span className={`font-bold text-sm ${isMe ? "text-blue-700" : "text-slate-700"}`}>
                        {s.name} {isMe && <span className="text-blue-400 font-normal">(tú)</span>}
                      </span>
                    </div>
                    <span className={`font-black text-sm ${
                      s.avg >= 100 ? "text-emerald-600" : s.avg > 0 ? "text-blue-600" : "text-slate-300"
                    }`}>
                      {s.avg}%
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
