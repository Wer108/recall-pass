import React, { useState } from "react";
import { Check, Copy, ExternalLink, Sparkles, Calendar, KeyRound } from "lucide-react";
import { SessionData } from "../types";

interface PublishModalProps {
  session: SessionData;
  onClose: () => void;
  onViewAsAttendee: (code: string) => void;
}

export const PublishModal: React.FC<PublishModalProps> = ({
  session,
  onClose,
  onViewAsAttendee,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const directUrl = `${window.location.origin}?code=${session.accessCode}`;

  const copyCode = () => {
    navigator.clipboard.writeText(session.accessCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(directUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const formattedExpiry = new Date(session.expiresAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      id="publish-modal-backdrop"
      className="fixed inset-0 z-50 bg-[#0F2540]/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div
        id="publish-success-card"
        className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="bg-[#0F2540] p-6 text-white text-center relative">
          <div className="w-12 h-12 rounded-full bg-[#C98A2C] text-white flex items-center justify-center mx-auto mb-3 shadow-md">
            <Check className="w-6 h-6 stroke-[3]" />
          </div>

          <span className="text-xs uppercase font-semibold tracking-wider text-[#C98A2C]">
            Session Published Successfully
          </span>
          <h2 className="text-xl font-bold mt-1 text-white">
            RecallPass Is Ready For Attendees
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto line-clamp-1">
            "{session.title}"
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Access Code Display */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Attendee Access Code
            </span>
            <div className="flex items-center justify-center gap-3">
              <span className="font-mono text-3xl font-extrabold tracking-wider text-[#0F2540]">
                {session.accessCode}
              </span>
              <button
                id="btn-copy-published-code"
                onClick={copyCode}
                className="p-2 rounded-lg bg-white border border-slate-300 hover:border-[#0F2540] text-slate-700 hover:text-[#0F2540] transition-colors"
                title="Copy access code"
              >
                {copiedCode ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Attendees can enter this pass ID on any phone or laptop.
            </p>
          </div>

          {/* Expiration Details */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[#FDF7ED] border border-[#E8BF78]">
            <Calendar className="w-5 h-5 text-[#C98A2C] shrink-0" />
            <div className="text-xs text-amber-950">
              <span className="font-semibold">60-Day Validity Window:</span> Active
              until{" "}
              <span className="font-bold underline">{formattedExpiry}</span> (2
              months from today).
            </div>
          </div>

          {/* Direct Link Share */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Direct Attendee Link
            </label>
            <div className="flex items-center gap-2">
              <input
                id="direct-attendee-url-input"
                type="text"
                readOnly
                value={directUrl}
                className="flex-1 text-xs text-slate-600 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 select-all"
              />
              <button
                id="btn-copy-direct-url"
                onClick={copyLink}
                className="px-3 py-2 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1.5 shrink-0"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              id="btn-modal-view-attendee"
              onClick={() => onViewAsAttendee(session.accessCode)}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#0F2540] hover:bg-[#17375E] text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-xs"
            >
              <KeyRound className="w-4 h-4 text-[#C98A2C]" />
              <span>View Attendee Experience</span>
            </button>
            <button
              id="btn-modal-close"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
