"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function TeacherLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [noTeacher, setNoTeacher] = useState(false);

  useEffect(() => {
    fetch("/api/teacher/exists").then((r) => r.json()).then((d) => {
      if (!d.exists) setNoTeacher(true);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/teacher/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      router.push("/teacher/dashboard");
    } else {
      const d = await res.json();
      setError(d.error || "Error al iniciar sesión");
      setLoading(false);
    }
  }

  if (noTeacher) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-3xl shadow-lg p-10 w-full max-w-md text-center">
          <div className="text-6xl mb-4">👨‍🏫</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-3">Bienvenido, profesor</h1>
          <p className="text-gray-500 mb-8">No hay ninguna cuenta creada todavía. Crea la tuya para empezar.</p>
          <Link
            href="/teacher/setup"
            className="block w-full py-4 bg-purple-600 text-white text-xl font-bold rounded-2xl hover:bg-purple-700 transition-all"
          >
            Crear cuenta de profesor →
          </Link>
          <Link href="/" className="block mt-4 text-gray-400 hover:text-gray-600 text-sm">← Volver</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-3xl shadow-lg p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">👨‍🏫</div>
          <h1 className="text-3xl font-bold text-gray-800">Panel del Profesor</h1>
          <p className="text-gray-400 mt-1">Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Usuario"
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
          {error && <p className="text-red-500 text-center font-semibold">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-purple-600 text-white text-xl font-bold rounded-2xl hover:bg-purple-700 disabled:opacity-50 transition-all mt-2"
          >
            {loading ? "Entrando..." : "Entrar →"}
          </button>
        </form>

        <Link href="/" className="block mt-6 text-center text-gray-400 hover:text-gray-600 text-sm">
          ← Volver al inicio
        </Link>
      </div>
    </main>
  );
}
