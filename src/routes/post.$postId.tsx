import { useCallback, useEffect, useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Flag, Link2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AppShell } from "@/components/friend/app-shell";
import { MediaCarousel } from "@/components/friend/post-media";
import { CommentsPanel } from "@/components/friend/comments-panel";
import { PostCard } from "@/components/friend/post-card";
import { UserAvatar } from "@/components/friend/user-avatar";
import { RichText } from "@/components/friend/rich-text";
import { ResponsiveModal } from "@/components/friend/responsive-modal";
import { ErrorState, PostSkeleton } from "@/components/friend/states";
import { useAuth } from "@/context/auth";
import { deletePost, getPost, getProfile, reportContent, toDate, updatePostCaption } from "@/lib/services";
import { friendlyError } from "@/lib/errors";
import { timeAgo } from "@/lib/text";
import type { Post } from "@/types";

export const Route = createFileRoute("/post/$postId")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Post — Friend" },
      { name: "description", content: "A photo or video shared on Friend." },
      { property: "og:title", content: "Post — Friend" },
      { property: "og:description", content: "A photo or video shared on Friend." },
    ],
  }),
  component: () => (
    <AppShell wide>
      <PostDetail />
    </AppShell>
  ),
});

function PostDetail() {
  const { postId } = Route.useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [caption, setCaption] = useState("");
  const [editingCaption, setEditingCaption] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [savingCaption, setSavingCaption] = useState(false);

  // Live author profile sync so avatar & username always show latest profile details
  const [authorData, setAuthorData] = useState<{
    username: string;
    displayName: string;
    photoURL: string | null;
  } | null>(null);

  useEffect(() => {
    if (!post?.authorId) return;
    let active = true;
    void getProfile(post.authorId).then((p) => {
      if (active && p) {
        setAuthorData({
          username: p.username || post.author.username,
          displayName: p.displayName || p.username || post.author.displayName,
          photoURL: p.photoURL ?? post.author.photoURL ?? null,
        });
      }
    });
    return () => {
      active = false;
    };
  }, [post?.authorId, post?.author]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const found = await getPost(postId);
      if (!found) setError("This post no longer exists.");
      setPost(found);
      if (found) {
        setCaption(found.caption);
        setEditingCaption(found.caption);
      }
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    void load();
  }, [load]);

  const isOwner = Boolean(
    profile && post && (profile.uid === post.authorId || profile.uid === post.author?.uid),
  );

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy the link.");
    }
    setShowMenu(false);
  };

  const remove = async () => {
    if (!post) return;
    try {
      await deletePost(post);
      toast.success("Post deleted");
      navigate({ to: "/home" });
    } catch (e) {
      toast.error(friendlyError(e));
    }
    setShowMenu(false);
  };

  const report = async () => {
    if (!profile || !post) return;
    try {
      await reportContent({
        reporterId: profile.uid,
        targetId: post.id,
        targetType: "post",
        reason: "Reported from post detail",
      });
      toast.success("Thanks — our team will review this post.");
    } catch (e) {
      toast.error(friendlyError(e));
    }
    setShowMenu(false);
  };

  const handleSaveCaption = async () => {
    if (!post) return;
    setSavingCaption(true);
    try {
      await updatePostCaption(post.id, editingCaption);
      setCaption(editingCaption);
      toast.success("Caption updated");
      setShowEdit(false);
    } catch (e) {
      toast.error(friendlyError(e));
    } finally {
      setSavingCaption(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-xl p-4">
        <PostSkeleton />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="mx-auto max-w-xl p-4">
        <ErrorState message={error ?? "This post no longer exists."} onRetry={load} />
        <div className="mt-4 text-center">
          <Button asChild variant="ghost">
            <Link to="/home">Back to feed</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl py-4">
      <div className="px-4 md:px-0">
        <Button asChild variant="ghost" size="sm" className="mb-3">
          <Link to="/home">
            <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" /> Back
          </Link>
        </Button>
      </div>

      {/* Mobile: the familiar single-column post */}
      <div className="md:hidden">
        <PostCard
          post={{ ...post, caption }}
          onDeleted={() => navigate({ to: "/home" })}
        />
      </div>

      {/* Desktop: split media / details with 3-dots options menu */}
      <div className="hidden overflow-hidden rounded-2xl border border-border bg-surface md:grid md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="bg-black flex items-center justify-center">
          <MediaCarousel media={post.media} alt={`Post by ${post.author.username}`} fit="contain" />
        </div>
        <div className="flex max-h-[80vh] flex-col">
          {/* Post Header with Author Info and 3-dots Menu */}
          {(() => {
            const authorUsername = authorData?.username || post.author.username;
            const authorDisplayName = authorData?.displayName || post.author.displayName || authorUsername;
            const authorPhotoURL = authorData?.photoURL ?? post.author.photoURL ?? null;

            return (
              <>
                <div className="flex items-center justify-between border-b border-border p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Link to="/profile/$username" params={{ username: authorUsername }}>
                      <UserAvatar photoURL={authorPhotoURL} name={authorDisplayName} size={40} />
                    </Link>
                    <div className="min-w-0">
                      <Link
                        to="/profile/$username"
                        params={{ username: authorUsername }}
                        className="block truncate text-sm font-semibold hover:underline"
                      >
                        {authorUsername}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {post.location ? `${post.location} · ` : ""}
                        {timeAgo(toDate(post.createdAt))}
                      </p>
                    </div>
                  </div>

                  {/* Three Dots Button for Desktop View */}
                  <button
                    type="button"
                    aria-label="Post options"
                    onClick={() => setShowMenu(true)}
                    className="rounded-full p-2 hover:bg-secondary transition-colors"
                  >
                    <MoreHorizontal className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {caption && (
                    <p className="mb-4 text-sm">
                      <Link
                        to="/profile/$username"
                        params={{ username: authorUsername }}
                        className="font-semibold hover:underline mr-1.5"
                      >
                        {authorUsername}
                      </Link>
                      <RichText text={caption} />
                    </p>
                  )}
                  <CommentsPanel post={post} />
                </div>
              </>
            );
          })()}
          </div>
        </div>

      {/* Post Options Modal */}
      <ResponsiveModal open={showMenu} onOpenChange={setShowMenu} title="Post options">
        <div className="flex flex-col gap-1 pb-2">
          <Button variant="ghost" className="justify-start" onClick={copyLink}>
            <Link2 className="mr-2 h-4 w-4" aria-hidden="true" /> Copy link
          </Button>
          {!isOwner && (
            <Button variant="ghost" className="justify-start" onClick={report}>
              <Flag className="mr-2 h-4 w-4" aria-hidden="true" /> Report post
            </Button>
          )}
          {isOwner && (
            <>
              <Button
                variant="ghost"
                className="justify-start"
                onClick={() => {
                  setShowMenu(false);
                  setEditingCaption(caption);
                  setShowEdit(true);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" aria-hidden="true" /> Edit caption
              </Button>
              <Button
                variant="ghost"
                className="justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={remove}
              >
                <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" /> Delete post
              </Button>
            </>
          )}
        </div>
      </ResponsiveModal>

      {/* Edit Caption Modal */}
      <ResponsiveModal open={showEdit} onOpenChange={setShowEdit} title="Edit caption">
        <div className="space-y-4 py-2">
          <Textarea
            value={editingCaption}
            onChange={(e) => setEditingCaption(e.target.value.slice(0, 2200))}
            rows={4}
            placeholder="Write a caption…"
            className="resize-none"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowEdit(false)} disabled={savingCaption}>
              Cancel
            </Button>
            <Button onClick={handleSaveCaption} disabled={savingCaption}>
              {savingCaption ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>
      </ResponsiveModal>
    </div>
  );
}
