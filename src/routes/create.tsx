import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppShell } from "@/components/friend/app-shell";
import { MediaPicker } from "@/components/friend/media-picker";
import { useAuth } from "@/context/auth";
import { createPost, createStory } from "@/lib/services";
import { friendlyError } from "@/lib/errors";
import type { PostMedia } from "@/types";

const searchSchema = z.object({
  mode: z.enum(["post", "story"]).optional().default("post"),
});

export const Route = createFileRoute("/create")({
  ssr: false,
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Create — Friend" },
      { name: "description", content: "Share a photo, a video, a carousel or a 24-hour story on Friend." },
      { property: "og:title", content: "Create — Friend" },
      { property: "og:description", content: "Share a post or a story on Friend." },
    ],
  }),
  component: () => (
    <AppShell>
      <CreatePage />
    </AppShell>
  ),
});

function CreatePage() {
  const { profile } = useAuth();
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const [media, setMedia] = useState<PostMedia[]>([]);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [publishing, setPublishing] = useState(false);

  const isStory = mode === "story";

  const publish = async () => {
    if (!profile || publishing) return;
    if (media.length === 0) {
      toast.error("Add at least one photo or video.");
      return;
    }
    setPublishing(true);
    try {
      const isVideo = media.some((m) => m.resourceType === "video");
      if (isStory) {
        await createStory(profile, media[0]!);
        toast.success("Story shared — it disappears in 24 hours");
        navigate({ to: "/home" });
      } else {
        const id = await createPost({ author: profile, media, caption, location: location || null });
        toast.success(isVideo ? "Reel published" : "Post published");
        if (isVideo) {
          navigate({ to: "/explore", search: { reelId: id } });
        } else {
          navigate({ to: "/post/$postId", params: { postId: id } });
        }
      }
    } catch (e) {
      toast.error(friendlyError(e));
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="text-2xl font-semibold">Create</h1>

      <Tabs
        value={mode}
        onValueChange={(value) =>
          navigate({ to: "/create", search: { mode: value as "post" | "story" } })
        }
        className="mt-4"
      >
        <TabsList>
          <TabsTrigger value="post">Post</TabsTrigger>
          <TabsTrigger value="story">Story</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-6 space-y-5">
        <MediaPicker
          media={media}
          onChange={setMedia}
          max={isStory ? 1 : 10}
          label={isStory ? "Choose story media" : "Add photos or a video"}
        />

        {!isStory && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="caption">Caption</Label>
              <Textarea
                id="caption"
                rows={4}
                value={caption}
                onChange={(e) => setCaption(e.target.value.slice(0, 2200))}
                placeholder="Say something… use #hashtags and @mentions"
              />
              <p className="text-xs text-muted-foreground">{caption.length}/2200</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">Location (optional)</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value.slice(0, 80))}
                placeholder="Where was this?"
              />
            </div>
          </>
        )}

        <div className="flex gap-2">
          <Button onClick={publish} disabled={publishing || media.length === 0} className="flex-1">
            {publishing ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : isStory ? (
              "Share story"
            ) : media.some((m) => m.resourceType === "video") ? (
              "Publish reel"
            ) : (
              "Publish post"
            )}
          </Button>
          <Button variant="ghost" onClick={() => navigate({ to: "/home" })} disabled={publishing}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
