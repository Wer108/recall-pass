import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  Music,
  Video,
  FileAudio,
  CheckCircle2,
  Sliders,
  RefreshCw,
  Youtube,
  ExternalLink,
} from "lucide-react";
import { playSampleAudioTrackTone } from "../utils/audioToneGenerator";
import { extractYouTubeId } from "../utils/mediaUtils";

interface TrackPlayerProps {
  mediaType: "audio" | "video" | "youtube";
  trackName: string;
  trackDuration: string;
  trackSize?: string;
  mediaUrl?: string;
  youtubeId?: string;
  onReplaceTrack?: () => void;
}

export const TrackPlayer: React.FC<TrackPlayerProps> = ({
  mediaType,
  trackName,
  trackDuration,
  trackSize,
  mediaUrl,
  youtubeId,
  onReplaceTrack,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const toneStopperRef = useRef<{ stop: () => void } | null>(null);

  const effectiveYouTubeId =
    youtubeId || (mediaUrl ? extractYouTubeId(mediaUrl) : null);
  const isYouTube = mediaType === "youtube" || Boolean(effectiveYouTubeId);

  // Parse duration string e.g. "48:15" to seconds
  const parseDurationToSeconds = (dur: string): number => {
    const parts = dur.split(":").map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return 300; // default 5m
  };

  const totalSeconds = parseDurationToSeconds(trackDuration);

  const formatSeconds = (sec: number): string => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const togglePlay = () => {
    if (isYouTube) return;

    if (mediaType === "video" && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
      return;
    }

    // Audio playback
    if (mediaUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    } else {
      // Sample track tone generator
      if (isPlaying) {
        toneStopperRef.current?.stop();
        setIsPlaying(false);
      } else {
        setIsPlaying(true);
        toneStopperRef.current = playSampleAudioTrackTone(() => {
          setIsPlaying(false);
        });
      }
    }
  };

  // Timer loop for simulation if no real element is playing
  useEffect(() => {
    if (isYouTube) return;
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= totalSeconds) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, totalSeconds, isYouTube]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) videoRef.current.volume = val;
    if (audioRef.current) audioRef.current.volume = val;
    setIsMuted(val === 0);
  };

  return (
    <div
      id="track-player-card"
      className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden"
    >
      {/* Track Header Bar */}
      <div className="px-5 py-3.5 bg-[#0F2540] text-white flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              isYouTube
                ? "bg-rose-500 text-white"
                : mediaType === "video"
                ? "bg-indigo-500/20 text-indigo-300"
                : "bg-[#C98A2C]/20 text-[#C98A2C]"
            }`}
          >
            {isYouTube ? (
              <Youtube className="w-4 h-4" />
            ) : mediaType === "video" ? (
              <Video className="w-4 h-4" />
            ) : (
              <Music className="w-4 h-4" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                  isYouTube
                    ? "bg-rose-600 text-white"
                    : "bg-white/10 text-slate-200"
                }`}
              >
                {isYouTube
                  ? "YouTube Video Track"
                  : mediaType === "video"
                  ? "Video Track Loaded"
                  : "Audio Track Loaded"}
              </span>
              {trackSize && (
                <span className="text-[11px] text-slate-300 font-mono">
                  {trackSize}
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-white truncate max-w-sm sm:max-w-md mt-0.5">
              {trackName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isYouTube && effectiveYouTubeId && (
            <a
              href={`https://www.youtube.com/watch?v=${effectiveYouTubeId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-1.5 shrink-0"
              title="Open on YouTube in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">YouTube</span>
            </a>
          )}

          {onReplaceTrack && (
            <button
              type="button"
              id="btn-replace-media-track"
              onClick={onReplaceTrack}
              className="text-xs font-medium text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-1.5 shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Change Track</span>
            </button>
          )}
        </div>
      </div>

      {/* Media Rendering Body */}
      <div className="p-5 space-y-4">
        {isYouTube && effectiveYouTubeId ? (
          /* Responsive YouTube Player */
          <div className="space-y-3">
            <div className="relative aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-md">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${effectiveYouTubeId}?rel=0&modestbranding=1`}
                title={trackName}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>YouTube source connected and ready for AI note recall extraction</span>
              </span>
              <span className="font-mono text-[11px]">{trackDuration}</span>
            </div>
          </div>
        ) : mediaType === "video" ? (
          /* Video Track View */
          <div className="space-y-3">
            <div className="relative aspect-video bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800">
              {mediaUrl ? (
                <video
                  ref={videoRef}
                  src={mediaUrl}
                  onTimeUpdate={() => {
                    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
                  }}
                  onEnded={() => setIsPlaying(false)}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center p-6 text-slate-400 space-y-2">
                  <Video className="w-12 h-12 mx-auto text-slate-500 stroke-[1.5]" />
                  <p className="text-xs font-medium text-slate-300">
                    High-Definition Workshop Video Feed ({trackDuration})
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    H.264 Video • 1080p • 60 FPS • Stereo Audio
                  </p>
                </div>
              )}

              {/* Overlay Play Button if not playing */}
              {!isPlaying && (
                <button
                  type="button"
                  onClick={togglePlay}
                  className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-[#0F2540]/80 hover:bg-[#0F2540] text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 backdrop-blur-xs"
                >
                  <Play className="w-6 h-6 ml-0.5 fill-current" />
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Audio Track View with Pulsing Equalizer Bars */
          <div className="space-y-4">
            {mediaUrl && (
              <audio
                ref={audioRef}
                src={mediaUrl}
                onTimeUpdate={() => {
                  if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
                }}
                onEnded={() => setIsPlaying(false)}
              />
            )}

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="w-11 h-11 rounded-xl bg-[#0F2540] hover:bg-slate-800 text-white flex items-center justify-center shadow-xs transition-colors shrink-0"
                  aria-label={isPlaying ? "Pause audio" : "Play audio"}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5 fill-current" />
                  )}
                </button>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {isPlaying ? "Audible Playback Active" : "Track Ready to Play"}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {mediaUrl ? "Streaming remote audio" : "Acoustic speech track ingested"}
                  </p>
                </div>
              </div>

              {/* Waveform Equalizer simulation */}
              <div className="hidden sm:flex items-center gap-1 h-7">
                {[18, 28, 40, 24, 32, 16, 36, 22, 14, 30, 42, 20].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: isPlaying ? `${Math.max(6, (h * (i % 2 === 0 ? 1 : 0.7)))}px` : "6px" }}
                    className={`w-1 rounded-full transition-all duration-300 ${
                      isPlaying ? "bg-[#C98A2C]" : "bg-slate-300"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Scrubber Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>{formatSeconds(currentTime)}</span>
                <span>{trackDuration}</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#0F2540] h-full transition-all duration-200"
                  style={{ width: `${Math.min(100, (currentTime / (totalSeconds || 1)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Volume Control */}
            <div className="flex items-center justify-between pt-1 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-slate-500 hover:text-slate-800"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 sm:w-28 accent-[#0F2540] h-1.5 rounded-lg cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Calibrated for AI Extraction</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
