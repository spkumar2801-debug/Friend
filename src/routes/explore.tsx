import { useCallback, useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Clapperboard, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/friend/app-shell";
import { UserAvatar } from "@/components/friend/user-avatar";
import { FollowButton } from "@/components/friend/follow-button";
import { EmptyState, ErrorState, GridSkeleton } from "@/components/friend/states";
import { useAuth } from "@/context/auth";
import { discoverPage, followingIds, suggestedUsers, type Cursor } from "@/lib/services";
import { friendlyError } from "@/lib/errors";
import { img } from "@/lib/cloudinary";
import type { Post, UserProfile } from "@/types";

export const Route = createFileRoute("/explore")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reels — Friend" },
      { name: "description", content: "Watch new reels and discover creators across Friend." },
      { property: "og:title", content: "Reels — Friend" },
      { property: "og:description", content: "Watch new reels and discover creators on Friend." },
    ],
  }),
  component: () => (
    <AppShell>
      <ExplorePage />
    </AppShell>
  ),
});

function ExplorePage() {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<Cursor>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [people, setPeople] = useState<UserProfile[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await discoverPage(null);
      setPosts(page.items);
      setCursor(page.cursor);
      setDone(page.done);
      if (profile) {
        const ids = await followingIds(profile.uid);
        setPeople(await suggestedUsers(profile.uid, ids, 8));
      }
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    void load();
  }, [load]);

  const more = async () => {
    setLoading(true);
    try {
      const page = await discoverPage(cursor);
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
    <div className="space-y-8 px-4 py-6">
      <h1 className="text-2xl font-semibold">Reels</h1>

      {people.length > 0 && (
        <section aria-labelledby="people-heading" className="space-y-3">
          <h2 id="people-heading" className="text-sm font-semibold text-muted-foreground">
            People to follow
          </h2>
          <ul className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
            {people.map((user) => (
              <li
                key={user.uid}
                className="w-40 shrink-0 space-y-2 rounded-2xl border border-border bg-surface p-4 text-center"
              >
                <Link
                  to="/profile/$username"
                  params={{ username: user.username }}
                  className="inline-block"
                >
                  <UserAvatar photoURL={user.photoURL} name={user.displayName} size={56} />
                </Link>
                <p className="truncate text-sm font-semibold">{user.username}</p>
                <p className="truncate text-xs text-muted-foreground">{user.displayName}</p>
                <FollowButton target={user} className="w-full" />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="grid-heading">
        <h2 id="grid-heading" className="mb-3 text-sm font-semibold text-muted-foreground">
          Latest reels
        </h2>
        {loading && posts.length === 0 ? (
          <GridSkeleton count={9} />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : posts.length === 0 ? (
          <EmptyState
            icon={<Clapperboard className="h-5 w-5" aria-hidden="true" />}
            title="No reels yet"
            description="Public reels will show up here as people start sharing."
          />
        ) : (
          <>
            <ul className="grid grid-cols-3 gap-1 sm:gap-2">
              {posts.map((post) => (
                <li key={post.id}>
                  <Link
                    to="/post/$postId"
                    params={{ postId: post.id }}
                    className="relative block aspect-square overflow-hidden rounded-md bg-secondary"
                  >
                    {post.media[0]?.resourceType === "video" ? (
                      <>
                        <img
                          src={img.poster(post.media[0]?.url)}
                          alt={post.caption.slice(0, 80) || `Post by ${post.author.username}`}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                        <Play className="absolute right-2 top-2 h-4 w-4 text-white" aria-hidden="true" />
                      </>
                    ) : (
                      <img
                        src={img.thumb(post.media[0]?.url)}
                        alt={post.caption.slice(0, 80) || `Post by ${post.author.username}`}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform hover:scale-[1.03]"
                      />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
            {!done && (
              <div className="flex justify-center pt-6">
                <Button variant="outline" onClick={more} disabled={loading}>
                  {loading ? "Loading…" : "Load more"}
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
