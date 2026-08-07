"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });

    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      setError("PIN incorrecto. Inténtalo de nuevo.");
      setPin("");
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-3xl shadow-lg p-10 w-full max-w-sm text-center">
        <div className="text-6xl mb-4">🔐</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Panel del Profesor</h1>
        <p className="text-gray-500 mb-8">Introduce el PIN para acceder</p>

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="••••"
            maxLength={8}
            className={`w-full text-center text-4xl font-bold tracking-widest border-4 rounded-2xl px-4 py-4 mb-6 focus:outline-none transition-all ${
              error ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-blue-500"
            }`}
          />

          {error && (
            <p className="text-red-500 font-semibold mb-4">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || pin.length === 0}
            className="w-full text-xl font-bold py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:opacity-40 transition-all"
          >
            {loading ? "Verificando..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
