import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { img } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";
import type { PostMedia } from "@/types";

export function MediaItem({
  media,
  alt,
  className,
  fit = "cover",
  onRatioDetected,
  onMediaClick,
}: {
  media: PostMedia;
  alt: string;
  className?: string;
  fit?: "cover" | "contain";
  onRatioDetected?: (ratio: number) => void;
  onMediaClick?: (() => void) | undefined;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showIcon, setShowIcon] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (onMediaClick) {
      e.preventDefault();
      e.stopPropagation();
      onMediaClick();
      return;
    }
    togglePlay(e);
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().then(() => setIsPlaying(true)).catch(() => undefined);
    } else {
      v.pause();
      setIsPlaying(false);
    }
    setShowIcon(true);
    window.setTimeout(() => setShowIcon(false), 500);
  };

  if (media.resourceType === "video") {
    return (
      <div
        className={cn("relative h-full w-full bg-black flex items-center justify-center cursor-pointer select-none", className)}
        onClick={handleClick}
      >
        <video
          ref={videoRef}
          src={img.video(media.url)}
          poster={img.poster(media.url)}
          playsInline
          muted={muted}
          loop
          autoPlay
          disablePictureInPicture
          controlsList="nodownload noplaybackrate nofullscreen noremoteplayback"
          preload="metadata"
          aria-label={alt}
          onLoadedMetadata={(e) => {
            const w = e.currentTarget.videoWidth;
            const h = e.currentTarget.videoHeight;
            if (w && h) onRatioDetected?.(w / h);
          }}
          className={cn("h-full w-full", fit === "cover" ? "object-cover" : "object-contain")}
        />

        {/* Center play/pause indicator ripple */}
        {showIcon && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25 backdrop-blur-xs">
            <div className="rounded-full bg-black/60 p-3.5 text-white shadow-xl">
              {isPlaying ? <Play className="h-7 w-7" /> : <Pause className="h-7 w-7" />}
            </div>
          </div>
        )}

        {!isPlaying && !showIcon && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-full bg-black/50 p-3 text-white">
              <Play className="h-6 w-6 fill-white text-white" />
            </div>
          </div>
        )}

        {/* Mute / Unmute Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const next = !muted;
            setMuted(next);
            if (videoRef.current) videoRef.current.muted = next;
          }}
          aria-label={muted ? "Unmute video" : "Mute video"}
          className="absolute bottom-3 right-3 z-10 rounded-full bg-black/60 p-2 text-white backdrop-blur transition-opacity hover:bg-black/80"
        >
          {muted ? (
            <VolumeX className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Volume2 className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
    );
  }

  return (
    <img
      src={img.feed(media.url)}
      alt={media.alt || alt}
      loading="lazy"
      decoding="async"
      onLoad={(e) => {
        const w = e.currentTarget.naturalWidth;
        const h = e.currentTarget.naturalHeight;
        if (w && h) onRatioDetected?.(w / h);
      }}
      className={cn(
        "h-full w-full",
        fit === "cover" ? "object-cover" : "object-contain",
        className,
      )}
    />
  );
}

/** Swipeable / keyboard-navigable carousel with natural aspect-ratio preservation. */
export function MediaCarousel({
  media,
  alt,
  fit = "cover",
  aspectRatio: explicitRatio,
  onMediaClick,
}: {
  media: PostMedia[];
  alt: string;
  fit?: "cover" | "contain";
  aspectRatio?: number;
  onMediaClick?: (() => void) | undefined;
}) {
  const [index, setIndex] = useState(0);
  const [detectedRatio, setDetectedRatio] = useState<number | null>(null);
  const start = useRef<number | null>(null);
  const total = media.length;
  const go = (next: number) => setIndex(Math.min(total - 1, Math.max(0, next)));
  const current = media[Math.min(index, total - 1)];

  if (!current) return null;

  // Calculate natural aspect ratio: from props, item metadata, or detected onload
  const rawRatio =
    explicitRatio ||
    (current.width && current.height ? current.width / current.height : detectedRatio);

  // Clamp ratio between 9:16 (0.5625 portrait) and 1.91:1 (landscape)
  const safeRatio = rawRatio ? Math.min(1.91, Math.max(0.5625, rawRatio)) : null;

  return (
    <div
      className={cn(
        "relative w-full max-h-[82vh] md:max-h-[680px] overflow-hidden bg-secondary flex items-center justify-center transition-[aspect-ratio] duration-200",
        !safeRatio && "aspect-square",
      )}
      style={safeRatio ? { aspectRatio: `${safeRatio}` } : undefined}
      onTouchStart={(e) => {
        start.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const from = start.current;
        const to = e.changedTouches[0]?.clientX;
        start.current = null;
        if (from === null || to === undefined) return;
        const delta = to - from;
        if (Math.abs(delta) > 40) go(index + (delta < 0 ? 1 : -1));
      }}
      role={total > 1 ? "group" : undefined}
      aria-label={total > 1 ? `Post media, item ${index + 1} of ${total}` : undefined}
    >
      <MediaItem
        media={current}
        alt={alt}
        fit={fit}
        onRatioDetected={(ratio) => {
          if (!detectedRatio) setDetectedRatio(ratio);
        }}
        onMediaClick={onMediaClick}
      />

      {total > 1 && (
        <>
          {index > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                go(index - 1);
              }}
              aria-label="Previous media"
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/80 p-2 shadow-soft hover:bg-background"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          {index < total - 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                go(index + 1);
              }}
              aria-label="Next media"
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/80 p-2 shadow-soft hover:bg-background"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {media.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition-colors",
                  i === index ? "bg-primary" : "bg-background/70",
                )}
              />
            ))}
          </div>
          <span className="absolute right-3 top-3 z-10 rounded-full bg-foreground/60 px-2 py-0.5 text-xs text-background backdrop-blur">
            {index + 1}/{total}
          </span>
        </>
      )}
    </div>
  );
}
