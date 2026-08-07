"use client";
import { useRouter } from "next/navigation";

export function LogoutTeacherButton() {
  const router = useRouter();
  async function handle() {
    await fetch("/api/teacher/logout", { method: "POST" });
    router.push("/");
  }
  return (
    <button onClick={handle} className="text-sm text-gray-400 hover:text-red-500 transition-colors">
      Cerrar sesión
    </button>
  );
}
