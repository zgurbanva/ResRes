"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/services/api";
import {
  Restaurant,
  Reservation,
  TableAvailability,
  Location,
} from "@/types";

/* ─── View types for navigation ─────────────────────────────── */
type AdminView =
  | { page: "home" }
  | { page: "restaurants"; locationId: number; locationName: string }
  | { page: "floorplan"; restaurantId: number; restaurantName: string };

export default function AdminPage() {
  /* ── Auth ────────────────────────────────────────────────── */
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [adminRestaurantId, setAdminRestaurantId] = useState<number | null>(null);
  const [adminRestaurantName, setAdminRestaurantName] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  /* ── Navigation ─────────────────────────────────────────── */
  const [view, setView] = useState<AdminView>({ page: "home" });

  /* ── Data ────────────────────────────────────────────────── */
  const [locations, setLocations] = useState<Location[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [allReservations, setAllReservations] = useState<Reservation[]>([]);
  const [tables, setTables] = useState<TableAvailability[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  /* ── Block form ─────────────────────────────────────────── */
  const [blockTableId, setBlockTableId] = useState<number | null>(null);
  const [blockStartTime, setBlockStartTime] = useState("12:00");
  const [blockEndTime, setBlockEndTime] = useState("14:00");
  const [blockReason, setBlockReason] = useState("");
  const [blockError, setBlockError] = useState("");
  const [blockSuccess, setBlockSuccess] = useState(false);

  /* ── Toast notification ─────────────────────────────────── */
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── Notification dismiss tracking ──────────────────────── */
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set());

  const pendingReservations = allReservations.filter(
    (r) => r.status === "pending"
  );

  const activeReservations = allReservations.filter(
    (r) => r.status === "pending" && !dismissedIds.has(r.id)
  );

  /* ── Login ──────────────────────────────────────────────── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const result = await api.adminLogin(email, password);
      setToken(result.access_token);
      setAdminRestaurantId(result.restaurant_id);
      setAdminRestaurantName(result.restaurant_name);
      setIsSuperAdmin(result.is_super_admin);
      // If restaurant-scoped admin, go directly to their floor plan
      if (result.restaurant_id && result.restaurant_name) {
        setView({
          page: "floorplan",
          restaurantId: result.restaurant_id,
          restaurantName: result.restaurant_name,
        });
      }
    } catch (err: any) {
      setLoginError(err.message || "Login failed");
    }
  };

  /* ── Load locations + all reservations on login ─────────── */
  useEffect(() => {
    if (!token) return;
    // Super admins see everything; restaurant admins only need reservations
    if (isSuperAdmin || !adminRestaurantId) {
      api.getLocations().then(setLocations).catch(console.error);
      api.getRestaurants().then(setRestaurants).catch(console.error);
    }
    api
      .adminGetReservations(token)
      .then(setAllReservations)
      .catch(console.error);
  }, [token, isSuperAdmin, adminRestaurantId]);

  /* ── Auto-poll for new reservations every 15s ───────────── */
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      api.adminGetReservations(token).then(setAllReservations).catch(console.error);
      if (view.page === "floorplan") {
        api.getAvailability(view.restaurantId, selectedDate).then(setTables).catch(console.error);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [token, view, selectedDate]);

  /* ── Load tables when viewing a floor plan ──────────────── */
  useEffect(() => {
    if (view.page !== "floorplan") return;
    api
      .getAvailability(view.restaurantId, selectedDate)
      .then(setTables)
      .catch(console.error);
  }, [view, selectedDate]);

  const refreshFloorplan = useCallback(() => {
    if (view.page !== "floorplan") return;
    api
      .getAvailability(view.restaurantId, selectedDate)
      .then(setTables)
      .catch(console.error);
  }, [view, selectedDate]);

  const refreshReservations = useCallback(() => {
    if (!token) return;
    api
      .adminGetReservations(token)
      .then(setAllReservations)
      .catch(console.error);
  }, [token]);

  /* ── Reservation actions ────────────────────────────────── */
  const handleStatusChange = async (id: number, status: string) => {
    if (!token) return;
    try {
      await api.adminUpdateReservation(token, id, status);

      // Immediately update local state so the notification disappears right away
      setAllReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );

      // Also remove from dismissed tracking (no longer needed)
      setDismissedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      // Refresh from server in background for full accuracy
      refreshReservations();
      refreshFloorplan();

      const label =
        status === "confirmed"
          ? "Successfully Approved!"
          : status === "declined"
          ? "Successfully Rejected!"
          : status === "cancelled"
          ? "Successfully Cancelled!"
          : "Status Updated!";
      showToast(label, "success");
    } catch (err: any) {
      showToast(err.message || "Action failed", "error");
    }
  };

  /* ── Block table ────────────────────────────────────────── */
  const handleBlockTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !blockTableId || view.page !== "floorplan") return;
    setBlockError("");
    setBlockSuccess(false);
    try {
      await api.adminCreateTableBlock(token, {
        table_id: blockTableId,
        restaurant_id: view.restaurantId,
        date: selectedDate,
        start_time: blockStartTime,
        end_time: blockEndTime,
        reason: blockReason || undefined,
      });
      setBlockSuccess(true);
      setBlockTableId(null);
      setBlockReason("");
      refreshFloorplan();
      showToast("Successfully Blocked time range!", "success");
    } catch (err: any) {
      setBlockError(err.message || "Failed to block table");
      showToast(err.message || "Failed to block table", "error");
    }
  };

  /* ── Navigate to restaurant from reservation ────────────── */
  const goToRestaurantFloorplan = (reservation: Reservation) => {
    // Restaurant admins can only view their own restaurant
    if (adminRestaurantId && reservation.restaurant_id !== adminRestaurantId) return;
    const rest = restaurants.find((r) => r.id === reservation.restaurant_id);
    setView({
      page: "floorplan",
      restaurantId: reservation.restaurant_id,
      restaurantName:
        rest?.name || "Restaurant #" + reservation.restaurant_id,
    });
  };

  /* ── Get location-filtered restaurants ──────────────────── */
  const filteredRestaurants =
    view.page === "restaurants"
      ? restaurants.filter((r) => r.location_id === view.locationId)
      : [];

  /* ── Reservation count per restaurant ───────────────────── */
  const reservationCountByRestaurant = allReservations
    .filter((r) => r.status === "confirmed")
    .reduce(
      (acc, r) => {
        acc[r.restaurant_id] = (acc[r.restaurant_id] || 0) + 1;
        return acc;
      },
      {} as Record<number, number>
    );

  /* ═══════════════════════════════════════════════════════════
     LOGIN SCREEN
     ═══════════════════════════════════════════════════════════ */
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0a1a] via-[#1a0e2e] to-[#0f0a1a] bg-orbs noise-overlay flex items-center justify-center p-4">
        <div className="relative z-10 w-full max-w-sm">
          <div className="flex flex-col items-center mb-8 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center mb-4 shadow-glow">
              <span className="text-white text-2xl font-black">R</span>
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              Res<span className="text-purple-400">Res</span>
              <span className="text-purple-200/30 ml-2 text-sm font-normal">
                admin
              </span>
            </span>
          </div>
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-7 shadow-2xl animate-fade-in-delay-1">
            <h1 className="text-xl font-bold text-white mb-2 text-center">
              Sign in to Dashboard
            </h1>
            <p className="text-xs text-purple-200/30 text-center mb-6">
              Each admin can only manage their own restaurant
            </p>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-purple-200/40 mb-1.5">
                  Restaurant Admin Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. papa-johns-28-may@resres.az"
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-white/15 focus:outline-none focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-purple-200/40 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-white/15 focus:outline-none focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20 transition"
                  required
                />
              </div>
              {loginError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2.5 rounded-xl text-sm flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  {loginError}
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white py-3 rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30"
              >
                Sign In
              </button>
            </form>
          </div>
          {/* Decorative lines */}
          <div className="flex justify-center mt-8 animate-fade-in-delay-2">
            <div className="flex items-center gap-2 text-purple-300/10 text-xs">
              <div className="w-4 h-px bg-purple-500/10" />
              <span className="tracking-widest uppercase">Secure Access</span>
              <div className="w-4 h-px bg-purple-500/10" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     DASHBOARD
     ═══════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#0f0a1a] noise-overlay">
      {/* ── Header ──────────────────────────────────────────── */}
      <header className="border-b border-purple-500/10 bg-[#0f0a1a]/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (adminRestaurantId && adminRestaurantName) {
                  setView({ page: "floorplan", restaurantId: adminRestaurantId, restaurantName: adminRestaurantName });
                } else {
                  setView({ page: "home" });
                }
              }}
              className="flex items-center gap-3 hover:opacity-80 transition"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-glow">
                <span className="text-white text-sm font-black">R</span>
              </div>
              <span className="text-sm font-bold text-white tracking-tight">
                Res<span className="text-purple-400">Res</span>
              </span>
            </button>
            <div className="h-5 w-px bg-purple-500/15 mx-1" />
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs">
              {isSuperAdmin || !adminRestaurantId ? (
                <button
                  onClick={() => setView({ page: "home" })}
                  className="text-purple-300/40 hover:text-purple-300 transition"
                >
                  Dashboard
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="bg-purple-500/15 border border-purple-500/25 text-purple-300 px-2.5 py-1 rounded-lg text-xs font-semibold">
                    {adminRestaurantName}
                  </span>
                  <span className="text-purple-200/30 text-[10px]">Admin</span>
                </div>
              )}
              {(isSuperAdmin || !adminRestaurantId) && view.page === "restaurants" && (
                <>
                  <span className="text-purple-500/30">/</span>
                  <span className="text-purple-300/60">
                    {view.locationName}
                  </span>
                </>
              )}
              {(isSuperAdmin || !adminRestaurantId) && view.page === "floorplan" && (
                <>
                  <span className="text-purple-500/30">/</span>
                  <span className="text-purple-300/60">
                    {view.restaurantName}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (adminRestaurantId && adminRestaurantName) {
                  setView({ page: "floorplan", restaurantId: adminRestaurantId, restaurantName: adminRestaurantName });
                } else {
                  setView({ page: "home" });
                }
              }}
              className="relative text-purple-300/40 hover:text-purple-300 transition"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                />
              </svg>
              {activeReservations.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                  {activeReservations.length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setToken(null);
                setAdminRestaurantId(null);
                setAdminRestaurantName(null);
                setIsSuperAdmin(false);
                setView({ page: "home" });
              }}
              className="text-purple-300/40 hover:text-purple-300 text-sm transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* ═══════════════════════════════════════════════════════
            RESTAURANT ADMIN BANNER — shows which restaurant this admin manages
            ═══════════════════════════════════════════════════════ */}
        {adminRestaurantId && adminRestaurantName && !isSuperAdmin && (
          <div className="mb-6 bg-gradient-to-r from-purple-500/10 to-purple-700/5 border border-purple-500/15 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                Managing: <span className="text-purple-400">{adminRestaurantName}</span>
              </p>
              <p className="text-xs text-purple-200/40">
                You can only view and manage tables for this restaurant
              </p>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            NOTIFICATION BANNER — always visible if reservations exist
            ═══════════════════════════════════════════════════════ */}
        {activeReservations.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                Pending Approval
                <span className="text-purple-300/30 font-normal">
                  ({activeReservations.length})
                </span>
              </h2>
              <button
                onClick={() =>
                  setDismissedIds(
                    new Set(activeReservations.map((r) => r.id))
                  )
                }
                className="text-xs text-purple-300/30 hover:text-purple-300/60 transition"
              >
                Dismiss all
              </button>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {activeReservations.map((r) => {
                const rest = restaurants.find(
                  (x) => x.id === r.restaurant_id
                );
                return (
                  <div
                    key={r.id}
                    className="bg-yellow-500/[0.04] border border-yellow-500/15 rounded-xl p-4 flex items-center justify-between gap-4 hover:bg-yellow-500/[0.08] transition group"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-5 h-5 text-yellow-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm text-white font-medium truncate">
                          {r.user_name}
                          <span className="text-purple-300/30 font-normal ml-2">
                            #{r.id}
                          </span>
                          <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">
                            PENDING
                          </span>
                        </div>
                        <div className="text-xs text-purple-200/40 truncate">
                          {rest?.name ||
                            "Restaurant #" + r.restaurant_id}{" "}
                          &middot; {r.date} &middot; {r.start_time} &mdash;{" "}
                          {r.end_time}
                          {r.user_phone && <span className="ml-1">&middot; {r.user_phone}</span>}
                          {r.preorder_note && (
                            <span className="ml-2 text-amber-400/60">
                              {r.preorder_note}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => goToRestaurantFloorplan(r)}
                        className="text-xs bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 px-3 py-1.5 rounded-lg transition border border-purple-500/20"
                        title="View restaurant floor plan"
                      >
                        View
                      </button>
                      <button
                        onClick={() =>
                          handleStatusChange(r.id, "confirmed")
                        }
                        className="text-xs bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 px-3 py-1.5 rounded-lg transition border border-emerald-500/20 font-semibold"
                      >
                        &#x2713; Approve
                      </button>
                      <button
                        onClick={() =>
                          handleStatusChange(r.id, "declined")
                        }
                        className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg transition border border-red-500/10 font-semibold"
                      >
                        &#x2715; Reject
                      </button>
                      <button
                        onClick={() =>
                          setDismissedIds(
                            (prev) => new Set([...Array.from(prev), r.id])
                          )
                        }
                        className="text-purple-300/20 hover:text-purple-300/50 transition p-1"
                        title="Dismiss"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            HOME — Location Grid
            ═══════════════════════════════════════════════════════ */}
        {view.page === "home" && (isSuperAdmin || !adminRestaurantId) && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-bold text-white mb-1">
                Locations
              </h2>
              <p className="text-sm text-purple-200/30">
                Select a location to view its restaurants
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {locations.map((loc) => {
                const locRestaurants = restaurants.filter(
                  (r) => r.location_id === loc.id
                );
                const locReservationCount = locRestaurants.reduce(
                  (sum, r) =>
                    sum + (reservationCountByRestaurant[r.id] || 0),
                  0
                );
                return (
                  <button
                    key={loc.id}
                    onClick={() =>
                      setView({
                        page: "restaurants",
                        locationId: loc.id,
                        locationName: loc.name,
                      })
                    }
                    className="relative bg-white/[0.04] border border-purple-500/10 rounded-xl p-5 text-left hover:bg-white/[0.07] hover:border-purple-500/20 transition group"
                  >
                    <div className="text-2xl mb-2 opacity-60 group-hover:opacity-100 transition">
                      <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                    </div>
                    <div className="text-sm font-semibold text-white mb-1">
                      {loc.name}
                    </div>
                    <div className="text-xs text-purple-200/30">
                      {locRestaurants.length} restaurant
                      {locRestaurants.length !== 1 ? "s" : ""}
                    </div>
                    {locReservationCount > 0 && (
                      <span className="absolute top-3 right-3 w-5 h-5 bg-emerald-500/80 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                        {locReservationCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            RESTAURANTS in a Location
            ═══════════════════════════════════════════════════════ */}
        {view.page === "restaurants" && (isSuperAdmin || !adminRestaurantId) && (
          <div>
            <div className="mb-6">
              <button
                onClick={() => setView({ page: "home" })}
                className="text-xs text-purple-400/60 hover:text-purple-400 transition mb-3 flex items-center gap-1"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to locations
              </button>
              <h2 className="text-lg font-bold text-white mb-1">
                Restaurants in {view.locationName}
              </h2>
              <p className="text-sm text-purple-200/30">
                Select a restaurant to manage its tables
              </p>
            </div>
            {filteredRestaurants.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-3 opacity-20">
                  <svg className="w-12 h-12 mx-auto text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11V4a1 1 0 00-1-1h-1a1 1 0 00-1 1v7m4 0H12m3 0v9m-3-9v9M5 3v5a3 3 0 003 3m-3-8h6M8 11v10" />
                  </svg>
                </div>
                <p className="text-purple-200/30">
                  No restaurants in this location
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredRestaurants.map((r) => (
                  <button
                    key={r.id}
                    onClick={() =>
                      setView({
                        page: "floorplan",
                        restaurantId: r.id,
                        restaurantName: r.name,
                      })
                    }
                    className="relative bg-white/[0.04] border border-purple-500/10 rounded-xl p-5 text-left hover:bg-white/[0.07] hover:border-purple-500/20 transition group"
                  >
                    <h3 className="text-sm font-semibold text-white mb-1 group-hover:text-purple-300 transition">
                      {r.name}
                    </h3>
                    {r.address && (
                      <p className="text-xs text-purple-200/30 mb-0.5">
                        {r.address}
                      </p>
                    )}
                    {r.phone && (
                      <p className="text-xs text-purple-200/30">
                        {r.phone}
                      </p>
                    )}
                    {reservationCountByRestaurant[r.id] > 0 && (
                      <span className="absolute top-3 right-3 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                        {reservationCountByRestaurant[r.id]} reservation
                        {reservationCountByRestaurant[r.id] > 1 ? "s" : ""}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            FLOOR PLAN — view tables + block/unblock
            ═══════════════════════════════════════════════════════ */}
        {view.page === "floorplan" && (
          <div>
            <div className="mb-6">
              {(isSuperAdmin || !adminRestaurantId) && (
                <button
                  onClick={() => {
                    const rest = restaurants.find(
                      (r) => r.id === view.restaurantId
                    );
                    const loc = locations.find(
                      (l) => l.id === rest?.location_id
                    );
                    if (loc) {
                      setView({
                        page: "restaurants",
                        locationId: loc.id,
                        locationName: loc.name,
                      });
                    } else {
                      setView({ page: "home" });
                    }
                  }}
                  className="text-xs text-purple-400/60 hover:text-purple-400 transition mb-3 flex items-center gap-1"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Back to restaurants
                </button>
              )}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {view.restaurantName}
                  </h2>
                  <p className="text-sm text-purple-200/30">
                    Click a table to block/unblock it
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-purple-200/40">Date:</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-white/[0.06] border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50 transition"
                  />
                </div>
              </div>
            </div>

            {/* Reservations for this restaurant on selected date */}
            {(() => {
              const restReservations = allReservations.filter(
                (r) =>
                  r.restaurant_id === view.restaurantId &&
                  r.date === selectedDate
              );
              if (restReservations.length === 0) return null;
              return (
                <div className="mb-6 bg-white/[0.03] border border-purple-500/10 rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-purple-200/50 uppercase tracking-wider mb-3">
                    Reservations for {selectedDate}
                  </h3>
                  <div className="space-y-2">
                    {restReservations.map((r) => {
                      const tbl = tables.find((t) => t.id === r.table_id);
                      return (
                        <div
                          key={r.id}
                          className="flex items-center justify-between gap-3 text-sm"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                r.status === "confirmed"
                                  ? "bg-emerald-400"
                                  : r.status === "pending"
                                  ? "bg-yellow-400 animate-pulse"
                                  : r.status === "cancelled"
                                  ? "bg-white/30"
                                  : "bg-red-400"
                              }`}
                            />
                            <span className="text-white truncate">
                              {r.user_name}
                            </span>
                            <span className="text-purple-200/30">
                              {tbl?.name || "Table #" + r.table_id}
                            </span>
                            <span className="text-purple-200/30">
                              {r.start_time} &mdash; {r.end_time}
                            </span>
                            {r.preorder_note && (
                              <span className="text-amber-400/50 text-xs truncate max-w-[150px]">
                                {r.preorder_note}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                r.status === "confirmed"
                                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                                  : r.status === "pending"
                                  ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20"
                                  : r.status === "cancelled"
                                  ? "bg-white/5 text-white/30 border border-white/10"
                                  : "bg-red-500/15 text-red-400 border border-red-500/20"
                              }`}
                            >
                              {r.status}
                            </span>
                            {r.status === "pending" && (
                              <>
                                <button
                                  onClick={() => handleStatusChange(r.id, "confirmed")}
                                  className="text-[10px] text-emerald-400/80 hover:text-emerald-400 px-1.5 py-0.5 rounded transition font-semibold"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleStatusChange(r.id, "declined")}
                                  className="text-[10px] text-red-400/60 hover:text-red-400 px-1.5 py-0.5 rounded transition"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {r.status === "confirmed" && (
                              <>
                                <button
                                  onClick={() =>
                                    handleStatusChange(r.id, "cancelled")
                                  }
                                  className="text-[10px] text-white/30 hover:text-white/60 px-1.5 py-0.5 rounded transition"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() =>
                                    handleStatusChange(r.id, "declined")
                                  }
                                  className="text-[10px] text-red-400/60 hover:text-red-400 px-1.5 py-0.5 rounded transition"
                                >
                                  Decline
                                </button>
                              </>
                            )}
                            {r.status !== "confirmed" && r.status !== "pending" && (
                              <button
                                onClick={() =>
                                  handleStatusChange(r.id, "confirmed")
                                }
                                className="text-[10px] text-emerald-400/60 hover:text-emerald-400 px-1.5 py-0.5 rounded transition"
                              >
                                Confirm
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Floor plan + block panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Floor plan canvas */}
              <div className="lg:col-span-2 bg-white/[0.04] border border-purple-500/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white">Floor Plan</h3>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                      <span className="text-xs text-white/40">Available</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60 animate-pulse" />
                      <span className="text-xs text-white/40">Pending</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                      <span className="text-xs text-white/40">Reserved</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                      <span className="text-xs text-white/40">Blocked</span>
                    </div>
                  </div>
                </div>
                <div
                  className="relative bg-[#0d0818] border border-purple-500/10 rounded-xl overflow-hidden"
                  style={{
                    width: "100%",
                    maxWidth: "700px",
                    height: "520px",
                  }}
                >
                  {/* Grid background */}
                  <svg
                    className="absolute inset-0 w-full h-full opacity-[0.03]"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <pattern
                        id="admin-grid"
                        width="40"
                        height="40"
                        patternUnits="userSpaceOnUse"
                      >
                        <path
                          d="M 40 0 L 0 0 0 40"
                          fill="none"
                          stroke="#a855f7"
                          strokeWidth="0.5"
                        />
                      </pattern>
                    </defs>
                    <rect
                      width="100%"
                      height="100%"
                      fill="url(#admin-grid)"
                    />
                  </svg>
                  {tables.map((table) => {
                    const colorClass =
                      table.status === "available"
                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25"
                        : table.status === "pending"
                        ? "bg-yellow-500/15 border-yellow-500/40 text-yellow-300 hover:bg-yellow-500/25 animate-pulse"
                        : table.status === "reserved"
                        ? "bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25"
                        : "bg-red-500/15 border-red-500/30 text-red-300 hover:bg-red-500/25";
                    const isSelected = blockTableId === table.id;
                    return (
                      <div
                        key={table.id}
                        onClick={() => setBlockTableId(table.id)}
                        className={`absolute flex flex-col items-center justify-center border-2 cursor-pointer transition-all ${colorClass} ${
                          isSelected
                            ? "ring-2 ring-purple-500 ring-offset-2 ring-offset-[#0d0818] shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                            : ""
                        }`}
                        style={{
                          left: table.position_x,
                          top: table.position_y,
                          width: table.width,
                          height: table.height,
                          borderRadius:
                            table.shape === "circle" ? "50%" : "14px",
                        }}
                      >
                        <span className="font-bold text-xs">
                          {table.name}
                        </span>
                        <span className="text-[10px] opacity-70">
                          {table.capacity} seats
                        </span>
                        {table.zone && (
                          <span className="text-[9px] opacity-50">
                            {table.zone}
                          </span>
                        )}
                        <span className="text-[9px] capitalize opacity-60 mt-0.5">
                          {table.status === "available"
                            ? "\u2713 Empty"
                            : table.status === "pending"
                            ? "\u25CB Pending"
                            : table.status === "reserved"
                            ? "\u25C9 Occupied"
                            : "\u2715 Blocked"}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {/* Summary bar */}
                <div className="mt-4 flex gap-6 text-xs text-purple-200/40">
                  <span>
                    Total:{" "}
                    <span className="text-white font-medium">
                      {tables.length}
                    </span>
                  </span>
                  <span>
                    Empty:{" "}
                    <span className="text-emerald-400 font-medium">
                      {
                        tables.filter((t) => t.status === "available")
                          .length
                      }
                    </span>
                  </span>
                  <span>
                    Pending:{" "}
                    <span className="text-yellow-400 font-medium">
                      {
                        tables.filter((t) => t.status === "pending")
                          .length
                      }
                    </span>
                  </span>
                  <span>
                    Occupied:{" "}
                    <span className="text-amber-400 font-medium">
                      {
                        tables.filter((t) => t.status === "reserved")
                          .length
                      }
                    </span>
                  </span>
                  <span>
                    Blocked:{" "}
                    <span className="text-red-400 font-medium">
                      {
                        tables.filter((t) => t.status === "blocked")
                          .length
                      }
                    </span>
                  </span>
                </div>
              </div>

              {/* Status / Block panel */}
              <div className="bg-white/[0.04] border border-purple-500/10 rounded-2xl p-6 h-fit">
                <h3 className="text-sm font-bold text-white mb-2">
                  Table Status
                </h3>
                <p className="text-purple-200/30 text-xs mb-5">
                  Click a table, then set its status or block a time range.
                </p>

                {/* Selected table */}
                <div className="mb-5">
                  <label className="block text-xs font-medium text-purple-200/50 mb-1.5">
                    Selected Table
                  </label>
                  <div className="bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm flex items-center gap-2">
                    {blockTableId ? (
                      <>
                        <div
                          className={`w-2 h-2 rounded-full ${
                            tables.find((t) => t.id === blockTableId)
                              ?.status === "available"
                              ? "bg-emerald-400"
                              : tables.find(
                                  (t) => t.id === blockTableId
                                )?.status === "pending"
                              ? "bg-yellow-400 animate-pulse"
                              : tables.find(
                                  (t) => t.id === blockTableId
                                )?.status === "reserved"
                              ? "bg-amber-400"
                              : "bg-red-400"
                          }`}
                        />
                        <span className="text-white">
                          {tables.find((t) => t.id === blockTableId)
                            ?.name || "Table #" + blockTableId}
                        </span>
                        <span className="text-purple-200/30 text-xs capitalize">
                          (
                          {tables.find((t) => t.id === blockTableId)
                            ?.status === "available"
                            ? "Empty"
                            : tables.find((t) => t.id === blockTableId)
                                ?.status === "pending"
                            ? "Pending"
                            : tables.find((t) => t.id === blockTableId)
                                ?.status === "reserved"
                            ? "Occupied"
                            : "Blocked"}
                          )
                        </span>
                      </>
                    ) : (
                      <span className="text-purple-200/20">
                        Click a table...
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick status buttons */}
                {blockTableId && (
                  <div className="mb-5">
                    <label className="block text-xs font-medium text-purple-200/50 mb-2">
                      Set Status for {selectedDate}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          if (!token || !blockTableId) return;
                          try {
                            await api.adminSetTableStatus(token, blockTableId, "empty", selectedDate);
                            setBlockError("");
                            refreshFloorplan();
                            refreshReservations();
                            showToast("Successfully set to Empty!", "success");
                          } catch (err: any) {
                            setBlockError(err.message || "Failed");
                            showToast(err.message || "Failed to set Empty", "error");
                          }
                        }}
                        className={`py-2 rounded-xl text-xs font-semibold transition border ${
                          tables.find((t) => t.id === blockTableId)?.status === "available"
                            ? "bg-emerald-500/30 border-emerald-500/50 text-emerald-300"
                            : "bg-white/[0.04] border-white/10 text-emerald-400 hover:bg-emerald-500/15 hover:border-emerald-500/30"
                        }`}
                      >
                        &#x2713; Empty
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!token || !blockTableId) return;
                          try {
                            await api.adminSetTableStatus(token, blockTableId, "occupied", selectedDate);
                            setBlockError("");
                            refreshFloorplan();
                            showToast("Successfully set to Occupied!", "success");
                          } catch (err: any) {
                            setBlockError(err.message || "Failed");
                            showToast(err.message || "Failed to set Occupied", "error");
                          }
                        }}
                        className={`py-2 rounded-xl text-xs font-semibold transition border ${
                          tables.find((t) => t.id === blockTableId)?.status === "reserved"
                            ? "bg-amber-500/30 border-amber-500/50 text-amber-300"
                            : "bg-white/[0.04] border-white/10 text-amber-400 hover:bg-amber-500/15 hover:border-amber-500/30"
                        }`}
                      >
                        &#x25C9; Occupied
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!token || !blockTableId) return;
                          try {
                            await api.adminSetTableStatus(token, blockTableId, "blocked", selectedDate);
                            setBlockError("");
                            refreshFloorplan();
                            refreshReservations();
                            showToast("Successfully Blocked!", "success");
                          } catch (err: any) {
                            setBlockError(err.message || "Failed");
                            showToast(err.message || "Failed to Block", "error");
                          }
                        }}
                        className={`py-2 rounded-xl text-xs font-semibold transition border ${
                          tables.find((t) => t.id === blockTableId)?.status === "blocked"
                            ? "bg-red-500/30 border-red-500/50 text-red-300"
                            : "bg-white/[0.04] border-white/10 text-red-400 hover:bg-red-500/15 hover:border-red-500/30"
                        }`}
                      >
                        &#x2715; Blocked
                      </button>
                    </div>
                    {blockError && (
                      <div className="mt-3 bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded-lg text-sm">
                        {blockError}
                      </div>
                    )}
                  </div>
                )}

                {/* Reservations on this table */}
                {blockTableId && (() => {
                  const tableReservations = allReservations.filter(
                    (r) => r.table_id === blockTableId && r.date === selectedDate
                  );
                  if (tableReservations.length === 0) return null;
                  return (
                    <div className="mb-5 border-t border-purple-500/10 pt-4">
                      <label className="block text-xs font-semibold text-purple-200/40 uppercase tracking-wider mb-2">
                        Reservations on this table
                      </label>
                      <div className="space-y-2">
                        {tableReservations.map((r) => (
                          <div
                            key={r.id}
                            className="bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <div className="text-xs text-white font-medium truncate">
                                {r.user_name}
                                <span className="text-purple-200/30 ml-1">#{r.id}</span>
                              </div>
                              <div className="text-[10px] text-purple-200/40">
                                {r.start_time} — {r.end_time}
                                {r.user_phone && <span className="ml-1">· {r.user_phone}</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                                  r.status === "confirmed"
                                    ? "bg-emerald-500/15 text-emerald-400"
                                    : r.status === "pending"
                                    ? "bg-yellow-500/15 text-yellow-400"
                                    : r.status === "cancelled"
                                    ? "bg-white/5 text-white/30"
                                    : "bg-red-500/15 text-red-400"
                                }`}
                              >
                                {r.status}
                              </span>
                              {r.status === "pending" && (
                                <>
                                  <button
                                    onClick={async () => {
                                      await handleStatusChange(r.id, "confirmed");
                                      refreshFloorplan();
                                    }}
                                    className="text-[10px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded transition border border-emerald-500/10 font-semibold"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={async () => {
                                      await handleStatusChange(r.id, "declined");
                                      refreshFloorplan();
                                    }}
                                    className="text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-400 px-2 py-0.5 rounded transition border border-red-500/10"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {r.status === "confirmed" && (
                                <button
                                  onClick={async () => {
                                    await handleStatusChange(r.id, "cancelled");
                                    refreshFloorplan();
                                  }}
                                  className="text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-400 px-2 py-0.5 rounded transition border border-red-500/10"
                                >
                                  Cancel
                                </button>
                              )}
                              {r.status !== "confirmed" && r.status !== "pending" && (
                                <button
                                  onClick={async () => {
                                    await handleStatusChange(r.id, "confirmed");
                                    refreshFloorplan();
                                  }}
                                  className="text-[10px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded transition border border-emerald-500/10"
                                >
                                  Restore
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Block with time range */}
                <div className="border-t border-purple-500/10 pt-5 mt-2">
                  <h4 className="text-xs font-semibold text-purple-200/40 uppercase tracking-wider mb-3">
                    Block Time Range
                  </h4>
                  <form onSubmit={handleBlockTable} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-purple-200/50 mb-1.5">
                          Start
                        </label>
                        <input
                          type="time"
                          value={blockStartTime}
                          onChange={(e) =>
                            setBlockStartTime(e.target.value)
                          }
                          className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50 transition"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-purple-200/50 mb-1.5">
                          End
                        </label>
                        <input
                          type="time"
                          value={blockEndTime}
                          onChange={(e) => setBlockEndTime(e.target.value)}
                          className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50 transition"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-purple-200/50 mb-1.5">
                        Reason
                      </label>
                      <input
                        type="text"
                        value={blockReason}
                        onChange={(e) => setBlockReason(e.target.value)}
                        className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50 transition placeholder-white/20"
                        placeholder="Maintenance, VIP, etc."
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!blockTableId}
                      className="w-full bg-red-500/80 hover:bg-red-500 text-white py-2.5 rounded-xl font-medium transition disabled:opacity-30 disabled:cursor-not-allowed text-sm"
                    >
                      Block Time Range
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
          TOAST NOTIFICATION — fixed bottom-center overlay
          ═══════════════════════════════════════════════════════ */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-[slideUp_0.3s_ease-out]">
          <div
            className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border backdrop-blur-xl ${
              toast.type === "success"
                ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
                : toast.type === "error"
                ? "bg-red-500/20 border-red-500/30 text-red-300"
                : "bg-purple-500/20 border-purple-500/30 text-purple-300"
            }`}
          >
            <span className="text-lg flex-shrink-0">
              {toast.type === "success" ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : toast.type === "error" ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
              )}
            </span>
            <span className="text-sm font-semibold">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 opacity-50 hover:opacity-100 transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
