"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function TeacherSetup() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Las contraseñas no coinciden"); return; }
    if (password.length < 4) { setError("La contraseña debe tener al menos 4 caracteres"); return; }

    setLoading(true);
    const res = await fetch("/api/teacher/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      router.push("/teacher/dashboard");
    } else {
      const d = await res.json();
      setError(d.error || "Error al crear la cuenta");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-3xl shadow-lg p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🔐</div>
          <h1 className="text-3xl font-bold text-gray-800">Crear cuenta</h1>
          <p className="text-gray-400 mt-1">Solo se puede crear una cuenta de profesor</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Nombre de usuario"
            required
            autoFocus
            className="w-full text-xl border-2 border-gray-200 rounded-2xl px-5 py-4 focus:border-purple-500 focus:outline-none bg-gray-50"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            required
            className="w-full text-xl border-2 border-gray-200 rounded-2xl px-5 py-4 focus:border-purple-500 focus:outline-none bg-gray-50"
          />
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repetir contraseña"
            required
            className="w-full text-xl border-2 border-gray-200 rounded-2xl px-5 py-4 focus:border-purple-500 focus:outline-none bg-gray-50"
          />
          {error && <p className="text-red-500 text-center font-semibold">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-purple-600 text-white text-xl font-bold rounded-2xl hover:bg-purple-700 disabled:opacity-50 transition-all mt-2"
          >
            {loading ? "Creando cuenta..." : "Crear cuenta →"}
          </button>
        </form>

        <Link href="/" className="block mt-6 text-center text-gray-400 hover:text-gray-600 text-sm">
          ← Volver al inicio
        </Link>
      </div>
    </main>
  );
}
