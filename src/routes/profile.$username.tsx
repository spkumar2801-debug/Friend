import { useCallback, useEffect, useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Grid3x3, Lock, Play, Repeat2, Settings, Video } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppShell } from "@/components/friend/app-shell";
import { UserAvatar } from "@/components/friend/user-avatar";
import { FollowButton } from "@/components/friend/follow-button";
import { FollowListModal, type FollowListKind } from "@/components/friend/follow-list";
import { EmptyState, ErrorState, GridSkeleton } from "@/components/friend/states";
import { useAuth } from "@/context/auth";
import {
  blockUser,
  canViewProfile,
  getProfileByUsername,
  openConversation,
  reportContent,
  repostedPosts,
  userPosts,
  type Cursor,
} from "@/lib/services";
import { friendlyError } from "@/lib/errors";
import { img } from "@/lib/cloudinary";
import { compact } from "@/lib/text";
import type { Post, UserProfile } from "@/types";

export const Route = createFileRoute("/profile/$username")({
  ssr: false,
  head: ({ params }) => ({
    meta: [
      { title: `@${params.username} — Friend` },
      { name: "description", content: `See posts and stories shared by @${params.username} on Friend.` },
      { property: "og:title", content: `@${params.username} — Friend` },
      { property: "og:description", content: `Posts shared by @${params.username} on Friend.` },
    ],
  }),
  component: () => (
    <AppShell>
      <ProfilePage />
    </AppShell>
  ),
});

