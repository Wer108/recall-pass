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
} from "lucide-react";
import { playSampleAudioTrackTone } from "../utils/audioToneGenerator";

interface TrackPlayerProps {
  mediaType: "audio" | "video";
  trackName: string;
  trackDuration: string;
  trackSize?: string;
  mediaUrl?: string;
  onReplaceTrack?: () => void;
}

export const TrackPlayer: React.FC<TrackPlayerProps> = ({
  mediaType,
  trackName,
  trackDuration,
  trackSize,
  mediaUrl,
  onReplaceTrack,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const toneStopperRef = useRef<{ stop: () => void } | null>(null);

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
      // Sample track simulated tone generator
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
  }, [isPlaying, totalSeconds]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value);
    setCurrentTime(newTime);
    if (mediaType === "video" && videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
    if (mediaType === "audio" && audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const progressPercent = totalSeconds > 0 ? (currentTime / totalSeconds) * 100 : 0;

  return (
    <div
      id="active-media-track-player"
      className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden"
    >
      {/* Top Track Header */}
      <div className="bg-[#0F2540] text-white px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              mediaType === "video" ? "bg-indigo-500/20 text-indigo-300" : "bg-[#C98A2C]/20 text-[#C98A2C]"
            }`}
          >
            {mediaType === "video" ? (
              <Video className="w-4 h-4" />
            ) : (
              <Music className="w-4 h-4" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/10 text-slate-200">
                {mediaType === "video" ? "Video Track Loaded" : "Audio Track Loaded"}
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

      {/* Media Rendering Body */}
      <div className="p-5 space-y-4">
        {mediaType === "video" ? (
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
                className="hidden"
              />
            )}

            {/* Visualizer Waveform Equalizer */}
            <div className="bg-slate-900 rounded-xl p-4 flex items-center justify-between gap-4 border border-slate-800">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  id="btn-play-pause-audio"
                  onClick={togglePlay}
                  className={`w-11 h-11 rounded-full flex items-center justify-center text-white transition-all shadow-md ${
                    isPlaying ? "bg-amber-600 hover:bg-amber-700" : "bg-[#0F6E56] hover:bg-[#128266]"
                  }`}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5 fill-current" />
                  )}
                </button>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">
                      {isPlaying ? "Auditory Track Playing" : "Session Track Ready"}
                    </span>
                    {isPlaying && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {formatSeconds(currentTime)} / {trackDuration}
                  </span>
                </div>
              </div>

              {/* Animated Waveform Bars */}
              <div className="flex items-center gap-1 h-9 px-2 overflow-hidden">
                {[14, 28, 18, 36, 22, 10, 32, 24, 16, 30, 20, 35, 12, 26, 18, 22].map(
                  (h, i) => (
                    <div
                      key={i}
                      style={{
                        height: isPlaying ? `${Math.max(6, (h * ((i % 3) + 1.2)) % 36)}px` : "6px",
                        transition: "height 0.15s ease-in-out",
                      }}
                      className={`w-1 rounded-full ${
                        isPlaying ? "bg-[#C98A2C]" : "bg-slate-700"
                      }`}
                    />
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* Scrubber & Controls */}
        <div className="space-y-1.5 pt-1">
          <input
            type="range"
            min={0}
            max={totalSeconds}
            step={1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0F2540]"
          />
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>{formatSeconds(currentTime)}</span>
            <span className="font-semibold text-[#0F2540]">
              {Math.round(progressPercent)}% elapsed
            </span>
            <span>{trackDuration}</span>
          </div>
        </div>

        {/* Track Readiness Badge */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Track verified for Gemini speech & dialogue extraction</span>
          </div>
          <span className="text-slate-400 font-mono text-[11px]">
            Ready for AI segmentation
          </span>
        </div>
      </div>
    </div>
  );
};
