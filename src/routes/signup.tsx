import { useEffect, useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FriendLogo } from "@/components/friend/logo";
import { useAuth } from "@/context/auth";
import { friendlyError } from "@/lib/errors";
import { isUsernameAvailable } from "@/lib/services";
import { normalizeUsername, validateEmail, validatePassword, validateUsername } from "@/lib/text";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your account — Friend" },
      { name: "description", content: "Join Friend and start sharing photos, videos and stories with your circle." },
      { property: "og:title", content: "Create your account — Friend" },
      { property: "og:description", content: "Join Friend and start sharing with the people who matter." },
    ],
  }),
  component: SignupPage,
});

interface FieldErrors {
  email?: string;
  password?: string;
  username?: string;
  displayName?: string;
  form?: string;
}

function SignupPage() {
  const { signUpWithEmail, signInWithGoogle, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", username: "", displayName: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState<"email" | "google" | null>(null);

  useEffect(() => {
    if (!loading && isAuthenticated) navigate({ to: "/home", replace: true });
  }, [loading, isAuthenticated, navigate]);

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: FieldErrors = {};
    const emailError = validateEmail(form.email);
    if (emailError) next.email = emailError;
    const passwordError = validatePassword(form.password);
    if (passwordError) next.password = passwordError;
    const usernameError = validateUsername(form.username);
    if (usernameError) next.username = usernameError;
    if (!form.displayName.trim()) next.displayName = "Tell people what to call you.";
    if (Object.keys(next).length) return setErrors(next);

    setErrors({});
    setBusy("email");
    try {
      if (!(await isUsernameAvailable(form.username.toLowerCase()))) {
        setErrors({ username: "That username is already taken." });
        return;
      }
      await signUpWithEmail(form);
      navigate({ to: "/home", replace: true });
    } catch (err) {
      setErrors({ form: friendlyError(err) });
    } finally {
      setBusy(null);
    }
  };

  const google = async () => {
    setBusy("google");
    try {
      await signInWithGoogle();
      navigate({ to: "/home", replace: true });
    } catch (err) {
      setErrors({ form: friendlyError(err) });
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
        <h1 className="text-center text-2xl font-semibold">Join Friend</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          It takes less than a minute.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="displayName">Name</Label>
            <Input
              id="displayName"
              value={form.displayName}
              onChange={(e) => set("displayName", e.target.value)}
              autoComplete="name"
              aria-invalid={Boolean(errors.displayName)}
            />
            {errors.displayName && <p className="text-xs text-destructive">{errors.displayName}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={form.username}
              onChange={(e) => set("username", normalizeUsername(e.target.value))}
              autoComplete="username"
              aria-invalid={Boolean(errors.username)}
            />
            <p className="text-xs text-muted-foreground">
              Lowercase letters, numbers, dots and underscores.
            </p>
            {errors.username && <p className="text-xs text-destructive">{errors.username}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
            />
            {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
          </div>

          {errors.form && (
            <p role="alert" className="text-sm text-destructive">
              {errors.form}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={busy !== null}>
            {busy === "email" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              "Create account"
            )}
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

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already on Friend?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