function ProfilePage() {
  const { username } = Route.useParams();
  const { profile: me } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<Cursor>(null);
  const [done, setDone] = useState(false);
  const [visible, setVisible] = useState(true);
  const [tab, setTab] = useState("posts");
  const [reposts, setReposts] = useState<Post[]>([]);
  const [loadingReposts, setLoadingReposts] = useState(false);
  const [listKind, setListKind] = useState<FollowListKind | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const found = await getProfileByUsername(username);
      if (!found) {
        setError("We couldn't find that account.");
        setUser(null);
        return;
      }
      setUser(found);
      const allowed = await canViewProfile(me?.uid ?? null, found);
      setVisible(allowed);
      if (allowed) {
        const page = await userPosts(found.uid, null);
        setPosts(page.items);
        setCursor(page.cursor);
        setDone(page.done);
      } else {
        setPosts([]);
      }
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }, [username, me]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (tab === "reposts" && user && visible) {
      setLoadingReposts(true);
      void repostedPosts(user.uid)
        .then(setReposts)
        .catch(() => undefined)
        .finally(() => setLoadingReposts(false));
    }
  }, [tab, user, visible]);

  const more = async () => {
    if (!user) return;
    const page = await userPosts(user.uid, cursor);
    setPosts((prev) => [...prev, ...page.items]);
    setCursor(page.cursor);
    setDone(page.done);
  };

  const message = async () => {
    if (!me || !user) return;
    try {
      const id = await openConversation(me, user);
      navigate({ to: "/messages/$conversationId", params: { conversationId: id } });
    } catch (e) {
      toast.error(friendlyError(e));
    }
  };

  const block = async () => {
    if (!me || !user) return;
    try {
      await blockUser(me.uid, user.uid);
      toast.success(`${user.username} is blocked`);
      void load();
    } catch (e) {
      toast.error(friendlyError(e));
    }
  };

  const report = async () => {
    if (!me || !user) return;
    try {
      await reportContent({
        reporterId: me.uid,
        targetId: user.uid,
        targetType: "user",
        reason: "Reported from profile",
      });
      toast.success("Thanks — our team will review this account.");
    } catch (e) {
      toast.error(friendlyError(e));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 px-4 py-6">
        <GridSkeleton count={6} />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="px-4 py-6">
        <ErrorState message={error ?? "Account not found."} onRetry={load} />
      </div>
    );
  }

  const isMe = me?.uid === user.uid;
  const shown = tab === "videos" ? posts.filter((p) => p.media[0]?.resourceType === "video") : posts;

  return (
    <div className="space-y-6 px-4 py-6">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <UserAvatar
          photoURL={user.photoURL}
          name={user.displayName}
          size={96}
          className="sm:h-32 sm:w-32"
        />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold">{user.username}</h1>
            {user.isPrivate && (
              <span className="flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs">
                <Lock className="h-3 w-3" aria-hidden="true" /> Private
              </span>
            )}
            {isMe ? (
              <div className="flex gap-2">
                <Button asChild size="sm" variant="secondary">
                  <Link to="/settings">Edit profile</Link>
                </Button>
                <Button asChild size="sm" variant="ghost" aria-label="Settings">
                  <Link to="/settings">
                    <Settings className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <FollowButton target={user} onChange={() => void load()} />
                <Button size="sm" variant="secondary" onClick={message}>
                  Message
                </Button>
                <Button size="sm" variant="ghost" onClick={report}>
                  Report
                </Button>
                <Button size="sm" variant="ghost" onClick={block}>
                  Block
                </Button>
              </div>
            )}
          </div>

          <ul className="flex gap-6 text-sm">
            <li>
              <strong>{compact(user.postCount)}</strong>{" "}
              <span className="text-muted-foreground">posts</span>
            </li>
            <li>
              <button
                type="button"
                onClick={() => visible && setListKind("followers")}
                disabled={!visible}
                className="disabled:cursor-not-allowed disabled:opacity-70"
              >
                <strong>{compact(user.followerCount)}</strong>{" "}
                <span className="text-muted-foreground">followers</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => visible && setListKind("following")}
                disabled={!visible}
                className="disabled:cursor-not-allowed disabled:opacity-70"
              >
                <strong>{compact(user.followingCount)}</strong>{" "}
                <span className="text-muted-foreground">following</span>
              </button>
            </li>
          </ul>

          <div className="text-sm">
            <p className="font-semibold">{user.displayName}</p>
            {user.bio && <p className="whitespace-pre-wrap text-muted-foreground">{user.bio}</p>}
            {user.website && (
              <a
                href={user.website.startsWith("http") ? user.website : `https://${user.website}`}
                target="_blank"
                rel="noreferrer noopener"
                className="text-primary hover:underline"
              >
                {user.website}
              </a>
            )}
          </div>
        </div>
      </header>

      {!visible ? (
        <EmptyState
          icon={<Lock className="h-5 w-5" aria-hidden="true" />}
          title="This account is private"
          description="Follow this account to see their posts and stories."
        />
      ) : (
        <>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="posts">
                <Grid3x3 className="mr-1.5 h-4 w-4" aria-hidden="true" /> Posts
              </TabsTrigger>
              <TabsTrigger value="videos">
                <Video className="mr-1.5 h-4 w-4" aria-hidden="true" /> Videos
              </TabsTrigger>
              <TabsTrigger value="reposts">
                <Repeat2 className="mr-1.5 h-4 w-4" aria-hidden="true" /> Reposts
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {tab === "reposts" ? (
            loadingReposts ? (
              <GridSkeleton count={6} />
            ) : reposts.length === 0 ? (
              <EmptyState
                icon={<Repeat2 className="h-5 w-5" aria-hidden="true" />}
                title="No reposts yet"
                description={
                  isMe
                    ? "Posts you repost will appear on your profile."
                    : `@${user.username} hasn't reposted any posts yet.`
                }
              />
            ) : (
              <ul className="grid grid-cols-3 gap-1 sm:gap-2">
                {reposts.map((post) => (
                  <li key={post.id}>
                    <Link
                      to="/post/$postId"
                      params={{ postId: post.id }}
                      className="relative block aspect-square overflow-hidden rounded-md bg-secondary"
                    >
                      <img
                        src={
                          post.media[0]?.resourceType === "video"
                            ? img.poster(post.media[0]?.url)
                            : img.thumb(post.media[0]?.url)
                        }
                        alt={post.caption.slice(0, 80) || `Repost by ${user.username}`}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                      {post.media[0]?.resourceType === "video" && (
                        <Play className="absolute right-2 top-2 h-4 w-4 text-white" aria-hidden="true" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )
          ) : shown.length === 0 ? (
            <EmptyState
              icon={<Grid3x3 className="h-5 w-5" aria-hidden="true" />}
              title={isMe ? "Share your first post" : "No posts yet"}
              description={isMe ? "Your posts will appear in this grid." : undefined}
              action={
                isMe ? (
                  <Button asChild size="sm">
                    <Link to="/create">Create a post</Link>
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              <ul className="grid grid-cols-3 gap-1 sm:gap-2">
                {shown.map((post) => (
                  <li key={post.id}>
                    <Link
                      to="/post/$postId"
                      params={{ postId: post.id }}
                      className="relative block aspect-square overflow-hidden rounded-md bg-secondary"
                    >
                      <img
                        src={
                          post.media[0]?.resourceType === "video"
                            ? img.poster(post.media[0]?.url)
                            : img.thumb(post.media[0]?.url)
                        }
                        alt={post.caption.slice(0, 80) || `Post by ${user.username}`}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                      {post.media[0]?.resourceType === "video" && (
                        <Play className="absolute right-2 top-2 h-4 w-4 text-white" aria-hidden="true" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
              {!done && tab === "posts" && (
                <div className="flex justify-center">
                  <Button variant="outline" onClick={more}>
                    Load more
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {listKind && (
        <FollowListModal
          open={listKind !== null}
          onOpenChange={(o) => !o && setListKind(null)}
          kind={listKind}
          user={user}
        />
      )}
    </div>
  );
}
