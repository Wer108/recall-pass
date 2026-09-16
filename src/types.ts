export interface TopicSection {
  id: string;
  title: string;
  bullets: string[];
}

export interface QAPair {
  id: string;
  question: string;
  answer: string;
  askerContext?: string;
}

export interface SessionData {
  id: string;
  accessCode: string;
  title: string;
  speaker?: string;
  eventContext?: string;
  createdAt: string;
  expiresAt: string;
  isExpired?: boolean;
  sections: TopicSection[];
  qaList: QAPair[];
  mediaType?: "audio" | "video" | "url" | "youtube";
  trackName?: string;
  trackDuration?: string;
  trackSize?: string;
  mediaPreviewUrl?: string;
  mediaUrl?: string;
  youtubeId?: string;
  wordCount?: number;
  rawTranscriptSnippet?: string;
  published: boolean;
  isLiveEventSession?: boolean;
}

export interface EventTrainingProfile {
  domain: string;
  customTerms: string[];
  speakerContext: string;
  qaFormatPrompt: string;
  targetCadence: "realtime" | "interval" | "ondemand";
  notesFocus: "technical" | "general" | "executive" | "study_guide";
  sourceTypePreference?: "youtube" | "audio_upload" | "podcast_stream" | "all_media";
  customPromptInstructions?: string;
  isLiveTrained: boolean;
}

export interface ProcessMediaRequest {
  title: string;
  speaker?: string;
  eventContext?: string;
  mediaType: "audio" | "video" | "url" | "youtube";
  trackName: string;
  trackDuration?: string;
  trackSize?: string;
  mediaBase64?: string;
  mediaUrl?: string;
  youtubeId?: string;
  mimeType?: string;
  sampleTrackId?: string;
  transcriptFallback?: string;
  liveTranscript?: string;
  lectureNotesOrTranscript?: string;
  trainingProfile?: EventTrainingProfile;
}

export interface ProcessMediaResponse {
  sections: Array<{
    title: string;
    bullets: string[];
  }>;
  qaList: Array<{
    question: string;
    answer: string;
    askerContext?: string;
  }>;
  trackInfo?: {
    mediaType: "audio" | "video" | "url" | "youtube";
    trackName: string;
    trackDuration?: string;
    mediaUrl?: string;
    youtubeId?: string;
  };
  wordCount?: number;
}

export interface ProcessTranscriptRequest {
  title: string;
  speaker?: string;
  transcript: string;
}

export interface ProcessTranscriptResponse {
  sections: Array<{
    title: string;
    bullets: string[];
  }>;
  qaList: Array<{
    question: string;
    answer: string;
    askerContext?: string;
  }>;
  wordCount: number;
}

export interface AdminAuthSession {
  adminId: string;
  token: string;
  loginTime: string;
  role: "admin";
}
