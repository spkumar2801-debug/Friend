import { useCallback, useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  Clapperboard,
  Compass,
  Copy,
  Hash,
  Heart,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  Play,
  Search as SearchIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/friend/app-shell";
import { UserAvatar } from "@/components/friend/user-avatar";
import { FollowButton } from "@/components/friend/follow-button";
import { EmptyState, GridSkeleton, RowSkeleton } from "@/components/friend/states";
import { RelativeTime } from "@/components/friend/relative-time";
import { discoverPage, hashtagPosts, searchUsers, toDate, type Cursor } from "@/lib/services";
import { friendlyError } from "@/lib/errors";
import { extractHashtags, compact, timeAgo, formatFullDate } from "@/lib/text";
import { img } from "@/lib/cloudinary";
import type { Post, UserProfile } from "@/types";

export const Route = createFileRoute("/search")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Search & Explore — Friend" },
      { name: "description", content: "Explore photos, reels, and creators across Friend." },
      { property: "og:title", content: "Search & Explore — Friend" },
      { property: "og:description", content: "Explore photos, reels, and creators on Friend." },
    ],
  }),
  component: () => (
    <AppShell>
      <SearchPage />
    </AppShell>
  ),
});

type FilterType = "all" | "reels" | "photos";

function SearchPage() {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<UserProfile[]>([]);
  const [explorePosts, setExplorePosts] = useState<Post[]>([]);
  const [tagPosts, setTagPosts] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<Cursor>(null);
  const [done, setDone] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingExplore, setLoadingExplore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");

  // Load Explore Posts (images & reels) like Instagram Explore
  const loadExplore = useCallback(async () => {
    setLoadingExplore(true);
    try {
      const page = await discoverPage(null, 24);
      setExplorePosts(page.items);
      setCursor(page.cursor);
      setDone(page.done);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoadingExplore(false);
    }
  }, []);

  useEffect(() => {
    void loadExplore();
  }, [loadExplore]);

  const loadMoreExplore = async () => {
    if (loadingExplore || done) return;
    try {
      const page = await discoverPage(cursor, 18);
      setExplorePosts((prev) => [...prev, ...page.items]);
      setCursor(page.cursor);
      setDone(page.done);
    } catch (e) {
      setError(friendlyError(e));
    }
  };

  // Search logic (users and hashtags)
  useEffect(() => {
    const value = term.trim();
    if (!value) {
      setResults([]);
      setTagPosts([]);
      setSearched(false);
      return;
    }

    setLoadingSearch(true);
    const timer = window.setTimeout(async () => {
      try {
        if (value.startsWith("#")) {
          const cleanTag = extractHashtags(value)[0] || value.replace(/^#/, "");
          if (cleanTag) {
            const res = await hashtagPosts(cleanTag, null, 12);
            setTagPosts(res.items);
          }
          setResults([]);
        } else {
          setResults(await searchUsers(value));
          setTagPosts([]);
        }
        setError(null);
      } catch (e) {
        setError(friendlyError(e));
      } finally {
        setLoadingSearch(false);
        setSearched(true);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [term]);

  const tag = term.startsWith("#") ? extractHashtags(term)[0] || term.replace(/^#/, "") : null;

  // Filter explore grid by all, reels only, or photos only
  const filteredPosts = explorePosts.filter((post) => {
    const isVideo = post.media[0]?.resourceType === "video";
    if (filter === "reels") return isVideo;
    if (filter === "photos") return !isVideo;
    return true;
  });

  return (
    <div className="space-y-6 px-4 py-6">
      {/* Header & Search Bar */}
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Search</h1>

        <div className="relative">
          <SearchIcon
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <label htmlFor="search-input" className="sr-only">
            Search people, photos, reels and hashtags
          </label>
          <Input
            id="search-input"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search people or #hashtags"
            className="h-12 pl-10 pr-10 rounded-xl"
            autoComplete="off"
          />
          {loadingSearch && (
            <Loader2
              className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
              aria-hidden="true"
            />
          )}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Active Search Results for Hashtag */}
      {tag && (
        <div className="space-y-4">
          <Link
            to="/hashtag/$tag"
            params={{ tag }}
            className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 transition-colors hover:bg-secondary"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Hash className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <span className="text-sm font-semibold">#{tag}</span>
              <p className="text-xs text-muted-foreground">View hashtag page</p>
            </div>
          </Link>

          {tagPosts.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Posts tagged #{tag}
              </h2>
              <ul className="grid grid-cols-3 gap-1 sm:gap-2">
                {tagPosts.map((post) => (
                  <li key={post.id}>
                    <Link
                      to="/post/$postId"
                      params={{ postId: post.id }}
                      className="group relative block aspect-square overflow-hidden rounded-lg bg-secondary"
                    >
                      <img
                        src={
                          post.media[0]?.resourceType === "video"
                            ? img.poster(post.media[0]?.url)
                            : img.thumb(post.media[0]?.url)
                        }
                        alt={post.caption.slice(0, 60) || `Post by ${post.author.username}`}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {post.media[0]?.resourceType === "video" && (
                        <span className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white backdrop-blur">
                          <Play className="h-3 w-3 fill-white" />
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Active Search Results for Users */}
      {term.trim() && !tag ? (
        loadingSearch && results.length === 0 ? (
          <RowSkeleton count={4} />
        ) : results.length > 0 ? (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Accounts
            </h2>
            <ul className="space-y-3">
              {results.map((user) => (
                <li key={user.uid} className="flex items-center gap-3">
                  <Link to="/profile/$username" params={{ username: user.username }}>
                    <UserAvatar photoURL={user.photoURL} name={user.displayName} size={44} />
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
          </div>
        ) : searched ? (
          <EmptyState
            icon={<SearchIcon className="h-5 w-5" aria-hidden="true" />}
            title="No accounts found"
            description="Try searching with a different name or browse trending reels below."
          />
        ) : null
      ) : null}

      {/* Instagram Explore Media Grid (Photos & Reels) */}
      <section aria-labelledby="explore-heading" className="space-y-4 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 id="explore-heading" className="text-base font-semibold">
              Explore Media & Reels
            </h2>
          </div>

          {/* Filter Chips: All, Reels, Photos */}
          <div className="flex items-center gap-1 rounded-lg bg-secondary/80 p-1 text-xs">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                filter === "all" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter("reels")}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition-colors ${
                filter === "reels" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Clapperboard className="h-3.5 w-3.5" />
              <span>Reels</span>
            </button>
            <button
              type="button"
              onClick={() => setFilter("photos")}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition-colors ${
                filter === "photos" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ImageIcon className="h-3.5 w-3.5" />
              <span>Photos</span>
            </button>
          </div>
        </div>

        {loadingExplore && explorePosts.length === 0 ? (
          <GridSkeleton count={9} />
        ) : filteredPosts.length === 0 ? (
          <EmptyState
            icon={<Clapperboard className="h-5 w-5" aria-hidden="true" />}
            title="No media found"
            description="Images and reels uploaded by creators will appear here."
          />
        ) : (
          <>
            {/* Instagram-style Explore Grid */}
            <ul className="grid grid-cols-3 gap-1 sm:gap-2">
              {filteredPosts.map((post) => {
                const isVideo = post.media[0]?.resourceType === "video";
                const isCarousel = post.media.length > 1;

                return (
                  <li key={post.id}>
                    <Link
                      to="/post/$postId"
                      params={{ postId: post.id }}
                      className="group relative block aspect-square overflow-hidden rounded-md bg-secondary"
                    >
                      <img
                        src={
                          isVideo
                            ? img.poster(post.media[0]?.url)
                            : img.thumb(post.media[0]?.url)
                        }
                        alt={post.caption.slice(0, 60) || `Post by ${post.author.username}`}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />

                      {/* Video / Reel Indicator Badge */}
                      {isVideo && (
                        <div className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-md bg-black/65 px-1.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
                          <Play className="h-3 w-3 fill-white text-white" aria-hidden="true" />
                          <span className="hidden sm:inline">Reel</span>
                        </div>
                      )}

                      {/* Multi-Photo Carousel Indicator */}
                      {isCarousel && !isVideo && (
                        <div className="absolute right-2 top-2 z-10 rounded-md bg-black/65 p-1 text-white backdrop-blur">
                          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                        </div>
                      )}

                      {/* Instagram Hover Stats Overlay */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100 p-2">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1 text-xs font-semibold">
                            <Heart className="h-4 w-4 fill-white" />
                            {compact(post.likeCount)}
                          </span>
                          <span className="flex items-center gap-1 text-xs font-semibold">
                            <MessageCircle className="h-4 w-4 fill-white" />
                            {compact(post.commentCount)}
                          </span>
                        </div>
                        {toDate(post.createdAt) && (
                          <RelativeTime
                            date={toDate(post.createdAt)}
                            className="text-[10px] text-white/90 font-medium"
                          />
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>

            {!done && (
              <div className="flex justify-center pt-4">
                <Button variant="outline" onClick={loadMoreExplore} disabled={loadingExplore}>
                  {loadingExplore ? "Loading…" : "Explore more"}
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
