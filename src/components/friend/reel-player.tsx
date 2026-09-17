import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Bookmark,
  ChevronDown,
  ChevronUp,
  Heart,
  Link2,
  MessageCircle,
  MoreHorizontal,
  Music2,
  Pause,
  Pencil,
  Play,
  Repeat2,
  Send,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "./user-avatar";
import { FollowButton } from "./follow-button";
import { ResponsiveModal } from "./responsive-modal";
import { CommentsPanel } from "./comments-panel";
import { RichText } from "./rich-text";
import { useAuth } from "@/context/auth";
import {
  isReposted,
  isSaved,
  likedByMe,
  deletePost,
  getProfile,
  toggleLike,
  toggleRepost,
  toggleSave,
  updatePostCaption,
} from "@/lib/services";
import { friendlyError } from "@/lib/errors";
import { compact } from "@/lib/text";
import { img } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";
import type { Post } from "@/types";

interface ReelItemProps {
  post: Post;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onDeleted?: ((postId: string) => void) | undefined;
}

function ReelSlide({ post, isActive, isMuted, onToggleMute, onDeleted }: ReelItemProps) {
  const { profile } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [progress, setProgress] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [reposted, setReposted] = useState(false);
  const [repostCount, setRepostCount] = useState(post.repostCount ?? 0);
  const [saved, setSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [caption, setCaption] = useState(post.caption);
  const [editingCaption, setEditingCaption] = useState(post.caption);
  const [savingCaption, setSavingCaption] = useState(false);
  const [captionExpanded, setCaptionExpanded] = useState(false);

  // Live author profile sync so avatar & username always show latest profile details
  const [authorData, setAuthorData] = useState({
    username: post.author?.username || "",
    displayName: post.author?.displayName || post.author?.username || "",
    photoURL: post.author?.photoURL || null,
  });

  useEffect(() => {
    let active = true;
    if (post.authorId) {
      void getProfile(post.authorId).then((p) => {
        if (active && p) {
          setAuthorData({
            username: p.username || post.author?.username || "",
            displayName: p.displayName || p.username || post.author?.displayName || "",
            photoURL: p.photoURL ?? post.author?.photoURL ?? null,
          });
        }
      });
    }
    return () => {
      active = false;
    };
  }, [post.authorId, post.author]);

  const media = post.media[0];
  const isVideo = media?.resourceType === "video";

  // Load interaction states
  useEffect(() => {
    if (!profile) return;
    let active = true;
    void Promise.all([
      likedByMe(post.id, profile.uid),
      isSaved(profile.uid, post.id),
      isReposted(profile.uid, post.id),
    ]).then(([l, s, r]) => {
      if (!active) return;
      setLiked(l);
      setSaved(s);
      setReposted(r);
    });
    return () => {
      active = false;
    };
  }, [profile, post.id]);

  // Autoplay single visible reel
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideo) return;

    if (isActive) {
      video.currentTime = 0;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => {
            // Autoplay with audio was prevented, fallback to muted autoplay
            video.muted = true;
            video
              .play()
              .then(() => setIsPlaying(true))
              .catch(() => setIsPlaying(false));
          });
      }
    } else {
      video.pause();
      setIsPlaying(false);
      setProgress(0);
    }
  }, [isActive, isVideo]);

  // Sync mute state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video || !isVideo) return;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => undefined);
    } else {
      video.pause();
      setIsPlaying(false);
    }
    setShowPlayIcon(true);
    window.setTimeout(() => setShowPlayIcon(false), 500);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    setProgress((video.currentTime / video.duration) * 100);
  };

  const onLike = async () => {
    if (!profile) return;
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => Math.max(0, c + (next ? 1 : -1)));
    try {
      await toggleLike(post, profile, next);
    } catch (e) {
      setLiked(!next);
      setLikeCount((c) => Math.max(0, c + (next ? -1 : 1)));
      toast.error(friendlyError(e));
    }
  };

  const onRepost = async () => {
    if (!profile) return;
    const next = !reposted;
    setReposted(next);
    setRepostCount((c) => Math.max(0, c + (next ? 1 : -1)));
    try {
      await toggleRepost(profile.uid, post.id, next, post, profile);
      toast.success(next ? "Reposted" : "Removed repost");
    } catch (e) {
      setReposted(!next);
      setRepostCount((c) => Math.max(0, c + (next ? -1 : 1)));
      toast.error(friendlyError(e));
    }
  };

  const onSave = async () => {
    if (!profile) return;
    const next = !saved;
    setSaved(next);
    try {
      await toggleSave(profile.uid, post.id, next);
      toast.success(next ? "Saved" : "Removed from saved");
    } catch (e) {
      setSaved(!next);
      toast.error(friendlyError(e));
    }
  };

  const isOwner = Boolean(
    profile && (profile.uid === post.authorId || profile.uid === post.author?.uid),
  );

  const handleSaveCaption = async () => {
    setSavingCaption(true);
    try {
      await updatePostCaption(post.id, editingCaption);
      setCaption(editingCaption);
      toast.success("Caption updated");
      setShowEdit(false);
    } catch (e) {
      toast.error(friendlyError(e));
    } finally {
      setSavingCaption(false);
    }
  };

  const removeReel = async () => {
    try {
      await deletePost(post);
      toast.success("Reel deleted");
      setShowOptions(false);
      onDeleted?.(post.id);
    } catch (e) {
      toast.error(friendlyError(e));
    }
  };

  const share = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Friend Reel", text: post.caption.slice(0, 80), url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy link.");
    }
  };

  return (
    <div className="relative h-full w-full snap-start snap-always shrink-0 overflow-hidden bg-black flex items-center justify-center select-none">
      {/* Media Player */}
      {isVideo ? (
        <div className="relative h-full w-full cursor-pointer" onClick={togglePlay}>
          <video
            ref={videoRef}
            src={img.video(media?.url)}
            poster={img.poster(media?.url)}
            playsInline
            loop
            muted={isMuted}
            preload="metadata"
            onTimeUpdate={handleTimeUpdate}
            className="h-full w-full object-contain md:object-cover"
          />
          {/* Animated Center Play/Pause Ripple */}
          {showPlayIcon && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-xs">
              <div className="rounded-full bg-black/60 p-4 text-white shadow-xl animate-scale-up">
                {isPlaying ? <Play className="h-8 w-8" /> : <Pause className="h-8 w-8" />}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="relative h-full w-full">
          <img
            src={img.feed(media?.url)}
            alt={post.caption || `Reel by ${post.author.username}`}
            className="h-full w-full object-contain md:object-cover"
          />
        </div>
      )}

      {/* Top Controls: Sound Toggle */}
      {isVideo && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleMute();
          }}
          aria-label={isMuted ? "Unmute reel" : "Mute reel"}
          className="absolute top-4 right-4 z-20 rounded-full bg-black/50 p-2.5 text-white backdrop-blur hover:bg-black/70 transition-transform active:scale-95"
        >
          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
      )}

      {/* Bottom Progress Bar */}
      {isVideo && (
        <div className="absolute bottom-0 left-0 right-0 z-20 h-1 bg-white/20">
          <div className="h-full bg-white transition-[width] duration-100" style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* Bottom Dark Gradient Scrim for 100% Contrast & Text Legibility */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/95 via-black/55 to-transparent z-10" />

      {/* Right Action Rail */}
      <div className="absolute bottom-6 right-2.5 z-20 flex flex-col items-center gap-2.5 text-white">
        <button
          type="button"
          onClick={onLike}
          className="group flex flex-col items-center gap-1 transition-transform active:scale-90"
          aria-label={liked ? "Unlike" : "Like"}
        >
          <div className="rounded-full bg-black/40 p-2.5 backdrop-blur group-hover:bg-black/60">
            <Heart
              className={cn(
                "h-6 w-6 transition-colors",
                liked ? "fill-red-500 text-red-500" : "text-white",
              )}
            />
          </div>
          <span className="text-xs font-semibold drop-shadow">{compact(likeCount)}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowComments(true)}
          className="group flex flex-col items-center gap-1 transition-transform active:scale-90"
          aria-label="Comments"
        >
          <div className="rounded-full bg-black/40 p-2.5 backdrop-blur group-hover:bg-black/60">
            <MessageCircle className="h-6 w-6 text-white" />
          </div>
          <span className="text-xs font-semibold drop-shadow">{compact(commentCount)}</span>
        </button>

        <button
          type="button"
          onClick={onRepost}
          className="group flex flex-col items-center gap-1 transition-transform active:scale-90"
          aria-label={reposted ? "Remove Repost" : "Repost"}
        >
          <div className="rounded-full bg-black/40 p-2.5 backdrop-blur group-hover:bg-black/60">
            <Repeat2
              className={cn(
                "h-6 w-6 transition-colors",
                reposted ? "text-emerald-400 stroke-[2.5]" : "text-white",
              )}
            />
          </div>
          <span className="text-xs font-semibold drop-shadow">{compact(repostCount)}</span>
        </button>

        <button
          type="button"
          onClick={share}
          className="group flex flex-col items-center gap-1 transition-transform active:scale-90"
          aria-label="Share"
        >
          <div className="rounded-full bg-black/40 p-2.5 backdrop-blur group-hover:bg-black/60">
            <Send className="h-6 w-6 text-white" />
          </div>
          <span className="text-xs font-semibold drop-shadow">Share</span>
        </button>

        <button
          type="button"
          onClick={onSave}
          className="group flex flex-col items-center gap-1 transition-transform active:scale-90"
          aria-label={saved ? "Remove from saved" : "Save"}
        >
          <div className="rounded-full bg-black/40 p-2.5 backdrop-blur group-hover:bg-black/60">
            <Bookmark className={cn("h-6 w-6", saved ? "fill-white text-white" : "text-white")} />
          </div>
        </button>

        {/* Three Dots Button for Options (Delete, Edit, Copy Link) */}
        <button
          type="button"
          onClick={() => setShowOptions(true)}
          className="group flex flex-col items-center gap-1 transition-transform active:scale-90"
          aria-label="Reel options"
        >
          <div className="rounded-full bg-black/40 p-2.5 backdrop-blur group-hover:bg-black/60">
            <MoreHorizontal className="h-6 w-6 text-white" />
          </div>
        </button>
      </div>

      {/* Bottom Creator & Caption Info Overlay */}
      <div className="pointer-events-none absolute bottom-5 left-3 right-16 z-20 text-white drop-shadow-md">
        <div className="pointer-events-auto flex items-center gap-2.5 mb-2">
          <Link
            to="/profile/$username"
            params={{ username: authorData.username || post.author.username }}
            className="flex items-center gap-2 font-bold hover:underline"
          >
            <div className="rounded-full ring-2 ring-white/95 shadow-md">
              <UserAvatar
                photoURL={authorData.photoURL}
                name={authorData.displayName || authorData.username}
                size={34}
              />
            </div>
            <span className="text-sm font-semibold truncate max-w-[140px] drop-shadow-sm">
              {authorData.username || post.author.username}
            </span>
          </Link>
          {profile?.uid !== post.authorId && (
            <FollowButton
              target={{
                uid: post.authorId,
                username: authorData.username || post.author.username,
                displayName: authorData.displayName || post.author.displayName,
                photoURL: authorData.photoURL,
                bio: "",
                website: "",
                photoPublicId: null,
                isPrivate: false,
                followerCount: 0,
                followingCount: 0,
                postCount: 0,
                verified: false,
                settings: {
                  theme: "system",
                  notifyLikes: true,
                  notifyComments: true,
                  notifyFollowers: true,
                  notifyMessages: true,
                  allowMessagesFrom: "everyone",
                  showActivity: true,
                },
                createdAt: null,
                usernameLower: (authorData.username || post.author.username).toLowerCase(),
              }}
              size="sm"
              className="h-7 border-white/40 bg-black/40 text-xs text-white hover:bg-white/20"
            />
          )}
        </div>

        {caption && (
          <div className="pointer-events-auto text-xs text-white/95">
            <p className={captionExpanded ? "whitespace-pre-wrap" : "line-clamp-2"}>
              <RichText text={caption} />
            </p>
            {caption.length > 80 && !captionExpanded && (
              <button
                type="button"
                onClick={() => setCaptionExpanded(true)}
                className="mt-0.5 font-semibold text-white/80 hover:text-white"
              >
                more
              </button>
            )}
          </div>
        )}

        <div className="pointer-events-auto mt-2 flex items-center gap-1.5 text-[11px] text-white/80">
          <Music2 className="h-3.5 w-3.5 animate-spin duration-3000" />
          <span className="truncate">Original audio — @{post.author.username}</span>
        </div>
      </div>

      {/* Comments Panel Sheet/Modal */}
      <ResponsiveModal
        open={showComments}
        onOpenChange={setShowComments}
        title="Comments"
        className="sm:max-w-lg"
      >
        <CommentsPanel post={post} onCountChange={(d) => setCommentCount((c) => Math.max(0, c + d))} />
      </ResponsiveModal>

      {/* Reel Options Modal (Three dots) */}
      <ResponsiveModal open={showOptions} onOpenChange={setShowOptions} title="Reel options">
        <div className="flex flex-col gap-1 pb-2">
          <Button variant="ghost" className="justify-start" onClick={() => { share(); setShowOptions(false); }}>
            <Link2 className="mr-2 h-4 w-4" aria-hidden="true" /> Copy link
          </Button>
          {isOwner && (
            <>
              <Button
                variant="ghost"
                className="justify-start"
                onClick={() => {
                  setShowOptions(false);
                  setEditingCaption(caption);
                  setShowEdit(true);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" aria-hidden="true" /> Edit caption
              </Button>
              <Button
                variant="ghost"
                className="justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={removeReel}
              >
                <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" /> Delete reel
              </Button>
            </>
          )}
        </div>
      </ResponsiveModal>

      {/* Edit Caption Modal */}
      <ResponsiveModal open={showEdit} onOpenChange={setShowEdit} title="Edit reel caption">
        <div className="space-y-4 py-2">
          <Textarea
            value={editingCaption}
            onChange={(e) => setEditingCaption(e.target.value.slice(0, 2200))}
            rows={4}
            placeholder="Write a caption…"
            className="resize-none"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowEdit(false)} disabled={savingCaption}>
              Cancel
            </Button>
            <Button onClick={handleSaveCaption} disabled={savingCaption}>
              {savingCaption ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>
      </ResponsiveModal>
    </div>
  );
}

export function ReelPlayer({
  posts,
  onLoadMore,
  hasMore,
  onDeleted,
}: {
  posts: Post[];
  onLoadMore?: (() => void) | undefined;
  hasMore?: boolean | undefined;
  onDeleted?: ((postId: string) => void) | undefined;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  // When top reel changes (e.g. user clicked a reel on home page), reset to index 0 and scroll to top
  useEffect(() => {
    setActiveIndex(0);
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [posts[0]?.id]);

  // Observe which slide is currently in view (>60% visible)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute("data-index"));
            if (!isNaN(index)) {
              setActiveIndex(index);
              // Trigger infinite scroll if reaching end
              if (index >= posts.length - 2 && hasMore && onLoadMore) {
                onLoadMore();
              }
            }
          }
        }
      },
      {
        root: container,
        threshold: 0.65,
      },
    );

    slideRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [posts.length, hasMore, onLoadMore]);

  // Scroll to slide
  const scrollToSlide = useCallback((index: number) => {
    const target = slideRefs.current[index];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, []);

  const goPrev = () => {
    if (activeIndex > 0) scrollToSlide(activeIndex - 1);
  };

  const goNext = () => {
    if (activeIndex < posts.length - 1) scrollToSlide(activeIndex + 1);
  };

  // Keyboard navigation (Arrow keys)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="relative flex w-full items-center justify-center">
      {/* Reels Screen Frame */}
      <div
        ref={containerRef}
        className="relative h-[calc(100dvh-12rem)] md:h-[calc(100vh-4.5rem)] w-full max-w-[420px] overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar rounded-2xl shadow-2xl bg-black border border-border/40"
      >
        {posts.map((post, index) => (
          <div
            key={post.id}
            data-index={index}
            ref={(el) => {
              slideRefs.current[index] = el;
            }}
            className="h-full w-full snap-start snap-always shrink-0"
          >
            <ReelSlide
              post={post}
              isActive={index === activeIndex}
              isMuted={isMuted}
              onToggleMute={() => setIsMuted((m) => !m)}
              onDeleted={onDeleted}
            />
          </div>
        ))}
      </div>

      {/* Floating Next / Previous Navigation Controls */}
      <div className="hidden md:flex absolute -right-16 top-1/2 -translate-y-1/2 flex-col gap-3">
        <button
          type="button"
          onClick={goPrev}
          disabled={activeIndex === 0}
          aria-label="Previous reel"
          className="rounded-full bg-secondary/80 p-3 text-foreground shadow-md hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-transform active:scale-95"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={activeIndex >= posts.length - 1}
          aria-label="Next reel"
          className="rounded-full bg-secondary/80 p-3 text-foreground shadow-md hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-transform active:scale-95"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
