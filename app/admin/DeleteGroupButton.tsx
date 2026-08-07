"use client";

interface Props {
  groupName: string;
  deleteAction: (formData: FormData) => Promise<void>;
  groupId: string;
}

export function DeleteGroupButton({ groupName, deleteAction, groupId }: Props) {
  return (
    <form action={deleteAction}>
      <input type="hidden" name="id" value={groupId} />
      <button
        type="submit"
        onClick={(e) => {
          if (!confirm(`¿Borrar "${groupName}"?`)) e.preventDefault();
        }}
        className="px-5 py-2 text-lg font-semibold bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all"
      >
        Borrar
      </button>
    </form>
  );
}
