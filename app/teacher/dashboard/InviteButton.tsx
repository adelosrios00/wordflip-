"use client";

import { useState } from "react";

export function InviteButton() {
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    const res = await fetch("/api/teacher/invite", { method: "POST" });
    const { code } = await res.json();
    const url = `${window.location.origin}/teacher/register?code=${code}`;
    setLink(url);
    setLoading(false);
  }

  async function copy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      {!link ? (
        <button
          onClick={generate}
          disabled={loading}
          className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 disabled:opacity-50 transition-all text-sm"
        >
          {loading ? "Generando..." : "Generar enlace de invitación"}
        </button>
      ) : (
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
          <p className="text-xs text-slate-500 truncate flex-1 font-mono">{link}</p>
          <button
            onClick={copy}
            className="shrink-0 text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors"
          >
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
      )}
    </div>
  );
}
