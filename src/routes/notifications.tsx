import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/friend/app-shell";
import { UserAvatar } from "@/components/friend/user-avatar";
import { EmptyState, RowSkeleton } from "@/components/friend/states";
import { RelativeTime } from "@/components/friend/relative-time";
import { useAuth } from "@/context/auth";
import {
  getProfiles,
  markNotificationsRead,
  pendingRequests,
  respondToRequest,
  toDate,
  watchNotifications,
} from "@/lib/services";
import { friendlyError } from "@/lib/errors";
import { timeAgo } from "@/lib/text";
import type { AppNotification, UserProfile } from "@/types";

export const Route = createFileRoute("/notifications")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Activity — Friend" },
      { name: "description", content: "Likes, comments, mentions, follows and requests on Friend." },
      { property: "og:title", content: "Activity — Friend" },
      { property: "og:description", content: "Your latest activity on Friend." },
    ],
  }),
  component: () => (
    <AppShell>
      <NotificationsPage />
    </AppShell>
  ),
});

const label: Record<AppNotification["type"], string> = {
  follow: "started following you",
  follow_request: "asked to follow you",
  follow_accepted: "accepted your follow request",
  like: "liked your post",
  repost: "reposted your post",
  comment: "commented on your post",
  reply: "replied to your comment",
  mention: "mentioned you",
  message: "sent you a message",
};

function NotificationsPage() {
  const { profile } = useAuth();
  const [items, setItems] = useState<AppNotification[] | null>(null);
  const [requests, setRequests] = useState<UserProfile[]>([]);

  useEffect(() => {
    if (!profile) return;
    const stop = watchNotifications(profile.uid, setItems);
    void pendingRequests(profile.uid)
      .then(getProfiles)
      .then(setRequests)
      .catch(() => undefined);
    return stop;
  }, [profile]);

  const markRead = async () => {
    const unread = (items ?? []).filter((n) => !n.read).map((n) => n.id);
    try {
      await markNotificationsRead(unread);
    } catch (e) {
      toast.error(friendlyError(e));
    }
  };

  const respond = async (user: UserProfile, accept: boolean) => {
    if (!profile) return;
    try {
      await respondToRequest(user.uid, profile, accept);
      setRequests((prev) => prev.filter((r) => r.uid !== user.uid));
      toast.success(accept ? `${user.username} can now follow you` : "Request removed");
    } catch (e) {
      toast.error(friendlyError(e));
    }
  };

  const unreadCount = (items ?? []).filter((n) => !n.read).length;

  return (
    <div className="space-y-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Activity</h1>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markRead}>
            Mark all read
          </Button>
        )}
      </div>

      {requests.length > 0 && (
        <section aria-labelledby="requests-heading" className="space-y-3">
          <h2 id="requests-heading" className="text-sm font-semibold text-muted-foreground">
            Follow requests
          </h2>
          <ul className="space-y-3">
            {requests.map((user) => (
              <li key={user.uid} className="flex items-center gap-3">
                <UserAvatar photoURL={user.photoURL} name={user.displayName} size={44} />
                <div className="min-w-0 flex-1 text-sm">
                  <Link
                    to="/profile/$username"
                    params={{ username: user.username }}
                    className="font-semibold hover:underline"
                  >
                    {user.username}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">wants to follow you</p>
                </div>
                <Button size="sm" onClick={() => respond(user, true)}>
                  Accept
                </Button>
                <Button size="sm" variant="secondary" onClick={() => respond(user, false)}>
                  Decline
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {items === null ? (
        <RowSkeleton count={5} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-5 w-5" aria-hidden="true" />}
          title="Nothing new yet"
          description="Likes, comments and follows will show up here."
        />
      ) : (
        <ul className="space-y-1">
          {items.map((item) => {
            const body = (
              <span className="flex items-center gap-3 py-2">
                <UserAvatar photoURL={item.actor.photoURL} name={item.actor.displayName} size={42} />
                <span className="min-w-0 flex-1 text-sm">
                  <span className="font-semibold">{item.actor.username}</span>{" "}
                  {label[item.type]}
                  {item.preview ? <span className="text-muted-foreground"> · {item.preview}</span> : null}
                  <RelativeTime
                    date={toDate(item.createdAt)}
                    className="ml-1 text-xs text-muted-foreground"
                  />
                </span>
                {!item.read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
              </span>
            );
            return (
              <li key={item.id} className={item.read ? "" : "rounded-xl bg-surface-elevated px-2"}>
                {item.postId ? (
                  <Link to="/post/$postId" params={{ postId: item.postId }} className="block">
                    {body}
                  </Link>
                ) : (
                  <Link
                    to="/profile/$username"
                    params={{ username: item.actor.username }}
                    className="block"
                  >
                    {body}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
