import { useEffect, useRef, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AppShell } from "@/components/friend/app-shell";
import { UserAvatar } from "@/components/friend/user-avatar";
import { useAuth } from "@/context/auth";
import { getDb } from "@/lib/firebase";
import { markConversationRead, sendMessage, toDate, watchMessages } from "@/lib/services";
import { friendlyError } from "@/lib/errors";
import { timeAgo } from "@/lib/text";
import type { AuthorSnapshot, Conversation, Message } from "@/types";

export const Route = createFileRoute("/messages/$conversationId")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Conversation — Friend" },
      { name: "description", content: "A private conversation on Friend." },
      { property: "og:title", content: "Conversation — Friend" },
      { property: "og:description", content: "A private conversation on Friend." },
    ],
  }),
  component: () => (
    <AppShell>
      <ConversationPage />
    </AppShell>
  ),
});

function ConversationPage() {
  const { conversationId } = Route.useParams();
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [other, setOther] = useState<AuthorSnapshot | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profile) return;
    void getDoc(doc(getDb(), "conversations", conversationId))
      .then((snap) => {
        if (!snap.exists()) return;
        const data = snap.data() as Conversation;
        const otherId = data.participants.find((p) => p !== profile.uid);
        setOther(otherId ? (data.participantInfo?.[otherId] ?? null) : null);
      })
      .catch(() => undefined);
    void markConversationRead(conversationId, profile.uid);
    return watchMessages(conversationId, setMessages);
  }, [conversationId, profile]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const submit = async () => {
    if (!profile || !other || !text.trim() || sending) return;
    setSending(true);
    const value = text;
    setText("");
    try {
      await sendMessage({
        conversationId,
        sender: profile,
        recipientId: other.uid,
        text: value,
      });
    } catch (e) {
      setText(value);
      toast.error(friendlyError(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col md:h-[calc(100vh-4rem)]">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Button asChild variant="ghost" size="icon" aria-label="Back to messages">
          <Link to="/messages">
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Link>
        </Button>
        {other && (
          <Link
            to="/profile/$username"
            params={{ username: other.username }}
            className="flex min-w-0 items-center gap-3"
          >
            <UserAvatar photoURL={other.photoURL} name={other.displayName} size={38} />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{other.username}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {other.displayName}
              </span>
            </span>
          </Link>
        )}
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {messages === null ? (
          <p className="text-center text-sm text-muted-foreground">Loading messages…</p>
        ) : messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No messages yet — say hello.
          </p>
        ) : (
          messages.map((message) => {
            const mine = message.senderId === profile?.uid;
            return (
              <div key={message.id} className={mine ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                    mine
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{message.text}</p>
                  <p className={`mt-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {timeAgo(toDate(message.createdAt))}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="safe-bottom flex items-end gap-2 border-t border-border px-4 py-3">
        <label htmlFor="message-input" className="sr-only">
          Write a message
        </label>
        <Textarea
          id="message-input"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 2000))}
          rows={1}
          placeholder="Message…"
          className="min-h-11 resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void submit();
          }}
        />
        <Button onClick={submit} disabled={!text.trim() || sending} aria-label="Send message">
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
      </div>
    </div>
  );
}
