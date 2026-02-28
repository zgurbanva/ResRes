"use client";

import { useState } from "react";
import { api } from "@/services/api";
import { useLanguage } from "@/lib/LanguageContext";

interface SuggestionsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SuggestionsModal({ open, onClose }: SuggestionsModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const { t } = useLanguage();

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setError(t("fillAllFields"));
      return;
    }
    setError("");
    setSending(true);
    try {
      await api.sendMessage({ name: name.trim(), email: email.trim(), subject: subject.trim(), message: message.trim() });
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setName("");
    setEmail("");
    setSubject("");
    setMessage("");
    setSent(false);
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative z-10 w-full max-w-lg bg-gradient-to-br from-[#1a0e2e] to-[#0f0a1a] border border-purple-500/20 rounded-2xl shadow-2xl animate-fade-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-7 pt-7 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-glow relative overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.15)_0%,transparent_50%)]" />
              <svg className="w-5 h-5 relative z-10" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{t("suggestionsFeedback")}</h2>
              <p className="text-[11px] text-purple-300/40">{t("sendMessageToDev")}</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-purple-300/30 hover:text-purple-300/70 transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="w-full h-px bg-purple-500/10" />

        {sent ? (
          /* Success state */
          <div className="px-7 py-12 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{t("messageSent")}</h3>
            <p className="text-sm text-purple-200/50 mb-6 max-w-xs">
              {t("thankYouFeedback")}
            </p>
            <button
              onClick={handleClose}
              className="text-sm bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-6 py-2 rounded-xl transition border border-purple-500/20"
            >
              {t("close")}
            </button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="px-7 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-purple-300/40 mb-1.5 uppercase tracking-wider">{t("name")}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("yourNamePlaceholder")}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-purple-300/20 focus:outline-none focus:border-purple-500/30 focus:bg-white/[0.06] transition"
                />
              </div>
              <div>
                <label className="block text-[11px] text-purple-300/40 mb-1.5 uppercase tracking-wider">{t("email")}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("emailPlaceholder")}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-purple-300/20 focus:outline-none focus:border-purple-500/30 focus:bg-white/[0.06] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-purple-300/40 mb-1.5 uppercase tracking-wider">{t("subject")}</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/30 focus:bg-white/[0.06] transition appearance-none"
                style={{ colorScheme: "dark" }}
              >
                <option value="" className="bg-[#1a0e2e]">{t("selectTopic")}</option>
                <option value="Suggestion" className="bg-[#1a0e2e]">{t("suggestion")}</option>
                <option value="Bug Report" className="bg-[#1a0e2e]">{t("bugReport")}</option>
                <option value="Feature Request" className="bg-[#1a0e2e]">{t("featureRequest")}</option>
                <option value="General Feedback" className="bg-[#1a0e2e]">{t("generalFeedback")}</option>
                <option value="Other" className="bg-[#1a0e2e]">{t("other")}</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-purple-300/40 mb-1.5 uppercase tracking-wider">{t("message")}</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("writeMessagePlaceholder")}
                rows={4}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-purple-300/20 focus:outline-none focus:border-purple-500/30 focus:bg-white/[0.06] transition resize-none"
              />
            </div>

            {error && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/15 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-semibold py-2.5 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-lg shadow-purple-500/20"
            >
              {sending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t("sending")}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  {t("sendMessage")}
                </span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
