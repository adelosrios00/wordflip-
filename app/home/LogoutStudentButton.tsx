"use client";
import { useRouter } from "next/navigation";

export function LogoutStudentButton() {
  const router = useRouter();
  async function handle() {
    await fetch("/api/student/logout", { method: "POST" });
    router.push("/");
  }
  return (
    <button onClick={handle} className="text-sm text-blue-200 hover:text-white font-semibold transition-colors">
      Cerrar sesión
    </button>
  );
}
