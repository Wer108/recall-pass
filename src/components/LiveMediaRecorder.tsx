import React, { useState, useRef, useEffect } from "react";
import { Mic, Video, Square, Radio, AlertCircle, RefreshCw } from "lucide-react";

interface LiveMediaRecorderProps {
  mode: "audio" | "video";
  onRecordingComplete: (file: File, previewUrl: string, durationSeconds: number) => void;
  onCancel: () => void;
}

export const LiveMediaRecorder: React.FC<LiveMediaRecorderProps> = ({
  mode,
  onRecordingComplete,
  onCancel,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);

  const startRecording = async () => {
    setError(null);
    chunksRef.current = [];
    setElapsedSeconds(0);

    try {
      const constraints: MediaStreamConstraints =
        mode === "video"
          ? { video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: true }
          : { audio: true };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (mode === "video" && videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play().catch(() => {});
      }

      // Select supported mimeType
      let mimeType = mode === "video" ? "video/webm" : "audio/webm";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "";
      }

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blobType = recorder.mimeType || (mode === "video" ? "video/webm" : "audio/webm");
        const blob = new Blob(chunksRef.current, { type: blobType });
        const ext = mode === "video" ? "webm" : "webm";
        const fileName = `live_${mode}_track_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "_")}.${ext}`;
        const file = new File([blob], fileName, { type: blobType });
        const url = URL.createObjectURL(blob);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());

        onRecordingComplete(file, url, elapsedSeconds || 1);
      };

      recorder.start(1000);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Recording error:", err);
      setError(
        err.name === "NotAllowedError" || err.message?.includes("Permission")
          ? `Microphone/Camera permission denied. Please allow device access in your browser settings.`
          : `Unable to access recording devices: ${err.message || "Unknown error"}`
      );
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      id="live-media-recorder-box"
      className="p-5 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-4 shadow-md"
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Radio className={`w-4 h-4 ${isRecording ? "text-rose-500 animate-pulse" : "text-slate-400"}`} />
          <span className="text-sm font-semibold">
            {isRecording
              ? `Recording Live ${mode === "video" ? "Video & Audio" : "Audio"} Track`
              : `Ready to Record ${mode === "video" ? "Video" : "Audio"} Track`}
          </span>
        </div>

        {isRecording && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 font-mono text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">{error}</div>
        </div>
      )}

      {mode === "video" && (
        <div className="relative aspect-video rounded-xl bg-black overflow-hidden border border-slate-800 flex items-center justify-center">
          <video
            ref={videoPreviewRef}
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          {!isRecording && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-950/70 p-4 text-center">
              <Video className="w-10 h-10 mb-2 text-slate-500" />
              <p className="text-xs">Camera preview will appear when you start recording</p>
            </div>
          )}
        </div>
      )}

      {mode === "audio" && (
        <div className="py-6 px-4 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center space-y-3">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              isRecording
                ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30 animate-pulse"
                : "bg-slate-800 text-slate-400"
            }`}
          >
            <Mic className="w-7 h-7" />
          </div>

          <p className="text-xs text-slate-300 font-medium">
            {isRecording
              ? "Microphone is live • Speak clearly into your input device"
              : "Capture spoken lecture or keynote directly through your microphone"}
          </p>

          {isRecording && (
            <div className="flex items-center gap-1.5 h-6">
              {[8, 16, 24, 12, 20, 28, 14, 22, 10, 26, 18].map((h, i) => (
                <div
                  key={i}
                  style={{
                    height: `${(h * ((elapsedSeconds % 4) + 1)) % 24 + 4}px`,
                    transition: "height 0.1s ease",
                  }}
                  className="w-1 rounded-full bg-rose-400"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Controls */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isRecording}
          className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg transition-colors disabled:opacity-30"
        >
          Cancel
        </button>

        {!isRecording ? (
          <button
            type="button"
            id="btn-start-recording"
            onClick={startRecording}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-2 shadow-sm transition-colors"
          >
            {mode === "video" ? <Video className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span>Start {mode === "video" ? "Video" : "Audio"} Recording</span>
          </button>
        ) : (
          <button
            type="button"
            id="btn-stop-recording"
            onClick={stopRecording}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-white hover:bg-slate-100 text-slate-900 flex items-center gap-2 shadow-md transition-colors"
          >
            <Square className="w-4 h-4 fill-current text-rose-600" />
            <span>Stop & Load Track</span>
          </button>
        )}
      </div>
    </div>
  );
};
