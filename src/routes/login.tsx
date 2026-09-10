import { useEffect, useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FriendLogo } from "@/components/friend/logo";
import { useAuth } from "@/context/auth";
import { friendlyError } from "@/lib/errors";
import { validateEmail } from "@/lib/text";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Friend" },
      { name: "description", content: "Sign in to Friend to see posts, stories and messages from your circle." },
      { property: "og:title", content: "Sign in — Friend" },
      { property: "og:description", content: "Sign in to Friend to catch up with your circle." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { signInWithEmail, signInWithGoogle, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"email" | "google" | null>(null);

  useEffect(() => {
    if (!loading && isAuthenticated) navigate({ to: "/home", replace: true });
  }, [loading, isAuthenticated, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailError = validateEmail(email);
    if (emailError) return setError(emailError);
    if (!password) return setError("Enter your password.");
    setError(null);
    setBusy("email");
    try {
      await signInWithEmail(email, password);
      navigate({ to: "/home", replace: true });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(null);
    }
  };

  const google = async () => {
    setError(null);
    setBusy("google");
    try {
      await signInWithGoogle();
      navigate({ to: "/home", replace: true });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-12">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex justify-center" aria-label="Friend home">
          <FriendLogo />
        </Link>
        <h1 className="text-center text-2xl font-semibold">Welcome back</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Sign in to pick up where you left off.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={busy !== null}>
            {busy === "email" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Sign in"}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs uppercase text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>

        <Button variant="outline" className="w-full" onClick={google} disabled={busy !== null}>
          {busy === "google" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            "Continue with Google"
          )}
        </Button>

        <div className="mt-6 space-y-2 text-center text-sm">
          <Link to="/forgot-password" className="text-primary hover:underline">
            Forgot your password?
          </Link>
          <p className="text-muted-foreground">
            New here?{" "}
            <Link to="/signup" className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
