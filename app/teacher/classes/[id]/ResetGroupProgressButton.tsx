"use client";
import { useRouter } from "next/navigation";

export function ResetGroupProgressButton({
  groupId,
  groupName,
  classId,
}: {
  groupId: string;
  groupName: string;
  classId: string;
}) {
  const router = useRouter();

  async function handleReset() {
    const confirmed = confirm(
      `Reset all progress for "${groupName}"?\n\nThis will clear progress for every student in this class. It cannot be undone.`
    );
    if (!confirmed) return;

    await fetch(`/api/admin/groups/${groupId}/reset-progress?classId=${classId}`, {
      method: "DELETE",
    });
    router.refresh();
  }

  return (
    <button
      onClick={handleReset}
      title="Reset progress for this group"
      className="ml-1 text-slate-300 hover:text-red-500 transition-colors"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    </button>
  );
}
