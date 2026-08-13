"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

type Phase = "match_es_en" | "match_en_es" | "type_en" | "unscramble" | "type_es";

interface Word {
  id: string;
  spanish: string;
  english: string;
  imageUrl: string | null;
}

interface Props {
  words: Word[];
  groupId: string;
  groupName: string;
  groupType: "words" | "phrases";
  targetLang: string;
}

const FALLBACK_IMG = "/no-image.svg";

function getLangName(code: string) {
  switch (code) {
    case "fr": return "French";
    case "de": return "German";
    case "it": return "Italian";
    case "pt": return "Portuguese";
    default:   return "English";
  }
}

function getLangCode(code: string) {
  return { fr: "FR", de: "DE", it: "IT", pt: "PT" }[code] ?? "EN";
}

function getSpecialChars(lang: string): string[] {
  if (lang === "fr") return ["é","è","ê","ë","à","â","ù","û","î","ï","ô","œ","ç","Ç","Œ","?","!"];
  return ["á","é","í","ó","ú","ñ","Á","É","Í","Ó","Ú","Ñ","¿","?","¡","!"];
}

function buildOptions(words: Word[], current: Word, field: "english" | "spanish"): string[] {
  const correct = current[field];
  const pool = words.filter((w) => w.id !== current.id);
  const distractors = [...pool].sort(() => Math.random() - 0.5).slice(0, 3).map((w) => w[field]);
  return [correct, ...distractors].sort(() => Math.random() - 0.5);
}

