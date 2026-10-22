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

  const LANG_FLAGS: Record<string, string> = {
    es: "🇪🇸", fr: "🇫🇷", la: "🏛️", de: "🇩🇪", it: "🇮🇹", pt: "🇵🇹", en: "🇬🇧",
  };

  return (
    <main className="min-h-screen" style={{ background: "#f0f4ff" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%)" }} className="relative px-6 pt-10 pb-20">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-indigo-300 text-xs font-semibold uppercase tracking-widest mb-1">Panel del Profesor</p>
              <h1 className="text-2xl font-black text-white uppercase tracking-wide">{teacher.username}</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/" className="text-indigo-300 hover:text-white text-sm font-semibold transition-colors">Inicio</Link>
              <LogoutTeacherButton />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { emoji: "🏫", label: "Clases", value: classes.length },
              { emoji: "👩‍🎓", label: "Alumnos", value: totalStudents },
              { emoji: "📚", label: "Grupos", value: wordGroups.length },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 border border-white/20 backdrop-blur-sm rounded-2xl px-3 py-3.5 text-center">
                <div className="text-xl mb-0.5">{s.emoji}</div>
                <p className="text-2xl font-black text-white">{s.value}</p>
                <p className="text-indigo-200 text-xs font-semibold mt-0.5 tracking-wide">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Wave */}
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 40" preserveAspectRatio="none">
          <path d="M0,20 C360,40 1080,0 1440,20 L1440,40 L0,40 Z" fill="#f0f4ff" />
        </svg>
      </div>

      <div className="max-w-2xl mx-auto px-5 pb-10" style={{ marginTop: -6 }}>

        {/* Mis clases */}
        <section className="mb-6 pt-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-black text-slate-600 uppercase tracking-widest">Mis clases</h2>
            <Link
              href="/teacher/classes/new"
              className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all text-sm shadow-sm"
            >
              + Nueva clase
            </Link>
          </div>

          {classes.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-indigo-100 rounded-3xl p-8 text-center">
              <div className="text-4xl mb-2">🏫</div>
              <p className="text-slate-400 text-sm font-semibold">Todavía no tienes clases. ¡Crea la primera!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {classes.map((cls) => (
                <Link
                  key={cls.id}
                  href={`/teacher/classes/${cls.id}`}
                  className="group flex items-center justify-between bg-white rounded-2xl px-5 py-4 shadow-sm border border-slate-100 hover:border-indigo-300 hover:shadow-md active:scale-[0.99] transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shrink-0 shadow-sm">
                      <span className="text-lg">🏫</span>
                    </div>
                    <div>
                      <p className="font-black text-slate-800">{cls.name}</p>
                      <p className="text-slate-400 text-xs mt-0.5 font-medium">
                        {cls._count.students} alumnos · {cls._count.groups} grupos asignados
                      </p>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
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
            <h2 className="text-xs font-black text-slate-600 uppercase tracking-widest">Grupos de vocabulario</h2>
            <Link
              href="/admin/groups/new"
              className="px-4 py-2 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 active:scale-95 transition-all text-sm shadow-sm"
            >
              + Nuevo grupo
            </Link>
          </div>

          {wordGroups.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-emerald-100 rounded-3xl p-8 text-center">
              <div className="text-4xl mb-2">📚</div>
              <p className="text-slate-400 text-sm font-semibold">No hay grupos todavía. ¡Crea el primero!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {wordGroups.map((g) => (
                <div key={g.id} className="group bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-emerald-200 hover:shadow-md transition-all overflow-hidden">
                  <Link
                    href={`/admin/groups/${g.id}`}
                    className="flex items-center justify-between px-5 py-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                        g.groupType === "phrases"
                          ? "bg-gradient-to-br from-violet-400 to-violet-600"
                          : "bg-gradient-to-br from-blue-400 to-blue-600"
                      }`}>
                        <span className="text-lg">{g.groupType === "phrases" ? "💬" : "📖"}</span>
                      </div>
                      <div>
                        <p className="font-black text-slate-800">{g.name}</p>
                        <p className="text-slate-400 text-xs mt-0.5 font-medium">
                          {LANG_FLAGS[g.targetLang] ?? "🌐"} {g.groupType === "phrases" ? "Frases" : "Palabras"} · {g._count.words} entradas
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <PreviewGroupButton groupId={g.id} />
                      <DuplicateGroupButton groupId={g.id} />
                      <DeleteGroupButton groupId={g.id} groupName={g.name} />
                      <svg className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all ml-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                      </svg>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
