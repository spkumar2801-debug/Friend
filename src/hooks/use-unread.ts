import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth";
import { watchConversations, watchNotifications } from "@/lib/services";

/** Live unread badges for notifications and messages. */
export function useUnreadCounts() {
  const { user } = useAuth();
  const [counts, setCounts] = useState({ notifications: 0, messages: 0 });

  useEffect(() => {
    if (!user) {
      setCounts({ notifications: 0, messages: 0 });
      return;
    }
    const stopNotifications = watchNotifications(user.uid, (items) =>
      setCounts((prev) => ({ ...prev, notifications: items.filter((n) => !n.read).length })),
    );
    const stopConversations = watchConversations(user.uid, (items) =>
      setCounts((prev) => ({
        ...prev,
        messages: items.reduce((sum, c) => sum + (c.unread?.[user.uid] ?? 0), 0),
      })),
    );
    return () => {
      stopNotifications();
      stopConversations();
    };
  }, [user]);

  return counts;
}
