"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { Language, LANGUAGE_LABELS, LANGUAGE_FLAGS } from "@/lib/translations";

const LANGUAGES: Language[] = ["en", "az", "ru", "es", "it", "ko"];

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-sm text-purple-300/60 hover:text-purple-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-purple-500/10 border border-transparent hover:border-purple-500/20"
      >
        <span className="text-base leading-none">{LANGUAGE_FLAGS[lang]}</span>
        <span className="hidden sm:inline text-xs font-medium">{LANGUAGE_LABELS[lang]}</span>
        <svg
          className={`w-3 h-3 opacity-50 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 bg-[#1a0e2e]/95 backdrop-blur-xl border border-purple-500/20 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in">
          {LANGUAGES.map((l) => (
            <button
              key={l}
              onClick={() => {
                setLang(l);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                lang === l
                  ? "bg-purple-500/15 text-purple-300"
                  : "text-purple-200/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="text-base leading-none">{LANGUAGE_FLAGS[l]}</span>
              <span className="font-medium">{LANGUAGE_LABELS[l]}</span>
              {lang === l && (
                <svg className="w-3.5 h-3.5 ml-auto text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
