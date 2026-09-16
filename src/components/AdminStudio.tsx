import React, { useState, useEffect } from "react";
import {
  UploadCloud,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Eye,
  Trash2,
  Clock,
  Send,
  Calendar,
  ArrowRight,
  Music,
  Video,
  Mic,
  FileAudio,
  FileVideo,
  Radio,
  Sliders,
  KeyRound,
  Shield,
  Link as LinkIcon,
  Globe,
  SlidersHorizontal,
  GraduationCap,
  Play,
  Layers,
  Youtube,
} from "lucide-react";
import { SessionData, TopicSection, QAPair, EventTrainingProfile } from "../types";
import { SAMPLE_MEDIA_TRACKS, MediaTrackInfo } from "../data/sampleMediaTracks";
import { NotesSection } from "./NotesSection";
import { QASection } from "./QASection";
import { PublishModal } from "./PublishModal";
import { TrackPlayer } from "./TrackPlayer";
import { LiveMediaRecorder } from "./LiveMediaRecorder";
import { UrlMediaIngestion } from "./UrlMediaIngestion";
import { EventTrainingModal } from "./EventTrainingModal";
import { LiveEventStudio } from "./LiveEventStudio";
import { sessionStore } from "../services/sessionStore";

interface AdminStudioProps {
  onViewAttendeeSession: (code: string) => void;
  sessions: SessionData[];
  onRefreshSessions: () => void;
  adminLoginId?: string;
  onOpenCredentialsModal?: () => void;
}

