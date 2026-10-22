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

const CARD_PALETTES = [
  { from: "#6366f1", to: "#4f46e5", bar: "#6366f1", light: "#eef2ff", text: "#4f46e5" },
  { from: "#3b82f6", to: "#2563eb", bar: "#3b82f6", light: "#eff6ff", text: "#2563eb" },
  { from: "#06b6d4", to: "#0891b2", bar: "#06b6d4", light: "#ecfeff", text: "#0891b2" },
  { from: "#f43f5e", to: "#e11d48", bar: "#f43f5e", light: "#fff1f2", text: "#e11d48" },
  { from: "#f59e0b", to: "#d97706", bar: "#f59e0b", light: "#fffbeb", text: "#d97706" },
  { from: "#8b5cf6", to: "#7c3aed", bar: "#8b5cf6", light: "#f5f3ff", text: "#7c3aed" },
];

export default async function StudentHome() {
  const student = await getStudent();
  if (!student) redirect("/student/login");

  if (!student.classId) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6" style={{ background: "linear-gradient(135deg,#eef2ff 0%,#e0e7ff 100%)" }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-black text-slate-800 mb-2">No class assigned</h1>
          <p className="text-slate-500 text-sm">Your teacher hasn&apos;t assigned you to a class yet.</p>
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

  return (
    <main className="min-h-screen" style={{ background: "#f0f4ff" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 45%, #4338ca 100%)" }} className="relative px-6 pt-10 pb-20">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="inline-block bg-white/15 text-indigo-200 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-2">
                {cls.name}
              </span>
              <h1 className="text-3xl font-black text-white leading-tight">
                Hello, {student.name}
              </h1>
            </div>
            <LogoutStudentButton />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              {
                value: cls.groups.length,
                label: "Sets",
                icon: (
                  <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                ),
              },
              {
                value: completed,
                label: "Completed",
                icon: (
                  <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                ),
              },
              {
                value: `${overallPct}%`,
                label: "Progress",
                icon: (
                  <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                ),
              },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 border border-white/20 rounded-2xl px-3 py-3 text-center">
                <div className="flex justify-center mb-1">{s.icon}</div>
                <p className="text-xl font-black text-white">{s.value}</p>
                <p className="text-indigo-200 text-xs font-semibold tracking-wide">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 40" preserveAspectRatio="none">
          <path d="M0,20 C360,40 1080,0 1440,20 L1440,40 L0,40 Z" fill="#f0f4ff" />
        </svg>
      </div>

      <div className="max-w-xl mx-auto px-5 pb-8" style={{ marginTop: -6 }}>

        {cls.groups.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-indigo-100 p-10 text-center mt-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-slate-500 font-semibold">Your teacher hasn&apos;t assigned any sets to your class yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 pt-2">
            {cls.groups.map(({ wordGroup: g, deadline }, idx) => {
              const mastery = getMastery(student.id, g.id, g._count.words);
              const isComplete = mastery >= 100;
              const isStarted = mastery > 0;
              const dl = deadline ? formatDeadline(new Date(deadline)) : null;
              const timesCompleted = completionsMap.get(g.id) ?? 0;
              const pal = isComplete
                ? { from: "#10b981", to: "#059669", bar: "#10b981", light: "#ecfdf5", text: "#059669" }
                : CARD_PALETTES[idx % CARD_PALETTES.length];

              return (
                <div key={g.id} className="anim-card bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden" style={{ animationDelay: `${idx * 80}ms` }}>
                  <Link href={`/practice/${g.id}`} className="block p-5 group">

                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div
                        className="w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
                        style={{ background: `linear-gradient(135deg, ${pal.from}, ${pal.to})`, width: 52, height: 52 }}
                      >
                        {isComplete ? (
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : g.groupType === "phrases" ? (
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h2 className="font-black text-slate-800 text-base leading-tight truncate">{g.name}</h2>
                          <span className="text-sm font-black shrink-0" style={{ color: isStarted || isComplete ? pal.text : "#cbd5e1" }}>
                            {mastery}%
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          <p className="text-xs text-slate-400 font-medium">
                            {g._count.words} {g.groupType === "phrases" ? "phrases" : "words"}
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

                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="anim-bar h-2.5 rounded-full"
                            style={{ width: `${mastery}%`, background: pal.bar, animationDelay: `${idx * 80 + 200}ms` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* CTA */}
                    <div
                      className="mt-4 w-full py-2.5 rounded-2xl font-bold text-sm text-center transition-all flex items-center justify-center gap-2"
                      style={isComplete
                        ? { background: pal.light, color: pal.text }
                        : isStarted
                        ? { background: pal.light, color: pal.text }
                        : { background: `linear-gradient(135deg, ${pal.from}, ${pal.to})`, color: "white" }
                      }
                    >
                      {isComplete ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Completed — Review
                        </>
                      ) : isStarted ? (
                        <>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                          Continue
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                          Start
                        </>
                      )}
                    </div>
                  </Link>

                  {isStarted && !isComplete && (
                    <div className="border-t border-slate-100 px-5 py-2.5">
                      <Link
                        href={`/practice/${g.id}?repaso=1`}
                        className="text-xs font-bold transition-colors flex items-center gap-1.5"
                        style={{ color: pal.text }}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Quick review — pending words only
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
