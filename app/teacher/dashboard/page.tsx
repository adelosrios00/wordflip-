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
      orderBy: { order: "asc" },
      include: { _count: { select: { words: true } } },
    }),
  ]);

  const totalStudents = classes.reduce((a, c) => a + c._count.students, 0);

  return (
    <main className="min-h-screen" style={{ background: "#f1f5f9" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1e40af 0%, #2563eb 60%, #3b82f6 100%)" }} className="px-6 pt-10 pb-16">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">Panel del Profesor</p>
              <h1 className="text-3xl font-black text-white capitalize">{teacher.username}</h1>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/" className="text-blue-200 hover:text-white text-sm font-semibold transition-colors">Inicio</Link>
              <LogoutTeacherButton />
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-3 mt-8">
            <div className="flex-1 bg-white/15 backdrop-blur rounded-2xl px-4 py-3 text-center">
              <p className="text-2xl font-black text-white">{classes.length}</p>
              <p className="text-blue-200 text-xs font-semibold mt-0.5">Clases</p>
            </div>
            <div className="flex-1 bg-white/15 backdrop-blur rounded-2xl px-4 py-3 text-center">
              <p className="text-2xl font-black text-white">{totalStudents}</p>
              <p className="text-blue-200 text-xs font-semibold mt-0.5">Alumnos</p>
            </div>
            <div className="flex-1 bg-white/15 backdrop-blur rounded-2xl px-4 py-3 text-center">
              <p className="text-2xl font-black text-white">{wordGroups.length}</p>
              <p className="text-blue-200 text-xs font-semibold mt-0.5">Grupos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content card over header */}
      <div className="max-w-2xl mx-auto px-6" style={{ marginTop: -24 }}>

        {/* Mis clases */}
        <section className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white/70 uppercase tracking-widest">Mis clases</h2>
            <Link
              href="/teacher/classes/new"
              className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all text-sm shadow-sm"
            >
              + Nueva clase
            </Link>
          </div>

          {classes.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center">
              <p className="text-slate-400 text-sm font-semibold">Todavía no tienes clases. ¡Crea la primera!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {classes.map((cls) => (
                <Link
                  key={cls.id}
                  href={`/teacher/classes/${cls.id}`}
                  className="group flex items-center justify-between bg-white rounded-2xl px-5 py-4 shadow-sm border border-slate-100 hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422A12.083 12.083 0 0118.824 20.055 11.952 11.952 0 0112 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{cls.name}</p>
                      <p className="text-slate-400 text-xs mt-0.5">
                        {cls._count.students} alumnos · {cls._count.groups} grupos asignados
                      </p>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                  </svg>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Grupos de vocabulario */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white/70 uppercase tracking-widest">Grupos de vocabulario</h2>
            <Link
              href="/admin/groups/new"
              className="px-4 py-2 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all text-sm shadow-sm"
            >
              + Nuevo grupo
            </Link>
          </div>

          {wordGroups.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center">
              <p className="text-slate-400 text-sm font-semibold">No hay grupos todavía. ¡Crea el primero!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {wordGroups.map((g) => (
                <Link
                  key={g.id}
                  href={`/admin/groups/${g.id}`}
                  className="group flex items-center justify-between bg-white rounded-2xl px-5 py-4 shadow-sm border border-slate-100 hover:border-emerald-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      g.groupType === "phrases" ? "bg-violet-100" : "bg-blue-100"
                    }`}>
                      {g.groupType === "phrases" ? (
                        <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{g.name}</p>
                      <p className="text-slate-400 text-xs mt-0.5">
                        {g.groupType === "phrases" ? "Frases" : "Palabras"} · {g._count.words} entradas
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      g.groupType === "phrases"
                        ? "bg-violet-50 text-violet-600"
                        : "bg-blue-50 text-blue-600"
                    }`}>
                      {g.groupType === "phrases" ? "Frases" : "Palabras"}
                    </span>
                    <PreviewGroupButton groupId={g.id} />
                    <DuplicateGroupButton groupId={g.id} />
                    <DeleteGroupButton groupId={g.id} groupName={g.name} />
                    <svg className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