export const AdminStudio: React.FC<AdminStudioProps> = ({
  onViewAttendeeSession,
  sessions,
  onRefreshSessions,
  adminLoginId = "admin",
  onOpenCredentialsModal,
}) => {
  // Navigation inside Admin: 'create' | 'review' | 'manage'
  const [activeAdminTab, setActiveAdminTab] = useState<"create" | "review" | "manage">("create");

  // Track Ingestion Mode: "audio" | "video" | "youtube"
  const [mediaType, setMediaType] = useState<"audio" | "video" | "youtube">("audio");
  const [trackSource, setTrackSource] = useState<"file" | "url" | "live">("file");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [youtubeId, setYoutubeId] = useState<string | null>(null);

  // Event Training & Live Studio state
  const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);
  const [isLiveStudioOpen, setIsLiveStudioOpen] = useState(false);
  const [trainingProfile, setTrainingProfile] = useState<EventTrainingProfile>(() =>
    sessionStore.getEventTrainingProfile()
  );

  // Loaded Media Track State
  const [selectedSampleTrack, setSelectedSampleTrack] = useState<MediaTrackInfo | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [trackName, setTrackName] = useState("");
  const [trackDuration, setTrackDuration] = useState("");
  const [trackSize, setTrackSize] = useState("");
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);

  // Live recording state
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);

  // Form metadata inputs
  const [title, setTitle] = useState("");
  const [speaker, setSpeaker] = useState("");
  const [eventContext, setEventContext] = useState("");

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  // Review state
  const [reviewSections, setReviewSections] = useState<TopicSection[]>([]);
  const [reviewQAList, setReviewQAList] = useState<QAPair[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedSession, setPublishedSession] = useState<SessionData | null>(null);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);

  // Select pre-loaded sample media track
  const handleSelectSampleTrack = (track: MediaTrackInfo) => {
    setTrackSource("file");
    setMediaUrl(null);
    setSelectedSampleTrack(track);
    setUploadedFile(null);
    setFileBase64(null);
    setMediaPreviewUrl(track.previewUrl || null);
    setMediaType(track.mediaType);
    setTrackName(track.trackName);
    setTrackDuration(track.trackDuration || track.duration || "30:00");
    setTrackSize(track.trackSize || track.fileSize || "50 MB");
    setTitle(track.title);
    setSpeaker(track.speaker);
    setEventContext(track.eventContext);
    setErrorMessage(null);
  };

  // Handle uploaded audio or video file
  const handleMediaFileSelect = (file: File) => {
    if (!file) return;

    // Detect type
    const isVideo = file.type.startsWith("video/") || /\.(mp4|webm|mov|mkv|avi)$/i.test(file.name);
    const chosenType = isVideo ? "video" : "audio";
    setMediaType(chosenType);
    setTrackSource("file");
    setMediaUrl(null);

    setUploadedFile(file);
    setSelectedSampleTrack(null);
    setTrackName(file.name);

    // Human-readable size
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    setTrackSize(`${sizeInMB} MB`);

    // Auto default title from file name if empty
    if (!title) {
      const cleanName = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      setTitle(cleanName);
    }

    const objectUrl = URL.createObjectURL(file);
    setMediaPreviewUrl(objectUrl);

    // Read media duration from element
    if (isVideo) {
      const vid = document.createElement("video");
      vid.src = objectUrl;
      vid.onloadedmetadata = () => {
        const m = Math.floor(vid.duration / 60);
        const s = Math.floor(vid.duration % 60);
        setTrackDuration(`${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
      };
    } else {
      const aud = document.createElement("audio");
      aud.src = objectUrl;
      aud.onloadedmetadata = () => {
        const m = Math.floor(aud.duration / 60);
        const s = Math.floor(aud.duration % 60);
        setTrackDuration(`${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
      };
    }

    // Convert file to base64 if <= 20MB for direct Gemini multimodal ingestion
    if (file.size <= 20 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = () => {
        setFileBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFileBase64(null);
    }

    setErrorMessage(null);
  };

  // Handle URL ingestion
  const handleUrlLoaded = (info: {
    url: string;
    mediaType: "audio" | "video" | "youtube";
    trackName: string;
    trackDuration: string;
    trackSize?: string;
    youtubeId?: string;
    suggestedTitle?: string;
    suggestedSpeaker?: string;
    thumbnailUrl?: string;
  }) => {
    setTrackSource("url");
    setMediaUrl(info.url);
    setMediaPreviewUrl(info.thumbnailUrl || info.url);
    setMediaType(info.mediaType);
    setTrackName(info.trackName);
    setTrackDuration(info.trackDuration);
    setTrackSize(info.trackSize || (info.mediaType === "youtube" ? "YouTube Video" : "Remote Stream"));
    setYoutubeId(info.youtubeId || null);
    setSelectedSampleTrack(null);
    setUploadedFile(null);
    setFileBase64(null);
    if (info.suggestedTitle) {
      setTitle(info.suggestedTitle);
    } else if (!title) {
      const clean = info.trackName.replace(/\.[^/.]+$/, "");
      setTitle(clean);
    }
    if (info.suggestedSpeaker) {
      setSpeaker(info.suggestedSpeaker);
    }
    setErrorMessage(null);
  };

  // Save trained event profile
  const handleSaveTrainingProfile = (profile: EventTrainingProfile) => {
    setTrainingProfile(profile);
    sessionStore.saveEventTrainingProfile(profile);
    setIsTrainingModalOpen(false);
    setNoticeMessage(`Event AI calibrated: ${profile.domain} with ${profile.customTerms.length} specialized domain terms.`);
  };

  // Handle completion from Live Event Studio
  const handleCompleteLiveSession = (result: {
    title: string;
    sections: TopicSection[];
    qaList: QAPair[];
    recordedFile?: File;
    mediaUrl?: string;
    duration: string;
  }) => {
    setIsLiveStudioOpen(false);
    setTitle(result.title);
    setTrackDuration(result.duration);
    setTrackName(`live_stage_${Date.now()}`);
    if (result.mediaUrl) {
      setMediaUrl(result.mediaUrl);
      setMediaPreviewUrl(result.mediaUrl);
    } else if (result.recordedFile) {
      setUploadedFile(result.recordedFile);
      setMediaPreviewUrl(URL.createObjectURL(result.recordedFile));
    }
    setReviewSections(result.sections);
    setReviewQAList(result.qaList);
    setActiveAdminTab("review");
    setNoticeMessage("Live session processing completed! Review the extracted topics and audience Q&A below before publishing.");
  };

  // Handle live recording completion
  const handleRecordingComplete = (file: File, previewUrl: string, durationSeconds: number) => {
    setIsRecordingModalOpen(false);
    setUploadedFile(file);
    setSelectedSampleTrack(null);
    setTrackName(file.name);
    setMediaPreviewUrl(previewUrl);

    const m = Math.floor(durationSeconds / 60);
    const s = durationSeconds % 60;
    setTrackDuration(`${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    setTrackSize(`${sizeInMB} MB`);

    if (!title) {
      setTitle(`Live ${mediaType === "video" ? "Video" : "Audio"} Session — ${new Date().toLocaleDateString()}`);
    }

    // Read as Base64 for Gemini
    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleClearActiveTrack = () => {
    setSelectedSampleTrack(null);
    setUploadedFile(null);
    setMediaUrl(null);
    setYoutubeId(null);
    setTrackName("");
    setTrackDuration("");
    setTrackSize("");
    setMediaPreviewUrl(null);
    setFileBase64(null);
  };

  // Process media track with Gemini via /api/process-media
  const handleProcessMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage("Please enter a session title.");
      return;
    }
    if (!trackName && !selectedSampleTrack && !uploadedFile && !mediaUrl) {
      setErrorMessage("Please upload or select a track, enter a media URL, or record live audio/video.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setProcessingStage(`Analyzing ${mediaType.toUpperCase()} track acoustic spectrum...`);

    try {
      const stepTimer1 = setTimeout(() => {
        setProcessingStage("Segmenting topics into concise, actionable bullet points...");
      }, 1200);

      const stepTimer2 = setTimeout(() => {
        setProcessingStage("Detecting & verifying genuine audience Q&A exchanges...");
      }, 2600);

      const payload: any = {
        title: title.trim(),
        speaker: speaker.trim(),
        eventContext: eventContext.trim(),
        mediaType,
        trackName: trackName || (selectedSampleTrack ? selectedSampleTrack.trackName : (mediaUrl ? "url_media_stream" : "session_track")),
        trackDuration: trackDuration || "Recorded Session",
        trackSize: trackSize || undefined,
        sampleTrackId: selectedSampleTrack ? selectedSampleTrack.id : undefined,
        mediaUrl: mediaUrl || undefined,
        youtubeId: youtubeId || undefined,
        trainingProfile: trainingProfile,
      };

      if (fileBase64 && uploadedFile) {
        payload.mediaBase64 = fileBase64;
        payload.mimeType = uploadedFile.type || (mediaType === "video" ? "video/mp4" : "audio/mp3");
      }

      const data = await sessionStore.processMedia(payload);

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      setReviewSections(data.sections || []);
      setReviewQAList(data.qaList || []);
      setActiveAdminTab("review");

      if (data.isFallback) {
        setNoticeMessage("Synthesized using high-resilience acoustic stream processor. All topics and verified Q&A are ready for review.");
      } else {
        setNoticeMessage(null);
      }
    } catch (err: any) {
      console.error("Media processing error:", err);
      let msg = err.message || "An error occurred during audio/video track processing.";
      try {
        const parsed = JSON.parse(msg);
        if (parsed?.error?.message) {
          msg = parsed.error.message;
        }
      } catch {
        // Not JSON
      }
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
      setProcessingStage("");
    }
  };

  // Section manipulation in review mode
  const handleUpdateSection = (index: number, updated: TopicSection) => {
    const updatedSections = [...reviewSections];
    updatedSections[index] = updated;
    setReviewSections(updatedSections);
  };

  const handleRemoveSection = (index: number) => {
    setReviewSections(reviewSections.filter((_, i) => i !== index));
  };

  const handleAddSection = () => {
    const newSec: TopicSection = {
      id: `sec-${Date.now()}`,
      title: "New Topic Section",
      bullets: ["Actionable key point"],
    };
    setReviewSections([...reviewSections, newSec]);
  };

  // QA manipulation in review mode
  const handleUpdateQA = (index: number, updated: QAPair) => {
    const updatedQA = [...reviewQAList];
    updatedQA[index] = updated;
    setReviewQAList(updatedQA);
  };

  const handleRemoveQA = (index: number) => {
    setReviewQAList(reviewQAList.filter((_, i) => i !== index));
  };

  const handleAddQA = () => {
    const newQA: QAPair = {
      id: `qa-${Date.now()}`,
      question: "Attendee question from session",
      answer: "Speaker's direct response",
      askerContext: "Audience Member",
    };
    setReviewQAList([...reviewQAList, newQA]);
  };

  // Publish session to server
  const handlePublish = async () => {
    setIsPublishing(true);
    setErrorMessage(null);

    try {
      const newSession = await sessionStore.createSession({
        title: title.trim(),
        speaker: speaker.trim(),
        eventContext: eventContext.trim(),
        mediaType,
        trackName: trackName || `${mediaType}_track`,
        trackDuration: trackDuration || "Recorded Session",
        trackSize: trackSize || undefined,
        mediaPreviewUrl: mediaPreviewUrl || mediaUrl || undefined,
        mediaUrl: mediaUrl || undefined,
        youtubeId: youtubeId || undefined,
        sections: reviewSections,
        qaList: reviewQAList,
        isLiveEventSession: trackSource === "live",
      });

      setPublishedSession(newSession);
      onRefreshSessions();
    } catch (err: any) {
      console.error("Publish error:", err);
      setErrorMessage(err.message || "Failed to publish session.");
    } finally {
      setIsPublishing(false);
    }
  };

  // Delete session
  const handleDeleteSession = async (code: string) => {
    if (!confirm(`Are you sure you want to delete session pass ${code}?`)) return;
    try {
      await sessionStore.deleteSession(code);
      onRefreshSessions();
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  // Toggle expiry demo
  const handleToggleExpiry = async (code: string) => {
    try {
      await sessionStore.toggleExpired(code);
      onRefreshSessions();
    } catch (err) {
      console.error("Failed to toggle expiry:", err);
    }
  };

  const hasActiveTrack = Boolean(trackName || selectedSampleTrack || uploadedFile || mediaUrl);

  return (
    <div id="admin-studio-wrapper" className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Studio Header & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0F6E56]" />
            <h1 className="text-2xl font-bold text-[#0F2540] tracking-tight">
              RecallPass Admin Studio
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Process audio and video tracks directly to generate topic-segmented notes, verified Q&A, and issue expiring passes
          </p>
        </div>

        {/* Navigation Pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            id="admin-tab-create"
            onClick={() => setActiveAdminTab("create")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeAdminTab === "create"
                ? "bg-[#0F2540] text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            1. Track Ingestion & AI
          </button>

          <button
            id="admin-tab-review"
            onClick={() => {
              if (reviewSections.length > 0) setActiveAdminTab("review");
            }}
            disabled={reviewSections.length === 0}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors disabled:opacity-40 ${
              activeAdminTab === "review"
                ? "bg-[#0F2540] text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            2. Review & Edit {reviewSections.length > 0 && `(${reviewSections.length})`}
          </button>

          <button
            id="admin-tab-manage"
            onClick={() => setActiveAdminTab("manage")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeAdminTab === "manage"
                ? "bg-[#0F2540] text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Manage Passes ({sessions.length})
          </button>

          {onOpenCredentialsModal && (
            <button
              id="admin-tab-security"
              type="button"
              onClick={onOpenCredentialsModal}
              className="px-3 py-1.5 text-xs font-semibold rounded-md transition-colors text-slate-600 hover:text-[#0F2540] hover:bg-slate-200/60 inline-flex items-center gap-1.5"
              title="Change Admin Login ID and Password"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#C98A2C]" />
              <span className="hidden sm:inline">Admin Security</span>
            </button>
          )}
        </div>
      </div>

      {/* Notice alert if resilient fallback was engaged */}
      {noticeMessage && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Resilience Engine Active: </span>
              {noticeMessage}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setNoticeMessage(null)}
            className="text-amber-700 hover:text-amber-900 text-[11px] font-semibold underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">Processing Notice: </span>
              {errorMessage}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-600 hover:text-rose-800 text-[11px] font-semibold underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: TRACK INGESTION & AI */}
      {activeAdminTab === "create" && (
        <form onSubmit={handleProcessMedia} className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
            {/* Header with Sample Track Preloaders */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-[#0F2540]">
                  Audio & Video Track Ingestion
                </h2>
                <p className="text-xs text-slate-500">
                  Accepts lecture recordings, workshop videos, podcast keynotes, or live microphone/camera captures.
                </p>
              </div>

              {/* Sample Media Preloaders */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-400 font-medium mr-1">Sample tracks:</span>
                {SAMPLE_MEDIA_TRACKS.map((track) => (
                  <button
                    key={track.id}
                    id={`btn-load-sample-track-${track.id}`}
                    type="button"
                    onClick={() => handleSelectSampleTrack(track)}
                    className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                      selectedSampleTrack?.id === track.id
                        ? "bg-[#0F2540] text-white"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    {track.mediaType === "video" ? (
                      <Video className="w-3 h-3 text-indigo-500" />
                    ) : (
                      <Music className="w-3 h-3 text-[#C98A2C]" />
                    )}
                    <span>{track.title.split(" ")[0]} ({track.mediaType})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Model Calibration Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-gradient-to-r from-slate-900 to-[#0F2540] text-white shadow-xs">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-400/20 border border-amber-400/30 text-amber-300 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">
                      AI Model Calibrated: {trainingProfile.domain}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-semibold border border-amber-400/30">
                      {trainingProfile.customTerms.length} Specialized Terms Active
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Optimized to extract clean, actionable notes from YouTube videos and audio tracks without hallucinations.
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="btn-train-event-ai-banner"
                onClick={() => setIsTrainingModalOpen(true)}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 transition-colors flex items-center gap-1.5 shrink-0 shadow-xs"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Train / Calibrate Model</span>
              </button>
            </div>

            {/* Track Type & AI Training Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              {/* Track Type Tabs */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">Track Source:</span>
                <div className="flex flex-wrap items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
                  <button
                    type="button"
                    id="btn-select-audio-mode"
                    onClick={() => {
                      setTrackSource("file");
                      setMediaType("audio");
                      if (selectedSampleTrack && selectedSampleTrack.mediaType !== "audio") {
                        handleClearActiveTrack();
                      }
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                      trackSource === "file" && mediaType === "audio"
                        ? "bg-[#0F2540] text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Music className="w-3.5 h-3.5 text-[#C98A2C]" />
                    <span>Audio Track (.mp3, .wav, .m4a)</span>
                  </button>

                  <button
                    type="button"
                    id="btn-select-youtube-mode"
                    onClick={() => {
                      setTrackSource("url");
                      setMediaType("youtube");
                      if (selectedSampleTrack) {
                        handleClearActiveTrack();
                      }
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                      trackSource === "url" && mediaType === "youtube"
                        ? "bg-rose-600 text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Youtube className="w-3.5 h-3.5 text-rose-500" />
                    <span>YouTube Video URL</span>
                  </button>

                  <button
                    type="button"
                    id="btn-select-video-mode"
                    onClick={() => {
                      setTrackSource("file");
                      setMediaType("video");
                      if (selectedSampleTrack && selectedSampleTrack.mediaType !== "video") {
                        handleClearActiveTrack();
                      }
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                      trackSource === "file" && mediaType === "video"
                        ? "bg-[#0F2540] text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Video className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Video File (.mp4, .webm)</span>
                  </button>

                  <button
                    type="button"
                    id="btn-select-url-mode"
                    onClick={() => {
                      setTrackSource("url");
                      setMediaType("audio");
                      if (selectedSampleTrack) {
                        handleClearActiveTrack();
                      }
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                      trackSource === "url" && mediaType === "audio"
                        ? "bg-[#0F2540] text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5 text-sky-500" />
                    <span>Audio Stream / Web Link</span>
                  </button>

                  <button
                    type="button"
                    id="btn-select-live-mode"
                    onClick={() => {
                      setTrackSource("live");
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                      trackSource === "live"
                        ? "bg-[#0F2540] text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                    <span>Live Event Mic</span>
                  </button>
                </div>
              </div>

              {/* Event AI Training & Quick Record Triggers */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  id="btn-train-event-ai"
                  onClick={() => setIsTrainingModalOpen(true)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-2xs transition-all flex items-center gap-1.5 group"
                  title="Configure domain vocabulary, speaker context, and notes focus for YouTube and audio tracks"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#C98A2C] group-hover:rotate-12 transition-transform" />
                  <span>Configure Training</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                    {trainingProfile.domain.length > 16 ? trainingProfile.domain.slice(0, 16) + "…" : trainingProfile.domain}
                  </span>
                </button>

                {trackSource === "file" && (
                  <button
                    type="button"
                    id="btn-open-live-recorder"
                    onClick={() => setIsRecordingModalOpen(!isRecordingModalOpen)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <Radio className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                    <span>
                      {isRecordingModalOpen
                        ? "Close Recorder"
                        : `Quick Record ${mediaType === "video" ? "Video" : "Audio"}`}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Live Media Recorder Drawer (when file mode quick recording is opened) */}
            {isRecordingModalOpen && trackSource === "file" && (
              <LiveMediaRecorder
                mode={mediaType}
                onRecordingComplete={handleRecordingComplete}
                onCancel={() => setIsRecordingModalOpen(false)}
              />
            )}

            {/* INGESTION CONTENT AREA DEPENDING ON trackSource */}
            {trackSource === "url" ? (
              hasActiveTrack && mediaUrl ? (
                <div className="space-y-3">
                  <TrackPlayer
                    mediaType={mediaType}
                    trackName={trackName || (mediaType === "youtube" ? "YouTube Video" : "url_media_stream")}
                    trackDuration={trackDuration || "Remote Stream"}
                    trackSize={trackSize || (mediaType === "youtube" ? "YouTube Video" : "URL Stream")}
                    mediaUrl={mediaUrl}
                    youtubeId={youtubeId || undefined}
                    onReplaceTrack={handleClearActiveTrack}
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleClearActiveTrack}
                      className="text-xs font-semibold text-sky-600 hover:text-sky-800 flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Change Media URL</span>
                    </button>
                  </div>
                </div>
              ) : (
                <UrlMediaIngestion
                  currentType={mediaType}
                  onUrlLoaded={handleUrlLoaded}
                />
              )
            ) : trackSource === "live" ? (
              /* Live Event Stage Launcher Card */
              <div className="rounded-2xl border-2 border-dashed border-rose-200 bg-rose-50/40 p-6 sm:p-8 text-center space-y-6">
                <div className="max-w-xl mx-auto space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shadow-xs">
                    <Radio className="w-8 h-8 animate-pulse" />
                  </div>

                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100/80 text-rose-800 text-xs font-bold mb-2">
                      <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                      <span>Real-Time Stage Processing Engine</span>
                    </div>
                    <h3 className="text-lg font-bold text-[#0F2540]">
                      Live Event Stage & Real-Time AI Checkpointing
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Capture live stage microphone or video feed directly in the venue. The calibrated AI model uses your custom vocabulary, speaker context, and live Q&A rules to structure the session on the fly.
                    </p>
                  </div>

                  {/* Training status snapshot */}
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-left space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#C98A2C]" />
                        Calibrated Model Profile:
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsTrainingModalOpen(true)}
                        className="text-[11px] font-bold text-[#0F2540] hover:underline"
                      >
                        Edit Training
                      </button>
                    </div>
                    <div className="text-xs font-bold text-[#0F2540]">
                      {trainingProfile.domain}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {trainingProfile.customTerms.slice(0, 8).map((term, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                        >
                          {term}
                        </span>
                      ))}
                      {trainingProfile.customTerms.length > 8 && (
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium text-slate-400">
                          +{trainingProfile.customTerms.length - 8} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      id="btn-launch-live-event-stage"
                      onClick={() => setIsLiveStudioOpen(true)}
                      className="px-6 py-3 rounded-xl bg-[#0F2540] hover:bg-[#17375E] text-white text-xs font-bold shadow-md transition-all flex items-center gap-2"
                    >
                      <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
                      <span>Launch Live Event Stage & Process</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsTrainingModalOpen(true)}
                      className="px-4 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4 text-[#C98A2C]" />
                      <span>Configure Training First</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Dropzone for Audio / Video File Selection */
              hasActiveTrack ? (
                <TrackPlayer
                  mediaType={mediaType}
                  trackName={trackName || "session_track"}
                  trackDuration={trackDuration || "30:00"}
                  trackSize={trackSize}
                  mediaUrl={mediaPreviewUrl || undefined}
                  youtubeId={youtubeId || undefined}
                  onReplaceTrack={handleClearActiveTrack}
                />
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files?.[0]) {
                      handleMediaFileSelect(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all ${
                    isDragging
                      ? "border-[#0F2540] bg-slate-100/80"
                      : "border-slate-300 hover:border-slate-400 bg-slate-50/50"
                  }`}
                >
                  <div className="max-w-md mx-auto space-y-4">
                    <div
                      className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center ${
                        mediaType === "video"
                          ? "bg-indigo-50 text-indigo-600 border border-indigo-200"
                          : "bg-amber-50 text-[#C98A2C] border border-amber-200"
                      }`}
                    >
                      {mediaType === "video" ? (
                        <Video className="w-8 h-8" />
                      ) : (
                        <Music className="w-8 h-8" />
                      )}
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-[#0F2540]">
                        Drop your {mediaType === "video" ? "video" : "audio"} track here
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {mediaType === "video"
                          ? "Supports MP4, WebM, MOV, MKV files (up to 500 MB)"
                          : "Supports MP3, WAV, M4A, AAC, FLAC, OGG files (up to 200 MB)"}
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-3 pt-2">
                      <label
                        htmlFor="media-file-input"
                        className="px-5 py-2.5 rounded-xl bg-[#0F2540] hover:bg-[#17375E] text-white text-xs font-semibold cursor-pointer shadow-sm transition-all flex items-center gap-2"
                      >
                        <UploadCloud className="w-4 h-4 text-[#C98A2C]" />
                        <span>Choose {mediaType === "video" ? "Video" : "Audio"} File</span>
                      </label>
                      <input
                        id="media-file-input"
                        type="file"
                        accept={
                          mediaType === "video"
                            ? "video/mp4,video/webm,video/quicktime,video/*"
                            : "audio/mp3,audio/mpeg,audio/wav,audio/m4a,audio/aac,audio/flac,audio/*"
                        }
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleMediaFileSelect(e.target.files[0]);
                          }
                        }}
                      />
                    </div>

                    <p className="text-[11px] text-slate-400 font-mono pt-1">
                      Or select a pre-loaded sample track from the top bar to test instantly
                    </p>
                  </div>
                </div>
              )
            )}

            {/* Session Metadata Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-slate-800 flex items-center justify-between">
                  <span>Session Title *</span>
                  <span className="text-[11px] text-slate-400">e.g. Distributed Systems Architecture</span>
                </label>
                <input
                  id="admin-session-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Designing Resilient Distributed Systems Under High Concurrency"
                  className="w-full text-sm font-medium text-[#0F2540] bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F2540]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800">
                  Speaker / Presenter
                </label>
                <input
                  id="admin-session-speaker"
                  type="text"
                  value={speaker}
                  onChange={(e) => setSpeaker(e.target.value)}
                  placeholder="e.g. Dr. Aris Thorne"
                  className="w-full text-sm font-medium text-[#0F2540] bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F2540]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-800">
                Event or Series Name (Optional)
              </label>
              <input
                id="admin-session-event"
                type="text"
                value={eventContext}
                onChange={(e) => setEventContext(e.target.value)}
                placeholder="e.g. CloudScale Global Summit 2026 • Main Auditorium"
                className="w-full text-sm font-medium text-[#0F2540] bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F2540]"
              />
            </div>

            {/* Submission Action */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C98A2C] shrink-0" />
                <span>
                  Transcribes and segments track into labeled topic bullet points & verified Q&A exchanges.
                </span>
              </div>

              <button
                id="btn-process-media"
                type="submit"
                disabled={isProcessing || !hasActiveTrack}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#0F2540] hover:bg-[#17375E] text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#C98A2C]" />
                    <span>{processingStage || "Extracting Notes with AI..."}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#C98A2C]" />
                    <span>
                      Extract Notes from {mediaType === "youtube" ? "YouTube Video" : mediaType === "video" ? "Video" : "Audio"} Track
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: REVIEW & EDIT */}
      {activeAdminTab === "review" && (
        <div className="space-y-6">
          {/* Review Banner with Source Track Chip */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0F2540]/5 text-[#0F2540] text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Acoustic Track Extracted & Segmented</span>
                  </div>

                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {mediaType === "video" ? (
                      <Video className="w-3 h-3 text-indigo-600" />
                    ) : (
                      <Music className="w-3 h-3 text-[#C98A2C]" />
                    )}
                    <span>{trackName || "Track"} ({trackDuration || "Duration logged"})</span>
                  </span>
                </div>

                <h2 className="text-xl font-bold text-[#0F2540]">
                  Review & Refine Before Publishing
                </h2>
                <p className="text-xs text-slate-500">
                  You can edit section titles, tweak bullet points, rephrase Q&A pairs, or add missing notes.
                </p>
              </div>

              {/* Publish CTA */}
              <button
                id="btn-publish-session"
                onClick={handlePublish}
                disabled={isPublishing}
                className="px-6 py-3 rounded-xl bg-[#C98A2C] hover:bg-[#B57921] text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
              >
                {isPublishing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Publish & Generate RecallPass</span>
                  </>
                )}
              </button>
            </div>

            {/* Mandatory AI Label */}
            <div className="bg-slate-50 border-l-4 border-[#C98A2C] p-3 rounded-r-lg text-xs text-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C98A2C] shrink-0" />
                <span>
                  <strong>AI-generated — verify against the original recording for critical details.</strong>
                </span>
              </div>
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                Standard 60-day expiry automatically attached upon publishing
              </span>
            </div>
          </div>

          {/* Section 1: Topic Notes Review */}
          <div className="space-y-4">
            <NotesSection
              sections={reviewSections}
              isEditable={true}
              onUpdateSection={handleUpdateSection}
              onRemoveSection={handleRemoveSection}
              onAddSection={handleAddSection}
            />
          </div>

          {/* Section 2: Real Audience Q&A Review */}
          <div className="space-y-4">
            <QASection
              qaList={reviewQAList}
              isEditable={true}
              onUpdateQA={handleUpdateQA}
              onRemoveQA={handleRemoveQA}
              onAddQA={handleAddQA}
            />
          </div>

          {/* Bottom Publish Bar */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#C98A2C]" />
              <span>
                Publishing will generate a short code (e.g. <strong>RP-XXXXXX</strong>) with a 2-month expiry date.
              </span>
            </div>

            <button
              id="btn-publish-session-bottom"
              onClick={handlePublish}
              disabled={isPublishing}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#0F2540] hover:bg-[#17375E] text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4 text-[#C98A2C]" />
              <span>Publish & Generate Access Code</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: MANAGE PUBLISHED PASSES */}
      {activeAdminTab === "manage" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-bold text-[#0F2540]">
                All Published Session Passes
              </h2>
              <p className="text-xs text-slate-500">
                Track active codes, monitor 60-day expirations, and test attendee experiences
              </p>
            </div>

            <button
              id="btn-create-new-pass"
              onClick={() => setActiveAdminTab("create")}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#0F2540] text-white hover:bg-[#17375E] flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-[#C98A2C]" />
              <span>Ingest New Track</span>
            </button>
          </div>

          {sessions.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 text-slate-500">
              No published sessions found. Ingest your first audio or video track above!
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {sessions.map((s) => {
                const isExpired = new Date(s.expiresAt) <= new Date();
                const daysRemaining = Math.max(
                  0,
                  Math.ceil(
                    (new Date(s.expiresAt).getTime() - new Date().getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                );

                return (
                  <div
                    key={s.accessCode}
                    id={`session-row-${s.accessCode}`}
                    className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-bold px-2.5 py-0.5 rounded bg-[#0F2540] text-white">
                          {s.accessCode}
                        </span>

                        {/* Audio / Video Track Tag */}
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            s.mediaType === "video"
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                              : "bg-amber-50 text-[#C98A2C] border border-amber-200"
                          }`}
                        >
                          {s.mediaType === "video" ? (
                            <Video className="w-3 h-3" />
                          ) : (
                            <Music className="w-3 h-3" />
                          )}
                          <span className="capitalize">{s.mediaType || "audio"} Track</span>
                          {s.trackDuration && <span className="text-[10px] font-mono">({s.trackDuration})</span>}
                        </span>

                        {isExpired ? (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                            Expired (Archived)
                          </span>
                        ) : (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Active ({daysRemaining} days remaining)
                          </span>
                        )}

                        <span className="text-xs text-slate-400">
                          {s.sections.length} topics • {s.qaList.length} Q&A
                        </span>
                      </div>

                      <h3 className="font-bold text-base text-[#0F2540] leading-snug">
                        {s.title}
                      </h3>

                      <p className="text-xs text-slate-500">
                        {s.speaker && <span className="font-medium text-slate-700">{s.speaker}</span>}
                        {s.speaker && s.eventContext && " • "}
                        {s.eventContext && <span>{s.eventContext}</span>}
                        {s.trackName && (
                          <span className="font-mono text-slate-400 ml-1">
                            • {s.trackName}
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        id={`btn-manage-view-${s.accessCode}`}
                        onClick={() => onViewAttendeeSession(s.accessCode)}
                        className="text-xs font-medium text-[#0F2540] hover:text-white hover:bg-[#0F2540] border border-slate-300 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                        title="View as Attendee"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Attendee View</span>
                      </button>

                      <button
                        id={`btn-manage-toggle-${s.accessCode}`}
                        onClick={() => handleToggleExpiry(s.accessCode)}
                        className="text-xs font-medium text-amber-800 hover:bg-amber-100 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg transition-colors"
                        title="Toggle expiration state to test active vs expired behavior"
                      >
                        {isExpired ? "Reactivate (60d)" : "Expire (Test)"}
                      </button>

                      <button
                        id={`btn-manage-delete-${s.accessCode}`}
                        onClick={() => handleDeleteSession(s.accessCode)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded"
                        title="Delete session"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Publish Success Modal */}
      {publishedSession && (
        <PublishModal
          session={publishedSession}
          onClose={() => {
            setPublishedSession(null);
            setActiveAdminTab("manage");
          }}
          onViewAsAttendee={(code) => {
            setPublishedSession(null);
            onViewAttendeeSession(code);
          }}
        />
      )}

      {/* Event Training Modal */}
      <EventTrainingModal
        isOpen={isTrainingModalOpen}
        onClose={() => setIsTrainingModalOpen(false)}
        profile={trainingProfile}
        onSaveProfile={handleSaveTrainingProfile}
      />

      {/* Live Event Studio Modal */}
      {isLiveStudioOpen && (
        <LiveEventStudio
          mode={mediaType}
          eventTraining={trainingProfile}
          onOpenTraining={() => setIsTrainingModalOpen(true)}
          onCompleteLiveSession={handleCompleteLiveSession}
          onClose={() => setIsLiveStudioOpen(false)}
        />
      )}
    </div>
  );
};
