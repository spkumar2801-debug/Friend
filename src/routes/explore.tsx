import { useCallback, useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Clapperboard, Grid3x3, Play, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/friend/app-shell";
import { UserAvatar } from "@/components/friend/user-avatar";
import { FollowButton } from "@/components/friend/follow-button";
import { EmptyState, ErrorState, GridSkeleton } from "@/components/friend/states";
import { ReelPlayer } from "@/components/friend/reel-player";
import { useAuth } from "@/context/auth";
import { discoverPage, followingIds, getPost, suggestedUsers, type Cursor } from "@/lib/services";
import { friendlyError } from "@/lib/errors";
import { img } from "@/lib/cloudinary";
import type { Post, UserProfile } from "@/types";

interface ExploreSearchParams {
  reelId?: string | undefined;
  postId?: string | undefined;
}

export const Route = createFileRoute("/explore")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): ExploreSearchParams => ({
    reelId: typeof search["reelId"] === "string" ? search["reelId"] : undefined,
    postId: typeof search["postId"] === "string" ? search["postId"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Reels — Friend" },
      { name: "description", content: "Watch new reels and discover creators across Friend." },
      { property: "og:title", content: "Reels — Friend" },
      { property: "og:description", content: "Watch new reels and discover creators on Friend." },
    ],
  }),
  component: () => (
    <AppShell wide>
      <ExplorePage />
    </AppShell>
  ),
});

function ExplorePage() {
  const { profile } = useAuth();
  const search = Route.useSearch();
  const targetReelId = search.reelId || search.postId;

  const [posts, setPosts] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<Cursor>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [people, setPeople] = useState<UserProfile[]>([]);
  const [viewMode, setViewMode] = useState<"player" | "grid">("player");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await discoverPage(null);
      let items = page.items;

      // If a specific reel was requested (e.g. from home feed), put it at top so it plays immediately
      if (targetReelId) {
        const existingIdx = items.findIndex((p) => p.id === targetReelId);
        if (existingIdx > 0) {
          const target = items[existingIdx]!;
          items = [target, ...items.filter((p) => p.id !== targetReelId)];
        } else if (existingIdx === -1) {
          const target = await getPost(targetReelId);
          if (target) {
            items = [target, ...items];
          }
        }
      }

      setPosts(items);
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
  }, [profile, targetReelId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (targetReelId) {
      setViewMode("player");
    }
  }, [targetReelId]);

  const more = async () => {
    if (loading || done) return;
    try {
      const page = await discoverPage(cursor);
      setPosts((prev) => [...prev, ...page.items]);
      setCursor(page.cursor);
      setDone(page.done);
    } catch (e) {
      setError(friendlyError(e));
    }
  };

  // Prioritize video reels; fall back to all media if no videos exist
  const videoPosts = posts.filter((p) => p.media[0]?.resourceType === "video");
  let displayReels = videoPosts.length > 0 ? videoPosts : posts;
  if (targetReelId) {
    const idx = displayReels.findIndex((p) => p.id === targetReelId);
    if (idx > 0) {
      const target = displayReels[idx]!;
      displayReels = [target, ...displayReels.filter((p) => p.id !== targetReelId)];
    }
  }

  return (
    <div className="py-2 md:py-4">
      {/* Top Header with Title and View Switcher */}
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 pb-3">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Clapperboard className="h-5 w-5 text-primary" aria-hidden="true" />
          <span>Reels</span>
        </h1>

        <div className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1">
          <button
            type="button"
            onClick={() => setViewMode("player")}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              viewMode === "player"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-label="Reels player feed"
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Feed</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              viewMode === "grid"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-label="Grid view"
          >
            <Grid3x3 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Grid</span>
          </button>
        </div>
      </div>

      {loading && posts.length === 0 ? (
        <div className="mx-auto max-w-md p-4">
          <div className="h-[calc(100vh-10rem)] rounded-2xl bg-secondary animate-pulse" />
        </div>
      ) : error ? (
        <div className="mx-auto max-w-md p-4">
          <ErrorState message={error} onRetry={load} />
        </div>
      ) : displayReels.length === 0 ? (
        <div className="mx-auto max-w-md p-4">
          <EmptyState
            icon={<Clapperboard className="h-5 w-5" aria-hidden="true" />}
            title="No reels yet"
            description="Reels shared by creators will play here automatically."
            action={
              <Button asChild size="sm">
                <Link to="/create">Create a reel</Link>
              </Button>
            }
          />
        </div>
      ) : viewMode === "player" ? (
        /* Immersive vertical Reels player with autoplay & snap scroll */
        <div className="px-2">
          <ReelPlayer
            posts={displayReels}
            onLoadMore={more}
            hasMore={!done}
            onDeleted={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
          />
        </div>
      ) : (
        /* Standard Discover Grid View */
        <div className="mx-auto max-w-5xl space-y-6 px-4">
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
                        alt={post.caption.slice(0, 80) || `Reel by ${post.author.username}`}
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
            <div className="flex justify-center pt-4">
              <Button variant="outline" onClick={more} disabled={loading}>
                {loading ? "Loading…" : "Load more"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
