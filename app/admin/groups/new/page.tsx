"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type GroupType = "words" | "phrases";

const LANGS = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fr", label: "French", flag: "🇫🇷" },
  { code: "de", label: "German", flag: "🇩🇪" },
  { code: "it", label: "Italian", flag: "🇮🇹" },
  { code: "pt", label: "Portuguese", flag: "🇵🇹" },
];

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
  const [targetLang, setTargetLang] = useState("en");
  const [groupName, setGroupName] = useState("");
  const [words, setWords] = useState<WordEntry[]>(Array.from({ length: 5 }, emptyWord));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isWords = groupType === "words";

  function handleTypeChange(t: GroupType) {
    setGroupType(t);
    setWords(Array.from({ length: 5 }, emptyWord));
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

  function removeWord(index: number) {
    setWords((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const filled = words.filter((w) => w.spanish.trim() && w.english.trim());
    if (!groupName.trim()) { setError("Group name is required."); return; }
    if (filled.length === 0) { setError("Add at least one entry."); return; }

    setSaving(true);
    const formData = new FormData();
    formData.append("name", groupName.trim());
    formData.append("type", groupType);
    formData.append("targetLang", targetLang);
    formData.append("wordCount", String(filled.length));
    filled.forEach((w, i) => {
      formData.append(`word_${i}_spanish`, w.spanish.trim());
      formData.append(`word_${i}_english`, w.english.trim());
      if (w.image) formData.append(`word_${i}_image`, w.image);
    });

    const res = await fetch("/api/admin/groups", { method: "POST", body: formData });
    if (res.ok) { router.push("/teacher/dashboard"); }
    else { const d = await res.json(); setError(d.error || "Error saving group"); setSaving(false); }
  }

  const selectedLang = LANGS.find((l) => l.code === targetLang);

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">New group</h1>
        <Link href="/teacher/dashboard" className="text-slate-400 hover:text-slate-600 text-sm transition-colors">← Cancel</Link>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Type selector */}
        <div className="mb-7">
          <label className="block text-sm font-semibold text-slate-500 uppercase tracking-widest mb-3">Group type</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleTypeChange("words")}
              className={`flex-1 py-4 rounded-xl border-2 font-bold transition-all text-base ${
                groupType === "words"
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
              }`}
            >
              Words
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("phrases")}
              className={`flex-1 py-4 rounded-xl border-2 font-bold transition-all text-base ${
                groupType === "phrases"
                  ? "border-violet-500 bg-violet-50 text-violet-700"
                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
              }`}
            >
              Phrases
            </button>
          </div>
        </div>

        {/* Target language */}
        <div className="mb-7">
          <label className="block text-sm font-semibold text-slate-500 uppercase tracking-widest mb-3">Target language</label>
          <div className="flex flex-wrap gap-2">
            {LANGS.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setTargetLang(l.code)}
                className={`px-4 py-2 rounded-xl border-2 font-bold text-sm transition-all ${
                  targetLang === l.code
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                }`}
              >
                {l.flag} {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Group name */}
        <div className="mb-7">
          <label className="block text-sm font-semibold text-slate-500 uppercase tracking-widest mb-2">Group name</label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder={isWords ? "E.g.: Vocabulary 1" : "E.g.: Everyday phrases"}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-slate-50"
          />
        </div>

        {/* Entries */}
        <div className="flex flex-col gap-3">
          {words.map((w, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  {isWords ? `Word ${i + 1}` : `Phrase ${i + 1}`}
                </p>
                {words.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeWord(i)}
                    className="text-slate-300 hover:text-red-400 transition-colors text-lg leading-none"
                  >
                    ×
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Spanish</label>
                  <input
                    type="text"
                    value={w.spanish}
                    onChange={(e) => updateWord(i, "spanish", e.target.value)}
                    placeholder={isWords ? "word in Spanish" : "phrase in Spanish"}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    {selectedLang?.label ?? "Target language"}
                  </label>
                  <input
                    type="text"
                    value={w.english}
                    onChange={(e) => updateWord(i, "english", e.target.value)}
                    placeholder={isWords ? `word in ${selectedLang?.label}` : `phrase in ${selectedLang?.label}`}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 font-medium transition-colors text-xs">
                  Upload image
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
                {w.imagePreview && (
                  <img src={w.imagePreview} alt="" className="h-10 w-10 object-cover rounded-lg border border-slate-200" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add more button */}
        <button
          type="button"
          onClick={() => setWords((prev) => [...prev, emptyWord()])}
          className="mt-3 w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-blue-300 hover:text-blue-500 font-semibold transition-all text-sm"
        >
          + Add {isWords ? "word" : "phrase"}
        </button>

        {error && <p className="mt-5 text-center text-red-600 font-semibold text-sm">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="mt-6 w-full font-bold py-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-sm"
        >
          {saving ? "Saving..." : "Save group"}
        </button>
      </form>
    </main>
  );
}
