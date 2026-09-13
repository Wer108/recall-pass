import React, { useState } from "react";
import { Sparkles, Clock, ShieldAlert, ArrowRight, Check, RotateCcw } from "lucide-react";
import { SessionData } from "../types";

interface PremiumExpiredCardProps {
  session: Partial<SessionData>;
  onResetCode?: () => void;
  onReactivateForTesting?: () => void;
}

export const PremiumExpiredCard: React.FC<PremiumExpiredCardProps> = ({
  session,
  onResetCode,
  onReactivateForTesting,
}) => {
  const [upgraded, setUpgraded] = useState(false);
  const [showExtensionRequested, setShowExtensionRequested] = useState(false);

  const formattedExpiry = session.expiresAt
    ? new Date(session.expiresAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Recently";

  return (
    <div id="premium-expired-container" className="max-w-2xl mx-auto space-y-6">
      {/* Expired Status Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-[#C98A2C]/15 text-[#C98A2C] flex items-center justify-center shrink-0 mt-0.5">
          <Clock className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-amber-950">
            Complimentary Access Window Expired
          </h3>
          <p className="text-xs text-amber-800 mt-0.5">
            The 60-day attendee recall window for code{" "}
            <span className="font-mono font-bold">{session.accessCode}</span>{" "}
            concluded on {formattedExpiry}. Content has been archived.
          </p>
        </div>
      </div>

      {/* Main Upgrade Card */}
      <div className="bg-white rounded-2xl border-2 border-[#C98A2C]/30 shadow-md overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#C98A2C]/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header with warm gold badge */}
        <div className="bg-[#0F2540] p-6 text-white text-center sm:text-left relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C98A2C] text-white text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>RecallPass Archival Access</span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight">
            Upgrade to RecallPass Premium
          </h2>
          <p className="text-slate-300 text-sm mt-1 max-w-xl">
            Retain continuous, permanent recall access to{" "}
            <span className="font-semibold text-white">
              "{session.title || "Session Notes"}"
            </span>{" "}
            and unlock perpetual knowledge retention tools.
          </p>
        </div>

        {/* Feature Comparison / Value Prop */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="w-5 h-5 rounded-full bg-[#0F2540] text-[#C98A2C] flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#0F2540]">
                  Permanent Note Archival
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  No 60-day expiration date; permanent search and review.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="w-5 h-5 rounded-full bg-[#0F2540] text-[#C98A2C] flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#0F2540]">
                  Real Q&A Deep Vault
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Verified audience interactions indexed for rapid reference.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="w-5 h-5 rounded-full bg-[#0F2540] text-[#C98A2C] flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#0F2540]">
                  Export to Markdown & PDF
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Download clean formatted briefs for Obsidian, Notion, or print.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="w-5 h-5 rounded-full bg-[#0F2540] text-[#C98A2C] flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#0F2540]">
                  Cross-Session Synthesis
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Connect recall insights across multiple conferences and keynotes.
                </p>
              </div>
            </div>
          </div>

          {/* Pricing & CTA */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-[#0F2540]">
                  $8
                </span>
                <span className="text-xs text-slate-500">
                  / session pass or $29/year all-access
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Cancel anytime • Instant access activation
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {upgraded ? (
                <div className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Premium Access Activated!</span>
                </div>
              ) : (
                <button
                  id="btn-upgrade-premium"
                  onClick={() => {
                    setUpgraded(true);
                    if (onReactivateForTesting) {
                      setTimeout(() => {
                        onReactivateForTesting();
                      }, 1200);
                    }
                  }}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#C98A2C] hover:bg-[#B57921] text-white text-sm font-semibold shadow-md transition-all flex items-center justify-center gap-2 group"
                >
                  <span>Upgrade to Premium</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              )}
            </div>
          </div>

          {/* Alternative: Request Extension / Tester shortcut */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
            <div>
              {showExtensionRequested ? (
                <span className="text-emerald-700 font-medium">
                  Extension request sent to event organizers.
                </span>
              ) : (
                <button
                  id="btn-request-extension"
                  onClick={() => setShowExtensionRequested(true)}
                  className="hover:underline text-slate-600"
                >
                  Are you an enrolled student or faculty? Request organizer extension →
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {onReactivateForTesting && (
                <button
                  id="btn-demo-reactivate"
                  onClick={onReactivateForTesting}
                  className="text-xs text-[#0F6E56] font-medium hover:underline flex items-center gap-1"
                  title="Demo feature: Toggle expiry date to test active view"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>(Demo: Reactivate Pass)</span>
                </button>
              )}

              {onResetCode && (
                <button
                  id="btn-back-to-code"
                  onClick={onResetCode}
                  className="text-xs text-slate-600 hover:text-slate-900 font-medium hover:underline"
                >
                  Enter another code
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
