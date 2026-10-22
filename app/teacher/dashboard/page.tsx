export const dynamic = 'force-dynamic';
import { prisma } from "@/app/lib/prisma";
import { getTeacher } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogoutTeacherButton } from "./LogoutTeacherButton";
import { DuplicateGroupButton } from "./DuplicateGroupButton";
import { PreviewGroupButton } from "./PreviewGroupButton";
import { DeleteGroupButton } from "./DeleteGroupButton";

export default async function TeacherDashboard() {
  const teacher = await getTeacher();
  if (!teacher) redirect("/teacher/login");

  const [classes, wordGroups] = await Promise.all([
    prisma.class.findMany({
      where: { teacherId: teacher.id },
      include: { _count: { select: { students: true, groups: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.wordGroup.findMany({
      where: { OR: [{ teacherId: teacher.id }, { teacherId: null }] },
      orderBy: { order: "asc" },
      include: { _count: { select: { words: true } } },
    }),
  ]);

  const totalStudents = classes.reduce((a, c) => a + c._count.students, 0);

  const LANG_LABELS: Record<string, { code: string; color: string }> = {
    es: { code: "ES", color: "#ef4444" },
    fr: { code: "FR", color: "#3b82f6" },
    la: { code: "LA", color: "#6366f1" },
    de: { code: "DE", color: "#f59e0b" },
    it: { code: "IT", color: "#10b981" },
    pt: { code: "PT", color: "#8b5cf6" },
    en: { code: "EN", color: "#06b6d4" },
  };

  return (
    <main className="min-h-screen" style={{ background: "#f0f4ff" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 45%, #4338ca 100%)" }} className="relative px-6 pt-10 pb-20">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-indigo-300 text-xs font-semibold uppercase tracking-widest mb-1">Teacher Dashboard</p>
              <h1 className="text-2xl font-black text-white uppercase tracking-wide">{teacher.username}</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/" className="text-indigo-300 hover:text-white text-sm font-semibold transition-colors">Home</Link>
              <LogoutTeacherButton />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              {
                value: classes.length,
                label: "Classes",
                icon: (
                  <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                ),
              },
              {
                value: totalStudents,
                label: "Students",
                icon: (
                  <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ),
              },
              {
                value: wordGroups.length,
                label: "Groups",
                icon: (
                  <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                ),
              },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 border border-white/20 rounded-2xl px-3 py-3 text-center">
                <div className="flex justify-center mb-1">{s.icon}</div>
                <p className="text-2xl font-black text-white">{s.value}</p>
                <p className="text-indigo-200 text-xs font-semibold mt-0.5 tracking-wide">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 40" preserveAspectRatio="none">
          <path d="M0,20 C360,40 1080,0 1440,20 L1440,40 L0,40 Z" fill="#f0f4ff" />
        </svg>
      </div>

      <div className="max-w-2xl mx-auto px-5 pb-10" style={{ marginTop: -6 }}>

        {/* Mis clases */}
        <section className="mb-6 pt-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-black text-slate-600 uppercase tracking-widest">My classes</h2>
            <Link
              href="/teacher/classes/new"
              className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all text-sm shadow-sm"
            >
              + New class
            </Link>
          </div>

          {classes.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-indigo-100 rounded-3xl p-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-indigo-300" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <p className="text-slate-400 text-sm font-semibold">No classes yet. Create your first one!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {classes.map((cls) => (
                <Link
                  key={cls.id}
                  href={`/teacher/classes/${cls.id}`}
                  className="group flex items-center justify-between bg-white rounded-2xl px-5 py-4 shadow-sm border border-slate-100 hover:border-indigo-200 hover:shadow-md active:scale-[0.99] transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: "linear-gradient(135deg,#6366f1,#4338ca)" }}>
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-black text-slate-800">{cls.name}</p>
                      <p className="text-slate-400 text-xs mt-0.5 font-medium">
                        {cls._count.students} students · {cls._count.groups} groups assigned
                      </p>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                  </svg>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Grupos de vocabulario */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-black text-slate-600 uppercase tracking-widest">Vocabulary groups</h2>
            <Link
              href="/admin/groups/new"
              className="px-4 py-2 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 active:scale-95 transition-all text-sm shadow-sm"
            >
              + New group
            </Link>
          </div>

          {wordGroups.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-emerald-100 rounded-3xl p-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-emerald-300" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="text-slate-400 text-sm font-semibold">No groups yet. Create the first one!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {wordGroups.map((g) => {
                const lang = LANG_LABELS[g.targetLang];
                return (
                  <div key={g.id} className="group bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-emerald-200 hover:shadow-md transition-all overflow-hidden">
                    <Link href={`/admin/groups/${g.id}`} className="flex items-center justify-between px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
                          style={{ background: g.groupType === "phrases" ? "linear-gradient(135deg,#a78bfa,#7c3aed)" : "linear-gradient(135deg,#60a5fa,#2563eb)" }}
                        >
                          {g.groupType === "phrases" ? (
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-black text-slate-800">{g.name}</p>
                            {lang && (
                              <span className="text-xs font-black px-1.5 py-0.5 rounded-md text-white" style={{ background: lang.color, fontSize: 10 }}>
                                {lang.code}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-400 text-xs mt-0.5 font-medium">
                            {g.groupType === "phrases" ? "Phrases" : "Words"} · {g._count.words} entries
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <PreviewGroupButton groupId={g.id} />
                        <DuplicateGroupButton groupId={g.id} />
                        <DeleteGroupButton groupId={g.id} groupName={g.name} />
                        <svg className="w-4 h-4 text-slate-300 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all ml-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                        </svg>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
