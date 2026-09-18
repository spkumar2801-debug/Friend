import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth";
import {
  addComment,
  commentPage,
  deleteComment,
  toDate,
  toggleCommentLike,
  type Cursor,
} from "@/lib/services";
import { friendlyError } from "@/lib/errors";
import { timeAgo } from "@/lib/text";
import type { Comment, Post } from "@/types";
import { UserAvatar } from "./user-avatar";
import { RichText } from "./rich-text";
import { RelativeTime } from "./relative-time";
import { EmptyState, RowSkeleton } from "./states";

export function CommentsPanel({
  post,
  onCountChange,
}: {
  post: Post;
  onCountChange?: (delta: number) => void;
}) {
  const { profile } = useAuth();
  const [items, setItems] = useState<Comment[]>([]);
  const [cursor, setCursor] = useState<Cursor>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [sending, setSending] = useState(false);
  const [liked, setLiked] = useState<Record<string, boolean>>({});

  const load = useCallback(
    async (reset = false) => {
      setLoading(true);
      setError(null);
      try {
        const page = await commentPage(post.id, reset ? null : cursor);
        setItems((prev) => (reset ? page.items : [...prev, ...page.items]));
        setCursor(page.cursor);
        setDone(page.done);
      } catch (e) {
        setError(friendlyError(e));
      } finally {
        setLoading(false);
      }
    },
    [cursor, post.id],
  );

  useEffect(() => {
    void load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id]);

  const submit = async () => {
    if (!profile || !text.trim() || sending) return;
    setSending(true);
    try {
      const id = await addComment({
        post,
        author: profile,
        text: text.trim(),
        parentId: replyTo?.id ?? null,
      });
      setItems((prev) => [
        {
          id,
          postId: post.id,
          authorId: profile.uid,
          author: {
            uid: profile.uid,
            username: profile.username,
            displayName: profile.displayName,
            photoURL: profile.photoURL,
          },
          text: text.trim(),
          parentId: replyTo?.id ?? null,
          likeCount: 0,
          createdAt: null,
        },
        ...prev,
      ]);
      setText("");
      setReplyTo(null);
      onCountChange?.(1);
    } catch (e) {
      toast.error(friendlyError(e));
    } finally {
      setSending(false);
    }
  };

  const remove = async (comment: Comment) => {
    try {
      await deleteComment(post.id, comment.id);
      setItems((prev) => prev.filter((c) => c.id !== comment.id));
      onCountChange?.(-1);
      toast.success("Comment deleted");
    } catch (e) {
      toast.error(friendlyError(e));
    }
  };

  const like = async (comment: Comment) => {
    if (!profile) return;
    const next = !liked[comment.id];
    setLiked((prev) => ({ ...prev, [comment.id]: next }));
    setItems((prev) =>
      prev.map((c) =>
        c.id === comment.id ? { ...c, likeCount: Math.max(0, c.likeCount + (next ? 1 : -1)) } : c,
      ),
    );
    try {
      await toggleCommentLike(post.id, comment.id, profile.uid, next);
    } catch (e) {
      setLiked((prev) => ({ ...prev, [comment.id]: !next }));
      toast.error(friendlyError(e));
    }
  };

  const roots = items.filter((c) => !c.parentId);
  const repliesOf = (id: string) => items.filter((c) => c.parentId === id);

  const row = (comment: Comment, isReply = false) => (
    <li key={comment.id} className={isReply ? "ml-10" : ""}>
      <div className="flex gap-3">
        <Link to="/profile/$username" params={{ username: comment.author.username }}>
          <UserAvatar
            photoURL={comment.author.photoURL}
            name={comment.author.displayName}
            size={isReply ? 28 : 36}
          />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-sm break-words">
            <Link
              to="/profile/$username"
              params={{ username: comment.author.username }}
              className="font-semibold hover:underline"
            >
              {comment.author.username}
            </Link>{" "}
            <RichText text={comment.text} />
          </p>
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            <RelativeTime date={toDate(comment.createdAt)} />
            {comment.likeCount > 0 && <span>{comment.likeCount} likes</span>}
            {!isReply && (
              <button type="button" className="hover:text-foreground" onClick={() => setReplyTo(comment)}>
                Reply
              </button>
            )}
            {profile?.uid === comment.authorId || profile?.uid === post.authorId ? (
              <button
                type="button"
                aria-label="Delete comment"
                className="hover:text-destructive"
                onClick={() => remove(comment)}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          aria-label={liked[comment.id] ? "Unlike comment" : "Like comment"}
          onClick={() => like(comment)}
          className="self-start p-1"
        >
          <Heart
            className={`h-3.5 w-3.5 ${liked[comment.id] ? "fill-primary text-primary" : "text-muted-foreground"}`}
            aria-hidden="true"
          />
        </button>
      </div>
      {repliesOf(comment.id).length > 0 && (
        <ul className="mt-3 space-y-3">{repliesOf(comment.id).map((r) => row(r, true))}</ul>
      )}
    </li>
  );

  return (
    <div className="space-y-4">
      {loading && items.length === 0 ? (
        <RowSkeleton count={3} />
      ) : error ? (
        <p className="text-sm text-muted-foreground">{error}</p>
      ) : roots.length === 0 ? (
        <EmptyState title="No comments yet" description="Be the first to say something kind." />
      ) : (
        <ul className="space-y-4">{roots.map((c) => row(c))}</ul>
      )}

      {!done && items.length > 0 && (
        <Button variant="ghost" size="sm" onClick={() => load()} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Load more comments"}
        </Button>
      )}

      {profile && (
        <div className="sticky bottom-0 space-y-2 border-t border-border bg-background pt-3">
          {replyTo && (
            <p className="flex items-center justify-between text-xs text-muted-foreground">
              Replying to @{replyTo.author.username}
              <button type="button" className="underline" onClick={() => setReplyTo(null)}>
                Cancel
              </button>
            </p>
          )}
          <div className="flex items-end gap-2">
            <label htmlFor={`comment-${post.id}`} className="sr-only">
              Add a comment
            </label>
            <Textarea
              id={`comment-${post.id}`}
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 1000))}
              placeholder="Add a comment…"
              rows={1}
              className="min-h-11 resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void submit();
              }}
            />
            <Button onClick={submit} disabled={!text.trim() || sending}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Post"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
