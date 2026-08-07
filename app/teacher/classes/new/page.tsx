"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface WordGroup {
  id: string;
  name: string;
  groupType: string;
  _count: { words: number };
}

interface GeneratedStudent {
  name: string;
  username: string;
  password: string;
}

export default function NewClassPage() {
  const router = useRouter();
  const [className, setClassName] = useState("");
  const [studentNames, setStudentNames] = useState("");
  const [wordGroups, setWordGroups] = useState<WordGroup[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState<GeneratedStudent[] | null>(null);
  const [classId, setClassId] = useState("");

  useEffect(() => {
    fetch("/api/word-groups").then((r) => r.json()).then(setWordGroups);
  }, []);

  function toggleGroup(id: string) {
    setSelectedGroups((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const names = studentNames.split("\n").map((s) => s.trim()).filter(Boolean);
    if (!className.trim()) { setError("El nombre de la clase es obligatorio"); return; }
    if (names.length === 0) { setError("Añade al menos un alumno"); return; }

    setSaving(true);

    // Get teacherId from session
    const meRes = await fetch("/api/teacher/me");
    const { teacherId } = await meRes.json();

    const res = await fetch("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: className.trim(), teacherId, studentNames: names }),
    });

    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "Error al crear la clase");
      setSaving(false);
      return;
    }

    const { classId: newClassId, students } = await res.json();
    setClassId(newClassId);

    // Assign selected groups
    for (const wordGroupId of selectedGroups) {
      await fetch(`/api/classes/${newClassId}/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wordGroupId }),
      });
    }

    setGenerated(students);
    setSaving(false);
  }

  if (generated) {
    return (
      <main className="max-w-2xl mx-auto p-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">✅</div>
          <h1 className="text-3xl font-bold text-gray-800">¡Clase creada!</h1>
          <p className="text-gray-400 mt-2">Comparte estas credenciales con cada alumno</p>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden mb-6">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-sm font-bold text-gray-500 uppercase">
                <th className="px-5 py-3">Alumno</th>
                <th className="px-5 py-3">Usuario</th>
                <th className="px-5 py-3">Contraseña</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {generated.map((s) => (
                <tr key={s.username}>
                  <td className="px-5 py-4 font-semibold text-gray-800">{s.name}</td>
                  <td className="px-5 py-4 font-mono text-blue-700 font-bold">{s.username}</td>
                  <td className="px-5 py-4 font-mono text-green-700 font-bold">{s.password}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              const text = generated.map((s) => `${s.name}: usuario=${s.username} contraseña=${s.password}`).join("\n");
              navigator.clipboard.writeText(text);
            }}
            className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-all"
          >
            📋 Copiar credenciales
          </button>
          <Link
            href={`/teacher/classes/${classId}`}
            className="flex-1 py-4 bg-blue-600 text-white font-bold text-center rounded-2xl hover:bg-blue-700 transition-all"
          >
            Ver clase →
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Nueva clase</h1>
        <Link href="/teacher/dashboard" className="text-gray-400 hover:text-gray-600">← Cancelar</Link>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Class name */}
        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-2">Nombre de la clase</label>
          <input
            type="text"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="Ej: 3ºA Inglés, Grupo Avanzado..."
            required
            className="w-full text-xl border-2 border-gray-200 rounded-2xl px-5 py-4 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Students */}
        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-2">
            Alumnos <span className="text-gray-400 font-normal text-base">(uno por línea)</span>
          </label>
          <textarea
            value={studentNames}
            onChange={(e) => setStudentNames(e.target.value)}
            placeholder={"María García\nJuan Pérez\nLaura Martínez"}
            rows={6}
            className="w-full text-lg border-2 border-gray-200 rounded-2xl px-5 py-4 focus:border-blue-500 focus:outline-none resize-none font-mono"
          />
          <p className="text-gray-400 text-sm mt-1">
            Se generará automáticamente usuario y contraseña para cada alumno
          </p>
        </div>

        {/* Word groups */}
        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-3">
            Grupos de vocabulario <span className="text-gray-400 font-normal text-base">(opcional, puedes añadir después)</span>
          </label>
          {wordGroups.length === 0 ? (
            <p className="text-gray-400">No hay grupos todavía. <Link href="/admin/groups/new" className="text-blue-600 underline">Crear uno</Link></p>
          ) : (
            <div className="flex flex-col gap-2">
              {wordGroups.map((g) => (
                <label
                  key={g.id}
                  className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedGroups.has(g.id)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedGroups.has(g.id)}
                    onChange={() => toggleGroup(g.id)}
                    className="w-5 h-5 accent-blue-600"
                  />
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    g.groupType === "phrases" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                  }`}>
                    {g.groupType === "phrases" ? "💬" : "📝"}
                  </span>
                  <span className="font-semibold text-gray-800">{g.name}</span>
                  <span className="text-gray-400 text-sm ml-auto">{g._count.words} entradas</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-red-500 font-semibold text-center">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-5 bg-blue-600 text-white text-xl font-bold rounded-2xl hover:bg-blue-700 disabled:opacity-50 transition-all"
        >
          {saving ? "Creando clase..." : "Crear clase y generar credenciales →"}
        </button>
      </form>
    </main>
  );
}
