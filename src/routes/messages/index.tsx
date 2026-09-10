import { useEffect, useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { MessageCircle, Search } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { AppShell } from "@/components/friend/app-shell";
import { UserAvatar } from "@/components/friend/user-avatar";
import { EmptyState, RowSkeleton } from "@/components/friend/states";
import { useAuth } from "@/context/auth";
import { openConversation, searchUsers, toDate, watchConversations } from "@/lib/services";
import { friendlyError } from "@/lib/errors";
import { timeAgo } from "@/lib/text";
import type { Conversation, UserProfile } from "@/types";

export const Route = createFileRoute("/messages/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Messages — Friend" },
      { name: "description", content: "Your private conversations on Friend." },
      { property: "og:title", content: "Messages — Friend" },
      { property: "og:description", content: "Your private conversations on Friend." },
    ],
  }),
  component: () => (
    <AppShell>
      <MessagesPage />
    </AppShell>
  ),
});

function MessagesPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Conversation[] | null>(null);
  const [term, setTerm] = useState("");
  const [people, setPeople] = useState<UserProfile[]>([]);

  useEffect(() => {
    if (!profile) return;
    return watchConversations(profile.uid, setItems);
  }, [profile]);

  useEffect(() => {
    const value = term.trim();
    if (!value) {
      setPeople([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      try {
        setPeople((await searchUsers(value)).filter((u) => u.uid !== profile?.uid));
      } catch {
        setPeople([]);
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [term, profile]);

  const start = async (other: UserProfile) => {
    if (!profile) return;
    try {
      const id = await openConversation(profile, other);
      navigate({ to: "/messages/$conversationId", params: { conversationId: id } });
    } catch (e) {
      toast.error(friendlyError(e));
    }
  };

  return (
    <div className="space-y-5 px-4 py-6">
      <h1 className="text-2xl font-semibold">Messages</h1>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <label htmlFor="dm-search" className="sr-only">
          Search people to message
        </label>
        <Input
          id="dm-search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search people to message"
          className="h-11 pl-9"
        />
      </div>

      {people.length > 0 && (
        <ul className="space-y-2 rounded-2xl border border-border bg-surface p-2">
          {people.map((user) => (
            <li key={user.uid}>
              <button
                type="button"
                onClick={() => start(user)}
                className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-secondary"
              >
                <UserAvatar photoURL={user.photoURL} name={user.displayName} size={40} />
                <span className="min-w-0 flex-1 text-sm">
                  <span className="block truncate font-semibold">{user.username}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {user.displayName}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {items === null ? (
        <RowSkeleton count={4} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<MessageCircle className="h-5 w-5" aria-hidden="true" />}
          title="Start a conversation"
          description="Search for someone above and say hello."
        />
      ) : (
        <ul className="divide-y divide-border">
          {items.map((conversation) => {
            const otherId = conversation.participants.find((p) => p !== profile?.uid);
            const other = otherId ? conversation.participantInfo?.[otherId] : undefined;
            const unread = profile ? (conversation.unread?.[profile.uid] ?? 0) : 0;
            return (
              <li key={conversation.id}>
                <Link
                  to="/messages/$conversationId"
                  params={{ conversationId: conversation.id }}
                  className="flex items-center gap-3 py-3"
                >
                  <UserAvatar photoURL={other?.photoURL} name={other?.displayName} size={48} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold">
                        {other?.username ?? "Friend"}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {timeAgo(toDate(conversation.updatedAt))}
                      </span>
                    </span>
                    <span
                      className={`block truncate text-sm ${unread ? "font-semibold" : "text-muted-foreground"}`}
                    >
                      {conversation.lastMessage || "No messages yet"}
                    </span>
                  </span>
                  {unread > 0 && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                      {unread}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
