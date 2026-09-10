import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth";
import { follow, getFollow, unfollow } from "@/lib/services";
import { friendlyError } from "@/lib/errors";
import type { UserProfile } from "@/types";

type State = "none" | "pending" | "following";

export function FollowButton({
  target,
  onChange,
  size = "sm",
  className,
}: {
  target: UserProfile;
  onChange?: (state: State) => void;
  size?: "sm" | "default";
  className?: string;
}) {
  const { profile } = useAuth();
  const [state, setState] = useState<State>("none");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    if (!profile || profile.uid === target.uid) return;
    getFollow(profile.uid, target.uid)
      .then((rel) => {
        if (!active) return;
        setState(rel ? (rel.status === "accepted" ? "following" : "pending") : "none");
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [profile, target.uid]);

  if (!profile || profile.uid === target.uid) return null;

  const act = async () => {
    const previous = state;
    setBusy(true);
    try {
      if (previous === "none") {
        setState(target.isPrivate ? "pending" : "following");
        const result = await follow(profile, target);
        setState(result === "accepted" ? "following" : "pending");
        onChange?.(result === "accepted" ? "following" : "pending");
        toast.success(result === "accepted" ? `Following ${target.username}` : "Request sent");
      } else {
        setState("none");
        await unfollow(profile.uid, target.uid);
        onChange?.("none");
      }
    } catch (error) {
      setState(previous);
      toast.error(friendlyError(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      size={size}
      variant={state === "none" ? "default" : "secondary"}
      onClick={act}
      disabled={busy}
      className={className}
    >
      {state === "following" ? "Following" : state === "pending" ? "Requested" : "Follow"}
    </Button>
  );
}
