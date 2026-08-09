"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

type Phase = "match_es_en" | "match_en_es" | "unscramble" | "type_en" | "type_es" | "complete";
const PHASES: Phase[] = ["match_es_en", "match_en_es", "unscramble", "type_en", "type_es"];

interface Word {
  id: string;
  spanish: string;
  english: string;
  imageUrl: string | null;
}

interface Props {
  words: Word[];
  studentId: string;
  groupId: string;
  groupName: string;
  groupType: "words" | "phrases";
  initialProgress: { phase: string; wordId: string }[];
}

function normalize(s: string) {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

function buildOptions(words: Word[], current: Word, field: "english" | "spanish"): string[] {
  const correct = current[field];
  const pool = words.filter((w) => w.id !== current.id);
  const distractors = [...pool].sort(() => Math.random() - 0.5).slice(0, 3).map((w) => w[field]);
  return [correct, ...distractors].sort(() => Math.random() - 0.5);
}

const FALLBACK_IMG = "/no-image.svg";

const localKey = (sid: string, gid: string) => `wf_${sid}_${gid}`;

function saveLocal(sid: string, gid: string, done: Set<string>) {
  try { localStorage.setItem(localKey(sid, gid), JSON.stringify([...done])); } catch {}
}

function loadLocal(sid: string, gid: string): Set<string> {
  try {
    const raw = localStorage.getItem(localKey(sid, gid));
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch {}
  return new Set();
}

export function PracticeSession({ words, studentId, groupId, groupName, groupType, initialProgress }: Props) {
  const buildDone = (p: { phase: string; wordId: string }[]) => {
    const db = new Set(p.map((x) => `${x.phase}:${x.wordId}`));
    const local = loadLocal(studentId, groupId);
    return new Set([...db, ...local]);
  };

  const [done, setDone] = useState(() => buildDone(initialProgress));
  const [showPreview, setShowPreview] = useState(true);

  // On mount: sync any localStorage progress that isn't in the DB yet
  useEffect(() => {
    const local = loadLocal(studentId, groupId);
    const db = new Set(initialProgress.map((x) => `${x.phase}:${x.wordId}`));
    const missing = [...local].filter((k) => !db.has(k));
    for (const key of missing) {
      const [phase, wordId] = key.split(":");
      fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, wordGroupId: groupId, phase, wordId }),
        keepalive: true,
      }).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getNext(d: Set<string>) {
    for (const p of PHASES) {
      const idx = words.findIndex((w) => !d.has(`${p}:${w.id}`));
      if (idx !== -1) return { phase: p, idx };
    }
    return { phase: "complete" as Phase, idx: 0 };
  }

  const init = getNext(buildDone(initialProgress));
  const [phase, setPhase] = useState<Phase>(init.phase);
  const [wordIdx, setWordIdx] = useState(init.idx);

  const totalAnswers = words.length * 5;
  const mastery = Math.min(100, Math.round((done.size / totalAnswers) * 100));
  const word = words[wordIdx];

  const [options, setOptions] = useState<string[]>([]);
  const [wrongOpts, setWrongOpts] = useState<Set<string>>(new Set());
  const [matchCorrect, setMatchCorrect] = useState(false);

  const [scramPos, setScramPos] = useState(0);
  const [scramChars, setScramChars] = useState<{ ch: string; ok: boolean }[]>([]);
  const [scramFlash, setScramFlash] = useState(false);
  const scramRef = useRef<HTMLDivElement>(null);

  const [typVal, setTypVal] = useState("");
  const [typWrong, setTypWrong] = useState(false);
  const [typCorrect, setTypCorrect] = useState(false);
  const typRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (phase === "complete" || !word) return;
    setWrongOpts(new Set());
    setMatchCorrect(false);
    setTypVal("");
    setTypWrong(false);
    setTypCorrect(false);
    setScramFlash(false);

    if (phase === "match_es_en" || phase === "match_en_es") {
      setOptions(buildOptions(words, word, phase === "match_es_en" ? "english" : "spanish"));
    }
    if (phase === "unscramble") {
      setScramPos(0);
      setScramChars(word.spanish.split("").map(() => ({ ch: "", ok: false })));
      setTimeout(() => scramRef.current?.focus(), 80);
    }
    if (phase === "type_en" || phase === "type_es") {
      setTimeout(() => typRef.current?.focus(), 80);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, wordIdx]);

  async function advance() {
    const key = `${phase}:${word.id}`;
    const newDone = new Set(done);
    newDone.add(key);
    setDone(newDone);
    // Save locally first (instant, reliable)
    saveLocal(studentId, groupId, newDone);
    // Also send to DB (may fail silently on Neon cold start)
    fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, wordGroupId: groupId, phase, wordId: word.id }),
      keepalive: true,
    }).catch(() => {});
    const { phase: np, idx: ni } = getNext(newDone);
    setPhase(np);
    setWordIdx(ni);
  }

  function handleMatch(opt: string) {
    if (matchCorrect || wrongOpts.has(opt)) return;
    const field = phase === "match_es_en" ? "english" : "spanish";
    if (opt === word[field]) {
      setMatchCorrect(true);
      setTimeout(() => advance(), 450);
    } else {
      setWrongOpts((prev) => new Set([...prev, opt]));
    }
  }

  function handleScrambleChar(ch: string) {
    if (scramPos >= word.spanish.length) return;
    const expected = word.spanish[scramPos];
    if (ch.toLowerCase() === expected.toLowerCase() || ch === expected) {
      const newChars = scramChars.map((c, i) => i === scramPos ? { ch: expected, ok: true } : c);
      setScramChars(newChars);
      const next = scramPos + 1;
      setScramPos(next);
      if (next >= word.spanish.length) setTimeout(() => advance(), 400);
    } else {
      setScramFlash(true);
      setTimeout(() => setScramFlash(false), 400);
    }
  }

  function handleScrambleKey(e: React.KeyboardEvent) {
    if (e.key.length === 1) { e.preventDefault(); handleScrambleChar(e.key); }
  }

  function handleTypingSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!typVal.trim()) return;
    const target = phase === "type_en" ? word.english : word.spanish;
    if (normalize(typVal) === normalize(target)) {
      setTypCorrect(true);
      setTimeout(() => { setTypVal(""); setTypCorrect(false); advance(); }, 600);
    } else {
      setTypWrong(true);
      // Don't clear — let the student see and fix their answer
    }
  }

  async function handleRestart() {
    await fetch("/api/progress/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, wordGroupId: groupId }),
    });
    setDone(new Set());
    setPhase("match_es_en");
    setWordIdx(0);
  }

  const specialChars = ["á", "é", "í", "ó", "ú", "ñ", ...(groupType === "phrases" ? ["Á", "É", "Í", "Ó", "Ú", "Ñ"] : [])];

  // ── PREVIEW ──
  if (showPreview) {
    const isWords = groupType === "words";
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <Link href="/home" className="text-blue-600 hover:underline text-lg">← Grupos</Link>
          <h1 className="text-2xl font-bold text-gray-800">{groupName}</h1>
          <span className="text-gray-400 text-sm">{words.length} {isWords ? "palabras" : "frases"}</span>
        </div>
        <p className="text-center text-gray-500 text-lg mb-6">Repasa antes de empezar:</p>
        <div className={`grid gap-4 mb-10 ${isWords ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-5" : "grid-cols-1 sm:grid-cols-2"}`}>
          {words.map((w) => (
            <div key={w.id} className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="aspect-square overflow-hidden bg-gray-50">
                <img src={w.imageUrl ?? FALLBACK_IMG} alt={w.spanish} className="w-full h-full object-cover" />
              </div>
              <div className={isWords ? "p-3" : "p-4"}>
                <p className={`font-bold text-gray-800 text-center leading-tight ${isWords ? "text-base" : "text-lg"}`}>{w.spanish}</p>
                <p className={`text-gray-400 text-center mt-1 leading-tight ${isWords ? "text-sm" : "text-base"}`}>{w.english}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="sticky bottom-6 flex justify-center">
          <button
            onClick={() => setShowPreview(false)}
            className="text-2xl font-bold px-16 py-5 bg-green-500 text-white rounded-full hover:bg-green-600 active:scale-95 transition-all shadow-lg"
          >
            {mastery > 0 ? `▶ Continuar (${mastery}%)` : "▶ ¡Empezar!"}
          </button>
        </div>
      </div>
    );
  }

  // ── COMPLETE ──
  if (phase === "complete") {
    return (
      <div className="max-w-lg mx-auto text-center py-20 px-8">
        <div className="text-9xl mb-6">🎉</div>
        <h1 className="text-5xl font-bold text-green-600 mb-4">¡Felicidades!</h1>
        <p className="text-3xl font-semibold text-gray-700 mb-2">100% completado</p>
        <p className="text-xl text-gray-500 mb-10">{groupName}</p>
        <Link href="/home" className="inline-block text-xl font-bold px-10 py-5 bg-green-500 text-white rounded-2xl hover:bg-green-600 transition-all shadow-md">
          ← Volver a mis grupos
        </Link>
        <div className="mt-4">
          <button onClick={handleRestart} className="text-gray-400 hover:text-gray-600 text-base underline">
            Volver a empezar desde cero
          </button>
        </div>
      </div>
    );
  }

  const phaseLabel: Record<Phase, string> = {
    match_es_en: "Fase 1 · Reconocimiento ES → EN",
    match_en_es: "Fase 1 · Reconocimiento EN → ES",
    unscramble: "Fase 2 · Deletrear en español",
    type_en: "Fase 3 · Escribir en inglés",
    type_es: "Fase 3 · Escribir en español",
    complete: "",
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-3">
        <Link href="/home" className="text-blue-600 hover:underline text-lg">← Grupos</Link>
        <h1 className="text-xl font-bold text-gray-700 truncate mx-4">{groupName}</h1>
        <span className="text-2xl font-bold text-blue-700 shrink-0">{mastery}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-5 mb-8 overflow-hidden">
        <div className="h-5 rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${mastery}%` }} />
      </div>
      <div className="text-center mb-8">
        <span className="px-5 py-2 rounded-full text-sm font-semibold bg-blue-100 text-blue-700">
          {phaseLabel[phase]}
        </span>
      </div>

      {/* MATCH */}
      {(phase === "match_es_en" || phase === "match_en_es") && (
        <div>
          <div className="flex justify-center mb-5">
            <img src={word.imageUrl ?? FALLBACK_IMG} alt="" className="h-44 w-44 object-cover rounded-2xl shadow-md" />
          </div>
          <div className="text-center text-5xl font-bold text-gray-800 mb-10 leading-tight">
            {phase === "match_es_en" ? word.spanish : word.english}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {options.map((opt) => {
              const field = phase === "match_es_en" ? "english" : "spanish";
              const isCorrect = matchCorrect && opt === word[field];
              const isWrong = wrongOpts.has(opt);
              return (
                <button
                  key={opt}
                  onClick={() => handleMatch(opt)}
                  disabled={isWrong || matchCorrect}
                  className={`text-xl font-bold py-6 px-4 rounded-2xl border-4 transition-all ${
                    isCorrect ? "border-green-500 bg-green-50 text-green-800 scale-105"
                    : isWrong ? "border-red-500 bg-red-50 text-red-500 opacity-60 cursor-not-allowed"
                    : "border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50 active:scale-95 cursor-pointer"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* UNSCRAMBLE */}
      {phase === "unscramble" && (
        <div>
          <div className="flex justify-center mb-4">
            <img src={word.imageUrl ?? FALLBACK_IMG} alt="" className="h-40 w-40 object-cover rounded-2xl shadow-md" />
          </div>
          <div className="text-center text-3xl font-semibold text-gray-500 mb-7">{word.english}</div>
          <div
            ref={scramRef}
            tabIndex={0}
            onKeyDown={handleScrambleKey}
            onClick={() => scramRef.current?.focus()}
            className="flex flex-wrap gap-2 justify-center mb-6 outline-none cursor-text"
          >
            {scramChars.map((c, i) => {
              const isCurrent = i === scramPos;
              return (
                <div
                  key={i}
                  className={`min-w-[2.75rem] h-[3.25rem] flex items-center justify-center text-2xl font-bold rounded-xl border-[3px] transition-all ${
                    isCurrent
                      ? scramFlash ? "border-red-500 bg-red-100 animate-pulse" : "border-blue-500 bg-blue-50 shadow-md"
                      : c.ok ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-200 bg-white text-gray-300"
                  }`}
                >
                  {c.ch}
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2 justify-center mb-3">
            {specialChars.map((ch) => (
              <button
                key={ch}
                onMouseDown={(e) => { e.preventDefault(); handleScrambleChar(ch); }}
                className="px-3 py-2 text-lg font-bold bg-gray-100 hover:bg-yellow-100 hover:border-yellow-400 rounded-xl border-2 border-gray-300 transition-all"
              >
                {ch}
              </button>
            ))}
          </div>
          <p className="text-center text-gray-400 text-sm">Haz clic aquí arriba y escribe con el teclado</p>
        </div>
      )}

      {/* TYPING */}
      {(phase === "type_en" || phase === "type_es") && (() => {
        const target = phase === "type_en" ? word.english : word.spanish;
        const prompt = phase === "type_en" ? word.spanish : word.english;
        const promptLen = prompt.length;
        const promptSize = promptLen > 60 ? "text-lg" : promptLen > 35 ? "text-2xl" : promptLen > 20 ? "text-3xl" : "text-4xl";

        // Character-by-character diff
        function renderDiff(typed: string, correct: string) {
          const norm = (s: string) => s.toLowerCase();
          return correct.split("").map((ch, i) => {
            const typedCh = typed[i] ?? "";
            const ok = norm(typedCh) === norm(ch);
            return (
              <span key={i} className={ok ? "text-emerald-600" : "text-red-500 font-bold underline decoration-2"}>
                {ch}
              </span>
            );
          });
        }

        return (
          <div>
            <div className="flex justify-center mb-4">
              <img src={word.imageUrl ?? FALLBACK_IMG} alt="" className="h-32 w-32 object-cover rounded-2xl shadow-md" />
            </div>

            {/* Prompt — always visible, size adapts to length */}
            <div className={`text-center font-bold text-gray-800 mb-2 leading-snug break-words px-2 ${promptSize}`}>
              {prompt}
            </div>
            <p className="text-center text-sm text-gray-400 mb-5">
              {phase === "type_en" ? "Escribe en inglés" : "Escribe en español"}
            </p>

            <form onSubmit={handleTypingSubmit} className="flex gap-3 max-w-md mx-auto">
              <input
                ref={typRef}
                type="text"
                value={typVal}
                onChange={(e) => {
                  setTypVal(e.target.value);
                  if (typWrong) setTypWrong(false);
                }}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                placeholder="Escribe aquí..."
                className={`flex-1 text-xl font-semibold border-4 rounded-2xl px-5 py-4 focus:outline-none text-center transition-all ${
                  typWrong ? "border-red-400 bg-red-50 text-red-700"
                  : typCorrect ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                  : "border-gray-300 focus:border-blue-500 bg-white"
                }`}
              />
              <button type="submit" className="text-2xl font-bold px-6 py-4 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 active:scale-95 transition-all shadow-sm">
                ✓
              </button>
            </form>

            {/* Special chars */}
            <div className="flex flex-wrap gap-2 justify-center mt-3 max-w-md mx-auto">
              {specialChars.map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const input = typRef.current;
                    if (!input) return;
                    const start = input.selectionStart ?? typVal.length;
                    const end = input.selectionEnd ?? typVal.length;
                    const newVal = typVal.slice(0, start) + ch + typVal.slice(end);
                    setTypVal(newVal);
                    if (typWrong) setTypWrong(false);
                    setTimeout(() => { input.focus(); input.setSelectionRange(start + 1, start + 1); }, 0);
                  }}
                  className="px-3 py-2 text-base font-bold bg-gray-100 hover:bg-yellow-100 hover:border-yellow-400 rounded-xl border-2 border-gray-300 transition-all"
                >
                  {ch}
                </button>
              ))}
            </div>

            {/* Error feedback — stays visible, shows diff */}
            {typWrong && (
              <div className="mt-5 max-w-md mx-auto bg-red-50 border-2 border-red-200 rounded-2xl p-4">
                <p className="text-red-600 font-bold text-sm mb-2 text-center">Incorrecto — corrige tu respuesta:</p>
                <div className="text-center text-lg font-mono leading-relaxed break-words">
                  {renderDiff(typVal, target)}
                </div>
                {typVal.length < target.length && (
                  <p className="text-red-400 text-xs text-center mt-1">
                    Faltan {target.length - typVal.length} caracteres
                  </p>
                )}
              </div>
            )}
            {typCorrect && (
              <p className="text-emerald-600 font-bold text-lg text-center mt-5">¡Correcto!</p>
            )}
          </div>
        );
      })()}
    </div>
  );
}
