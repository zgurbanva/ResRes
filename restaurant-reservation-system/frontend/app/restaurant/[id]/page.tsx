"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/services/api";
import { Restaurant, TableAvailability } from "@/types";
import ReservationModal from "@/components/ReservationModal";
import AboutModal from "@/components/AboutModal";
import SuggestionsModal from "@/components/SuggestionsModal";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/lib/LanguageContext";

const ZONE_DOT_COLORS: Record<string, string> = {
  Window: "bg-sky-400",
  Front: "bg-amber-400",
  Center: "bg-purple-400",
  Patio: "bg-lime-400",
  Terrace: "bg-teal-400",
  Bar: "bg-rose-400",
  VIP: "bg-yellow-400",
  Corner: "bg-indigo-400",
  Garden: "bg-emerald-400",
  Lounge: "bg-fuchsia-400",
};

const ZONE_GLOW: Record<string, string> = {
  Window: "shadow-[0_0_15px_rgba(56,189,248,0.15)]",
  Front: "shadow-[0_0_15px_rgba(245,158,11,0.15)]",
  Center: "shadow-[0_0_15px_rgba(168,85,247,0.15)]",
  Patio: "shadow-[0_0_15px_rgba(132,204,22,0.15)]",
  Terrace: "shadow-[0_0_15px_rgba(20,184,166,0.15)]",
  Bar: "shadow-[0_0_15px_rgba(251,113,133,0.15)]",
  VIP: "shadow-[0_0_15px_rgba(234,179,8,0.15)]",
  Corner: "shadow-[0_0_15px_rgba(99,102,241,0.15)]",
  Garden: "shadow-[0_0_15px_rgba(16,185,129,0.15)]",
  Lounge: "shadow-[0_0_15px_rgba(217,70,239,0.15)]",
};

