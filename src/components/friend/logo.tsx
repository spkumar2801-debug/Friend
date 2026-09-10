import { cn } from "@/lib/utils";

/** Friend mark: two overlapping rings — original branding, no Instagram assets. */
export function FriendMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-flex h-8 w-8 shrink-0 items-center justify-center",
        className,
      )}
    >
      <span className="absolute left-0 h-6 w-6 rounded-full border-[2.5px] border-primary" />
      <span className="absolute right-0 h-6 w-6 rounded-full border-[2.5px] border-accent" />
    </span>
  );
}

export function FriendLogo({
  className,
  showWord = true,
}: {
  className?: string;
  showWord?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <FriendMark />
      {showWord && (
        <span className="font-display text-xl font-semibold tracking-tight">Friend</span>
      )}
      <span className="sr-only">Friend</span>
    </span>
  );
}
