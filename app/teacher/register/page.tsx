"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const code = params.get("code") ?? "";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!code) setError("Enlace de invitación inválido o incompleto.");
  }, [code]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Las contraseñas no coinciden"); return; }
    if (password.length < 4) { setError("La contraseña debe tener al menos 4 caracteres"); return; }

    setLoading(true);
    const res = await fetch("/api/teacher/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, code }),
    });

    if (res.ok) {
      router.push("/teacher/login");
    } else {
      const d = await res.json();
      setError(d.error || "Error al crear la cuenta");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-7">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">WordFlip</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Crear cuenta de profesor</h1>
          <p className="text-slate-500 text-sm mt-1">Has sido invitado a unirte como profesor</p>
        </div>

        {!code ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
            <p className="text-red-600 text-sm font-medium">Enlace de invitación inválido.</p>
            <p className="text-slate-400 text-xs mt-1">Pide a tu administrador que genere un nuevo enlace.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm">
            <div className="flex items-center gap-2 mb-5 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5">
              <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-emerald-700 text-xs font-medium">Código de invitación válido: <span className="font-bold">{code}</span></p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre de usuario</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="profesor"
                  required
                  autoFocus
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all bg-slate-50 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all bg-slate-50 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Repetir contraseña</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all bg-slate-50 text-sm"
                />
              </div>
              {error && (
                <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-all text-sm mt-1"
              >
                {loading ? "Creando cuenta..." : "Crear cuenta"}
              </button>
            </form>
          </div>
        )}

        <p className="text-center text-slate-400 text-xs mt-6">
          ¿Ya tienes cuenta?{" "}
          <Link href="/teacher/login" className="text-violet-600 hover:underline">Inicia sesión</Link>
        </p>
      </div>
    </main>
  );
}

export default function TeacherRegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
