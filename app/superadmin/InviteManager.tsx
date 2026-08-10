"use client";

import { useState } from "react";

interface Teacher {
  id: string;
  username: string;
}

export function InviteManager({ teachers }: { teachers: Teacher[] }) {
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  async function generate() {
    setLoading(true);
    setError("");
    setCode(null);
    const res = await fetch("/api/superadmin/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherId: teachers[0]?.id }),
    });
    const d = await res.json();
    if (res.ok) {
      setCode(d.code);
    } else {
      setError(d.error || "Error al generar");
    }
    setLoading(false);
  }

  async function copy() {
    if (!code) return;
    await navigator.clipboard.writeText(`${baseUrl}/teacher/register?code=${code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Generar enlace de acceso</h2>
      <p className="text-slate-500 text-sm mb-5">
        Genera un enlace único para un nuevo profesor. Mándalo por WhatsApp o email al que haya pagado.
      </p>

      <button
        onClick={generate}
        disabled={loading || teachers.length === 0}
        className="px-6 py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all text-sm"
      >
        {loading ? "Generando..." : "Generar nuevo enlace"}
      </button>

      {error && <p className="mt-3 text-red-500 text-sm font-semibold">{error}</p>}

      {code && (
        <div className="mt-5 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Enlace para el profesor</p>
          <div className="flex items-center gap-3">
            <code className="flex-1 text-sm font-bold text-blue-700 break-all">
              {baseUrl}/teacher/register?code={code}
            </code>
            <button
              onClick={copy}
              className={`shrink-0 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                copied ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700 hover:bg-blue-200"
              }`}
            >
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">Este enlace es de un solo uso.</p>
        </div>
      )}
    </div>
  );
}
