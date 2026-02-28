"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/services/api";
import { Restaurant } from "@/types";
import Link from "next/link";

function RestaurantsContent() {
  const searchParams = useSearchParams();
  const locationId = searchParams?.get("location_id") ?? null;
  const locationName = searchParams?.get("location_name") || "All";
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    api
      .getRestaurants(locationId ? Number(locationId) : undefined)
      .then(setRestaurants)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [locationId]);

  const getChainLogo = (name: string) => {
    if (name.includes("Papa Johns")) return "🍕";
    if (name.includes("Pizza Mizza")) return "🍕";
    return "🍽️";
  };

  const getChainColor = (name: string) => {
    if (name.includes("Papa Johns"))
      return "from-green-500/20 to-green-600/5 border-green-500/15";
    if (name.includes("Pizza Mizza"))
      return "from-orange-500/20 to-orange-600/5 border-orange-500/15";
    return "from-purple-500/20 to-purple-600/5 border-purple-500/15";
  };

  const getChainAccent = (name: string) => {
    if (name.includes("Papa Johns")) return "text-green-400";
    if (name.includes("Pizza Mizza")) return "text-orange-400";
    return "text-purple-400";
  };

  return (
    <div className="min-h-screen bg-mesh">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-5">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
            <span className="text-white text-lg font-black">R</span>
          </div>
          <span className="text-lg font-bold text-white tracking-tight">
            Res<span className="text-purple-400">Res</span>
          </span>
        </Link>
      </nav>

      <div className="max-w-5xl mx-auto px-6 pb-20">
        {/* Back + Header */}
        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-2 text-purple-400/70 hover:text-purple-300 transition-colors mb-8 text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to locations
        </button>

        <div className="mb-10 animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">
            Restaurants in{" "}
            <span className="text-gradient">{locationName}</span>
          </h1>
          <p className="text-purple-200/40">
            Choose a restaurant to view the floor plan & reserve
          </p>
        </div>

        {/* Restaurant Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-40 rounded-2xl" />
            ))}
          </div>
        ) : restaurants.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4 opacity-30">🍽️</div>
            <p className="text-purple-200/40 text-lg">No restaurants found in this area</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in-delay-1">
            {restaurants.map((r) => (
              <Link
                key={r.id}
                href={`/restaurant/${r.id}`}
                className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-glow ${getChainColor(r.name)}`}
              >
                {/* Chain badge */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-black/20 flex items-center justify-center text-2xl">
                    {getChainLogo(r.name)}
                  </div>
                  <div className={`text-xs font-semibold px-3 py-1 rounded-full bg-black/20 ${getChainAccent(r.name)}`}>
                    {r.name.includes("Papa Johns") ? "Papa Johns" : r.name.includes("Pizza Mizza") ? "Pizza Mizza" : "Restaurant"}
                  </div>
                </div>

                <h2 className="text-lg font-bold text-white mb-2 group-hover:text-purple-200 transition-colors">
                  {r.name}
                </h2>

                <div className="space-y-1">
                  {r.address && (
                    <p className="text-purple-200/40 text-sm flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {r.address}
                    </p>
                  )}
                  {r.phone && (
                    <p className="text-purple-200/40 text-sm flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {r.phone}
                    </p>
                  )}
                </div>

                {/* Arrow indicator */}
                <div className="absolute right-4 bottom-4 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                  <svg className="w-4 h-4 text-white/40 group-hover:text-white/70 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
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
