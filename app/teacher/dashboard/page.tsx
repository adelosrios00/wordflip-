export const dynamic = 'force-dynamic';
import { prisma } from "@/app/lib/prisma";
import { getTeacher } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogoutTeacherButton } from "./LogoutTeacherButton";

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
    <main className="max-w-3xl mx-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Panel del Profesor</h1>
          <p className="text-gray-400 mt-1">Bienvenido, {teacher.username}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">← Inicio</Link>
          <LogoutTeacherButton />
        </div>
      </div>

      {/* Classes section */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-700">🏫 Mis clases</h2>
          <Link
            href="/teacher/classes/new"
            className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all"
          >
            + Nueva clase
          </Link>
        </div>

        {classes.length === 0 ? (
          <div className="bg-blue-50 border-2 border-dashed border-blue-200 rounded-2xl p-10 text-center">
            <p className="text-blue-400 text-lg">Todavía no tienes clases. ¡Crea la primera!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {classes.map((cls) => (
              <Link
                key={cls.id}
                href={`/teacher/classes/${cls.id}`}
                className="flex items-center justify-between p-5 bg-white rounded-2xl border-2 border-gray-200 hover:border-blue-400 hover:shadow-sm transition-all group"
              >
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{cls.name}</h3>
                  <p className="text-gray-400 text-sm mt-0.5">
                    {cls._count.students} alumnos · {cls._count.groups} grupos asignados
                  </p>
                </div>
                <span className="text-2xl text-gray-300 group-hover:text-blue-400 group-hover:translate-x-1 transition-all">→</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Word groups section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-700">📚 Grupos de vocabulario</h2>
          <Link
            href="/admin/groups/new"
            className="px-5 py-2 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all"
          >
            + Nuevo grupo
          </Link>
        </div>

        {wordGroups.length === 0 ? (
          <div className="bg-green-50 border-2 border-dashed border-green-200 rounded-2xl p-10 text-center">
            <p className="text-green-400 text-lg">No hay grupos todavía. ¡Crea el primero!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {wordGroups.map((g) => (
              <div
                key={g.id}
                className="flex items-center justify-between p-5 bg-white rounded-2xl border-2 border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    g.groupType === "phrases" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                  }`}>
                    {g.groupType === "phrases" ? "💬 Frases" : "📝 Palabras"}
                  </span>
                  <span className="text-lg font-semibold text-gray-800">{g.name}</span>
                  <span className="text-gray-400 text-sm">{g._count.words} / {g.groupType === "phrases" ? 5 : 10}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