function normalize(s: string) {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

const PHASE_TABS: { id: Phase; label: string }[] = [
  { id: "match_es_en",  label: "Phase 1a · Match" },
  { id: "match_en_es",  label: "Phase 1b · Match" },
  { id: "type_en",      label: "Phase 2 · Type" },
  { id: "unscramble",   label: "Phase 3a · Spell" },
  { id: "type_es",      label: "Phase 3b · Type" },
];

export function DemoSession({ words, groupId, groupName, groupType, targetLang }: Props) {
  const [phase, setPhase] = useState<Phase>("match_es_en");
  const [wordIdx, setWordIdx] = useState(0);

  const langName = getLangName(targetLang);
  const langCode = getLangCode(targetLang);
  const sourceSpecialChars = getSpecialChars("es");
  const targetSpecialChars = getSpecialChars(targetLang);

  const word = words[wordIdx];

  // Match phase state
  const [options, setOptions] = useState<string[]>([]);
  const [wrongOpts, setWrongOpts] = useState<Set<string>>(new Set());
  const [matchCorrect, setMatchCorrect] = useState(false);

  // Unscramble state
  const [scramPos, setScramPos] = useState(0);
  const [scramChars, setScramChars] = useState<{ ch: string; ok: boolean }[]>([]);
  const [scramFlash, setScramFlash] = useState(false);
  const scramRef = useRef<HTMLDivElement>(null);

  // Typing state
  const [typVal, setTypVal] = useState("");
  const [typWrong, setTypWrong] = useState(false);
  const [typCorrect, setTypCorrect] = useState(false);
  const typRef = useRef<HTMLInputElement>(null);

  // Reset interaction state when phase or word changes
  useEffect(() => {
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

  function prevWord() { setWordIdx((i) => (i - 1 + words.length) % words.length); }
  function nextWord() { setWordIdx((i) => (i + 1) % words.length); }

  function handleMatch(opt: string) {
    if (matchCorrect || wrongOpts.has(opt)) return;
    const field = phase === "match_es_en" ? "english" : "spanish";
    if (opt === word[field]) {
      setMatchCorrect(true);
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
    } else {
      setTypWrong(true);
    }
  }

  const phaseLabel: Record<Phase, string> = {
    match_es_en: `Phase 1 · Recognition ES → ${langCode}`,
    match_en_es: `Phase 1 · Recognition ${langCode} → ES`,
    type_en:     `Phase 2 · Spell in ${langName}`,
    unscramble:  `Phase 3 · Spell in Spanish`,
    type_es:     `Phase 3 · Spell in Spanish`,
  };

  return (
    <div className="max-w-2xl mx-auto p-4">

      {/* Demo banner */}
      <div className="flex items-center justify-between mb-4 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-2xl">
        <div className="flex items-center gap-2">
          <span className="text-amber-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </span>
          <span className="text-amber-700 text-sm font-bold">Teacher preview — no progress saved</span>
        </div>
        <Link href="/teacher/dashboard" className="text-amber-600 hover:text-amber-800 text-sm font-semibold transition-colors">
          ← Dashboard
        </Link>
      </div>

      {/* Phase tabs */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {PHASE_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setPhase(tab.id)}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              phase === tab.id
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600"
            }`}
          >
            {tab.id === "match_es_en" ? `Recognition ES→${langCode}` :
             tab.id === "match_en_es" ? `Recognition ${langCode}→ES` :
             tab.id === "type_en" ? `Spell in ${langName}` :
             tab.id === "unscramble" ? "Spell in Spanish (letter)" :
             "Spell in Spanish (free)"}
          </button>
        ))}
      </div>

      {/* Word navigation */}
      <div className="flex items-center justify-between mb-5 bg-white rounded-2xl px-4 py-3 border border-slate-200 shadow-sm">
        <button
          onClick={prevWord}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">{groupName}</p>
          <p className="text-sm font-bold text-slate-700">
            Word {wordIdx + 1} of {words.length}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">{word.spanish} · {word.english}</p>
        </div>
        <button
          onClick={nextWord}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Phase badge */}
      <div className="text-center mb-6">
        <span className="px-5 py-2 rounded-full text-sm font-semibold bg-blue-100 text-blue-700">
          {phaseLabel[phase]}
        </span>
      </div>

      {/* ── MATCH ── */}
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
          {matchCorrect && (
            <p className="text-emerald-600 font-bold text-lg text-center mt-6">Correct! ✓</p>
          )}
        </div>
      )}

      {/* ── TYPE IN TARGET LANG (Phase 2) ── */}
      {phase === "type_en" && (() => {
        const prompt = word.spanish;
        const promptLen = prompt.length;
        const promptSize = promptLen > 60 ? "text-lg" : promptLen > 35 ? "text-2xl" : promptLen > 20 ? "text-3xl" : "text-4xl";
        return (
          <div>
            <div className="flex justify-center mb-4">
              <img src={word.imageUrl ?? FALLBACK_IMG} alt="" className="h-32 w-32 object-cover rounded-2xl shadow-md" />
            </div>
            <div className={`text-center font-bold text-gray-800 mb-2 leading-snug break-words px-2 ${promptSize}`}>{prompt}</div>
            <p className="text-center text-sm text-gray-400 mb-5">Write in {langName}</p>
            <form onSubmit={handleTypingSubmit} className="flex gap-3 max-w-md mx-auto">
              <input ref={typRef} type="text" value={typVal}
                onChange={(e) => { setTypVal(e.target.value); if (typWrong) setTypWrong(false); }}
                autoComplete="off" autoCorrect="off" spellCheck={false} placeholder="Type here..."
                className={`flex-1 text-xl font-semibold border-4 rounded-2xl px-5 py-4 focus:outline-none text-center transition-all ${
                  typWrong ? "border-red-400 bg-red-50 text-red-700"
                  : typCorrect ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                  : "border-gray-300 focus:border-blue-500 bg-white"}`}
              />
              <button type="submit" className="text-2xl font-bold px-6 py-4 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 active:scale-95 transition-all shadow-sm">✓</button>
            </form>
            {targetSpecialChars.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center mt-3 max-w-md mx-auto">
                {targetSpecialChars.map((ch) => (
                  <button key={ch} type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      const input = typRef.current; if (!input) return;
                      const start = input.selectionStart ?? typVal.length;
                      const end = input.selectionEnd ?? typVal.length;
                      const newVal = typVal.slice(0, start) + ch + typVal.slice(end);
                      setTypVal(newVal);
                      setTimeout(() => { input.focus(); input.setSelectionRange(start+1, start+1); }, 0);
                    }}
                    className="px-3 py-2 text-base font-bold bg-gray-100 hover:bg-yellow-100 hover:border-yellow-400 rounded-xl border-2 border-gray-300 transition-all"
                  >{ch}</button>
                ))}
              </div>
            )}
            <div className="text-center mt-4 text-sm font-semibold">
              {typWrong && <p className="text-red-500">Incorrect, try again</p>}
              {typCorrect && <p className="text-emerald-600">Correct! ✓</p>}
            </div>
          </div>
        );
      })()}

      {/* ── UNSCRAMBLE (Phase 3a) ── */}
      {phase === "unscramble" && (
        <div>
          <div className="flex justify-center mb-4">
            <img src={word.imageUrl ?? FALLBACK_IMG} alt="" className="h-40 w-40 object-cover rounded-2xl shadow-md" />
          </div>
          <div className="text-center text-3xl font-semibold text-gray-500 mb-7">{word.english}</div>
          <div ref={scramRef} tabIndex={0} onKeyDown={handleScrambleKey} onClick={() => scramRef.current?.focus()}
            className="flex flex-wrap gap-2 justify-center mb-6 outline-none cursor-text">
            {scramChars.map((c, i) => {
              const isCurrent = i === scramPos;
              return (
                <div key={i} className={`min-w-[2.75rem] h-[3.25rem] flex items-center justify-center text-2xl font-bold rounded-xl border-[3px] transition-all ${
                  isCurrent ? scramFlash ? "border-red-500 bg-red-100 animate-pulse" : "border-blue-500 bg-blue-50 shadow-md"
                  : c.ok ? "border-green-500 bg-green-50 text-green-700"
                  : "border-gray-200 bg-white text-gray-300"}`}>
                  {c.ch}
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2 justify-center mb-3">
            {sourceSpecialChars.map((ch) => (
              <button key={ch} onMouseDown={(e) => { e.preventDefault(); handleScrambleChar(ch); }}
                className="px-3 py-2 text-lg font-bold bg-gray-100 hover:bg-yellow-100 hover:border-yellow-400 rounded-xl border-2 border-gray-300 transition-all">
                {ch}
              </button>
            ))}
          </div>
          <p className="text-center text-gray-400 text-sm">Click on the first box and type on your keyboard</p>
        </div>
      )}

      {/* ── TYPE IN SPANISH (Phase 3b) ── */}
      {phase === "type_es" && (() => {
        const prompt = word.english;
        const promptLen = prompt.length;
        const promptSize = promptLen > 60 ? "text-lg" : promptLen > 35 ? "text-2xl" : promptLen > 20 ? "text-3xl" : "text-4xl";
        return (
          <div>
            <div className="flex justify-center mb-4">
              <img src={word.imageUrl ?? FALLBACK_IMG} alt="" className="h-32 w-32 object-cover rounded-2xl shadow-md" />
            </div>
            <div className={`text-center font-bold text-gray-800 mb-2 leading-snug break-words px-2 ${promptSize}`}>{prompt}</div>
            <p className="text-center text-sm text-gray-400 mb-5">Write in Spanish</p>
            <form onSubmit={handleTypingSubmit} className="flex gap-3 max-w-md mx-auto">
              <input ref={typRef} type="text" value={typVal}
                onChange={(e) => { setTypVal(e.target.value); if (typWrong) setTypWrong(false); }}
                autoComplete="off" autoCorrect="off" spellCheck={false} placeholder="Type here..."
                className={`flex-1 text-xl font-semibold border-4 rounded-2xl px-5 py-4 focus:outline-none text-center transition-all ${
                  typWrong ? "border-red-400 bg-red-50 text-red-700"
                  : typCorrect ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                  : "border-gray-300 focus:border-blue-500 bg-white"}`}
              />
              <button type="submit" className="text-2xl font-bold px-6 py-4 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 active:scale-95 transition-all shadow-sm">✓</button>
            </form>
            <div className="flex flex-wrap gap-2 justify-center mt-3 max-w-md mx-auto">
              {sourceSpecialChars.map((ch) => (
                <button key={ch} type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const input = typRef.current; if (!input) return;
                    const start = input.selectionStart ?? typVal.length;
                    const end = input.selectionEnd ?? typVal.length;
                    const newVal = typVal.slice(0, start) + ch + typVal.slice(end);
                    setTypVal(newVal);
                    setTimeout(() => { input.focus(); input.setSelectionRange(start+1, start+1); }, 0);
                  }}
                  className="px-3 py-2 text-base font-bold bg-gray-100 hover:bg-yellow-100 hover:border-yellow-400 rounded-xl border-2 border-gray-300 transition-all"
                >{ch}</button>
              ))}
            </div>
            <div className="text-center mt-4 text-sm font-semibold">
              {typWrong && <p className="text-red-500">Incorrect, try again</p>}
              {typCorrect && <p className="text-emerald-600">Correct! ✓</p>}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
