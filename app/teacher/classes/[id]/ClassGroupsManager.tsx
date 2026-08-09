"use client";

import { useState } from "react";

interface Group {
  id: string;
  name: string;
  groupType: string;
  _count: { words: number };
}

interface Props {
  classId: string;
  allGroups: Group[];
  assignedIds: string[];
}

export function ClassGroupsManager({ classId, allGroups, assignedIds: initial }: Props) {
  const [assigned, setAssigned] = useState(new Set(initial));
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function toggle(groupId: string) {
    setLoading(groupId);
    setError("");
    const isAssigned = assigned.has(groupId);

    const res = await fetch(`/api/classes/${classId}/groups`, {
      method: isAssigned ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wordGroupId: groupId }),
    });

    if (res.ok) {
      setAssigned((prev) => {
        const n = new Set(prev);
        if (isAssigned) n.delete(groupId);
        else n.add(groupId);
        return n;
      });
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Error al actualizar la asignación");
    }

    setLoading(null);
  }

  if (allGroups.length === 0) {
    return <p className="text-slate-400 text-sm">No hay grupos de vocabulario todavía.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 mb-1">
          {error}
        </p>
      )}
      {allGroups.map((g) => {
        const isAssigned = assigned.has(g.id);
        return (
          <div
            key={g.id}
            className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
              isAssigned ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                g.groupType === "phrases" ? "bg-violet-50 text-violet-600" : "bg-blue-50 text-blue-600"
              }`}>
                {g.groupType === "phrases" ? "Frases" : "Palabras"}
              </span>
              <span className="font-medium text-slate-800 text-sm">{g.name}</span>
              <span className="text-slate-400 text-xs">{g._count.words} entradas</span>
            </div>
            <button
              onClick={() => toggle(g.id)}
              disabled={loading === g.id}
              className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all disabled:opacity-50 ${
                isAssigned
                  ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {loading === g.id ? "..." : isAssigned ? "Quitar" : "Asignar"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
