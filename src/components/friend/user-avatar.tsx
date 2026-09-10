import { img } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";

interface Props {
  photoURL?: string | null | undefined;
  name?: string | null | undefined;
  size?: number | undefined;
  className?: string | undefined;
  ring?: boolean | undefined;
}

export function UserAvatar({ photoURL, name, size = 40, className, ring }: Props) {
  const initials = (name ?? "?").trim().slice(0, 1).toUpperCase() || "?";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-secondary-foreground",
        ring && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {photoURL ? (
        <img
          src={img.avatar(photoURL, size * 2)}
          alt={name ? `${name}'s profile photo` : "Profile photo"}
          width={size}
          height={size}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="font-display font-semibold"
          style={{ fontSize: Math.max(11, size * 0.4) }}
        >
          {initials}
        </span>
      )}
    </span>
  );
}
