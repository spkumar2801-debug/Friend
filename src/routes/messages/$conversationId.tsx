import { useEffect, useRef, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  Camera,
  Download,
  ExternalLink,
  FileText,
  Film,
  Image as ImageIcon,
  Loader2,
  Music,
  Paperclip,
  Send,
  X,
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { AppShell } from "@/components/friend/app-shell";
import { UserAvatar } from "@/components/friend/user-avatar";
import { CameraModal } from "@/components/friend/camera-modal";
import { useAuth } from "@/context/auth";
import { getDb } from "@/lib/firebase";
import { markConversationRead, sendMessage, toDate, watchMessages } from "@/lib/services";
import { friendlyError } from "@/lib/errors";
import { timeAgo } from "@/lib/text";
import { uploadAttachmentToCloudinary, validateAttachment } from "@/lib/cloudinary";
import type { AuthorSnapshot, Conversation, Message, MessageAttachment } from "@/types";

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

function formatBytes(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AttachmentMessage({
  attachment,
  mine,
}: {
  attachment: MessageAttachment;
  mine: boolean;
}) {
  const [lightbox, setLightbox] = useState(false);

  if (attachment.resourceType === "image") {
    return (
      <>
        <div className="overflow-hidden rounded-xl">
          <button
            type="button"
            onClick={() => setLightbox(true)}
            className="block text-left transition-opacity hover:opacity-95"
            aria-label="Enlarge image"
          >
            <img
              src={attachment.url}
              alt={attachment.fileName || "Image attachment"}
              loading="lazy"
              className="max-h-72 w-auto max-w-full rounded-xl object-contain bg-black/20"
            />
          </button>
        </div>
        {lightbox && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Image preview"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={() => setLightbox(false)}
          >
            <button
              type="button"
              onClick={() => setLightbox(false)}
              className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/40"
              aria-label="Close image preview"
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
            <img
              src={attachment.url}
              alt={attachment.fileName || "Image attachment"}
              className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </>
    );
  }

  if (attachment.resourceType === "video") {
    return (
      <div className="overflow-hidden rounded-xl bg-black">
        <video
          src={attachment.url}
          controls
          playsInline
          preload="metadata"
          className="max-h-80 w-full rounded-xl object-contain"
        />
      </div>
    );
  }

  if (attachment.resourceType === "audio") {
    return (
      <div className="space-y-1.5 py-1">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background/30 text-current">
            <Music className="h-4 w-4" aria-hidden="true" />
          </div>
          <span className="truncate text-xs font-medium">
            {attachment.fileName || "Audio recording"}
          </span>
        </div>
        <audio src={attachment.url} controls className="h-9 w-full max-w-xs" preload="metadata" />
      </div>
    );
  }

  if (attachment.resourceType === "pdf") {
    return (
      <div
        className={`flex items-center justify-between gap-3 rounded-xl p-3 ${
          mine ? "bg-primary-foreground/15 text-primary-foreground" : "bg-background/70 text-foreground"
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/20 text-red-500">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold">{attachment.fileName || "Document.pdf"}</p>
            {attachment.fileSize ? (
              <p className="text-[10px] opacity-75">{formatBytes(attachment.fileSize)}</p>
            ) : null}
          </div>
        </div>
        <a
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          download={attachment.fileName || "document.pdf"}
          aria-label={`Open ${attachment.fileName || "PDF document"}`}
          className={`flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
            mine
              ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Open</span>
        </a>
      </div>
    );
  }

  return null;
}

function ConversationPage() {
  const { conversationId } = Route.useParams();
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [other, setOther] = useState<AuthorSnapshot | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [draftFile, setDraftFile] = useState<File | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [draftPreview, setDraftPreview] = useState<{
    url: string;
    type: "image" | "video" | "audio" | "pdf";
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleAttachFile = (file: File) => {
    const err = validateAttachment(file);
    if (err) {
      toast.error(err);
      return;
    }
    setDraftFile(file);
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isAudio = file.type.startsWith("audio/") || file.name.endsWith(".mp3") || file.name.endsWith(".wav");
    const isVideo = file.type.startsWith("video/");
    const type: "image" | "video" | "audio" | "pdf" = isPdf
      ? "pdf"
      : isAudio
        ? "audio"
        : isVideo
          ? "video"
          : "image";

    setDraftPreview({
      url: URL.createObjectURL(file),
      type,
    });
  };

  const onFileSelect = (files: FileList | null) => {
    if (!files?.length) return;
    const file = files[0];
    if (file) handleAttachFile(file);
  };

  const clearDraft = () => {
    if (draftPreview?.url) URL.revokeObjectURL(draftPreview.url);
    setDraftFile(null);
    setDraftPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submit = async () => {
    if (!profile || !other || sending) return;
    if (!text.trim() && !draftFile) return;

    setSending(true);
    const value = text;
    setText("");

    try {
      let attachment: MessageAttachment | null = null;

      if (draftFile) {
        setUploadProgress(0);
        const uploaded = await uploadAttachmentToCloudinary(draftFile, (pct) =>
          setUploadProgress(pct),
        );
        attachment = {
          url: uploaded.url,
          publicId: uploaded.publicId,
          resourceType: uploaded.resourceType,
          fileName: uploaded.fileName,
          fileSize: uploaded.fileSize,
          width: uploaded.width,
          height: uploaded.height,
          duration: uploaded.duration,
        };
      }

      await sendMessage({
        conversationId,
        sender: profile,
        recipientId: other.uid,
        text: value,
        attachment,
      });

      clearDraft();
    } catch (e) {
      setText(value);
      toast.error(friendlyError(e));
    } finally {
      setSending(false);
      setUploadProgress(null);
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

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages === null ? (
          <p className="text-center text-sm text-muted-foreground">Loading messages…</p>
        ) : messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No messages yet — say hello with text, photos, audio, or files.
          </p>
        ) : (
          messages.map((message) => {
            const mine = message.senderId === profile?.uid;
            // Support both new attachment and legacy media formats
            const attachmentData: MessageAttachment | null =
              message.attachment ??
              (message.media
                ? {
                    url: message.media.url,
                    publicId: message.media.publicId,
                    resourceType: message.media.resourceType,
                    width: message.media.width,
                    height: message.media.height,
                    duration: message.media.duration,
                  }
                : null);

            return (
              <div key={message.id} className={mine ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={`max-w-[85%] sm:max-w-[70%] space-y-2 rounded-2xl p-3 text-sm shadow-xs ${
                    mine
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {attachmentData && (
                    <AttachmentMessage attachment={attachmentData} mine={mine} />
                  )}
                  {message.text && (
                    <p className="whitespace-pre-wrap break-words">{message.text}</p>
                  )}
                  <p
                    className={`text-[10px] text-right ${
                      mine ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}
                  >
                    {timeAgo(toDate(message.createdAt))}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Attachment Draft Preview */}
      {draftPreview && draftFile && (
        <div className="border-t border-border bg-surface px-4 py-2">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-2.5">
            <div className="flex min-w-0 items-center gap-3">
              {draftPreview.type === "image" && (
                <img
                  src={draftPreview.url}
                  alt="Draft preview"
                  className="h-12 w-12 rounded-lg object-cover"
                />
              )}
              {draftPreview.type === "video" && (
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-black text-white">
                  <Film className="h-6 w-6" aria-hidden="true" />
                </div>
              )}
              {draftPreview.type === "audio" && (
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Music className="h-6 w-6" aria-hidden="true" />
                </div>
              )}
              {draftPreview.type === "pdf" && (
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                  <FileText className="h-6 w-6" aria-hidden="true" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold">{draftFile.name}</p>
                <p className="text-[10px] text-muted-foreground">{formatBytes(draftFile.size)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={clearDraft}
              aria-label="Remove attachment"
              className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          {uploadProgress !== null && (
            <div className="mt-2 space-y-1">
              <Progress value={uploadProgress} aria-label="Upload progress" />
              <p className="text-[10px] text-muted-foreground">Uploading attachment… {uploadProgress}%</p>
            </div>
          )}
        </div>
      )}

      {/* Message Input & Attachment Triggers */}
      <div className="safe-bottom flex items-end gap-2 border-t border-border px-4 py-3">
        {/* Hidden multi-format file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/mp4,video/webm,video/quicktime,audio/*,application/pdf"
          className="sr-only"
          onChange={(e) => onFileSelect(e.target.files)}
        />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Attach file, image, video, audio or PDF"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending}
          className="h-11 w-11 shrink-0 rounded-full hover:bg-secondary"
        >
          <Paperclip className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Take photo with camera"
          onClick={() => setShowCamera(true)}
          disabled={sending}
          className="h-11 w-11 shrink-0 rounded-full hover:bg-secondary text-primary"
        >
          <Camera className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" aria-hidden="true" />
        </Button>

        {/* In-app & device Camera modal */}
        <CameraModal
          open={showCamera}
          onOpenChange={setShowCamera}
          onCapture={handleAttachFile}
        />

        <label htmlFor="message-input" className="sr-only">
          Write a message
        </label>
        <Textarea
          id="message-input"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 2000))}
          rows={1}
          placeholder="Message… (or attach photo, video, audio, PDF)"
          className="min-h-11 resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void submit();
            }
          }}
        />

        <Button
          onClick={submit}
          disabled={(!text.trim() && !draftFile) || sending}
          aria-label="Send message"
          className="h-11 w-11 shrink-0 rounded-full"
        >
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
