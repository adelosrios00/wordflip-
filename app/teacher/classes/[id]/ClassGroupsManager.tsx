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
  deadlines: Record<string, string | null>;
}

export function ClassGroupsManager({ classId, allGroups, assignedIds: initial, deadlines: initialDeadlines }: Props) {
  const [assigned, setAssigned] = useState(new Set(initial));
  const [deadlines, setDeadlines] = useState<Record<string, string | null>>(initialDeadlines);
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

  async function setDeadline(groupId: string, deadline: string | null) {
    setLoading(`dl-${groupId}`);
    const res = await fetch(`/api/classes/${classId}/groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wordGroupId: groupId, deadline }),
    });
    if (res.ok) {
      setDeadlines((prev) => ({ ...prev, [groupId]: deadline }));
    }
    setLoading(null);
  }

  if (allGroups.length === 0) {
    return <p className="text-slate-400 text-sm">No hay grupos de vocabulario todavía.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
          {error}
        </p>
      )}
      {allGroups.map((g) => {
        const isAssigned = assigned.has(g.id);
        const dl = deadlines[g.id];
        return (
          <div
            key={g.id}
            className={`rounded-2xl border transition-all ${
              isAssigned ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  g.groupType === "phrases" ? "bg-violet-50 text-violet-600" : "bg-blue-50 text-blue-600"
                }`}>
                  {g.groupType === "phrases" ? "Frases" : "Palabras"}
                </span>
                <span className="font-bold text-slate-800 text-sm">{g.name}</span>
                <span className="text-slate-400 text-xs">{g._count.words} entradas</span>
              </div>
              <button
                onClick={() => toggle(g.id)}
                disabled={loading === g.id}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all disabled:opacity-50 ${
                  isAssigned
                    ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {loading === g.id ? "..." : isAssigned ? "Quitar" : "Asignar"}
              </button>
            </div>

            {/* Fecha límite (solo si asignado) */}
            {isAssigned && (
              <div className="flex items-center gap-3 px-4 pb-3 border-t border-blue-100 pt-2">
                <span className="text-xs font-bold text-slate-500">Fecha límite:</span>
                <input
                  type="date"
                  value={dl ? dl.slice(0, 10) : ""}
                  onChange={(e) => setDeadline(g.id, e.target.value || null)}
                  className="text-xs border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:border-blue-400 outline-none bg-white"
                />
                {dl && (
                  <button
                    onClick={() => setDeadline(g.id, null)}
                    className="text-xs text-slate-400 hover:text-red-400 transition-colors"
                  >
                    Sin límite
                  </button>
                )}
                {loading === `dl-${g.id}` && <span className="text-xs text-slate-400">Guardando...</span>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
