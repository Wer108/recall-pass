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
  mediaType?: "audio" | "video";
  trackName?: string;
  trackDuration?: string;
  trackSize?: string;
  mediaPreviewUrl?: string;
  wordCount?: number;
  rawTranscriptSnippet?: string;
  published: boolean;
}

export interface ProcessMediaRequest {
  title: string;
  speaker?: string;
  eventContext?: string;
  mediaType: "audio" | "video";
  trackName: string;
  trackDuration?: string;
  trackSize?: string;
  mediaBase64?: string;
  mimeType?: string;
  sampleTrackId?: string;
  transcriptFallback?: string;
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
    mediaType: "audio" | "video";
    trackName: string;
    trackDuration?: string;
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
