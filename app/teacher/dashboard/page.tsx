export const dynamic = 'force-dynamic';
import { prisma } from "@/app/lib/prisma";
import { getTeacher } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogoutTeacherButton } from "./LogoutTeacherButton";
import { InviteButton } from "./InviteButton";

export default async function TeacherDashboard() {
  const teacher = await getTeacher();
  if (!teacher) redirect("/teacher/login");

  const [classes, wordGroups] = await Promise.all([
    prisma.class.findMany({
      where: { teacherId: teacher.id },
      include: {
        _count: { select: { students: true, groups: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.wordGroup.findMany({
      orderBy: { order: "asc" },
      include: { _count: { select: { words: true } } },
    }),
  ]);

  return (
    <main className="max-w-2xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Panel del Profesor</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{teacher.username}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">Inicio</Link>
          <LogoutTeacherButton />
        </div>
      </div>

      <section className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-700">Invitar otro profesor</h2>
        </div>
        <InviteButton />
      </section>

      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-700">Mis clases</h2>
          <Link
            href="/teacher/classes/new"
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all text-sm"
          >
            + Nueva clase
          </Link>
        </div>

        {classes.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center">
            <p className="text-slate-400 text-sm">Todavía no tienes clases. ¡Crea la primera!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {classes.map((cls) => (
              <Link
                key={cls.id}
                href={`/teacher/classes/${cls.id}`}
                className="flex items-center justify-between px-5 py-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all group"
              >
                <div>
                  <p className="font-semibold text-slate-800">{cls.name}</p>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {cls._count.students} alumnos · {cls._count.groups} grupos
                  </p>
                </div>
                <svg className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-700">Grupos de vocabulario</h2>
          <Link
            href="/admin/groups/new"
            className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-all text-sm"
          >
            + Nuevo grupo
          </Link>
        </div>

        {wordGroups.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center">
            <p className="text-slate-400 text-sm">No hay grupos todavía. ¡Crea el primero!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {wordGroups.map((g) => (
              <div
                key={g.id}
                className="flex items-center justify-between px-5 py-4 bg-white rounded-xl border border-slate-200"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    g.groupType === "phrases"
                      ? "bg-violet-50 text-violet-600"
                      : "bg-blue-50 text-blue-600"
                  }`}>
                    {g.groupType === "phrases" ? "Frases" : "Palabras"}
                  </span>
                  <span className="font-medium text-slate-800">{g.name}</span>
                </div>
                <span className="text-slate-400 text-xs">
                  {g._count.words} / {g.groupType === "phrases" ? 5 : 10}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
