"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DuplicateGroupButton({ groupId }: { groupId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function duplicate() {
    setLoading(true);
    await fetch(`/api/admin/groups/${groupId}/duplicate`, { method: "POST" });
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={duplicate}
      disabled={loading}
      title="Duplicar grupo"
      className="p-1.5 text-slate-300 hover:text-blue-500 transition-colors disabled:opacity-50"
    >
      {loading ? (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
}
