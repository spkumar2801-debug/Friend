import { useCallback, useEffect, useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/friend/app-shell";
import { PostCard } from "@/components/friend/post-card";
import { StoryTray } from "@/components/friend/stories";
import { UserAvatar } from "@/components/friend/user-avatar";
import { FollowButton } from "@/components/friend/follow-button";
import { EmptyState, ErrorState, PostSkeleton, RowSkeleton } from "@/components/friend/states";
import { useAuth } from "@/context/auth";
import {
  activeStories,
  discoverPage,
  feedPage,
  followingIds,
  suggestedUsers,
  type Cursor,
} from "@/lib/services";
import { friendlyError } from "@/lib/errors";
import type { Post, Story, UserProfile } from "@/types";

export const Route = createFileRoute("/home")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Your feed — Friend" },
      { name: "description", content: "Posts and stories from the people you follow on Friend." },
      { property: "og:title", content: "Your feed — Friend" },
      { property: "og:description", content: "Catch up with the people you follow on Friend." },
    ],
  }),
  component: () => (
    <AppShell>
      <HomeFeed />
    </AppShell>
  ),
});

function HomeFeed() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<Cursor>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [suggested, setSuggested] = useState<UserProfile[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [storyKey, setStoryKey] = useState(0);

  const loadFirst = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      const ids = await followingIds(profile.uid);
      setFollowing(ids);
      const page = ids.length
        ? await feedPage(profile.uid, ids, null)
        : await discoverPage(null, 6);
      setPosts(page.items);
      setCursor(page.cursor);
      setDone(page.done);
      const [storyItems, people] = await Promise.all([
        activeStories([profile.uid, ...ids].slice(0, 30)),
        suggestedUsers(profile.uid, ids),
      ]);
      setStories(storyItems);
      setSuggested(people);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    void loadFirst();
  }, [loadFirst, storyKey]);

  const loadMore = async () => {
    if (!profile || done) return;
    setLoading(true);
    try {
      const page = following.length
        ? await feedPage(profile.uid, following, cursor)
        : await discoverPage(cursor, 6);
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
    <div className="lg:flex lg:gap-10 lg:pt-6">
      <div className="min-w-0 flex-1 lg:max-w-xl">
        <StoryTray
          stories={stories}
          onCreate={() => navigate({ to: "/create", search: { mode: "story" } })}
          onChanged={() => setStoryKey((k) => k + 1)}
        />

        <div className="md:mt-6">
          {loading && posts.length === 0 ? (
            <div className="space-y-4 p-4 md:p-0">
              <PostSkeleton />
              <PostSkeleton />
            </div>
          ) : error ? (
            <div className="p-4 md:p-0">
              <ErrorState message={error} onRetry={loadFirst} />
            </div>
          ) : posts.length === 0 ? (
            <div className="p-4 md:p-0">
              <EmptyState
                icon={<Sparkles className="h-5 w-5" aria-hidden="true" />}
                title="Your feed is quiet"
                description="Follow a few people or share your first post to get things going."
                action={
                  <Button asChild size="sm">
                    <Link to="/explore">Watch reels</Link>
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onDeleted={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
                />
              ))}
              {!done && (
                <div className="flex justify-center py-6">
                  <Button variant="outline" onClick={loadMore} disabled={loading}>
                    {loading ? "Loading…" : "Load more"}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <aside className="hidden w-72 shrink-0 lg:block">
        <h2 className="mb-4 text-sm font-semibold text-muted-foreground">Suggested for you</h2>
        {loading && suggested.length === 0 ? (
          <RowSkeleton count={4} />
        ) : suggested.length === 0 ? (
          <p className="text-sm text-muted-foreground">No suggestions yet.</p>
        ) : (
          <ul className="space-y-3">
            {suggested.map((user) => (
              <li key={user.uid} className="flex items-center gap-3">
                <Link to="/profile/$username" params={{ username: user.username }}>
                  <UserAvatar photoURL={user.photoURL} name={user.displayName} size={40} />
                </Link>
                <div className="min-w-0 flex-1 text-sm leading-tight">
                  <Link
                    to="/profile/$username"
                    params={{ username: user.username }}
                    className="block truncate font-semibold hover:underline"
                  >
                    {user.username}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">{user.displayName}</p>
                </div>
                <FollowButton target={user} />
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}
