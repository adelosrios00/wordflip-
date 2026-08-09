export const dynamic = 'force-dynamic';
import { prisma } from "@/app/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DeleteGroupButton } from "./DeleteGroupButton";
import { LogoutButton } from "./LogoutButton";

async function deleteGroup(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  await prisma.wordGroup.delete({ where: { id } });
  redirect("/admin");
}

export default async function AdminPage() {
  const groups = await prisma.wordGroup.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { words: true } } },
  });

  return (
    <main className="max-w-2xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Panel del Profesor</h1>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">← Inicio</Link>
          <LogoutButton />
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <Link href="/admin/results" className="flex-1 text-center py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-2xl transition-all">
          📊 Ver resultados de alumnos
        </Link>
      </div>

      <Link
        href="/admin/groups/new"
        className="block w-full text-center text-xl font-bold py-4 mb-8 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-sm"
      >
        + Crear nuevo grupo
      </Link>

      {groups.length === 0 ? (
        <p className="text-center text-gray-400 text-xl mt-12">
          No hay grupos todavía. ¡Crea el primero!
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map((group) => (
            <div
              key={group.id}
              className="flex items-center justify-between p-5 bg-white rounded-2xl border-2 border-gray-200 shadow-sm"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-gray-800">{group.name}</h2>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    group.groupType === "phrases"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-blue-100 text-blue-700"
                  }`}>
                    {group.groupType === "phrases" ? "💬 Frases" : "📝 Palabras"}
                  </span>
                </div>
                <p className="text-gray-500">
                  {group._count.words} / 10
                  {group.groupType === "phrases" ? " frases" : " palabras"}
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  href={`/admin/groups/${group.id}`}
                  className="px-5 py-2 text-lg font-semibold bg-yellow-400 text-yellow-900 rounded-xl hover:bg-yellow-500 transition-all"
                >
                  Editar
                </Link>
                <DeleteGroupButton
                  groupName={group.name}
                  groupId={group.id}
                  deleteAction={deleteGroup}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
