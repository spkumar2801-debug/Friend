import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth";
import { deleteStory, markStoryViewed, toDate } from "@/lib/services";
import { friendlyError } from "@/lib/errors";
import { timeAgo } from "@/lib/text";
import type { Story } from "@/types";
import { UserAvatar } from "./user-avatar";
import { MediaItem } from "./post-media";
import { cn } from "@/lib/utils";

interface Group {
  authorId: string;
  username: string;
  displayName: string;
  photoURL: string | null;
  stories: Story[];
  unseen: boolean;
}

export function StoryTray({
  stories,
  onCreate,
  onChanged,
}: {
  stories: Story[];
  onCreate: () => void;
  onChanged: () => void;
}) {
  const { profile } = useAuth();
  const [openGroup, setOpenGroup] = useState<Group | null>(null);

  const groups = useMemo<Group[]>(() => {
    const map = new Map<string, Group>();
    for (const story of stories) {
      const existing = map.get(story.authorId);
      const unseen = !profile || !story.viewers?.includes(profile.uid);
      if (existing) {
        existing.stories.push(story);
        existing.unseen = existing.unseen || unseen;
      } else {
        map.set(story.authorId, {
          authorId: story.authorId,
          username: story.author.username,
          displayName: story.author.displayName,
          photoURL: story.author.photoURL,
          stories: [story],
          unseen,
        });
      }
    }
    return [...map.values()].sort((a, b) => Number(b.unseen) - Number(a.unseen));
  }, [stories, profile]);

  return (
    <>
      <div className="no-scrollbar flex gap-4 overflow-x-auto border-b border-border px-4 py-4 md:rounded-2xl md:border md:bg-surface md:px-5">
        <button
          type="button"
          onClick={onCreate}
          className="flex w-16 shrink-0 flex-col items-center gap-1.5"
          aria-label="Add a story"
        >
          <span className="relative">
            <UserAvatar photoURL={profile?.photoURL} name={profile?.displayName} size={60} />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground">
              <Plus className="h-3 w-3" aria-hidden="true" />
            </span>
          </span>
          <span className="w-full truncate text-center text-xs text-muted-foreground">Your story</span>
        </button>

        {groups.map((group) => (
          <button
            key={group.authorId}
            type="button"
            onClick={() => setOpenGroup(group)}
            className="flex w-16 shrink-0 flex-col items-center gap-1.5"
            aria-label={`View ${group.username}'s story`}
          >
            <span
              className={cn(
                "rounded-full p-[2.5px]",
                group.unseen ? "bg-primary" : "bg-border",
              )}
            >
              <span className="block rounded-full border-2 border-background">
                <UserAvatar photoURL={group.photoURL} name={group.displayName} size={56} />
              </span>
            </span>
            <span className="w-full truncate text-center text-xs">{group.username}</span>
          </button>
        ))}
      </div>

      {openGroup && (
        <StoryViewer
          group={openGroup}
          onClose={() => {
            setOpenGroup(null);
            onChanged();
          }}
        />
      )}
    </>
  );
}

function StoryViewer({ group, onClose }: { group: Group; onClose: () => void }) {
  const { profile } = useAuth();
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const story = group.stories[index];

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!story || !profile) return;
    void markStoryViewed(story.id, profile.uid).catch(() => undefined);
  }, [story, profile]);

  useEffect(() => {
    setProgress(0);
    if (paused) return;
    const duration = story?.media.resourceType === "video" ? 15000 : 5000;
    const started = Date.now();
    const timer = window.setInterval(() => {
      const pct = Math.min(100, ((Date.now() - started) / duration) * 100);
      setProgress(pct);
      if (pct >= 100) {
        window.clearInterval(timer);
        if (index < group.stories.length - 1) setIndex(index + 1);
        else onClose();
      }
    }, 60);
    return () => window.clearInterval(timer);
  }, [index, paused, story, group.stories.length, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => Math.min(group.stories.length - 1, i + 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [group.stories.length, onClose]);

  if (!story) return null;

  const remove = async () => {
    try {
      await deleteStory(story.id);
      toast.success("Story deleted");
      onClose();
    } catch (e) {
      toast.error(friendlyError(e));
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${group.username}'s story`}
      className="fixed inset-0 z-50 flex flex-col bg-black"
    >
      <div className="flex gap-1 px-3 pt-3">
        {group.stories.map((_, i) => (
          <span key={i} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
            <span
              className="block h-full bg-white"
              style={{ width: i < index ? "100%" : i === index ? `${progress}%` : "0%" }}
            />
          </span>
        ))}
      </div>

      <div className="flex items-center gap-3 px-4 py-3 text-white">
        <UserAvatar photoURL={group.photoURL} name={group.displayName} size={34} />
        <div className="min-w-0 flex-1 text-sm">
          <p className="truncate font-semibold">{group.username}</p>
          <p className="text-xs text-white/70">{timeAgo(toDate(story.createdAt))} ago</p>
        </div>
        {profile?.uid === group.authorId && (
          <button type="button" onClick={remove} aria-label="Delete this story" className="p-2">
            <Trash2 className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
        <button ref={closeRef} type="button" onClick={onClose} aria-label="Close story" className="p-2">
          <X className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>

      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden"
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerCancel={() => setPaused(false)}
      >
        <div className="relative flex h-full w-full items-center justify-center">
          <MediaItem media={story.media} alt={`Story by ${group.username}`} fit="contain" />
        </div>
        <button
          type="button"
          aria-label="Previous story"
          className="absolute left-0 top-0 h-full w-1/3"
          onClick={() => (index > 0 ? setIndex(index - 1) : onClose())}
        />
        <button
          type="button"
          aria-label="Next story"
          className="absolute right-0 top-0 h-full w-1/3"
          onClick={() => (index < group.stories.length - 1 ? setIndex(index + 1) : onClose())}
        />
      </div>

      {profile?.uid === group.authorId && (
        <p className="px-4 pb-6 pt-2 text-center text-xs text-white/70">
          {story.viewers?.length ?? 0} views
        </p>
      )}
    </div>
  );
}
