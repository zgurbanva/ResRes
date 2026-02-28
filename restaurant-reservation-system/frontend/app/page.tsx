"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import { Location } from "@/types";
import Link from "next/link";
import AboutModal from "@/components/AboutModal";
import SuggestionsModal from "@/components/SuggestionsModal";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/lib/LanguageContext";

/* SVG icon paths for each Baku district */
const locationSvgs: Record<string, JSX.Element> = {
  "Sahil": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 18.5S5.5 16 8 16s4 3 6.5 3 5-3 5-3M3.5 13.5S5.5 11 8 11s4 3 6.5 3 5-3 5-3M8 6V3m0 3a2 2 0 100-4 2 2 0 000 4z" />
    </svg>
  ),
  "Icherisheher": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3L2 12h3v8h5v-5h4v5h5v-8h3L12 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 21v-3h6v3" />
    </svg>
  ),
  "Yasamal": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4M9 10h.01M15 10h.01M9 14h.01M15 14h.01" />
    </svg>
  ),
  "Nasimi": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4.97 0-9-2.686-9-6V9c0-3.314 4.03-6 9-6s9 2.686 9 6v6c0 3.314-4.03 6-9 6z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9c0 3.314 4.03 6 9 6s9-2.686 9-6" />
    </svg>
  ),
  "Narimanov": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 22h20M6 22V6l4-4 4 4v16M14 22V10h6v12M10 10h.01M10 14h.01M10 18h.01M18 14h.01M18 18h.01" />
    </svg>
  ),
  "Sabail": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 16.8A8.5 8.5 0 0012 21a8.5 8.5 0 00-9-4.2M12 3v2m6.36 1.64l-1.41 1.41M21 12h-2M17.95 17.95l-1.41-1.41M12 17v2M7.46 16.54L6.05 17.95M5 12H3M6.05 6.05l1.41 1.41" />
    </svg>
  ),
  "Khatai": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 21V10l8-7 8 7v11M4 21h16M9 21v-6h6v6" />
    </svg>
  ),
  "Ahmadli": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h7V11H3v10zm0 0h18M14 21V6h7v15" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 15h1M6 18h1M17 10h1M17 13h1M17 16h1M17 19h1" />
    </svg>
  ),
  "28 May": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 18h18M3 18V6m18 12V6M7 6V3m10 3V3M3 6h18M8 10h8M8 14h4" />
    </svg>
  ),
  "Elmler Akademiyasi": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14v7M21 9v7M5.5 11.5v5S8 20 12 20s6.5-3.5 6.5-3.5v-5" />
    </svg>
  ),
  "Genclik": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012-2l.054-.006A2 2 0 0113 11.99V10a2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  "Fountain Square": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 22v-6m0-4V3M8 8c0-2.5 1.5-5 4-5s4 2.5 4 5c0 2-1 3-2 4h-4c-1-1-2-2-2-4zM6 22h12M9 16h6" />
    </svg>
  ),
  "Boulevard": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M9 21V9h6v12M5 21V13h4M15 21V13h4M12 5V3m-3 3h6" />
    </svg>
  ),
  "Nizami": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  ),
};

/* Accent color per location */
const locationAccents: Record<string, string> = {
  "Sahil": "from-cyan-500/20 to-cyan-600/5 text-cyan-400 border-cyan-500/15",
  "Icherisheher": "from-amber-500/20 to-amber-600/5 text-amber-400 border-amber-500/15",
  "Yasamal": "from-violet-500/20 to-violet-600/5 text-violet-400 border-violet-500/15",
  "Nasimi": "from-blue-500/20 to-blue-600/5 text-blue-400 border-blue-500/15",
  "Narimanov": "from-rose-500/20 to-rose-600/5 text-rose-400 border-rose-500/15",
  "Sabail": "from-teal-500/20 to-teal-600/5 text-teal-400 border-teal-500/15",
  "Khatai": "from-orange-500/20 to-orange-600/5 text-orange-400 border-orange-500/15",
  "Ahmadli": "from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/15",
  "28 May": "from-red-500/20 to-red-600/5 text-red-400 border-red-500/15",
  "Elmler Akademiyasi": "from-indigo-500/20 to-indigo-600/5 text-indigo-400 border-indigo-500/15",
  "Genclik": "from-pink-500/20 to-pink-600/5 text-pink-400 border-pink-500/15",
  "Fountain Square": "from-purple-500/20 to-purple-600/5 text-purple-400 border-purple-500/15",
  "Boulevard": "from-sky-500/20 to-sky-600/5 text-sky-400 border-sky-500/15",
  "Nizami": "from-fuchsia-500/20 to-fuchsia-600/5 text-fuchsia-400 border-fuchsia-500/15",
};

