export const dynamic = 'force-dynamic';
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import Link from "next/link";

async function getSuperadmin() {
  const jar = await cookies();
  return jar.get("superadmin_session")?.value === "1";
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "hace un momento";
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "ayer";
  if (days < 30) return `hace ${days} días`;
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

export default async function TeacherDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ok = await getSuperadmin();
  if (!ok) redirect("/superadmin/login");

  const { id } = await params;

  const teacher = await prisma.teacher.findUnique({
    where: { id },
    include: {
      classes: {
        orderBy: { name: "asc" },
        include: {
          students: { orderBy: { name: "asc" } },
          groups: {
            include: {
              wordGroup: { include: { _count: { select: { words: true } } } },
            },
          },
        },
      },
      wordGroups: {
        orderBy: { order: "asc" },
        include: { _count: { select: { words: true } } },
      },
    },
  });

  if (!teacher) redirect("/superadmin");

  const totalStudents = teacher.classes.reduce((a, c) => a + c.students.length, 0);

  // Progress summary per student per group
  const allStudentIds = teacher.classes.flatMap((c) => c.students.map((s) => s.id));
  const allGroupIds = teacher.classes.flatMap((c) => c.groups.map((g) => g.wordGroupId));

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

  return (
    <main className="min-h-screen" style={{ background: "#f1f5f9" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" }} className="px-6 pt-10 pb-16">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/superadmin" className="text-slate-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
              </svg>
            </Link>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Profesor</p>
              <h1 className="text-2xl font-black text-white capitalize">{teacher.username}</h1>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 bg-white/10 rounded-2xl px-4 py-3 text-center">
              <p className="text-2xl font-black text-white">{teacher.classes.length}</p>
              <p className="text-slate-400 text-xs font-semibold mt-0.5">Clases</p>
            </div>
            <div className="flex-1 bg-white/10 rounded-2xl px-4 py-3 text-center">
              <p className="text-2xl font-black text-white">{totalStudents}</p>
              <p className="text-slate-400 text-xs font-semibold mt-0.5">Alumnos</p>
            </div>
            <div className="flex-1 bg-white/10 rounded-2xl px-4 py-3 text-center">
              <p className="text-2xl font-black text-white">{teacher.wordGroups.length}</p>
              <p className="text-slate-400 text-xs font-semibold mt-0.5">Grupos</p>
            </div>
          </div>

          {/* Last login */}
          <div className="mt-4 flex items-center gap-2 text-slate-400 text-xs">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {teacher.lastLoginAt
              ? `Última conexión: ${timeAgo(teacher.lastLoginAt)} · ${teacher.lastLoginAt.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}`
              : "Sin conexiones registradas"}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6" style={{ marginTop: -24 }}>

        {/* Clases */}
        {teacher.classes.length > 0 ? (
          teacher.classes.map((cls) => (
            <section key={cls.id} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">{cls.name}</h2>
                <span className="text-xs text-slate-400">· {cls.students.length} alumnos · {cls.groups.length} grupos</span>
              </div>

              {cls.students.length > 0 && cls.groups.length > 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto shadow-sm">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-5 py-3 text-left font-bold text-slate-500">Alumno</th>
                        {cls.groups.map((g) => (
                          <th key={g.wordGroupId} className="px-4 py-3 text-center font-bold text-slate-500 whitespace-nowrap text-xs">
                            {g.wordGroup.name}
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
                            <td className="px-5 py-3 font-semibold text-slate-800 whitespace-nowrap">{s.name}</td>
                            {masteries.map((pct, i) => (
                              <td key={i} className="px-4 py-3 text-center">
                                <span className={`text-sm font-bold ${
                                  pct >= 100 ? "text-emerald-600" : pct > 0 ? "text-blue-600" : "text-slate-300"
                                }`}>
                                  {pct > 0 ? `${pct}%` : "—"}
                                </span>
                              </td>
                            ))}
                            <td className="px-5 py-3 text-center">
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
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
                  <p className="text-slate-400 text-sm">
                    {cls.students.length === 0 ? "Sin alumnos" : "Sin grupos asignados"}
                  </p>
                </div>
              )}
            </section>
          ))
        ) : (
          <section className="mb-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
              <p className="text-slate-400 text-sm font-semibold">Este profesor no tiene clases todavía.</p>
            </div>
          </section>
        )}

        {/* Grupos de vocabulario */}
        {teacher.wordGroups.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Grupos de vocabulario</h2>
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              {teacher.wordGroups.map((g, i) => (
                <div key={g.id} className={`flex items-center justify-between px-5 py-3.5 ${i > 0 ? "border-t border-slate-100" : ""}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      g.groupType === "phrases" ? "bg-violet-100" : "bg-blue-100"
                    }`}>
                      <svg className={`w-3.5 h-3.5 ${g.groupType === "phrases" ? "text-violet-600" : "text-blue-600"}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        {g.groupType === "phrases"
                          ? <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          : <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                        }
                      </svg>
                    </div>
                    <span className="font-semibold text-slate-800 text-sm">{g.name}</span>
                  </div>
                  <span className="text-xs text-slate-400">{g._count.words} {g.groupType === "phrases" ? "frases" : "palabras"}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
