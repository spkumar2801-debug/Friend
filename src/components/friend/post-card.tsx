import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Bookmark,
  BadgeCheck,
  Heart,
  Link2,
  MessageCircle,
  MoreHorizontal,
  Repeat2,
  Flag,
  Send,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth";
import {
  deletePost,
  isReposted,
  isSaved,
  likedByMe,
  reportContent,
  toDate,
  toggleLike,
  toggleRepost,
  toggleSave,
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
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [saved, setSaved] = useState(false);
  const [pop, setPop] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (!profile) return;
    let active = true;
    void Promise.all([likedByMe(post.id, profile.uid), isSaved(profile.uid, post.id)]).then(
      ([l, s]) => {
        if (!active) return;
        setLiked(l);
        setSaved(s);
      },
    );
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

  const isOwner = profile?.uid === post.authorId;
  const altBase = `Post by ${post.author.username}`;

  return (
    <article className="border-b border-border bg-surface pb-4 md:mb-6 md:rounded-2xl md:border md:shadow-soft">
      <header className="flex items-center gap-3 px-4 py-3">
        <Link to="/profile/$username" params={{ username: post.author.username }}>
          <UserAvatar photoURL={post.author.photoURL} name={post.author.displayName} size={38} />
        </Link>
        <div className="min-w-0 flex-1 leading-tight">
          <Link
            to="/profile/$username"
            params={{ username: post.author.username }}
            className="flex items-center gap-1 text-sm font-semibold hover:underline"
          >
            <span className="truncate">{post.author.username}</span>
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

      <Link to="/post/$postId" params={{ postId: post.id }} aria-label={`Open ${altBase}`}>
        <MediaCarousel media={post.media} alt={altBase} />
      </Link>

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
          onClick={onSave}
          aria-label={saved ? "Remove from saved" : "Save post"}
          aria-pressed={saved}
          className="ml-auto rounded-full p-2.5 hover:bg-secondary"
        >
          <Bookmark className={cn("h-6 w-6", saved && "fill-foreground")} aria-hidden="true" />
        </button>
      </div>

      <div className="space-y-1 px-4 pt-1">
        <p className="text-sm font-semibold">{compact(likeCount)} likes</p>
        {post.caption && (
          <p className="text-sm">
            <Link
              to="/profile/$username"
              params={{ username: post.author.username }}
              className="font-semibold hover:underline"
            >
              {post.author.username}
            </Link>{" "}
            <RichText text={post.caption} />
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
            <Button variant="ghost" className="justify-start text-destructive" onClick={remove}>
              <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" /> Delete post
            </Button>
          )}
        </div>
      </ResponsiveModal>
    </article>
  );
}
