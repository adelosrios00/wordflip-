export const dynamic = 'force-dynamic';
import { getTeacher } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ResultsPage() {
  const teacher = await getTeacher();
  if (!teacher) redirect("/teacher/login");

  const teacherClasses = await prisma.class.findMany({
    where: { teacherId: teacher.id },
    select: { id: true },
  });
  const classIds = teacherClasses.map((c) => c.id);

  const [students, groups] = await Promise.all([
    prisma.student.findMany({
      where: { classId: { in: classIds } },
      orderBy: { name: "asc" },
    }),
    prisma.wordGroup.findMany({
      where: { OR: [{ teacherId: teacher.id }, { teacherId: null }] },
      orderBy: { order: "asc" },
      include: { _count: { select: { words: true } } },
    }),
  ]);

  const allProgress = await prisma.progress.groupBy({
    by: ["studentId", "wordGroupId"],
    _count: { _all: true },
  });

  const progressMap = new Map(
    allProgress.map((p) => [`${p.studentId}:${p.wordGroupId}`, p._count._all])
  );

  function getMastery(studentId: string, groupId: string, wordCount: number) {
    const count = progressMap.get(`${studentId}:${groupId}`) ?? 0;
    return Math.min(100, Math.round((count / (wordCount * 5)) * 100));
  }

  return (
    <main className="max-w-4xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Student results</h1>
        <Link href="/teacher/dashboard" className="text-gray-500 hover:text-gray-700">← Dashboard</Link>
      </div>

      {students.length === 0 ? (
        <p className="text-center text-gray-400 text-xl mt-12">No students yet.</p>
      ) : (
        <div className="flex flex-col gap-8">
          {students.map((student) => {
            const total = groups.length;
            const completed = groups.filter(
              (g) => getMastery(student.id, g.id, g._count.words) >= 100
            ).length;

            return (
              <div key={student.id} className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-800">{student.name}</h2>
                  <span className="text-base font-semibold text-gray-500">
                    {completed} / {total} groups completed
                  </span>
                </div>

                {groups.length === 0 ? (
                  <p className="p-6 text-gray-400">No groups yet.</p>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm font-semibold text-gray-400 uppercase tracking-wide">
                        <th className="px-6 py-3">Group</th>
                        <th className="px-6 py-3">Type</th>
                        <th className="px-6 py-3">Progress</th>
                        <th className="px-6 py-3 text-right">%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {groups.map((group) => {
                        const mastery = getMastery(student.id, group.id, group._count.words);
                        const isComplete = mastery >= 100;
                        const isStarted = mastery > 0;
                        return (
                          <tr key={group.id}>
                            <td className="px-6 py-4 font-semibold text-gray-800">{group.name}</td>
                            <td className="px-6 py-4">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                group.groupType === "phrases"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}>
                                {group.groupType === "phrases" ? "Phrases" : "Words"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="w-full bg-gray-100 rounded-full h-3 max-w-xs">
                                <div
                                  className={`h-3 rounded-full transition-all ${
                                    isComplete ? "bg-green-500" : isStarted ? "bg-blue-500" : "bg-gray-200"
                                  }`}
                                  style={{ width: `${mastery}%` }}
                                />
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className={`text-lg font-bold ${
                                isComplete ? "text-green-600" : isStarted ? "text-blue-600" : "text-gray-300"
                              }`}>
                                {isComplete ? "✅ 100%" : `${mastery}%`}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
