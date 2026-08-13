"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteGroupButton({ groupId, groupName }: { groupId: string; groupName: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`Delete "${groupName}"? This will remove all words and student progress for this group.`)) return;
    setLoading(true);
    await fetch(`/api/admin/groups/${groupId}`, { method: "DELETE" });
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(); }}
      disabled={loading}
      title="Delete group"
      className="p-1.5 text-slate-300 hover:text-red-500 transition-colors disabled:opacity-50"
    >
      {loading ? (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      )}
    </button>
  );
}
