import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from "lucide-react";
import { img } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";
import type { PostMedia } from "@/types";

export function MediaItem({
  media,
  alt,
  className,
  fit = "cover",
}: {
  media: PostMedia;
  alt: string;
  className?: string;
  fit?: "cover" | "contain";
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  if (media.resourceType === "video") {
    return (
      <div className={cn("relative h-full w-full bg-black", className)}>
        <video
          ref={videoRef}
          src={img.video(media.url)}
          poster={img.poster(media.url)}
          controls
          playsInline
          muted={muted}
          loop
          preload="metadata"
          aria-label={alt}
          className={cn("h-full w-full", fit === "cover" ? "object-cover" : "object-contain")}
        />
        <button
          type="button"
          onClick={() => {
            const next = !muted;
            setMuted(next);
            if (videoRef.current) videoRef.current.muted = next;
          }}
          aria-label={muted ? "Unmute video" : "Mute video"}
          className="absolute bottom-3 right-3 rounded-full bg-foreground/60 p-2 text-background"
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
      className={cn(
        "h-full w-full",
        fit === "cover" ? "object-cover" : "object-contain",
        className,
      )}
    />
  );
}

/** Swipeable / keyboard-navigable carousel for multi-image posts. */
export function MediaCarousel({
  media,
  alt,
  fit = "cover",
}: {
  media: PostMedia[];
  alt: string;
  fit?: "cover" | "contain";
}) {
  const [index, setIndex] = useState(0);
  const start = useRef<number | null>(null);
  const total = media.length;
  const go = (next: number) => setIndex(Math.min(total - 1, Math.max(0, next)));
  const current = media[Math.min(index, total - 1)];

  if (!current) return null;

  return (
    <div
      className="relative aspect-square w-full overflow-hidden bg-secondary"
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
      <MediaItem media={current} alt={alt} fit={fit} />


      {total > 1 && (
        <>
          {index > 0 && (
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Previous media"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 shadow-soft"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          {index < total - 1 && (
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Next media"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 shadow-soft"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
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
          <span className="absolute right-3 top-3 rounded-full bg-foreground/60 px-2 py-0.5 text-xs text-background">
            {index + 1}/{total}
          </span>
        </>
      )}
    </div>
  );
}
