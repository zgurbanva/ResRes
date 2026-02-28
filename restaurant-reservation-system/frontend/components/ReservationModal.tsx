"use client";

import { useState } from "react";
import { api } from "@/services/api";
import { TableAvailability } from "@/types";
import { useLanguage } from "@/lib/LanguageContext";

interface Props {
  table: TableAvailability;
  restaurantId: number;
  date: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReservationModal({
  table,
  restaurantId,
  date,
  onClose,
  onSuccess,
}: Props) {
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("20:00");
  const [userName, setUserName] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [preorderNote, setPreorderNote] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!userName.trim()) {
      setError(t("nameRequired"));
      return;
    }
    if (startTime >= endTime) {
      setError(t("startBeforeEnd"));
      return;
    }

    setSubmitting(true);
    try {
      await api.createReservation({
        table_id: table.id,
        restaurant_id: restaurantId,
        date,
        start_time: startTime,
        end_time: endTime,
        user_name: userName,
        user_phone: userPhone,
        user_email: userEmail,
        preorder_note: preorderNote || undefined,
      });
      setSuccess(true);
      setTimeout(onSuccess, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to create reservation");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#1a1128] border border-purple-500/15 rounded-2xl shadow-glow-lg max-w-md w-full p-7 relative animate-fade-in">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
        >
          <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-dot"></div>
            <span className="text-xs text-emerald-400 font-medium">{t("available")}</span>
          </div>
          <h2 className="text-2xl font-bold text-white">
            {t("reserve")} {table.name}
          </h2>
          <p className="text-purple-200/40 text-sm mt-1">
            {table.capacity} {t("seats")} &middot; {new Date(date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            {table.zone && (
              <span className="ml-2 inline-flex items-center gap-1 text-purple-300/60">
                &middot; <span className="text-purple-300/80 font-medium">{table.zone}</span> {t("zone")}
              </span>
            )}
          </p>
        </div>

        {success ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/15 border-2 border-emerald-500/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-xl font-bold text-white mb-1">
              {t("reservationConfirmed")}
            </p>
            <p className="text-purple-200/40 text-sm">
              {table.name} &middot; {startTime} — {endTime}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-purple-200/50 mb-1.5">
                  {t("startTime")}
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="input-dark w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-purple-200/50 mb-1.5">
                  {t("endTime")}
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="input-dark w-full"
                  required
                />
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-purple-200/50 mb-1.5">
                Your Name <span className="text-purple-400">*</span>
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="input-dark w-full"
                placeholder="Enter your name"
                required
              />
            </div>

            {/* Phone + Email */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-purple-200/50 mb-1.5">
                  {t("phone")} <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  className="input-dark w-full"
                  placeholder="+994 50 ..."
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-purple-200/50 mb-1.5">
                  {t("email")} <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="input-dark w-full"
                  placeholder="you@email.com"
                  required
                />
              </div>
            </div>

            {/* Pre-order note */}
            <div>
              <label className="block text-xs font-medium text-purple-200/50 mb-1.5">
                {t("specialRequest")}
              </label>
              <textarea
                value={preorderNote}
                onChange={(e) => setPreorderNote(e.target.value)}
                className="input-dark w-full resize-none"
                rows={3}
                placeholder={t("specialRequestPlaceholder")}
              />
              <p className="text-[10px] text-purple-200/20 mt-1">{t("specialRequestHint")}</p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2.5 rounded-xl text-sm">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="flex items-center justify-center gap-2">
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t("reserving")}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {t("confirmReservation")}
                  </>
                )}
              </span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
