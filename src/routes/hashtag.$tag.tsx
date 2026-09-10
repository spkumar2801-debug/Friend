import { useCallback, useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/friend/app-shell";
import { EmptyState, ErrorState, GridSkeleton } from "@/components/friend/states";
import { hashtagCount, hashtagPosts, type Cursor } from "@/lib/services";
import { friendlyError } from "@/lib/errors";
import { img } from "@/lib/cloudinary";
import { compact } from "@/lib/text";
import type { Post } from "@/types";

export const Route = createFileRoute("/hashtag/$tag")({
  ssr: false,
  head: ({ params }) => ({
    meta: [
      { title: `#${params.tag} — Friend` },
      { name: "description", content: `Posts tagged #${params.tag} on Friend.` },
      { property: "og:title", content: `#${params.tag} — Friend` },
      { property: "og:description", content: `Posts tagged #${params.tag} on Friend.` },
    ],
  }),
  component: () => (
    <AppShell>
      <HashtagPage />
    </AppShell>
  ),
});

function HashtagPage() {
  const { tag } = Route.useParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<Cursor>(null);
  const [done, setDone] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [page, total] = await Promise.all([hashtagPosts(tag, null), hashtagCount(tag)]);
      setPosts(page.items);
      setCursor(page.cursor);
      setDone(page.done);
      setCount(total);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }, [tag]);

  useEffect(() => {
    void load();
  }, [load]);

  const more = async () => {
    setLoading(true);
    try {
      const page = await hashtagPosts(tag, cursor);
      setPosts((prev) => [...prev, ...page.items]);
      setCursor(page.cursor);
      setDone(page.done);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 px-4 py-6">
      <header className="flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
          <Hash className="h-7 w-7" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold">#{tag}</h1>
          <p className="text-sm text-muted-foreground">{compact(count)} posts</p>
        </div>
      </header>

      {loading && posts.length === 0 ? (
        <GridSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : posts.length === 0 ? (
        <EmptyState
          icon={<Hash className="h-5 w-5" aria-hidden="true" />}
          title="No posts with this tag yet"
          description="Be the first to use it in a caption."
        />
      ) : (
        <>
          <ul className="grid grid-cols-3 gap-1 sm:gap-2">
            {posts.map((post) => (
              <li key={post.id}>
                <Link
                  to="/post/$postId"
                  params={{ postId: post.id }}
                  className="block aspect-square overflow-hidden rounded-md bg-secondary"
                >
                  <img
                    src={
                      post.media[0]?.resourceType === "video"
                        ? img.poster(post.media[0]?.url)
                        : img.thumb(post.media[0]?.url)
                    }
                    alt={post.caption.slice(0, 80) || `Post by ${post.author.username}`}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </Link>
              </li>
            ))}
          </ul>
          {!done && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={more} disabled={loading}>
                {loading ? "Loading…" : "Load more"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
