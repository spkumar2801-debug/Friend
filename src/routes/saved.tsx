import { useCallback, useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Bookmark } from "lucide-react";
import { AppShell } from "@/components/friend/app-shell";
import { EmptyState, ErrorState, GridSkeleton } from "@/components/friend/states";
import { useAuth } from "@/context/auth";
import { savedPosts } from "@/lib/services";
import { friendlyError } from "@/lib/errors";
import { img } from "@/lib/cloudinary";
import type { Post } from "@/types";

export const Route = createFileRoute("/saved")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Saved — Friend" },
      { name: "description", content: "The posts you've saved on Friend, visible only to you." },
      { property: "og:title", content: "Saved — Friend" },
      { property: "og:description", content: "The posts you've saved on Friend." },
    ],
  }),
  component: () => (
    <AppShell>
      <SavedPage />
    </AppShell>
  ),
});

function SavedPage() {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      setPosts(await savedPosts(profile.uid));
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6 px-4 py-6">
      <h1 className="text-2xl font-semibold">Saved</h1>
      <p className="text-sm text-muted-foreground">Only you can see what you've saved.</p>

      {loading ? (
        <GridSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : posts.length === 0 ? (
        <EmptyState
          icon={<Bookmark className="h-5 w-5" aria-hidden="true" />}
          title="Posts you save will appear here"
          description="Tap the bookmark on any post to keep it for later."
        />
      ) : (
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
      )}
    </div>
  );
}
