import { prisma } from "@/app/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

interface Props {
  params: Promise<{ name: string }>;
}

export default async function StudentPage({ params }: Props) {
  const { name: encodedName } = await params;
  const name = decodeURIComponent(encodedName);

  const student = await prisma.student.findUnique({ where: { name } });
  if (!student) notFound();

  const groups = await prisma.wordGroup.findMany({
    orderBy: { order: "asc" },
  });

  const progressCounts = await prisma.progress.groupBy({
    by: ["wordGroupId"],
    where: { studentId: student.id },
    _count: { _all: true },
  });

  const masteryByGroup = new Map(
    progressCounts.map((p) => [
      p.wordGroupId,
      Math.min(100, Math.round((p._count._all / 50) * 100)),
    ])
  );

  return (
    <main className="max-w-2xl mx-auto p-8">
      <div className="flex items-center justify-between mb-10">
        <Link href="/" className="text-blue-600 text-lg hover:underline">
          ← Cambiar alumno
        </Link>
        <h1 className="text-3xl font-bold text-gray-800">
          Hola, <span className="text-blue-700">{name}</span>! 👋
        </h1>
      </div>

      {groups.length === 0 ? (
        <div className="text-center mt-20">
          <p className="text-2xl text-gray-400">
            El profesor todavía no ha creado grupos de vocabulario.
          </p>
        </div>
      ) : (
        <>
          <h2 className="text-xl font-semibold text-gray-600 mb-5">
            Grupos de vocabulario
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {groups.map((group) => {
              const mastery = masteryByGroup.get(group.id) ?? 0;
              const isComplete = mastery >= 100;
              const isStarted = mastery > 0;

              return (
                <Link
                  key={group.id}
                  href={`/practice/${encodeURIComponent(name)}/${group.id}`}
                  className={`block p-6 rounded-2xl border-2 transition-all hover:shadow-lg hover:-translate-y-0.5 ${
                    isComplete
                      ? "border-green-400 bg-green-50"
                      : isStarted
                        ? "border-blue-300 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-blue-300"
                  }`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold text-gray-800">
                      {group.name}
                    </h3>
                    {isComplete ? (
                      <span className="text-3xl">✅</span>
                    ) : isStarted ? (
                      <span className="text-3xl">📖</span>
                    ) : (
                      <span className="text-3xl">🔒</span>
                    )}
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                    <div
                      className={`h-4 rounded-full transition-all duration-500 ${
                        isComplete ? "bg-green-500" : "bg-blue-500"
                      }`}
                      style={{ width: `${mastery}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center mt-2">
                    <span className="text-base text-gray-500">
                      {isComplete
                        ? "¡Completado!"
                        : isStarted
                          ? "Continuar..."
                          : "Empezar"}
                    </span>
                    <span
                      className={`text-xl font-bold ${
                        isComplete ? "text-green-600" : "text-blue-600"
                      }`}
                    >
                      {mastery}%
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}
