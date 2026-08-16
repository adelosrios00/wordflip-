"use client";

import { useState } from "react";

interface Student {
  id: string;
  name: string;
  username: string | null;
  password: string | null;
}

interface EditData {
  name: string;
  username: string;
  password: string;
}

export function StudentManager({ classId, initial }: { classId: string; initial: Student[] }) {
  const [students, setStudents] = useState<Student[]>(initial);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editData, setEditData] = useState<EditData>({ name: "", username: "", password: "" });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

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

  function startEdit(s: Student) {
    setEditing(s.id);
    setEditData({ name: s.name, username: s.username ?? "", password: s.password ?? "" });
    setEditError("");
  }

  function cancelEdit() {
    setEditing(null);
    setEditError("");
  }

  async function saveEdit(studentId: string) {
    setSaving(true);
    setEditError("");
    const res = await fetch(`/api/classes/${classId}/students`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, ...editData }),
    });
    const d = await res.json();
    if (res.ok) {
      setStudents((prev) => prev.map((s) => s.id === studentId ? d : s));
      setEditing(null);
    } else {
      setEditError(d.error || "Error al guardar");
    }
    setSaving(false);
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
              {students.map((s) =>
                editing === s.id ? (
                  // ── EDIT ROW ──
                  <tr key={s.id} className="bg-blue-50">
                    <td className="px-3 py-2">
                      <input
                        value={editData.name}
                        onChange={(e) => setEditData((p) => ({ ...p, name: e.target.value }))}
                        className="w-full border border-blue-300 rounded-lg px-2 py-1.5 text-slate-800 font-semibold text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                        placeholder="Nombre"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={editData.username}
                        onChange={(e) => setEditData((p) => ({ ...p, username: e.target.value }))}
                        className="w-full border border-blue-300 rounded-lg px-2 py-1.5 font-mono text-blue-700 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                        placeholder="usuario"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={editData.password}
                        onChange={(e) => setEditData((p) => ({ ...p, password: e.target.value }))}
                        className="w-full border border-blue-300 rounded-lg px-2 py-1.5 font-mono text-emerald-700 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                        placeholder="contraseña"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => saveEdit(s.id)}
                          disabled={saving}
                          className="px-2.5 py-1 bg-blue-600 text-white font-bold rounded-lg text-xs hover:bg-blue-700 disabled:opacity-50 transition-all"
                        >
                          {saving ? "..." : "Guardar"}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-2 py-1 text-slate-400 hover:text-slate-600 font-bold rounded-lg text-xs transition-all"
                        >
                          ✕
                        </button>
                      </div>
                      {editError && <p className="text-red-500 text-xs mt-1 font-semibold">{editError}</p>}
                    </td>
                  </tr>
                ) : (
                  // ── NORMAL ROW ──
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-800">{s.name}</td>
                    <td className="px-5 py-3.5 font-mono text-blue-600 font-bold">{s.username ?? "—"}</td>
                    <td className="px-5 py-3.5 font-mono text-emerald-600 font-bold">{s.password ?? "—"}</td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEdit(s)}
                          className="text-slate-300 hover:text-blue-400 transition-colors"
                          title="Editar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H8v-2.414a2 2 0 01.586-1.414z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => removeStudent(s.id)}
                          disabled={deleting === s.id}
                          className="text-slate-300 hover:text-red-400 transition-colors text-lg leading-none disabled:opacity-50 ml-1"
                          title="Eliminar"
                        >
                          ×
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
