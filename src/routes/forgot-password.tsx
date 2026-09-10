import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FriendLogo } from "@/components/friend/logo";
import { useAuth } from "@/context/auth";
import { friendlyError } from "@/lib/errors";
import { validateEmail } from "@/lib/text";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — Friend" },
      { name: "description", content: "Send yourself a password reset link for your Friend account." },
      { property: "og:title", content: "Reset your password — Friend" },
      { property: "og:description", content: "Send yourself a password reset link for Friend." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailError = validateEmail(email);
    if (emailError) return setError(emailError);
    setError(null);
    setBusy(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-12">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex justify-center" aria-label="Friend home">
          <FriendLogo />
        </Link>

        {sent ? (
          <div className="space-y-4 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <MailCheck className="h-5 w-5 text-primary" aria-hidden="true" />
            </span>
            <h1 className="text-2xl font-semibold">Check your inbox</h1>
            <p className="text-sm text-muted-foreground">
              We sent a reset link to {email}. It may take a minute to arrive.
            </p>
            <Button asChild className="w-full">
              <Link to="/login">Back to sign in</Link>
            </Button>
          </div>
        ) : (
          <>
            <h1 className="text-center text-2xl font-semibold">Reset your password</h1>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              We'll email you a link to choose a new one.
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
                  aria-invalid={Boolean(error)}
                />
              </div>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Send reset link"}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              <Link to="/login" className="text-primary hover:underline">
                Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
