import React, { useState } from "react";
import {
  Link,
  Music,
  Video,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Globe,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

interface UrlMediaIngestionProps {
  onUrlLoaded: (trackInfo: {
    url: string;
    mediaType: "audio" | "video";
    trackName: string;
    trackDuration: string;
    trackSize?: string;
  }) => void;
  currentType: "audio" | "video";
}

const SAMPLE_MEDIA_URLS = [
  {
    name: "Dr. Thorne Keynote (Audio)",
    url: "https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg",
    mediaType: "audio" as const,
    title: "Designing Resilient Distributed Systems Keynote",
    duration: "48:15",
  },
  {
    name: "AI & Vector Search (Video)",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    mediaType: "video" as const,
    title: "Billion-Scale Vector Search & ANN Traversal",
    duration: "15:00",
  },
  {
    name: "Cognitive Pedagogy (Audio)",
    url: "https://actions.google.com/sounds/v1/science_fiction/deep_pulse_hum.ogg",
    mediaType: "audio" as const,
    title: "Cognitive Architecture & Retrieval Dynamics",
    duration: "42:30",
  },
];

export const UrlMediaIngestion: React.FC<UrlMediaIngestionProps> = ({
  onUrlLoaded,
  currentType,
}) => {
  const [urlInput, setUrlInput] = useState("");
  const [mediaType, setMediaType] = useState<"audio" | "video">(currentType);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleValidateAndLoad = (targetUrl?: string, overrideType?: "audio" | "video", presetTitle?: string, presetDuration?: string) => {
    const cleanUrl = (targetUrl || urlInput).trim();
    const typeToUse = overrideType || mediaType;

    if (!cleanUrl) {
      setError("Please enter a valid media stream or file URL.");
      return;
    }

    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      setError("URL must start with http:// or https://");
      return;
    }

    setIsValidating(true);
    setError(null);

    // Derive track name from URL pathname
    let derivedName = "Remote Media Stream";
    try {
      const parsedUrl = new URL(cleanUrl);
      const pathname = parsedUrl.pathname;
      const fileName = pathname.split("/").pop() || "";
      if (fileName && fileName.includes(".")) {
        derivedName = decodeURIComponent(fileName);
      } else if (presetTitle) {
        derivedName = `${presetTitle.slice(0, 30)}.mp3`;
      } else {
        derivedName = `${parsedUrl.hostname}_stream_${typeToUse}`;
      }
    } catch {
      derivedName = `stream_track_${typeToUse}`;
    }

    // Auto-detect audio vs video from extension if not overridden
    let detectedType = typeToUse;
    if (/\.(mp4|webm|mov|mkv|avi|m4v)/i.test(cleanUrl)) {
      detectedType = "video";
    } else if (/\.(mp3|wav|m4a|aac|flac|ogg|opus)/i.test(cleanUrl)) {
      detectedType = "audio";
    }

    // Attempt DOM probe to read real duration
    const probeTimeout = setTimeout(() => {
      // If probe takes longer than 2.5s (e.g. live stream or CORS restriction), still accept with preset/fallback
      setIsValidating(false);
      onUrlLoaded({
        url: cleanUrl,
        mediaType: detectedType,
        trackName: derivedName,
        trackDuration: presetDuration || "Live Stream",
        trackSize: "Remote Stream",
      });
    }, 2500);

    if (detectedType === "video") {
      const vid = document.createElement("video");
      vid.preload = "metadata";
      vid.src = cleanUrl;
      vid.onloadedmetadata = () => {
        clearTimeout(probeTimeout);
        setIsValidating(false);
        const m = Math.floor(vid.duration / 60);
        const s = Math.floor(vid.duration % 60);
        const durationFormatted = isFinite(vid.duration) && vid.duration > 0
          ? `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
          : (presetDuration || "Stream Session");

        onUrlLoaded({
          url: cleanUrl,
          mediaType: "video",
          trackName: derivedName,
          trackDuration: durationFormatted,
          trackSize: "Remote Video",
        });
      };
      vid.onerror = () => {
        clearTimeout(probeTimeout);
        setIsValidating(false);
        // If probe fails due to CORS, allow anyway with remote stream label
        onUrlLoaded({
          url: cleanUrl,
          mediaType: "video",
          trackName: derivedName,
          trackDuration: presetDuration || "Live Feed",
          trackSize: "Remote Stream",
        });
      };
    } else {
      const aud = document.createElement("audio");
      aud.preload = "metadata";
      aud.src = cleanUrl;
      aud.onloadedmetadata = () => {
        clearTimeout(probeTimeout);
        setIsValidating(false);
        const m = Math.floor(aud.duration / 60);
        const s = Math.floor(aud.duration % 60);
        const durationFormatted = isFinite(aud.duration) && aud.duration > 0
          ? `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
          : (presetDuration || "Stream Session");

        onUrlLoaded({
          url: cleanUrl,
          mediaType: "audio",
          trackName: derivedName,
          trackDuration: durationFormatted,
          trackSize: "Remote Audio",
        });
      };
      aud.onerror = () => {
        clearTimeout(probeTimeout);
        setIsValidating(false);
        // Fallback for CORS-restricted streams
        onUrlLoaded({
          url: cleanUrl,
          mediaType: "audio",
          trackName: derivedName,
          trackDuration: presetDuration || "Live Audio Stream",
          trackSize: "Remote Stream",
        });
      };
    }
  };

  const handleSelectSampleUrl = (sample: typeof SAMPLE_MEDIA_URLS[0]) => {
    setUrlInput(sample.url);
    setMediaType(sample.mediaType);
    handleValidateAndLoad(sample.url, sample.mediaType, sample.title, sample.duration);
  };

  return (
    <div
      id="url-media-ingestion-box"
      className="p-6 sm:p-8 rounded-2xl bg-white border-2 border-dashed border-[#0F2540]/30 hover:border-[#0F2540]/50 space-y-6 transition-all"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#0F2540] text-[#C98A2C] flex items-center justify-center shadow-xs shrink-0">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0F2540]">
              Remote Media URL & Live Stream Ingestion
            </h3>
            <p className="text-xs text-slate-500">
              Provide a direct URL to a cloud recording, hosted lecture (.mp3 / .mp4), podcast feed, or live event broadcast.
            </p>
          </div>
        </div>

        {/* Stream Type Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
          <button
            type="button"
            onClick={() => setMediaType("audio")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
              mediaType === "audio"
                ? "bg-[#0F2540] text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Music className="w-3.5 h-3.5 text-[#C98A2C]" />
            <span>Audio Stream</span>
          </button>

          <button
            type="button"
            onClick={() => setMediaType("video")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
              mediaType === "video"
                ? "bg-[#0F2540] text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Video className="w-3.5 h-3.5 text-indigo-400" />
            <span>Video Stream</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{error}</div>
        </div>
      )}

      {/* URL Input Bar */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-700 block">
          Media Stream or File URL (HTTPS)
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Link className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="input-media-track-url"
              type="url"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleValidateAndLoad();
                }
              }}
              placeholder="https://cdn.example.com/sessions/keynote_recording.mp4 (or .mp3, .wav)"
              className="w-full pl-10 pr-4 py-2.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-[#0F2540] focus:outline-hidden transition-all"
            />
          </div>

          <button
            type="button"
            id="btn-load-media-url"
            onClick={() => handleValidateAndLoad()}
            disabled={isValidating || !urlInput.trim()}
            className="px-6 py-2.5 rounded-xl bg-[#0F2540] hover:bg-[#17375E] text-white text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
          >
            {isValidating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#C98A2C]" />
                <span>Validating Stream...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#C98A2C]" />
                <span>Load & Inspect URL</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sample Media URL Presets */}
      <div className="pt-2 border-t border-slate-100 space-y-2">
        <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
          Or test instantly with sample media streams:
        </span>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_MEDIA_URLS.map((sample) => (
            <button
              key={sample.name}
              type="button"
              id={`btn-sample-url-${sample.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
              onClick={() => handleSelectSampleUrl(sample)}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1.5"
            >
              {sample.mediaType === "video" ? (
                <Video className="w-3 h-3 text-indigo-500" />
              ) : (
                <Music className="w-3 h-3 text-[#C98A2C]" />
              )}
              <span className="font-medium">{sample.name}</span>
              <span className="text-[10px] text-slate-400 font-mono">({sample.duration})</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
