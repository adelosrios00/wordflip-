"use client";

import { useState } from "react";

interface Student {
  id: string;
  name: string;
  username: string | null;
  password: string | null;
}

export function StudentManager({ classId, initial }: { classId: string; initial: Student[] }) {
  const [students, setStudents] = useState<Student[]>(initial);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  async function addStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    setError("");
    const res = await fetch(`/api/classes/${classId}/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    const d = await res.json();
    if (res.ok) {
      setStudents((prev) => [...prev, d]);
      setNewName("");
    } else {
      setError(d.error || "Error al añadir alumno");
    }
    setAdding(false);
  }

  async function removeStudent(studentId: string) {
    if (!confirm("¿Eliminar este alumno? Se perderá todo su progreso.")) return;
    setDeleting(studentId);
    await fetch(`/api/classes/${classId}/students`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId }),
    });
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    setDeleting(null);
  }

  return (
    <div>
      {/* Formulario añadir */}
      <form onSubmit={addStudent} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nombre completo del alumno"
          className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none text-sm bg-slate-50"
        />
        <button
          type="submit"
          disabled={adding}
          className="px-4 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all text-sm"
        >
          {adding ? "..." : "+ Añadir"}
        </button>
      </form>
      {error && <p className="text-red-500 text-sm mb-3 font-semibold">{error}</p>}

      {students.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center">
          <p className="text-slate-400 text-sm font-semibold">Todavía no hay alumnos. ¡Añade el primero!</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-5 py-3 text-left font-bold text-slate-500">Alumno</th>
                <th className="px-5 py-3 text-left font-bold text-slate-500">Usuario</th>
                <th className="px-5 py-3 text-left font-bold text-slate-500">Contraseña</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-slate-800">{s.name}</td>
                  <td className="px-5 py-3.5 font-mono text-blue-600 font-bold">{s.username ?? "—"}</td>
                  <td className="px-5 py-3.5 font-mono text-emerald-600 font-bold">{s.password ?? "—"}</td>
                  <td className="px-3 py-3.5">
                    <button
                      onClick={() => removeStudent(s.id)}
                      disabled={deleting === s.id}
                      className="text-slate-300 hover:text-red-400 transition-colors text-lg leading-none disabled:opacity-50"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
