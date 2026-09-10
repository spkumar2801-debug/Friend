import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { uploadToCloudinary, validateFile, img } from "@/lib/cloudinary";
import type { PostMedia } from "@/types";

export function MediaPicker({
  media,
  onChange,
  max = 10,
  label = "Add photos or a video",
}: {
  media: PostMedia[];
  onChange: (media: PostMedia[]) => void;
  max?: number;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const pick = async (files: FileList | null) => {
    if (!files?.length) return;
    const chosen = Array.from(files).slice(0, max - media.length);
    for (const file of chosen) {
      const invalid = validateFile(file);
      if (invalid) {
        toast.error(invalid);
        return;
      }
    }
    setUploading(true);
    const uploaded: PostMedia[] = [];
    try {
      for (let i = 0; i < chosen.length; i++) {
        const file = chosen[i]!;
        const result = await uploadToCloudinary(file, (pct) =>
          setProgress(Math.round(((i + pct / 100) / chosen.length) * 100)),
        );
        uploaded.push({ ...result, alt: "" });
      }
      onChange([...media, ...uploaded]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= media.length) return;
    const next = [...media];
    const [item] = next.splice(from, 1);
    if (item) next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        id="friend-media"
        type="file"
        accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
        multiple={max > 1}
        className="sr-only"
        onChange={(e) => void pick(e.target.files)}
      />

      {media.length > 0 && (
        <ul className="grid grid-cols-3 gap-2">
          {media.map((item, i) => (
            <li key={item.publicId} className="relative overflow-hidden rounded-xl bg-secondary">
              <div className="aspect-square">
                {item.resourceType === "video" ? (
                  <video
                    src={img.video(item.url)}
                    poster={img.poster(item.url)}
                    muted
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <img
                    src={img.thumb(item.url)}
                    alt={item.alt || `Selected item ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <button
                type="button"
                aria-label={`Remove item ${i + 1}`}
                onClick={() => onChange(media.filter((_, index) => index !== i))}
                className="absolute right-1 top-1 rounded-full bg-foreground/70 p-1 text-background"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              {media.length > 1 && (
                <div className="absolute bottom-1 left-1 flex gap-1">
                  <button
                    type="button"
                    aria-label={`Move item ${i + 1} earlier`}
                    onClick={() => move(i, i - 1)}
                    className="rounded bg-background/85 px-1.5 text-xs"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    aria-label={`Move item ${i + 1} later`}
                    onClick={() => move(i, i + 1)}
                    className="rounded bg-background/85 px-1.5 text-xs"
                  >
                    ›
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {uploading && (
        <div className="space-y-1">
          <Progress value={progress} aria-label="Upload progress" />
          <p className="text-xs text-muted-foreground">Uploading… {progress}%</p>
        </div>
      )}

      {media.length < max && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <ImagePlus className="mr-2 h-4 w-4" aria-hidden="true" />
          )}
          {label}
        </Button>
      )}
    </div>
  );
}
