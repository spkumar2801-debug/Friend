import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Hash, Loader2, Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AppShell } from "@/components/friend/app-shell";
import { UserAvatar } from "@/components/friend/user-avatar";
import { FollowButton } from "@/components/friend/follow-button";
import { EmptyState, RowSkeleton } from "@/components/friend/states";
import { searchUsers } from "@/lib/services";
import { friendlyError } from "@/lib/errors";
import { extractHashtags } from "@/lib/text";
import type { UserProfile } from "@/types";

export const Route = createFileRoute("/search")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Search — Friend" },
      { name: "description", content: "Find people and hashtags on Friend." },
      { property: "og:title", content: "Search — Friend" },
      { property: "og:description", content: "Find people and hashtags on Friend." },
    ],
  }),
  component: () => (
    <AppShell>
      <SearchPage />
    </AppShell>
  ),
});

function SearchPage() {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const value = term.trim();
    if (!value) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        setResults(await searchUsers(value));
        setError(null);
      } catch (e) {
        setError(friendlyError(e));
      } finally {
        setLoading(false);
        setSearched(true);
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [term]);

  const tag = term.startsWith("#") ? extractHashtags(term)[0] : null;

  return (
    <div className="space-y-6 px-4 py-6">
      <h1 className="text-2xl font-semibold">Search</h1>

      <div className="relative">
        <SearchIcon
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <label htmlFor="search-input" className="sr-only">
          Search people and hashtags
        </label>
        <Input
          id="search-input"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search people or #hashtags"
          className="h-12 pl-9"
          autoComplete="off"
        />
        {loading && (
          <Loader2
            className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
            aria-hidden="true"
          />
        )}
      </div>

      {tag && (
        <Link
          to="/hashtag/$tag"
          params={{ tag }}
          className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
            <Hash className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold">#{tag}</span>
        </Link>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading && results.length === 0 ? (
        <RowSkeleton count={4} />
      ) : results.length > 0 ? (
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
      ) : searched && !tag ? (
        <EmptyState
          icon={<SearchIcon className="h-5 w-5" aria-hidden="true" />}
          title="No matches"
          description="Try a different username, or search a #hashtag."
        />
      ) : !term ? (
        <EmptyState
          icon={<SearchIcon className="h-5 w-5" aria-hidden="true" />}
          title="Find your people"
          description="Search by username, or start with # to browse a hashtag."
        />
      ) : null}
    </div>
  );
}