export default function RestaurantPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const restaurantId = Number(id);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [tables, setTables] = useState<TableAvailability[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedTable, setSelectedTable] = useState<TableAvailability | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hoveredTable, setHoveredTable] = useState<number | null>(null);
  const [zoneFilter, setZoneFilter] = useState<string | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    api.getRestaurant(restaurantId).then(setRestaurant).catch(console.error);
  }, [restaurantId]);

  useEffect(() => {
    setLoading(true);
    api
      .getAvailability(restaurantId, selectedDate)
      .then(setTables)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [restaurantId, selectedDate]);

  const handleTableClick = (table: TableAvailability) => {
    if (table.status !== "available") return;
    setSelectedTable(table);
    setModalOpen(true);
  };

  const handleReservationSuccess = () => {
    setModalOpen(false);
    setSelectedTable(null);
    api
      .getAvailability(restaurantId, selectedDate)
      .then(setTables)
      .catch(console.error);
  };

  const statusStyles = (status: string, isHovered: boolean) => {
    const base = "transition-all duration-300";
    switch (status) {
      case "available":
        return `${base} bg-emerald-500/15 border-emerald-500/40 text-emerald-300 ${
          isHovered ? "bg-emerald-500/25 border-emerald-400/60 shadow-[0_0_20px_rgba(16,185,129,0.25)]" : ""
        }`;
      case "reserved":
        return `${base} bg-amber-500/15 border-amber-500/30 text-amber-300/80`;
      case "pending":
        return `${base} bg-yellow-500/15 border-yellow-500/30 text-yellow-300/80 animate-pulse`;
      case "blocked":
        return `${base} bg-red-500/15 border-red-500/30 text-red-300/80`;
      default:
        return `${base} bg-white/5 border-white/10 text-white/40`;
    }
  };

  const availableCount = tables.filter((t) => t.status === "available").length;
  const reservedCount = tables.filter((t) => t.status === "reserved" || t.status === "pending").length;
  const blockedCount = tables.filter((t) => t.status === "blocked").length;

  // Get unique zones for filter
  const zones = Array.from(new Set(tables.map((t) => t.zone).filter(Boolean))) as string[];

  // Filter tables by zone
  const filteredTables = zoneFilter
    ? tables.filter((t) => t.zone === zoneFilter)
    : tables;

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

      <div className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-purple-400/60 hover:text-purple-300 transition-all mb-6 text-sm font-medium group"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {t("back")}
        </button>

        {/* Restaurant Header */}
        {restaurant && (
          <div className="mb-8 animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">
              <span className="text-gradient-shine">{restaurant.name}</span>
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-purple-200/40 text-sm">
              {restaurant.address && (
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {restaurant.address}
                </span>
              )}
              {restaurant.phone && (
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {restaurant.phone}
                </span>
              )}
            </div>
            {/* Decorative separator */}
            <div className="mt-4 flex items-center gap-3">
              <div className="h-px w-16 bg-gradient-to-r from-purple-500/30 to-transparent" />
              <div className="w-1 h-1 rounded-full bg-purple-500/30" />
            </div>
          </div>
        )}

        {/* Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 animate-fade-in-delay-1">
          <div className="flex items-center gap-3">
            <label className="text-sm text-purple-200/40 flex items-center gap-2">
              <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {t("date")}
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input-dark"
            />
          </div>

          {/* Stats */}
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2 group">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60 ring-2 ring-emerald-500/20 group-hover:ring-emerald-500/40 transition-all"></div>
              <span className="text-xs text-white/40">{t("available")} <span className="text-emerald-400 font-bold tabular-nums">{availableCount}</span></span>
            </div>
            <div className="flex items-center gap-2 group">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60 ring-2 ring-amber-500/20 group-hover:ring-amber-500/40 transition-all"></div>
              <span className="text-xs text-white/40">{t("reserved")} <span className="text-amber-400 font-bold tabular-nums">{reservedCount}</span></span>
            </div>
            <div className="flex items-center gap-2 group">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60 ring-2 ring-red-500/20 group-hover:ring-red-500/40 transition-all"></div>
              <span className="text-xs text-white/40">{t("blocked")} <span className="text-red-400 font-bold tabular-nums">{blockedCount}</span></span>
            </div>
          </div>
        </div>

        {/* Zone filter chips */}
        {zones.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4 animate-fade-in-delay-1">
            <span className="text-xs text-purple-200/30 mr-1">{t("filterByZone")}</span>
            <button
              onClick={() => setZoneFilter(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                zoneFilter === null
                  ? "bg-purple-600/30 border-purple-500/50 text-purple-300"
                  : "bg-white/[0.03] border-white/5 text-purple-200/30 hover:text-purple-200/50"
              }`}
            >
              {t("all")}
            </button>
            {zones.map((z) => (
              <button
                key={z}
                onClick={() => setZoneFilter(zoneFilter === z ? null : z)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all border flex items-center gap-1.5 ${
                  zoneFilter === z
                    ? "bg-purple-600/30 border-purple-500/50 text-white"
                    : "bg-white/[0.03] border-white/5 text-purple-200/30 hover:text-purple-200/50"
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${ZONE_DOT_COLORS[z] || "bg-purple-400"}`}></div>
                {z}
              </button>
            ))}
          </div>
        )}

        {/* Floor Plan */}
        {loading ? (
          <div className="skeleton rounded-2xl w-full" style={{ height: "540px" }} />
        ) : (
          <div className="animate-fade-in-delay-2">
            <div className="glass-card-shimmer rounded-2xl p-4 hover:transform-none w-full">
              <div className="flex items-center gap-2 text-xs text-purple-300/30 font-medium uppercase tracking-widest mb-3 px-1">
                <svg className="w-3.5 h-3.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                </svg>
                {t("floorPlan")}
              </div>
              <div className="w-full overflow-auto rounded-xl">
                <div
                  className="relative rounded-xl bg-[#0d0818] border border-purple-500/10 min-w-[700px]"
                  style={{ width: "700px", height: "500px" }}
                >
                {/* Grid pattern */}
                <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#a855f7" strokeWidth="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>

                {/* Zone labels floating above tables */}
                {filteredTables.filter((t) => t.zone).map((table) => (
                  <div
                    key={`zone-label-${table.id}`}
                    className="absolute pointer-events-none z-20"
                    style={{
                      left: table.position_x + table.width / 2,
                      top: table.position_y - 16,
                      transform: "translateX(-50%)",
                    }}
                  >
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold tracking-wide bg-black/50 backdrop-blur-sm border border-white/5 ${
                      ZONE_DOT_COLORS[table.zone!] ? ZONE_DOT_COLORS[table.zone!].replace("bg-", "text-") : "text-purple-400"
                    }`}>
                      {table.zone}
                    </span>
                  </div>
                ))}

                {filteredTables.map((table) => {
                  const isHovered = hoveredTable === table.id;
                  const zoneGlow = table.zone && isHovered && table.status === "available"
                    ? ZONE_GLOW[table.zone] || ""
                    : "";

                  return (
                    <div
                      key={table.id}
                      onClick={() => handleTableClick(table)}
                      onMouseEnter={() => setHoveredTable(table.id)}
                      onMouseLeave={() => setHoveredTable(null)}
                      className={`absolute flex flex-col items-center justify-center border-2 backdrop-blur-sm ${statusStyles(
                        table.status,
                        isHovered
                      )} ${zoneGlow} ${
                        table.status === "available"
                          ? "cursor-pointer hover:scale-[1.03]"
                          : "cursor-not-allowed opacity-60"
                      }`}
                      style={{
                        left: table.position_x,
                        top: table.position_y,
                        width: table.width,
                        height: table.height,
                        borderRadius: table.shape === "circle" ? "50%" : "14px",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <span className="font-bold text-xs">{table.name}</span>
                      <span className="text-[10px] opacity-70">
                        {table.capacity} {t("seats")}
                      </span>
                      {table.status !== "available" && (
                        <span className="text-[9px] uppercase tracking-wider opacity-60 mt-0.5">
                          {table.status}
                        </span>
                      )}
                      {table.status === "available" && isHovered && (
                        <span className="text-[9px] text-emerald-400 font-medium mt-0.5 animate-pulse">
                          {t("clickToReserve")}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              </div>
            </div>

            <p className="text-xs text-purple-200/20 mt-4 flex items-center gap-2">
              <svg className="w-3.5 h-3.5 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
              </svg>
            {t("clickAvailableTable")}
            </p>
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

      {/* Floating Google Maps Card — always visible */}
      {restaurant?.address && !mapOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[340px] md:w-[400px] animate-fade-in" style={{ pointerEvents: "auto" }}>
          <div className="bg-[#1a0e2e]/95 backdrop-blur-xl border border-purple-500/20 rounded-2xl shadow-2xl overflow-hidden">
            {/* Map header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-purple-500/10">
              <div className="flex items-center gap-2 min-w-0">
                <svg className="w-3.5 h-3.5 text-purple-400/60 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-[11px] font-medium text-purple-200/60 truncate">{restaurant.name} — {restaurant.address}</span>
              </div>
              <button
                onClick={() => setMapOpen(true)}
                className="text-purple-400/40 hover:text-purple-300 transition-colors p-1 flex-shrink-0"
                title="Hide map"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Map iframe */}
            <div className="w-full h-64 md:h-72">
              <iframe
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(restaurant.name.replace(/\s*—\s*/g, ', ') + ', ' + restaurant.address + ', Baku, Azerbaijan')}&t=&z=17&ie=UTF8&iwloc=&output=embed`}
                allowFullScreen
              />
            </div>

            {/* Open in Google Maps link */}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name.replace(/\s*—\s*/g, ', ') + ', ' + restaurant.address + ', Baku, Azerbaijan')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-3 py-2 text-[11px] text-purple-400/60 hover:text-purple-300 transition-colors border-t border-purple-500/10"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              {t("openInGoogleMaps")}
            </a>
          </div>
        </div>
      )}

      {/* Map re-open button (shown when map is dismissed) */}
      {restaurant?.address && mapOpen && (
        <button
          onClick={() => setMapOpen(false)}
          className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-xl bg-[#1a0e2e]/90 backdrop-blur-xl border border-purple-500/20 text-purple-400 hover:text-purple-300 hover:border-purple-500/40 hover:shadow-purple-500/20 flex items-center justify-center transition-all duration-300 shadow-lg"
          title={t("viewOnMap")}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      )}

      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
      <SuggestionsModal open={suggestionsOpen} onClose={() => setSuggestionsOpen(false)} />

      {modalOpen && selectedTable && (
        <ReservationModal
          table={selectedTable}
          restaurantId={restaurantId}
          date={selectedDate}
          onClose={() => {
            setModalOpen(false);
            setSelectedTable(null);
          }}
          onSuccess={handleReservationSuccess}
        />
      )}
    </div>
  );
}
