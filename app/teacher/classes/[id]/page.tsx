import { prisma } from "@/app/lib/prisma";
import { getTeacher } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ClassGroupsManager } from "./ClassGroupsManager";

export default async function ClassPage({ params }: { params: Promise<{ id: string }> }) {
  const teacher = await getTeacher();
  if (!teacher) redirect("/teacher/login");

  const { id } = await params;

  const [cls, allGroups] = await Promise.all([
    prisma.class.findUnique({
      where: { id },
      include: {
        students: { orderBy: { name: "asc" } },
        groups: { include: { wordGroup: { include: { _count: { select: { words: true } } } } } },
      },
    }),
    prisma.wordGroup.findMany({
      orderBy: { order: "asc" },
      include: { _count: { select: { words: true } } },
    }),
  ]);

  if (!cls || cls.teacherId !== teacher.id) redirect("/teacher/dashboard");

  const assignedIds = new Set(cls.groups.map((g) => g.wordGroupId));

  // Get progress per student per group
  const allProgress = await prisma.progress.groupBy({
    by: ["studentId", "wordGroupId"],
    _count: { _all: true },
    where: {
      studentId: { in: cls.students.map((s) => s.id) },
      wordGroupId: { in: cls.groups.map((g) => g.wordGroupId) },
    },
  });

  const progressMap = new Map(
    allProgress.map((p) => [`${p.studentId}:${p.wordGroupId}`, p._count._all])
  );

  return (
    <main className="max-w-3xl mx-auto p-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/teacher/dashboard" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-3xl font-bold text-gray-800">{cls.name}</h1>
      </div>

      {/* Student credentials */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-700 mb-4">🎒 Alumnos y credenciales</h2>
        <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-sm font-bold text-gray-500 uppercase">
                <th className="px-5 py-3">Alumno</th>
                <th className="px-5 py-3">Usuario</th>
                <th className="px-5 py-3">Contraseña</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cls.students.map((s) => (
                <tr key={s.id}>
                  <td className="px-5 py-4 font-semibold text-gray-800">{s.name}</td>
                  <td className="px-5 py-4 font-mono text-blue-700 font-bold">{s.username ?? "—"}</td>
                  <td className="px-5 py-4 font-mono text-green-700 font-bold">{s.password ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Assigned groups */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-700 mb-4">📚 Grupos asignados</h2>
        <ClassGroupsManager classId={id} allGroups={allGroups} assignedIds={[...assignedIds]} />
      </section>

      {/* Results */}
      {cls.groups.length > 0 && cls.students.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-gray-700 mb-4">📊 Resultados</h2>
          <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left text-sm font-bold text-gray-500 uppercase">
                  <th className="px-5 py-3">Alumno</th>
                  {cls.groups.map((g) => (
                    <th key={g.wordGroupId} className="px-4 py-3 text-center">{g.wordGroup.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cls.students.map((s) => (
                  <tr key={s.id}>
                    <td className="px-5 py-4 font-semibold text-gray-800">{s.name}</td>
                    {cls.groups.map((g) => {
                      const count = progressMap.get(`${s.id}:${g.wordGroupId}`) ?? 0;
                      const total = g.wordGroup._count.words * 5;
                      const pct = total > 0 ? Math.min(100, Math.round((count / total) * 100)) : 0;
                      return (
                        <td key={g.wordGroupId} className="px-4 py-4 text-center">
                          <span className={`text-lg font-bold ${
                            pct >= 100 ? "text-green-600" : pct > 0 ? "text-blue-600" : "text-gray-300"
                          }`}>
                            {pct >= 100 ? "✅" : `${pct}%`}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
