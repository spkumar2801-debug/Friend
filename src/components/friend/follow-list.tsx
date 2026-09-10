import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ResponsiveModal } from "@/components/friend/responsive-modal";
import { UserAvatar } from "@/components/friend/user-avatar";
import { FollowButton } from "@/components/friend/follow-button";
import { EmptyState, ErrorState, RowSkeleton } from "@/components/friend/states";
import { followerIds, followingIds, getProfiles } from "@/lib/services";
import { friendlyError } from "@/lib/errors";
import type { UserProfile } from "@/types";

export type FollowListKind = "followers" | "following";

export function FollowListModal({
  open,
  onOpenChange,
  kind,
  user,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: FollowListKind;
  user: UserProfile;
}) {
  const [people, setPeople] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const ids = kind === "followers" ? await followerIds(user.uid) : await followingIds(user.uid);
        const profiles = await getProfiles(ids.slice(0, 100));
        if (!active) return;
        setPeople(profiles);
      } catch (e) {
        if (active) setError(friendlyError(e));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [open, kind, user.uid]);

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={kind === "followers" ? "Followers" : "Following"}
      description={`People ${kind === "followers" ? "following" : "followed by"} ${user.username}`}
    >
      {loading ? (
        <RowSkeleton count={5} />
      ) : error ? (
        <ErrorState message={error} />
      ) : people.length === 0 ? (
        <EmptyState
          title={kind === "followers" ? "No followers yet" : "Not following anyone yet"}
        />
      ) : (
        <ul className="space-y-3 pb-2">
          {people.map((person) => (
            <li key={person.uid} className="flex items-center gap-3">
              <Link
                to="/profile/$username"
                params={{ username: person.username }}
                onClick={() => onOpenChange(false)}
              >
                <UserAvatar photoURL={person.photoURL} name={person.displayName} size={40} />
              </Link>
              <div className="min-w-0 flex-1 text-sm leading-tight">
                <Link
                  to="/profile/$username"
                  params={{ username: person.username }}
                  onClick={() => onOpenChange(false)}
                  className="block truncate font-semibold hover:underline"
                >
                  {person.username}
                </Link>
                <p className="truncate text-xs text-muted-foreground">{person.displayName}</p>
              </div>
              <FollowButton target={person} />
            </li>
          ))}
        </ul>
      )}
    </ResponsiveModal>
  );
}
