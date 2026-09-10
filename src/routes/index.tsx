import { useEffect } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Camera, Heart, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FriendLogo } from "@/components/friend/logo";
import { useAuth } from "@/context/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Friend — share moments with the people who matter" },
      {
        name: "description",
        content:
          "Friend is a calm, modern social network: photo and video posts, stories that vanish in a day, and private conversations with your circle.",
      },
      { property: "og:title", content: "Friend — share moments with the people who matter" },
      {
        property: "og:description",
        content: "Photo and video posts, 24-hour stories, and private messages with your circle.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Camera, title: "Posts that look great", copy: "Photos, videos and swipeable carousels, delivered fast at any screen size." },
  { icon: Sparkles, title: "Stories for today", copy: "Share a moment that quietly disappears after 24 hours." },
  { icon: Heart, title: "Real conversations", copy: "Likes, threaded comments and saves — without the noise." },
  { icon: MessageCircle, title: "Private messages", copy: "Direct chats that arrive the instant they're sent." },
];

function Landing() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isAuthenticated) navigate({ to: "/home", replace: true });
  }, [loading, isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <FriendLogo />
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/signup">Join Friend</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-24">
        <section className="py-12 md:py-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            A warmer social space
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl font-bold leading-tight md:text-6xl">
            Share your day with friends, not an audience.
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
            Friend keeps the parts of social media you love — moments, stories and conversation —
            in one calm, beautifully simple place.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/signup">Create your account</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/login">I already have one</Link>
            </Button>
          </div>
        </section>

        <section aria-label="What you can do on Friend" className="grid gap-4 sm:grid-cols-2">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-surface p-6 shadow-soft">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary">
                <f.icon className="h-5 w-5 text-primary" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-lg font-semibold">{f.title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.copy}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
