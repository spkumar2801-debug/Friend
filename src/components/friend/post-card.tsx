import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Bookmark,
  BadgeCheck,
  Clapperboard,
  Heart,
  Link2,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Repeat2,
  Flag,
  Send,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth";
import {
  deletePost,
  getProfile,
  isReposted,
  isSaved,
  likedByMe,
  reportContent,
  toDate,
  toggleLike,
  toggleRepost,
  toggleSave,
  updatePostCaption,
} from "@/lib/services";
import { friendlyError } from "@/lib/errors";
import { compact, timeAgo } from "@/lib/text";
import type { Post } from "@/types";
import { UserAvatar } from "./user-avatar";
import { MediaCarousel } from "./post-media";
import { RichText } from "./rich-text";
import { ResponsiveModal } from "./responsive-modal";
import { CommentsPanel } from "./comments-panel";
import { cn } from "@/lib/utils";

export function PostCard({ post, onDeleted }: { post: Post; onDeleted?: (id: string) => void }) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [reposted, setReposted] = useState(false);
  const [repostCount, setRepostCount] = useState(post.repostCount ?? 0);
  const [saved, setSaved] = useState(false);
  const [pop, setPop] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [caption, setCaption] = useState(post.caption);
  const [editingCaption, setEditingCaption] = useState(post.caption);
  const [showEdit, setShowEdit] = useState(false);
  const [savingCaption, setSavingCaption] = useState(false);

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

  const onLike = async () => {
    if (!profile) return;
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => Math.max(0, c + (next ? 1 : -1)));
    if (next) {
      setPop(true);
      window.setTimeout(() => setPop(false), 350);
    }
    try {
      await toggleLike(post, profile, next);
    } catch (e) {
      setLiked(!next);
      setLikeCount((c) => Math.max(0, c + (next ? -1 : 1)));
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

  const share = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Friend", text: post.caption.slice(0, 80), url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Sharing isn't available in this browser. Copy the link from your address bar.");
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy the link.");
    }
    setShowMenu(false);
  };

  const remove = async () => {
    try {
      await deletePost(post);
      toast.success("Post deleted");
      onDeleted?.(post.id);
    } catch (e) {
      toast.error(friendlyError(e));
    }
    setShowMenu(false);
  };

  const report = async () => {
    if (!profile) return;
    try {
      await reportContent({
        reporterId: profile.uid,
        targetId: post.id,
        targetType: "post",
        reason: "Reported from feed",
      });
      toast.success("Thanks — our team will review this post.");
    } catch (e) {
      toast.error(friendlyError(e));
    }
    setShowMenu(false);
  };

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

  const isOwner = Boolean(
    profile && (profile.uid === post.authorId || profile.uid === post.author?.uid),
  );
  const authorUsername = authorData.username || post.author.username;
  const authorDisplayName = authorData.displayName || post.author.displayName || authorUsername;
  const authorPhotoURL = authorData.photoURL ?? post.author.photoURL ?? null;
  const altBase = `Post by ${authorUsername}`;

  return (
    <article className="border-b border-border bg-surface pb-4 md:mb-6 md:rounded-2xl md:border md:shadow-soft">
      <header className="flex items-center gap-3 px-4 py-3">
        <Link to="/profile/$username" params={{ username: authorUsername }}>
          <UserAvatar photoURL={authorPhotoURL} name={authorDisplayName} size={38} />
        </Link>
        <div className="min-w-0 flex-1 leading-tight">
          <Link
            to="/profile/$username"
            params={{ username: authorUsername }}
            className="flex items-center gap-1 text-sm font-semibold hover:underline"
          >
            <span className="truncate">{authorUsername}</span>
            <BadgeCheck className="hidden h-3.5 w-3.5 text-primary" aria-hidden="true" />
          </Link>
          <p className="truncate text-xs text-muted-foreground">
            {post.location ? `${post.location} · ` : ""}
            {timeAgo(toDate(post.createdAt))}
          </p>
        </div>
        <button
          type="button"
          aria-label="Post options"
          onClick={() => setShowMenu(true)}
          className="rounded-full p-2 hover:bg-secondary"
        >
          <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
        </button>
      </header>

      {/* If video, clicking moves directly to Reels section to play immediately */}
      {post.media[0]?.resourceType === "video" ? (
        <div
          role="link"
          tabIndex={0}
          onClick={() => navigate({ to: "/explore", search: { reelId: post.id } })}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              void navigate({ to: "/explore", search: { reelId: post.id } });
            }
          }}
          className="group relative block cursor-pointer select-none"
          aria-label={`Watch reel by ${authorUsername}`}
        >
          <MediaCarousel
            media={post.media}
            alt={altBase}
            onMediaClick={() => navigate({ to: "/explore", search: { reelId: post.id } })}
          />
          <div className="pointer-events-none absolute top-3 right-3 z-10 flex items-center gap-1.5 rounded-full bg-black/65 px-3 py-1 text-xs font-semibold text-white backdrop-blur shadow-md transition-transform group-hover:scale-105">
            <Clapperboard className="h-3.5 w-3.5" />
            <span>Reel</span>
          </div>
        </div>
      ) : (
        <Link to="/post/$postId" params={{ postId: post.id }} aria-label={`Open ${altBase}`}>
          <MediaCarousel media={post.media} alt={altBase} />
        </Link>
      )}

      <div className="flex items-center gap-1 px-2 pt-2">
        <button
          type="button"
          onClick={onLike}
          aria-label={liked ? "Unlike post" : "Like post"}
          aria-pressed={liked}
          className="rounded-full p-2.5 hover:bg-secondary"
        >
          <Heart
            className={cn(
              "h-6 w-6 transition-colors",
              liked && "fill-primary text-primary",
              pop && "animate-pop",
            )}
            aria-hidden="true"
          />
        </button>
        <button
          type="button"
          onClick={() => setShowComments(true)}
          aria-label="View comments"
          className="rounded-full p-2.5 hover:bg-secondary"
        >
          <MessageCircle className="h-6 w-6" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={share}
          aria-label="Share post"
          className="rounded-full p-2.5 hover:bg-secondary"
        >
          <Send className="h-6 w-6" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onRepost}
          aria-label={reposted ? "Remove repost" : "Repost"}
          aria-pressed={reposted}
          className="rounded-full p-2.5 hover:bg-secondary"
        >
          <Repeat2
            className={cn(
              "h-6 w-6 transition-colors",
              reposted ? "text-emerald-500 stroke-[2.5]" : "text-foreground",
            )}
            aria-hidden="true"
          />
        </button>
        <button
          type="button"
          onClick={onSave}
          aria-label={saved ? "Remove from saved" : "Save post"}
          aria-pressed={saved}
          className="ml-auto rounded-full p-2.5 hover:bg-secondary"
        >
          <Bookmark className={cn("h-6 w-6", saved && "fill-foreground")} aria-hidden="true" />
        </button>
      </div>

      <div className="space-y-1 px-4 pt-1">
        <div className="flex items-center gap-3 text-sm font-semibold">
          <span>{compact(likeCount)} likes</span>
          {repostCount > 0 && (
            <span className="text-muted-foreground font-normal">
              · <strong className="font-semibold text-foreground">{compact(repostCount)}</strong> reposts
            </span>
          )}
        </div>
        {caption && (
          <p className="text-sm">
            <Link
              to="/profile/$username"
              params={{ username: post.author.username }}
              className="font-semibold hover:underline"
            >
              {post.author.username}
            </Link>{" "}
            <RichText text={caption} />
          </p>
        )}
        {commentCount > 0 && (
          <button
            type="button"
            onClick={() => setShowComments(true)}
            className="text-sm text-muted-foreground hover:underline"
          >
            View all {commentCount} comments
          </button>
        )}
      </div>

      <ResponsiveModal
        open={showComments}
        onOpenChange={setShowComments}
        title="Comments"
        className="sm:max-w-lg"
      >
        <CommentsPanel post={post} onCountChange={(d) => setCommentCount((c) => Math.max(0, c + d))} />
      </ResponsiveModal>

      <ResponsiveModal open={showMenu} onOpenChange={setShowMenu} title="Post options">
        <div className="flex flex-col gap-1 pb-2">
          <Button variant="ghost" className="justify-start" onClick={copyLink}>
            <Link2 className="mr-2 h-4 w-4" aria-hidden="true" /> Copy link
          </Button>
          {!isOwner && (
            <Button variant="ghost" className="justify-start" onClick={report}>
              <Flag className="mr-2 h-4 w-4" aria-hidden="true" /> Report post
            </Button>
          )}
          {isOwner && (
            <>
              <Button
                variant="ghost"
                className="justify-start"
                onClick={() => {
                  setShowMenu(false);
                  setEditingCaption(caption);
                  setShowEdit(true);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" aria-hidden="true" /> Edit caption
              </Button>
              <Button
                variant="ghost"
                className="justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={remove}
              >
                <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" /> Delete post
              </Button>
            </>
          )}
        </div>
      </ResponsiveModal>

      <ResponsiveModal open={showEdit} onOpenChange={setShowEdit} title="Edit caption">
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
    </article>
  );
}
