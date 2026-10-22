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
  if (days < 0) return { label: "Past due", urgent: true };
  if (days === 0) return { label: "Due today", urgent: true };
  if (days === 1) return { label: "Due tomorrow", urgent: true };
  if (days <= 3) return { label: `${days} days`, urgent: true };
  return { label: `${days} days`, urgent: false };
}

export default async function StudentHome() {
  const student = await getStudent();
  if (!student) redirect("/student/login");

  if (!student.classId) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6" style={{ background: "linear-gradient(135deg,#eef2ff 0%,#e0e7ff 100%)" }}>
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-xl font-black text-slate-800 mb-2">No estás en ninguna clase</h1>
          <p className="text-slate-500 text-sm">Tu profesor todavía no te ha asignado a una clase.</p>
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

  const myCompletions = allGroupIds.length > 0
    ? await prisma.groupCompletion.groupBy({
        by: ["wordGroupId"],
        _count: { _all: true },
        where: { studentId: student.id, wordGroupId: { in: allGroupIds } },
      })
    : [];
  const completionsMap = new Map(myCompletions.map((c) => [c.wordGroupId, c._count._all]));
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

  const CARD_COLORS = [
    { bg: "bg-violet-500", light: "bg-violet-50", text: "text-violet-600", bar: "bg-violet-500", border: "border-violet-200" },
    { bg: "bg-blue-500", light: "bg-blue-50", text: "text-blue-600", bar: "bg-blue-500", border: "border-blue-200" },
    { bg: "bg-cyan-500", light: "bg-cyan-50", text: "text-cyan-600", bar: "bg-cyan-500", border: "border-cyan-200" },
    { bg: "bg-pink-500", light: "bg-pink-50", text: "text-pink-600", bar: "bg-pink-500", border: "border-pink-200" },
    { bg: "bg-amber-500", light: "bg-amber-50", text: "text-amber-600", bar: "bg-amber-500", border: "border-amber-200" },
    { bg: "bg-emerald-500", light: "bg-emerald-50", text: "text-emerald-600", bar: "bg-emerald-500", border: "border-emerald-200" },
  ];

  return (
    <main className="min-h-screen" style={{ background: "#f0f4ff" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #312e81 0%, #4338ca 50%, #6366f1 100%)" }} className="relative px-6 pt-10 pb-20">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="inline-block bg-white/20 text-white/90 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-2">
                {cls.name}
              </span>
              <h1 className="text-3xl font-black text-white leading-tight">
                ¡Hola, {student.name}! 👋
              </h1>
            </div>
            <LogoutStudentButton />
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { emoji: "📚", value: cls.groups.length, label: "Sets" },
              { emoji: "⭐", value: completed, label: "Completados" },
              { emoji: "🎯", value: `${overallPct}%`, label: "Progreso" },
            ].map((s) => (
              <div key={s.label} className="bg-white/15 backdrop-blur-sm border border-white/25 rounded-2xl px-3 py-3 text-center">
                <div className="text-xl mb-0.5">{s.emoji}</div>
                <p className="text-xl font-black text-white">{s.value}</p>
                <p className="text-indigo-200 text-xs font-semibold tracking-wide">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Wave bottom */}
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 40" preserveAspectRatio="none">
          <path d="M0,20 C360,40 1080,0 1440,20 L1440,40 L0,40 Z" fill="#f0f4ff" />
        </svg>
      </div>

      <div className="max-w-xl mx-auto px-5 pb-8" style={{ marginTop: -6 }}>

        {cls.groups.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-indigo-100 p-10 text-center mt-4">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-slate-500 font-semibold">Tu profesor todavía no ha asignado ningún set a tu clase.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 pt-2">
            {cls.groups.map(({ wordGroup: g, deadline }, idx) => {
              const mastery = getMastery(student.id, g.id, g._count.words);
              const isComplete = mastery >= 100;
              const isStarted = mastery > 0;
              const dl = deadline ? formatDeadline(new Date(deadline)) : null;
              const timesCompleted = completionsMap.get(g.id) ?? 0;
              const col = isComplete
                ? { bg: "bg-emerald-500", light: "bg-emerald-50", text: "text-emerald-600", bar: "bg-emerald-500", border: "border-emerald-200" }
                : CARD_COLORS[idx % CARD_COLORS.length];

              return (
                <div key={g.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                  <Link href={`/practice/${g.id}`} className="block p-5 group">

                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-2xl ${col.bg} flex items-center justify-center shrink-0 shadow-sm`}>
                        {isComplete ? (
                          <span className="text-xl">🏆</span>
                        ) : g.groupType === "phrases" ? (
                          <span className="text-xl">💬</span>
                        ) : (
                          <span className="text-xl">📖</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h2 className="font-black text-slate-800 text-base leading-tight truncate">{g.name}</h2>
                          <span className={`text-sm font-black shrink-0 ${isComplete ? "text-emerald-500" : isStarted ? col.text : "text-slate-300"}`}>
                            {mastery}%
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1 mb-3">
                          <p className="text-xs text-slate-400 font-medium">
                            {g._count.words} {g.groupType === "phrases" ? "frases" : "palabras"}
                          </p>
                          {timesCompleted > 0 && (
                            <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                              ✓ {timesCompleted}×
                            </span>
                          )}
                          {dl && (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ml-auto ${
                              dl.urgent ? "bg-red-50 text-red-500" : "bg-slate-100 text-slate-400"
                            }`}>
                              {dl.label}
                            </span>
                          )}
                        </div>

                        {/* Progress bar */}
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-2.5 rounded-full transition-all duration-700 ${col.bar}`}
                            style={{ width: `${mastery}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className={`mt-4 w-full py-2.5 rounded-2xl font-bold text-sm text-center transition-all ${
                      isComplete
                        ? "bg-emerald-50 text-emerald-600"
                        : isStarted
                        ? `${col.light} ${col.text}`
                        : "bg-indigo-600 text-white group-hover:bg-indigo-700"
                    }`}>
                      {isComplete ? "🎉 ¡Completado! Repasar" : isStarted ? "▶ Continuar" : "▶ Empezar"}
                    </div>
                  </Link>

                  {isStarted && !isComplete && (
                    <div className="border-t border-slate-100 px-5 py-2.5">
                      <Link
                        href={`/practice/${g.id}?repaso=1`}
                        className="text-xs font-bold text-violet-500 hover:text-violet-700 transition-colors"
                      >
                        ⚡ Repaso rápido — solo palabras pendientes →
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
