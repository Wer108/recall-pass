// Media utilities for YouTube, audio tracks, and stream detection

export function extractYouTubeId(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  const clean = url.trim();

  // Match youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, youtube.com/shorts/ID
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/;
  const match = clean.match(regExp);
  return match ? match[1] : null;
}

export function isYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null;
}

export function getYouTubeThumbnail(videoId: string, quality: "hq" | "max" = "hq"): string {
  if (quality === "max") {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
}

export interface YouTubeMetadata {
  videoId: string;
  title: string;
  authorName: string;
  authorUrl?: string;
  thumbnailUrl: string;
  duration?: string;
}

export async function fetchYouTubeInfo(urlOrId: string): Promise<YouTubeMetadata | null> {
  const videoId = extractYouTubeId(urlOrId) || (urlOrId.length === 11 ? urlOrId : null);
  if (!videoId) return null;

  const targetUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const defaultThumb = getYouTubeThumbnail(videoId);

  // Try server proxy first (avoids CORS issues on production/static)
  try {
    const srvRes = await fetch(`/api/youtube-info?id=${encodeURIComponent(videoId)}`);
    if (srvRes.ok) {
      const data = await srvRes.json();
      if (data && data.title) {
        return {
          videoId,
          title: data.title,
          authorName: data.authorName || "YouTube Creator",
          authorUrl: data.authorUrl,
          thumbnailUrl: data.thumbnailUrl || defaultThumb,
          duration: data.duration || "YouTube Video",
        };
      }
    }
  } catch {
    // Continue to oembed fallback
  }

  // Fallback to public YouTube oEmbed API directly
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(targetUrl)}&format=json`;
    const res = await fetch(oembedUrl);
    if (res.ok) {
      const data = await res.json();
      return {
        videoId,
        title: data.title || `YouTube Video (${videoId})`,
        authorName: data.author_name || "Speaker / Creator",
        authorUrl: data.author_url,
        thumbnailUrl: data.thumbnail_url || defaultThumb,
        duration: "Full Video",
      };
    }
  } catch (err) {
    console.info("Direct YouTube oEmbed request notice, using thumbnail metadata fallback:", err);
  }

  return {
    videoId,
    title: `YouTube Video (${videoId})`,
    authorName: "Featured Speaker",
    thumbnailUrl: defaultThumb,
    duration: "YouTube Stream",
  };
}

export function isAudioFormat(filenameOrMime: string): boolean {
  if (!filenameOrMime) return false;
  const lower = filenameOrMime.toLowerCase();
  return (
    lower.startsWith("audio/") ||
    /\.(mp3|wav|m4a|aac|flac|ogg|opus|weba|wma|aiff)$/i.test(lower)
  );
}

export function isVideoFormat(filenameOrMime: string): boolean {
  if (!filenameOrMime) return false;
  const lower = filenameOrMime.toLowerCase();
  return (
    lower.startsWith("video/") ||
    /\.(mp4|webm|mov|mkv|avi|m4v|wmv|flv)$/i.test(lower)
  );
}
