"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type GroupType = "words" | "phrases";

interface WordEntry {
  spanish: string;
  english: string;
  image: File | null;
  imagePreview: string | null;
}

function emptyWord(): WordEntry {
  return { spanish: "", english: "", image: null, imagePreview: null };
}

export default function NewGroupPage() {
  const router = useRouter();
  const [groupType, setGroupType] = useState<GroupType>("words");
  const [groupName, setGroupName] = useState("");
  const [words, setWords] = useState<WordEntry[]>(Array.from({ length: 10 }, emptyWord));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const slots = groupType === "words" ? 10 : 5;
  const isWords = groupType === "words";

  function handleTypeChange(t: GroupType) {
    setGroupType(t);
    // Reset slots to match new type
    setWords(Array.from({ length: t === "words" ? 10 : 5 }, emptyWord));
  }

  function updateWord(index: number, field: keyof WordEntry, value: string | File | null) {
    setWords((prev) => {
      const next = [...prev];
      if (field === "image" && value instanceof File) {
        next[index] = { ...next[index], image: value, imagePreview: URL.createObjectURL(value) };
      } else {
        next[index] = { ...next[index], [field]: value };
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const filled = words.filter((w) => w.spanish.trim() && w.english.trim());
    if (!groupName.trim()) { setError("El nombre del grupo es obligatorio."); return; }
    if (filled.length === 0) { setError("Añade al menos una entrada."); return; }

    setSaving(true);
    const formData = new FormData();
    formData.append("name", groupName.trim());
    formData.append("type", groupType);
    formData.append("wordCount", String(filled.length));
    filled.forEach((w, i) => {
      formData.append(`word_${i}_spanish`, w.spanish.trim());
      formData.append(`word_${i}_english`, w.english.trim());
      if (w.image) formData.append(`word_${i}_image`, w.image);
    });

    const res = await fetch("/api/admin/groups", { method: "POST", body: formData });
    if (res.ok) { router.push("/admin"); }
    else { const d = await res.json(); setError(d.error || "Error al guardar"); setSaving(false); }
  }

  return (
    <main className="max-w-3xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Nuevo grupo</h1>
        <Link href="/admin" className="text-gray-500 hover:text-gray-700">← Cancelar</Link>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Type selector */}
        <div className="mb-8">
          <label className="block text-lg font-semibold text-gray-700 mb-3">Tipo de grupo</label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => handleTypeChange("words")}
              className={`flex-1 py-5 rounded-2xl border-4 text-xl font-bold transition-all ${
                groupType === "words"
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
              }`}
            >
              📝 Palabras
              <span className="block text-sm font-normal mt-1 opacity-70">10 palabras · con imagen</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("phrases")}
              className={`flex-1 py-5 rounded-2xl border-4 text-xl font-bold transition-all ${
                groupType === "phrases"
                  ? "border-purple-500 bg-purple-50 text-purple-700"
                  : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
              }`}
            >
              💬 Frases
              <span className="block text-sm font-normal mt-1 opacity-70">5 frases · con imagen</span>
            </button>
          </div>
        </div>

        {/* Group name */}
        <div className="mb-8">
          <label className="block text-lg font-semibold text-gray-700 mb-2">Nombre del grupo</label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder={isWords ? "Ej: Vocabulario 1" : "Ej: Frases 1"}
            className="w-full text-xl border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-blue-500 focus:outline-none bg-white"
          />
        </div>

        {/* Word/phrase slots */}
        <div className="flex flex-col gap-4">
          {Array.from({ length: slots }, (_, i) => (
            <div key={i} className="bg-white border-2 border-gray-200 rounded-2xl p-5">
              <p className="text-sm font-semibold text-gray-400 mb-3">
                {isWords ? `Palabra ${i + 1}` : `Frase ${i + 1}`}
              </p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Español</label>
                  <input
                    type="text"
                    value={words[i]?.spanish ?? ""}
                    onChange={(e) => updateWord(i, "spanish", e.target.value)}
                    placeholder={isWords ? "palabra en español" : "frase en español"}
                    className="w-full text-lg border-2 border-gray-200 rounded-xl px-3 py-2 focus:border-blue-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">English</label>
                  <input
                    type="text"
                    value={words[i]?.english ?? ""}
                    onChange={(e) => updateWord(i, "english", e.target.value)}
                    placeholder={isWords ? "word in English" : "phrase in English"}
                    className="w-full text-lg border-2 border-gray-200 rounded-xl px-3 py-2 focus:border-blue-400 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-medium transition-colors">
                  📷 Subir imagen
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) updateWord(i, "image", file);
                    }}
                  />
                </label>
                {words[i]?.imagePreview && (
                  <img src={words[i].imagePreview!} alt="" className="h-16 w-16 object-cover rounded-xl border border-gray-200" />
                )}
              </div>
            </div>
          ))}
        </div>

        {error && <p className="mt-6 text-center text-red-600 font-semibold text-lg">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="mt-8 w-full text-xl font-bold py-5 bg-green-500 text-white rounded-2xl hover:bg-green-600 disabled:opacity-50 transition-all shadow-sm"
        >
          {saving ? "Guardando..." : "Guardar grupo"}
        </button>
      </form>
    </main>
  );
}
