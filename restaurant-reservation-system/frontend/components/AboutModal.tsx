"use client";

import { useLanguage } from "@/lib/LanguageContext";

interface AboutModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AboutModal({ open, onClose }: AboutModalProps) {
  const { t } = useLanguage();
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-md bg-gradient-to-br from-[#1a0e2e] to-[#0f0a1a] border border-purple-500/20 rounded-2xl p-8 shadow-2xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-purple-300/30 hover:text-purple-300/70 transition"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center mb-4 shadow-glow relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.15)_0%,transparent_50%)]" />
            <svg className="w-8 h-8 relative z-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 4h7a5 5 0 010 10h-2l5 6M7 4v16M7 14h5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M7 4h7a5 5 0 010 10" stroke="url(#rGlowAbout)" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
              <defs>
                <linearGradient id="rGlowAbout" x1="7" y1="4" x2="19" y2="14">
                  <stop stopColor="#e9d5ff" />
                  <stop offset="1" stopColor="#a855f7" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            {t("about")} <span className="text-purple-400">ResRes</span>
          </h2>
        </div>

        {/* Divider */}
        <div className="w-12 h-px bg-purple-500/20 mx-auto mb-6" />

        {/* Message */}
        <p className="text-sm text-purple-200/70 text-center leading-relaxed">
          {t("aboutDescription")}
        </p>

        {/* Footer accent */}
        <div className="mt-8 flex justify-center">
          <div className="flex items-center gap-2 text-purple-300/20 text-[10px]">
            <div className="w-3 h-px bg-purple-500/15" />
            <span className="tracking-widest uppercase">2026</span>
            <div className="w-3 h-px bg-purple-500/15" />
          </div>
        </div>
      </div>
    </div>
  );
}
