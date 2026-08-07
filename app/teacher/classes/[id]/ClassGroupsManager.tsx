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

  async function toggle(groupId: string) {
    setLoading(groupId);
    if (assigned.has(groupId)) {
      await fetch(`/api/classes/${classId}/groups`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wordGroupId: groupId }),
      });
      setAssigned((prev) => { const n = new Set(prev); n.delete(groupId); return n; });
    } else {
      await fetch(`/api/classes/${classId}/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wordGroupId: groupId }),
      });
      setAssigned((prev) => new Set([...prev, groupId]));
    }
    setLoading(null);
  }

  if (allGroups.length === 0) {
    return <p className="text-gray-400">No hay grupos de vocabulario todavía.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {allGroups.map((g) => {
        const isAssigned = assigned.has(g.id);
        return (
          <div
            key={g.id}
            className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
              isAssigned ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                g.groupType === "phrases" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
              }`}>
                {g.groupType === "phrases" ? "💬" : "📝"}
              </span>
              <span className="font-semibold text-gray-800">{g.name}</span>
              <span className="text-gray-400 text-sm">{g._count.words} entradas</span>
            </div>
            <button
              onClick={() => toggle(g.id)}
              disabled={loading === g.id}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition-all disabled:opacity-50 ${
                isAssigned
                  ? "bg-red-100 text-red-600 hover:bg-red-200"
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
