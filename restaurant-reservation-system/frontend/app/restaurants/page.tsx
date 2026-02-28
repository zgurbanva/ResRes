"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/services/api";
import { Restaurant } from "@/types";
import Link from "next/link";
import AboutModal from "@/components/AboutModal";
import SuggestionsModal from "@/components/SuggestionsModal";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/lib/LanguageContext";

/* Restaurant icon based on first letter — gives each card a unique visual identity */
function RestaurantIcon({ name }: { name: string }) {
  const letter = name.charAt(0).toUpperCase();
  return (
    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center relative overflow-hidden group-hover:border-purple-500/30 transition-all duration-300">
      <span className="text-lg font-bold text-purple-300/80 group-hover:text-purple-200 transition-colors">{letter}</span>
      {/* shine sweep on hover */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}

/* Utensil SVG icon for empty state */
function UtensilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} className="w-16 h-16 text-purple-500/20">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11V4a1 1 0 00-1-1h-1a1 1 0 00-1 1v7m4 0H12m3 0v9m-3-9v9M5 3v5a3 3 0 003 3m-3-8h6M8 11v10" />
    </svg>
  );
}

function RestaurantsContent() {
  const searchParams = useSearchParams();
  const locationId = searchParams?.get("location_id") ?? null;
  const locationName = searchParams?.get("location_name") || "All";
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    api
      .getRestaurants(locationId ? Number(locationId) : undefined)
      .then(setRestaurants)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [locationId]);

  return (
    <div className="min-h-screen bg-mesh bg-orbs noise-overlay">
      {/* Nav */}
      <nav className="relative z-30 flex items-center justify-between px-6 md:px-12 py-5">
        <Link href="/" className="flex items-center gap-3">
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
        </Link>
        <LanguageSwitcher />
      </nav>

      <div className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
        {/* Back button */}
        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-2 text-purple-400/60 hover:text-purple-300 transition-all mb-8 text-sm font-medium group"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {t("backToLocations")}
        </button>

        {/* Header */}
        <div className="mb-10 animate-fade-in">
          <div className="flex items-center gap-3 mb-3">
            <svg className="w-5 h-5 text-purple-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <span className="text-sm text-purple-300/40 font-medium tracking-wide uppercase">{locationName}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">
            {t("chooseA")}{" "}
            <span className="text-gradient-shine">{t("restaurant")}</span>
          </h1>
          <p className="text-purple-200/40 leading-relaxed">
            {t("viewFloorPlanAndReserve")}
          </p>
          {/* Decorative line */}
          <div className="mt-6 flex items-center gap-3">
            <div className="h-px w-12 bg-gradient-to-r from-purple-500/30 to-transparent" />
            <div className="w-1 h-1 rounded-full bg-purple-500/30" />
          </div>
        </div>

        {/* Count badge */}
        {!loading && restaurants.length > 0 && (
          <div className="mb-6 animate-fade-in-delay-1 flex items-center gap-2">
            <span className="text-xs text-purple-300/30 font-medium tracking-wide">
              {restaurants.length} {restaurants.length !== 1 ? t("restaurantsFound") : t("restaurantFound")}
            </span>
          </div>
        )}

        {/* Restaurant Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-44 rounded-2xl" />
            ))}
          </div>
        ) : restaurants.length === 0 ? (
          <div className="text-center py-24 animate-fade-in">
            <UtensilIcon />
            <p className="text-purple-200/30 text-lg mt-4 mb-2">{t("noRestaurantsFound")}</p>
            <p className="text-purple-200/20 text-sm">{t("tryDifferentDistrict")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {restaurants.map((r, i) => (
              <Link
                key={r.id}
                href={`/restaurant/${r.id}`}
                className="animate-stagger-in group relative overflow-hidden rounded-2xl border border-purple-500/10 bg-gradient-to-br from-purple-500/10 to-purple-600/5 p-6 transition-all duration-400 hover:scale-[1.02] hover:shadow-glow hover:border-purple-500/25"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                {/* Subtle corner accent */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-purple-500/5 to-transparent rounded-bl-full" />

                {/* Icon + Badge row */}
                <div className="flex items-start justify-between mb-4">
                  <RestaurantIcon name={r.name} />
                  <div className="text-xs font-medium px-3 py-1.5 rounded-full bg-white/5 text-purple-300/50 border border-white/5 flex items-center gap-1.5">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                    </svg>
                    {t("viewFloorPlan")}
                  </div>
                </div>

                {/* Name */}
                <h2 className="text-lg font-bold text-white mb-3 group-hover:text-purple-200 transition-colors">
                  {r.name}
                </h2>

                {/* Details */}
                <div className="space-y-1.5">
                  {r.address && (
                    <p className="text-purple-200/35 text-sm flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 opacity-60 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="truncate">{r.address}</span>
                    </p>
                  )}
                  {r.phone && (
                    <p className="text-purple-200/35 text-sm flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 opacity-60 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {r.phone}
                    </p>
                  )}
                </div>

                {/* Arrow indicator */}
                <div className="absolute right-5 bottom-5 w-8 h-8 rounded-full bg-white/[0.03] flex items-center justify-center group-hover:bg-purple-500/15 transition-all duration-300">
                  <svg className="w-4 h-4 text-white/25 group-hover:text-purple-300/70 group-hover:translate-x-0.5 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
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

export default function RestaurantsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-mesh flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-400 rounded-full animate-spin" />
        </div>
      }
    >
      <RestaurantsContent />
    </Suspense>
  );
}