const defaultAccent = "from-purple-500/20 to-purple-600/5 text-purple-400 border-purple-500/15";

export default function HomePage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    api
      .getLocations()
      .then(setLocations)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-mesh bg-orbs noise-overlay">
      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-glow relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.15)_0%,transparent_50%)]" />
            <svg className="w-5 h-5 relative z-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 4h7a5 5 0 010 10h-2l5 6M7 4v16M7 14h5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M7 4h7a5 5 0 010 10" stroke="url(#rGlow)" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
              <defs><linearGradient id="rGlow" x1="7" y1="4" x2="19" y2="14"><stop stopColor="#e9d5ff" /><stop offset="1" stopColor="#a855f7" stopOpacity="0" /></linearGradient></defs>
            </svg>
          </div>
          <span className="text-lg font-bold text-white tracking-tight">
            Res<span className="text-purple-400">Res</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Link
            href="/admin"
            className="text-sm text-purple-300/60 hover:text-purple-300 transition-colors px-4 py-2 rounded-lg hover:bg-purple-500/10 border border-transparent hover:border-purple-500/20"
          >
            {t("admin")}
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative z-10 flex flex-col items-center pt-16 pb-8 px-6">
        <div className="animate-fade-in">
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-purple-500/20 bg-purple-500/5 mb-10 shadow-glow">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse-dot" />
            <span className="text-sm text-purple-300/80 font-medium tracking-wide">{t("bakuAzerbaijan")}</span>
          </div>
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-white text-center mb-5 animate-fade-in leading-[1.1]">
          {t("findYour")}
          <br />
          <span className="text-gradient-shine">{t("perfectTable")}</span>
        </h1>
        <p className="text-purple-200/50 text-lg text-center max-w-lg mb-4 animate-fade-in-delay-1 leading-relaxed">
          {t("heroDescription")}
        </p>
        {/* Decorative line */}
        <div className="animate-fade-in-delay-2 flex items-center gap-3 mb-14">
          <div className="w-8 h-px bg-gradient-to-r from-transparent to-purple-500/40" />
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500/40" />
          <div className="w-8 h-px bg-gradient-to-l from-transparent to-purple-500/40" />
        </div>
      </div>

      {/* Section label */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-purple-500/20 to-transparent" />
          <span className="text-xs text-purple-300/30 uppercase tracking-[0.2em] font-semibold">{t("selectDistrict")}</span>
          <div className="h-px flex-1 bg-gradient-to-l from-purple-500/20 to-transparent" />
        </div>
      </div>

      {/* Locations Grid */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="skeleton h-32 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {locations.map((loc, i) => {
              const accent = locationAccents[loc.name] || defaultAccent;
              return (
                <button
                  key={loc.id}
                  onClick={() =>
                    router.push(
                      `/restaurants?location_id=${loc.id}&location_name=${encodeURIComponent(loc.name)}`
                    )
                  }
                  className={`animate-stagger-in group relative rounded-2xl border bg-gradient-to-br p-6 text-center cursor-pointer transition-all duration-400 hover:scale-[1.04] hover:shadow-glow ${accent}`}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  {/* Glow dot top-right */}
                  <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-current opacity-0 group-hover:opacity-60 transition-opacity duration-300 animate-breathe" />

                  {/* Icon */}
                  <div className="flex items-center justify-center mb-3 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">
                    {locationSvgs[loc.name] || (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                    )}
                  </div>

                  {/* Name */}
                  <div className="text-sm font-semibold text-white/90 group-hover:text-white transition-colors">
                    {loc.name}
                  </div>

                  {/* Subtle marker */}
                  <div className="mt-2 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                    <svg className="w-3 h-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <span className="text-[10px] opacity-50 font-medium tracking-wide">{t("explore")}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="relative z-10 pb-8 flex flex-col items-center gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAboutOpen(true)}
            className="text-xs text-purple-300/30 hover:text-purple-300/70 transition-colors cursor-pointer"
          >
            {t("aboutUs")}
          </button>
          <span className="text-purple-500/20">|</span>
          <button
            onClick={() => setSuggestionsOpen(true)}
            className="text-xs text-purple-300/30 hover:text-purple-300/70 transition-colors cursor-pointer"
          >
            {t("suggestions")}
          </button>
        </div>
        <div className="flex items-center gap-2 text-purple-300/15 text-xs">
          <div className="w-4 h-px bg-purple-500/15" />
          <span className="tracking-widest uppercase">ResRes</span>
          <div className="w-4 h-px bg-purple-500/15" />
        </div>
      </div>

      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
      <SuggestionsModal open={suggestionsOpen} onClose={() => setSuggestionsOpen(false)} />
    </div>
  );
}
