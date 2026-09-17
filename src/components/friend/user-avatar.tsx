import { useEffect, useState } from "react";
import { img } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";

interface Props {
  photoURL?: string | null | undefined;
  name?: string | null | undefined;
  size?: number | undefined;
  className?: string | undefined;
  ring?: boolean | undefined;
}

const AVATAR_GRADIENTS = [
  "from-pink-500 to-rose-600",
  "from-purple-600 to-indigo-600",
  "from-blue-500 to-cyan-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-violet-600 to-fuchsia-600",
];

function getGradient(name?: string | null): string {
  if (!name) return AVATAR_GRADIENTS[0]!;
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length]!;
}

export function UserAvatar({ photoURL, name, size = 40, className, ring }: Props) {
  const [hasError, setHasError] = useState(false);
  const cleanUrl = photoURL && photoURL.trim().length > 0 ? photoURL.trim() : null;

  useEffect(() => {
    setHasError(false);
  }, [cleanUrl]);

  const initials = (name ?? "?").trim().slice(0, 1).toUpperCase() || "?";
  const bgGradient = getGradient(name);

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-secondary-foreground shadow-xs select-none",
        ring && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {cleanUrl && !hasError ? (
        <img
          src={img.avatar(cleanUrl, size * 2)}
          alt={name ? `${name}'s profile photo` : "Profile photo"}
          width={size}
          height={size}
          loading="lazy"
          onError={() => setHasError(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className={cn(
            "flex h-full w-full items-center justify-center bg-gradient-to-tr text-white font-display font-bold shadow-inner",
            bgGradient,
          )}
          style={{ fontSize: Math.max(12, Math.round(size * 0.42)) }}
        >
          {initials}
        </span>
      )}
    </span>
  );
}
