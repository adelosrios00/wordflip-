export const dynamic = 'force-dynamic';
import { prisma } from "@/app/lib/prisma";
import { getTeacher } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ClassGroupsManager } from "./ClassGroupsManager";
import { StudentManager } from "./StudentManager";
import { ResetGroupProgressButton } from "./ResetGroupProgressButton";

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
  const deadlines: Record<string, string | null> = {};
  for (const g of cls.groups) {
    deadlines[g.wordGroupId] = g.deadline ? g.deadline.toISOString() : null;
  }

  const allProgress = cls.students.length > 0 && cls.groups.length > 0
    ? await prisma.progress.groupBy({
        by: ["studentId", "wordGroupId"],
        _count: { _all: true },
        where: {
          studentId: { in: cls.students.map((s) => s.id) },
          wordGroupId: { in: cls.groups.map((g) => g.wordGroupId) },
        },
      })
    : [];

  const allCompletions = cls.students.length > 0 && cls.groups.length > 0
    ? await prisma.groupCompletion.groupBy({
        by: ["studentId", "wordGroupId"],
        _count: { _all: true },
        where: {
          studentId: { in: cls.students.map((s) => s.id) },
          wordGroupId: { in: cls.groups.map((g) => g.wordGroupId) },
        },
      })
    : [];

  const progressMap = new Map(allProgress.map((p) => [`${p.studentId}:${p.wordGroupId}`, p._count._all]));
  const completionsMap = new Map(allCompletions.map((c) => [`${c.studentId}:${c.wordGroupId}`, c._count._all]));

  function getMastery(studentId: string, groupId: string, wordCount: number) {
    const count = progressMap.get(`${studentId}:${groupId}`) ?? 0;
    return Math.min(100, Math.round((count / (wordCount * 5)) * 100));
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/teacher/dashboard" className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Clase</p>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">{cls.name}</h1>
          </div>
        </div>
      </div>

      {/* Alumnos */}
      <section className="mb-10">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Alumnos</h2>
        <StudentManager classId={id} initial={cls.students.map((s) => ({
          id: s.id, name: s.name, username: s.username ?? null, password: s.password ?? null,
        }))} />
      </section>

      {/* Resultados */}
      {cls.students.length > 0 && cls.groups.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Resultados</h2>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-3 text-left font-bold text-slate-500">Alumno</th>
                  {cls.groups.map((g) => (
                    <th key={g.wordGroupId} className="px-4 py-3 text-center font-bold text-slate-500 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        {g.wordGroup.name}
                        <ResetGroupProgressButton
                          groupId={g.wordGroupId}
                          groupName={g.wordGroup.name}
                          classId={id}
                        />
                      </span>
                    </th>
                  ))}
                  <th className="px-5 py-3 text-center font-bold text-slate-500">Media</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cls.students.map((s) => {
                  const masteries = cls.groups.map((g) =>
                    getMastery(s.id, g.wordGroupId, g.wordGroup._count.words)
                  );
                  const avg = masteries.length > 0
                    ? Math.round(masteries.reduce((a, b) => a + b, 0) / masteries.length)
                    : 0;
                  return (
                    <tr key={s.id}>
                      <td className="px-5 py-3.5 font-bold text-slate-800 whitespace-nowrap">{s.name}</td>
                      {cls.groups.map((g, i) => {
                        const pct = masteries[i];
                        const times = completionsMap.get(`${s.id}:${g.wordGroupId}`) ?? 0;
                        return (
                          <td key={g.wordGroupId} className="px-4 py-3.5 text-center">
                            <span className={`text-sm font-bold ${
                              pct >= 100 ? "text-emerald-600" : pct > 0 ? "text-blue-600" : "text-slate-300"
                            }`}>
                              {pct >= 100 ? "100%" : pct > 0 ? `${pct}%` : "—"}
                            </span>
                            {times > 0 && (
                              <span className="block text-xs text-emerald-500 font-semibold mt-0.5">
                                {times}×
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center justify-center text-xs font-bold px-2.5 py-1 rounded-full ${
                          avg >= 100 ? "bg-emerald-50 text-emerald-700" :
                          avg > 0 ? "bg-blue-50 text-blue-700" :
                          "bg-slate-100 text-slate-400"
                        }`}>
                          {avg}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Grupos asignados */}
      <section>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Grupos asignados</h2>
        <ClassGroupsManager classId={id} allGroups={allGroups} assignedIds={[...assignedIds]} deadlines={deadlines} />
      </section>
    </main>
  );
}
