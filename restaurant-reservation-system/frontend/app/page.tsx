"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import { Location } from "@/types";
import Link from "next/link";

const locationIcons: Record<string, string> = {
  "Sahil": "🌊",
  "Icherisheher": "🏰",
  "Yasamal": "🏙️",
  "Nasimi": "🌆",
  "Narimanov": "🏗️",
  "Sabail": "⛵",
  "Khatai": "🌇",
  "Ahmadli": "🏘️",
  "28 May": "🚇",
  "Elmler Akademiyasi": "🎓",
  "Genclik": "🎭",
  "Fountain Square": "⛲",
};

export default function HomePage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    api
      .getLocations()
      .then(setLocations)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-mesh">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
            <span className="text-white text-lg font-black">R</span>
          </div>
          <span className="text-lg font-bold text-white tracking-tight">
            Res<span className="text-purple-400">Res</span>
          </span>
        </div>
        <Link
          href="/admin"
          className="text-sm text-purple-300/60 hover:text-purple-300 transition-colors"
        >
          Admin
        </Link>
      </nav>

      {/* Hero */}
      <div className="flex flex-col items-center pt-12 pb-6 px-6">
        <div className="animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/5 mb-8">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse-dot"></span>
            <span className="text-sm text-purple-300/80">Baku, Azerbaijan</span>
          </div>
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold text-white text-center mb-4 animate-fade-in leading-tight">
          Find Your
          <br />
          <span className="text-gradient">Perfect Table</span>
        </h1>
        <p className="text-purple-200/50 text-lg text-center max-w-md mb-14 animate-fade-in-delay-1">
          Browse locations across Baku and reserve your seat at the best restaurants
        </p>
      </div>

      {/* Locations Grid */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="skeleton h-28 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-fade-in-delay-2">
            {locations.map((loc, i) => (
              <button
                key={loc.id}
                onClick={() =>
                  router.push(
                    `/restaurants?location_id=${loc.id}&location_name=${encodeURIComponent(loc.name)}`
                  )
                }
                className="glass-card rounded-2xl p-6 text-center group cursor-pointer"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  {locationIcons[loc.name] || "📍"}
                </div>
                <div className="text-sm font-semibold text-white/90 group-hover:text-purple-300 transition-colors">
                  {loc.name}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
