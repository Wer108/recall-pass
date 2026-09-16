import React, { useState, useEffect } from "react";
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
  Youtube,
  Play,
} from "lucide-react";
import {
  extractYouTubeId,
  isYouTubeUrl,
  fetchYouTubeInfo,
  YouTubeMetadata,
} from "../utils/mediaUtils";

interface UrlMediaIngestionProps {
  onUrlLoaded: (trackInfo: {
    url: string;
    mediaType: "audio" | "video" | "youtube";
    trackName: string;
    trackDuration: string;
    trackSize?: string;
    youtubeId?: string;
    suggestedTitle?: string;
    suggestedSpeaker?: string;
    thumbnailUrl?: string;
  }) => void;
  currentType: "audio" | "video" | "youtube";
}

const POPULAR_YOUTUBE_LECTURES = [
  {
    name: "Intro to Large Language Models",
    author: "Andrej Karpathy",
    url: "https://www.youtube.com/watch?v=zjkBMFhNj_g",
    videoId: "zjkBMFhNj_g",
    duration: "1:00:00",
    description: "Deep dive into LLM architecture, pretraining, fine-tuning, RLHF, and AI safety.",
  },
  {
    name: "Stanford CS229: Machine Learning Lecture 1",
    author: "Andrew Ng",
    url: "https://www.youtube.com/watch?v=jGwO_UgTS7I",
    videoId: "jGwO_UgTS7I",
    duration: "1:07:00",
    description: "Foundational machine learning concepts, supervised learning, and linear regression.",
  },
  {
    name: "MIT 6.006: Introduction to Algorithms",
    author: "Erik Demaine",
    url: "https://www.youtube.com/watch?v=ZA-tUyM_y7s",
    videoId: "ZA-tUyM_y7s",
    duration: "49:00",
    description: "Algorithmic complexity, asymptotic notation, and divide-and-conquer principles.",
  },
];

const SAMPLE_AUDIO_STREAMS = [
  {
    name: "Dr. Thorne: Resilient Distributed Systems (Audio)",
    speaker: "Dr. Rachel Thorne",
    url: "https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg",
    duration: "48:15",
    description: "Keynote on microservice resiliency, circuit breakers, and p99 latency guarantees.",
  },
  {
    name: "Cognitive Pedagogy & Retrieval Dynamics (Audio)",
    speaker: "Prof. Jonathan Vance",
    url: "https://actions.google.com/sounds/v1/science_fiction/deep_pulse_hum.ogg",
    duration: "42:30",
    description: "Cognitive science lecture on testing effect, spaced retrieval, and long-term memory.",
  },
  {
    name: "AI & Vector Search ANN Traversal (Video)",
    speaker: "Elena Rostova",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    duration: "15:00",
    description: "Technical presentation on HNSW graphs, IVF-PQ index quantization, and memory budgets.",
  },
];

