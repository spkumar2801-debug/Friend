import { useCallback, useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/friend/app-shell";
import { MediaCarousel } from "@/components/friend/post-media";
import { CommentsPanel } from "@/components/friend/comments-panel";
import { PostCard } from "@/components/friend/post-card";
import { UserAvatar } from "@/components/friend/user-avatar";
import { RichText } from "@/components/friend/rich-text";
import { ErrorState, PostSkeleton } from "@/components/friend/states";
import { getPost, toDate } from "@/lib/services";
import { friendlyError } from "@/lib/errors";
import { timeAgo } from "@/lib/text";
import type { Post } from "@/types";

export const Route = createFileRoute("/post/$postId")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Post — Friend" },
      { name: "description", content: "A photo or video shared on Friend." },
      { property: "og:title", content: "Post — Friend" },
      { property: "og:description", content: "A photo or video shared on Friend." },
    ],
  }),
  component: () => (
    <AppShell wide>
      <PostDetail />
    </AppShell>
  ),
});

function PostDetail() {
  const { postId } = Route.useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const found = await getPost(postId);
      if (!found) setError("This post no longer exists.");
      setPost(found);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="mx-auto max-w-xl p-4">
        <PostSkeleton />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="mx-auto max-w-xl p-4">
        <ErrorState message={error ?? "This post no longer exists."} onRetry={load} />
        <div className="mt-4 text-center">
          <Button asChild variant="ghost">
            <Link to="/home">Back to feed</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl py-4">
      <div className="px-4 md:px-0">
        <Button asChild variant="ghost" size="sm" className="mb-3">
          <Link to="/home">
            <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" /> Back
          </Link>
        </Button>
      </div>

      {/* Mobile: the familiar single-column post. Desktop: split media / details. */}
      <div className="md:hidden">
        <PostCard post={post} />
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-border bg-surface md:grid md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="bg-black">
          <MediaCarousel media={post.media} alt={`Post by ${post.author.username}`} fit="contain" />
        </div>
        <div className="flex max-h-[80vh] flex-col">
          <div className="flex items-center gap-3 border-b border-border p-4">
            <Link to="/profile/$username" params={{ username: post.author.username }}>
              <UserAvatar photoURL={post.author.photoURL} name={post.author.displayName} size={40} />
            </Link>
            <div className="min-w-0">
              <Link
                to="/profile/$username"
                params={{ username: post.author.username }}
                className="block truncate text-sm font-semibold hover:underline"
              >
                {post.author.username}
              </Link>
              <p className="text-xs text-muted-foreground">
                {post.location ? `${post.location} · ` : ""}
                {timeAgo(toDate(post.createdAt))}
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {post.caption && (
              <p className="mb-4 text-sm">
                <span className="font-semibold">{post.author.username}</span>{" "}
                <RichText text={post.caption} />
              </p>
            )}
            <CommentsPanel post={post} />
          </div>
        </div>
      </div>
    </div>
  );
}
