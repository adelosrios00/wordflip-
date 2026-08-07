"use client";
import { useRouter } from "next/navigation";

export function LogoutStudentButton() {
  const router = useRouter();
  async function handle() {
    await fetch("/api/student/logout", { method: "POST" });
    router.push("/");
  }
  return (
    <button onClick={handle} className="text-sm text-gray-400 hover:text-red-500 transition-colors">
      Cerrar sesión
    </button>
  );
}
