"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface WordEntry {
  id?: string;
  spanish: string;
  english: string;
  image: File | null;
  imagePreview: string | null;
  existingImageUrl?: string | null;
}

function emptyWord(): WordEntry {
  return { spanish: "", english: "", image: null, imagePreview: null };
}

interface Props {
  params: Promise<{ groupId: string }>;
}

export default function EditGroupPage({ params }: Props) {
  const router = useRouter();
  const [groupId, setGroupId] = useState("");
  const [groupName, setGroupName] = useState("");
  const [words, setWords] = useState<WordEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    params.then(({ groupId: id }) => {
      setGroupId(id);
      fetch(`/api/admin/groups/${id}`)
        .then((r) => r.json())
        .then((data) => {
          setGroupName(data.name);
          const loaded: WordEntry[] = data.words.map((w: { id: string; spanish: string; english: string; imageUrl?: string }) => ({
            id: w.id,
            spanish: w.spanish,
            english: w.english,
            image: null,
            imagePreview: null,
            existingImageUrl: w.imageUrl,
          }));
          // Start with existing words; if none yet, show 5 empty slots
          setWords(loaded.length > 0 ? loaded : Array.from({ length: 5 }, emptyWord));
          setLoading(false);
        });
    });
  }, [params]);

  function updateWord(index: number, field: string, value: string | File | null) {
    setWords((prev) => {
      const next = [...prev];
      if (field === "image" && value instanceof File) {
        next[index] = { ...next[index], image: value, imagePreview: URL.createObjectURL(value) };
      } else {
        next[index] = { ...next[index], [field]: value as string };
      }
      return next;
    });
  }

  function addWord() {
    setWords((prev) => [...prev, emptyWord()]);
  }

  function removeWord(index: number) {
    setWords((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const filledWords = words.filter((w) => w.spanish.trim() && w.english.trim());
    if (!groupName.trim()) {
      setError("El nombre del grupo es obligatorio.");
      return;
    }
    setSaving(true);

    const formData = new FormData();
    formData.append("name", groupName.trim());
    formData.append("wordCount", String(filledWords.length));

    filledWords.forEach((w, i) => {
      formData.append(`word_${i}_id`, w.id ?? "");
      formData.append(`word_${i}_spanish`, w.spanish.trim());
      formData.append(`word_${i}_english`, w.english.trim());
      formData.append(`word_${i}_existingImage`, w.existingImageUrl ?? "");
      if (w.image) formData.append(`word_${i}_image`, w.image);
    });

    const res = await fetch(`/api/admin/groups/${groupId}`, {
      method: "PUT",
      body: formData,
    });

    if (res.ok) {
      router.push("/teacher/dashboard");
    } else {
      const data = await res.json();
      setError(data.error || "Error al guardar");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto p-8 text-center">
        <p className="text-xl text-gray-500">Cargando...</p>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Editar grupo</h1>
        <Link href="/teacher/dashboard" className="text-gray-500 hover:text-gray-700">
          ← Cancelar
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-8">
          <label className="block text-lg font-semibold text-gray-700 mb-2">
            Nombre del grupo
          </label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="w-full text-xl border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-blue-500 focus:outline-none bg-white"
          />
        </div>

        <div className="flex flex-col gap-4">
          {words.map((word, i) => (
            <div key={i} className="bg-white border-2 border-gray-200 rounded-2xl p-5 relative">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-400">Palabra {i + 1}</p>
                {words.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeWord(i)}
                    className="text-gray-300 hover:text-red-400 transition-colors text-xl leading-none font-bold"
                    title="Eliminar"
                  >
                    ×
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Español</label>
                  <input
                    type="text"
                    value={word.spanish}
                    onChange={(e) => updateWord(i, "spanish", e.target.value)}
                    placeholder="palabra en español"
                    className="w-full text-lg border-2 border-gray-200 rounded-xl px-3 py-2 focus:border-blue-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">English</label>
                  <input
                    type="text"
                    value={word.english}
                    onChange={(e) => updateWord(i, "english", e.target.value)}
                    placeholder="word in English"
                    className="w-full text-lg border-2 border-gray-200 rounded-xl px-3 py-2 focus:border-blue-400 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-medium transition-colors">
                  📷 {word.existingImageUrl || word.imagePreview ? "Cambiar imagen" : "Subir imagen"}
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
                {(word.imagePreview || word.existingImageUrl) && (
                  <img
                    src={word.imagePreview ?? word.existingImageUrl ?? ""}
                    alt=""
                    className="h-16 w-16 object-cover rounded-xl border border-gray-200"
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add word button */}
        <button
          type="button"
          onClick={addWord}
          className="mt-4 w-full py-3 border-2 border-dashed border-gray-300 rounded-2xl text-gray-400 hover:border-blue-400 hover:text-blue-500 font-bold text-lg transition-all"
        >
          + Añadir palabra
        </button>

        {error && (
          <p className="mt-6 text-center text-red-600 font-semibold text-lg">{error}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="mt-6 w-full text-xl font-bold py-5 bg-green-500 text-white rounded-2xl hover:bg-green-600 disabled:opacity-50 transition-all shadow-sm"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </main>
  );
}
