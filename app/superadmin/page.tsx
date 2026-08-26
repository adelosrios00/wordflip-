export const dynamic = 'force-dynamic';
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { InviteManager } from "./InviteManager";
import Image from "next/image";
import Link from "next/link";

async function getSuperadmin() {
  const jar = await cookies();
  return jar.get("superadmin_session")?.value === "1";
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "ayer";
  if (days < 7) return `hace ${days} días`;
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export default async function SuperadminPage() {
  const ok = await getSuperadmin();
  if (!ok) redirect("/superadmin/login");

  const [teachers, invites, wordGroupsCount, wordsCount, completionsCount, recentCompletions, allStudents] = await Promise.all([
    prisma.teacher.findMany({
      orderBy: { username: "asc" },
      include: {
        _count: { select: { classes: true } },
        classes: { include: { _count: { select: { students: true } } } },
      },
    }),
    prisma.teacherInvite.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { teacher: { select: { username: true } } },
    }),
    prisma.wordGroup.count(),
    prisma.word.count(),
    prisma.groupCompletion.count(),
    prisma.groupCompletion.findMany({
      orderBy: { completedAt: "desc" },
      take: 20,
    }),
    prisma.student.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        username: true,
        class: {
          select: {
            name: true,
            teacher: { select: { username: true } },
          },
        },
      },
    }),
  ]);

  // Resolve names for activity feed
  const activityStudentIds = [...new Set(recentCompletions.map((c) => c.studentId))];
  const activityGroupIds = [...new Set(recentCompletions.map((c) => c.wordGroupId))];

  const [activityStudentsData, activityGroupsData, studentCompletionCounts] = await Promise.all([
    activityStudentIds.length > 0
      ? prisma.student.findMany({
          where: { id: { in: activityStudentIds } },
          select: { id: true, name: true },
        })
      : Promise.resolve([] as { id: string; name: string }[]),
    activityGroupIds.length > 0
      ? prisma.wordGroup.findMany({
          where: { id: { in: activityGroupIds } },
          select: { id: true, name: true },
        })
      : Promise.resolve([] as { id: string; name: string }[]),
    allStudents.length > 0
      ? prisma.groupCompletion.groupBy({
          by: ["studentId"],
          _count: { _all: true },
          where: { studentId: { in: allStudents.map((s) => s.id) } },
        })
      : Promise.resolve([] as { studentId: string; _count: { _all: number } }[]),
  ]);

  const activityStudentMap = new Map(activityStudentsData.map((s) => [s.id, s.name]));
  const activityGroupMap = new Map(activityGroupsData.map((g) => [g.id, g.name]));
  const completionsPerStudent = new Map(studentCompletionCounts.map((c) => [c.studentId, c._count._all]));

  const totalStudents = teachers.reduce(
    (a, t) => a + t.classes.reduce((b, c) => b + c._count.students, 0),
    0
  );

  return (
    <main className="min-h-screen" style={{ background: "#f1f5f9" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" }} className="px-6 pt-10 pb-16">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Image src="/logo.png" alt="WordFlip" width={48} height={48} style={{ borderRadius: 12 }} />
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">WordFlip</p>
                <h1 className="text-2xl font-black text-white">Panel de administración</h1>
              </div>
            </div>
            <Link href="/" className="text-slate-400 hover:text-white text-sm font-semibold transition-colors">
              Salir
            </Link>
          </div>

          {/* Stats globales */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { value: teachers.length, label: "Profesores" },
              { value: totalStudents, label: "Alumnos" },
              { value: wordGroupsCount, label: "Grupos vocab." },
              { value: wordsCount, label: "Palabras" },
            ].map(({ value, label }) => (
              <div key={label} className="bg-white/10 rounded-2xl px-4 py-3 text-center">
                <p className="text-2xl font-black text-white">{value}</p>
                <p className="text-slate-400 text-xs font-semibold mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="bg-white/10 rounded-2xl px-4 py-3 text-center">
              <p className="text-2xl font-black text-white">{completionsCount}</p>
              <p className="text-slate-400 text-xs font-semibold mt-0.5">Completaciones totales</p>
            </div>
            <div className="bg-white/10 rounded-2xl px-4 py-3 text-center">
              <p className="text-2xl font-black text-white">{invites.filter((i) => !i.usedAt).length}</p>
              <p className="text-slate-400 text-xs font-semibold mt-0.5">Invitaciones pendientes</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6" style={{ marginTop: -24 }}>

        {/* Generar invitación */}
        <div className="mb-4">
          <InviteManager teachers={teachers.map((t) => ({ id: t.id, username: t.username }))} />
        </div>

        {/* Actividad reciente */}
        <section className="mb-4">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Actividad reciente</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {recentCompletions.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8 font-semibold">Sin actividad todavía</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {recentCompletions.map((c) => (
                  <div key={c.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {activityStudentMap.get(c.studentId) ?? "Alumno"}
                        </p>
                        <p className="text-xs text-slate-400">
                          completó <span className="font-semibold text-slate-600">{activityGroupMap.get(c.wordGroupId) ?? "grupo"}</span>
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0 ml-4">{timeAgo(c.completedAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Profesores */}
        <section className="mb-4">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Profesores registrados</h2>
          {teachers.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
              <p className="text-slate-400 text-sm font-semibold">Todavía no hay profesores registrados.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {teachers.map((t) => {
                const students = t.classes.reduce((a, c) => a + c._count.students, 0);
                return (
                  <Link key={t.id} href={`/superadmin/teachers/${t.id}`}
                    className="group bg-white rounded-2xl shadow-sm border border-slate-100 px-5 py-4 flex items-center justify-between hover:border-slate-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                        <span className="text-white font-black text-sm uppercase">{t.username[0]}</span>
                      </div>
                      <div>
                        <p className="font-black text-slate-800">{t.username}</p>
                        <p className="text-slate-400 text-xs mt-0.5">
                          {t._count.classes} clases · {students} alumnos
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-600">Activo</span>
                      <svg className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                      </svg>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Todos los alumnos */}
        <section className="mb-4">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">
            Todos los alumnos
            <span className="ml-2 text-slate-400 font-normal normal-case tracking-normal">({allStudents.length})</span>
          </h2>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-3 text-left font-bold text-slate-500">Alumno</th>
                  <th className="px-5 py-3 text-left font-bold text-slate-500">Usuario</th>
                  <th className="px-5 py-3 text-left font-bold text-slate-500">Clase</th>
                  <th className="px-5 py-3 text-left font-bold text-slate-500">Profesor</th>
                  <th className="px-5 py-3 text-center font-bold text-slate-500">Completaciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-400 text-sm font-semibold">
                      Sin alumnos todavía
                    </td>
                  </tr>
                ) : (
                  allStudents.map((s) => {
                    const completions = completionsPerStudent.get(s.id) ?? 0;
                    return (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3 font-bold text-slate-800 whitespace-nowrap">{s.name}</td>
                        <td className="px-5 py-3 font-mono text-xs text-slate-500">{s.username ?? "—"}</td>
                        <td className="px-5 py-3 text-slate-600 whitespace-nowrap">{s.class?.name ?? "Sin clase"}</td>
                        <td className="px-5 py-3 text-slate-500 whitespace-nowrap">{s.class?.teacher?.username ?? "—"}</td>
                        <td className="px-5 py-3 text-center">
                          {completions > 0 ? (
                            <span className="inline-flex items-center justify-center text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                              {completions}×
                            </span>
                          ) : (
                            <span className="text-slate-300 text-sm">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Historial de invitaciones */}
        <section className="mb-8">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Últimas invitaciones</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-5 py-3 text-left font-bold text-slate-500">Código</th>
                  <th className="px-5 py-3 text-left font-bold text-slate-500">Generado por</th>
                  <th className="px-5 py-3 text-left font-bold text-slate-500">Fecha</th>
                  <th className="px-5 py-3 text-center font-bold text-slate-500">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {invites.map((inv) => (
                  <tr key={inv.id}>
                    <td className="px-5 py-3.5 font-mono font-bold text-blue-700">{inv.code}</td>
                    <td className="px-5 py-3.5 text-slate-600 font-semibold">{inv.teacher.username}</td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs">
                      {new Date(inv.createdAt).toLocaleDateString("es-ES")}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        inv.usedAt
                          ? "bg-slate-100 text-slate-400"
                          : "bg-emerald-50 text-emerald-600"
                      }`}>
                        {inv.usedAt ? "Usado" : "Pendiente"}
                      </span>
                    </td>
                  </tr>
                ))}
                {invites.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-slate-400 text-sm">
                      No hay invitaciones todavía
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