export const UrlMediaIngestion: React.FC<UrlMediaIngestionProps> = ({
  onUrlLoaded,
  currentType,
}) => {
  const [activeTab, setActiveTab] = useState<"youtube" | "audio" | "video">(
    currentType === "youtube" ? "youtube" : currentType === "video" ? "video" : "youtube"
  );
  const [urlInput, setUrlInput] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ytPreview, setYtPreview] = useState<YouTubeMetadata | null>(null);

  // Auto-detect YouTube links as user types or pastes
  useEffect(() => {
    const trimmed = urlInput.trim();
    if (isYouTubeUrl(trimmed)) {
      if (activeTab !== "youtube") {
        setActiveTab("youtube");
      }
      const vid = extractYouTubeId(trimmed);
      if (vid) {
        fetchYouTubeInfo(vid).then((meta) => {
          if (meta) setYtPreview(meta);
        });
      }
    } else {
      setYtPreview(null);
    }
  }, [urlInput]);

  const handleLoadYouTube = async (targetUrl?: string, preset?: typeof POPULAR_YOUTUBE_LECTURES[0]) => {
    const cleanUrl = (targetUrl || urlInput).trim();
    const vid = preset?.videoId || extractYouTubeId(cleanUrl);

    if (!vid) {
      setError("Please enter a valid YouTube URL (e.g. youtube.com/watch?v=... or youtu.be/...)");
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const info = await fetchYouTubeInfo(vid);
      setIsValidating(false);

      const titleToUse = preset?.name || info?.title || `YouTube Lecture (${vid})`;
      const speakerToUse = preset?.author || info?.authorName || "YouTube Creator";
      const durationToUse = preset?.duration || info?.duration || "Full Video";

      onUrlLoaded({
        url: `https://www.youtube.com/watch?v=${vid}`,
        mediaType: "youtube",
        trackName: `${titleToUse}.youtube`,
        trackDuration: durationToUse,
        trackSize: "YouTube Video Stream",
        youtubeId: vid,
        suggestedTitle: titleToUse,
        suggestedSpeaker: speakerToUse,
        thumbnailUrl: info?.thumbnailUrl || `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
      });
    } catch {
      setIsValidating(false);
      onUrlLoaded({
        url: cleanUrl,
        mediaType: "youtube",
        trackName: `YouTube Video (${vid})`,
        trackDuration: "YouTube Stream",
        trackSize: "YouTube Stream",
        youtubeId: vid,
        thumbnailUrl: `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
      });
    }
  };

  const handleLoadAudioOrVideoStream = (targetUrl?: string, overrideType?: "audio" | "video", presetTitle?: string, presetDuration?: string, presetSpeaker?: string) => {
    const cleanUrl = (targetUrl || urlInput).trim();
    const typeToUse = overrideType || (activeTab === "video" ? "video" : "audio");

    if (!cleanUrl) {
      setError("Please enter a valid media stream or audio URL.");
      return;
    }

    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      setError("URL must start with http:// or https://");
      return;
    }

    setIsValidating(true);
    setError(null);

    // Derive clean name
    let derivedName = "Remote Media Stream";
    try {
      const parsedUrl = new URL(cleanUrl);
      const fileName = parsedUrl.pathname.split("/").pop() || "";
      if (fileName && fileName.includes(".")) {
        derivedName = decodeURIComponent(fileName);
      } else if (presetTitle) {
        derivedName = `${presetTitle.slice(0, 30)}.mp3`;
      } else {
        derivedName = `${parsedUrl.hostname}_audio_stream`;
      }
    } catch {
      derivedName = `audio_stream_track`;
    }

    // Attempt DOM probe to read real duration
    const probeTimeout = setTimeout(() => {
      setIsValidating(false);
      onUrlLoaded({
        url: cleanUrl,
        mediaType: typeToUse,
        trackName: derivedName,
        trackDuration: presetDuration || "Audio Stream",
        trackSize: "Remote Audio Track",
        suggestedTitle: presetTitle,
        suggestedSpeaker: presetSpeaker,
      });
    }, 2000);

    const el = document.createElement(typeToUse === "video" ? "video" : "audio");
    el.preload = "metadata";
    el.src = cleanUrl;
    el.onloadedmetadata = () => {
      clearTimeout(probeTimeout);
      setIsValidating(false);
      const m = Math.floor(el.duration / 60);
      const s = Math.floor(el.duration % 60);
      const durationFormatted =
        isFinite(el.duration) && el.duration > 0
          ? `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
          : presetDuration || "Audio Session";

      onUrlLoaded({
        url: cleanUrl,
        mediaType: typeToUse,
        trackName: derivedName,
        trackDuration: durationFormatted,
        trackSize: typeToUse === "video" ? "Remote Video" : "Remote Audio",
        suggestedTitle: presetTitle,
        suggestedSpeaker: presetSpeaker,
      });
    };
    el.onerror = () => {
      clearTimeout(probeTimeout);
      setIsValidating(false);
      onUrlLoaded({
        url: cleanUrl,
        mediaType: typeToUse,
        trackName: derivedName,
        trackDuration: presetDuration || "Remote Stream",
        trackSize: "Remote Stream",
        suggestedTitle: presetTitle,
        suggestedSpeaker: presetSpeaker,
      });
    };
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-5">
      {/* Source Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setActiveTab("youtube");
              setError(null);
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "youtube"
                ? "bg-[#0F2540] text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Youtube className="w-3.5 h-3.5 text-rose-500" />
            <span>YouTube Video URL</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("audio");
              setError(null);
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "audio"
                ? "bg-[#0F2540] text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Music className="w-3.5 h-3.5 text-amber-500" />
            <span>Audio Track & Podcast Stream</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("video");
              setError(null);
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "video"
                ? "bg-[#0F2540] text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Video className="w-3.5 h-3.5 text-indigo-500" />
            <span>Direct Video URL</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-400 font-medium">
          {activeTab === "youtube" ? "Supports any YouTube video or short" : "Supports .mp3, .wav, .m4a, and streams"}
        </div>
      </div>

      {/* Main Input Form */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-slate-800">
          {activeTab === "youtube"
            ? "Paste YouTube Video Link"
            : activeTab === "audio"
            ? "Paste Remote Audio Track / Podcast URL"
            : "Paste Direct Video Stream URL"}
        </label>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              {activeTab === "youtube" ? (
                <Youtube className="w-4 h-4 text-rose-500" />
              ) : activeTab === "audio" ? (
                <Music className="w-4 h-4 text-amber-500" />
              ) : (
                <Link className="w-4 h-4 text-slate-400" />
              )}
            </div>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (activeTab === "youtube") {
                    handleLoadYouTube();
                  } else {
                    handleLoadAudioOrVideoStream();
                  }
                }
              }}
              placeholder={
                activeTab === "youtube"
                  ? "https://www.youtube.com/watch?v=... or https://youtu.be/..."
                  : "https://example.com/audio-tracks/lecture.mp3"
              }
              className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#0F2540] focus:ring-1 focus:ring-[#0F2540] outline-none transition-all font-mono"
            />
          </div>

          <button
            type="button"
            id="btn-ingest-url"
            disabled={isValidating || !urlInput.trim()}
            onClick={() => {
              if (activeTab === "youtube" || isYouTubeUrl(urlInput)) {
                handleLoadYouTube();
              } else {
                handleLoadAudioOrVideoStream();
              }
            }}
            className="px-5 py-2.5 text-xs font-bold rounded-xl bg-[#0F2540] hover:bg-slate-800 text-white shadow-xs transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isValidating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Validating...</span>
              </>
            ) : (
              <>
                <span>Ingest Track</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 px-3 py-2 rounded-lg border border-rose-200 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Real-time YouTube Metadata Preview Card */}
        {ytPreview && (
          <div className="flex items-center gap-3.5 p-3 rounded-xl border border-rose-200 bg-rose-50/40 animate-in fade-in">
            <img
              src={ytPreview.thumbnailUrl}
              alt="YouTube Preview"
              referrerPolicy="no-referrer"
              className="w-24 h-14 object-cover rounded-lg border border-rose-200 shadow-2xs shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-600 text-white">
                  YouTube
                </span>
                <span className="text-xs text-slate-500 font-medium truncate">{ytPreview.authorName}</span>
              </div>
              <h5 className="text-xs font-bold text-slate-900 truncate mt-0.5">{ytPreview.title}</h5>
              <div className="text-[11px] text-slate-500 mt-0.5">Video ID: {ytPreview.videoId}</div>
            </div>
            <button
              type="button"
              onClick={() => handleLoadYouTube(urlInput)}
              className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors shrink-0 shadow-2xs flex items-center gap-1"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Use This Video</span>
            </button>
          </div>
        )}
      </div>

      {/* Preset Curated Lectures / Streams for Instant Ingestion */}
      <div className="pt-3 border-t border-slate-100 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>
              {activeTab === "youtube"
                ? "Popular YouTube Educational Lectures (1-Click Load)"
                : "Curated Audio & Media Tracks (1-Click Load)"}
            </span>
          </span>
          <span className="text-[11px] text-slate-400">Ready for instant AI note extraction</span>
        </div>

        {activeTab === "youtube" ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {POPULAR_YOUTUBE_LECTURES.map((lecture, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setUrlInput(lecture.url);
                  handleLoadYouTube(lecture.url, lecture);
                }}
                className="p-3 rounded-xl border border-slate-200 bg-white hover:border-rose-300 hover:bg-rose-50/30 transition-all text-left group flex flex-col justify-between shadow-2xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-semibold">
                      {lecture.duration}
                    </span>
                    <Youtube className="w-3.5 h-3.5 text-rose-500 group-hover:scale-110 transition-transform" />
                  </div>
                  <h6 className="text-xs font-bold text-slate-900 group-hover:text-rose-900 transition-colors line-clamp-1">
                    {lecture.name}
                  </h6>
                  <p className="text-[11px] text-slate-500 line-clamp-1">Speaker: {lecture.author}</p>
                </div>
                <div className="mt-2 text-[10px] font-semibold text-rose-600 flex items-center gap-1">
                  <span>Load YouTube Video</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {SAMPLE_AUDIO_STREAMS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setUrlInput(sample.url);
                  handleLoadAudioOrVideoStream(
                    sample.url,
                    sample.name.includes("Video") ? "video" : "audio",
                    sample.name,
                    sample.duration,
                    sample.speaker
                  );
                }}
                className="p-3 rounded-xl border border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/30 transition-all text-left group flex flex-col justify-between shadow-2xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                      {sample.duration}
                    </span>
                    {sample.name.includes("Video") ? (
                      <Video className="w-3.5 h-3.5 text-indigo-500" />
                    ) : (
                      <Music className="w-3.5 h-3.5 text-amber-500" />
                    )}
                  </div>
                  <h6 className="text-xs font-bold text-slate-900 group-hover:text-amber-900 transition-colors line-clamp-1">
                    {sample.name.split(" (")[0]}
                  </h6>
                  <p className="text-[11px] text-slate-500 line-clamp-1">Speaker: {sample.speaker}</p>
                </div>
                <div className="mt-2 text-[10px] font-semibold text-amber-700 flex items-center gap-1">
                  <span>Load Audio Track</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
