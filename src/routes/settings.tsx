import { useEffect, useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { AppShell } from "@/components/friend/app-shell";
import { UserAvatar } from "@/components/friend/user-avatar";
import { MediaPicker } from "@/components/friend/media-picker";
import { useAuth } from "@/context/auth";
import { useTheme, type ThemeMode } from "@/context/theme";
import { defaultSettings, isUsernameAvailable, updateProfile, updateSettings } from "@/lib/services";
import { friendlyError } from "@/lib/errors";
import { normalizeUsername, validateUsername } from "@/lib/text";
import type { PostMedia, UserSettings } from "@/types";

export const Route = createFileRoute("/settings")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Settings — Friend" },
      { name: "description", content: "Manage your Friend profile, privacy, notifications and appearance." },
      { property: "og:title", content: "Settings — Friend" },
      { property: "og:description", content: "Manage your Friend account settings." },
    ],
  }),
  component: () => (
    <AppShell>
      <SettingsPage />
    </AppShell>
  ),
});

function SettingsPage() {
  const { profile, refreshProfile, logout } = useAuth();
  const { mode, setMode } = useTheme();
  const navigate = useNavigate();
  const [form, setForm] = useState({ displayName: "", username: "", bio: "", website: "" });
  const [avatar, setAvatar] = useState<PostMedia[]>([]);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setForm({
      displayName: profile.displayName,
      username: profile.username,
      bio: profile.bio ?? "",
      website: profile.website ?? "",
    });
    setSettings({ ...defaultSettings, ...profile.settings });
  }, [profile]);

  if (!profile) return null;

  const saveProfile = async () => {
    const usernameError = validateUsername(form.username);
    if (usernameError) return setError(usernameError);
    if (!form.displayName.trim()) return setError("Add a name people will recognise.");
    setError(null);
    setSaving(true);
    try {
      if (
        form.username.toLowerCase() !== profile.username.toLowerCase() &&
        !(await isUsernameAvailable(form.username.toLowerCase(), profile.uid))
      ) {
        setError("That username is already taken.");
        return;
      }
      const uploaded = avatar[0];
      await updateProfile(
        profile.uid,
        {
          displayName: form.displayName.trim(),
          username: form.username.toLowerCase(),
          usernameLower: form.username.toLowerCase(),
          bio: form.bio.slice(0, 200),
          website: form.website.slice(0, 120),
          ...(uploaded ? { photoURL: uploaded.url, photoPublicId: uploaded.publicId } : {}),
        },
        profile.username,
      );
      await refreshProfile();
      setAvatar([]);
      toast.success("Profile updated");
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setSaving(false);
    }
  };

  const patchSettings = async (patch: Partial<UserSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    try {
      await updateSettings(profile.uid, next);
    } catch (e) {
      toast.error(friendlyError(e));
    }
  };

  const setPrivate = async (isPrivate: boolean) => {
    try {
      await updateProfile(profile.uid, { isPrivate });
      await refreshProfile();
      toast.success(isPrivate ? "Your account is now private" : "Your account is now public");
    } catch (e) {
      toast.error(friendlyError(e));
    }
  };

  const signOut = async () => {
    await logout();
    navigate({ to: "/login", replace: true });
  };

  return (
    <div className="mx-auto max-w-xl space-y-8 px-4 py-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <section aria-labelledby="profile-heading" className="space-y-4">
        <h2 id="profile-heading" className="text-sm font-semibold text-muted-foreground">
          Profile
        </h2>
        <div className="flex items-center gap-4">
          <UserAvatar
            photoURL={avatar[0]?.url ?? profile.photoURL}
            name={profile.displayName}
            size={72}
          />
          <div className="flex-1">
            <MediaPicker media={avatar} onChange={setAvatar} max={1} label="Change photo" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="displayName">Name</Label>
          <Input
            id="displayName"
            value={form.displayName}
            onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: normalizeUsername(e.target.value) }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            rows={3}
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value.slice(0, 200) }))}
          />
          <p className="text-xs text-muted-foreground">{form.bio.length}/200</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            value={form.website}
            onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
            placeholder="yoursite.com"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button onClick={saveProfile} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Save changes"}
        </Button>
      </section>

      <Separator />

      <section aria-labelledby="privacy-heading" className="space-y-4">
        <h2 id="privacy-heading" className="text-sm font-semibold text-muted-foreground">
          Privacy
        </h2>
        <Row
          id="private"
          label="Private account"
          hint="Only approved followers can see your posts and stories."
          checked={profile.isPrivate}
          onChange={setPrivate}
        />
        <Row
          id="activity"
          label="Show my activity"
          hint="Let people see when you were last active."
          checked={settings.showActivity}
          onChange={(v) => patchSettings({ showActivity: v })}
        />
        <div className="space-y-1.5">
          <Label htmlFor="dm-permission">Who can message me</Label>
          <select
            id="dm-permission"
            value={settings.allowMessagesFrom}
            onChange={(e) =>
              patchSettings({ allowMessagesFrom: e.target.value as UserSettings["allowMessagesFrom"] })
            }
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="everyone">Everyone</option>
            <option value="followers">People I follow back</option>
          </select>
        </div>
      </section>

      <Separator />

      <section aria-labelledby="notify-heading" className="space-y-4">
        <h2 id="notify-heading" className="text-sm font-semibold text-muted-foreground">
          Notifications
        </h2>
        <Row
          id="n-likes"
          label="Likes"
          checked={settings.notifyLikes}
          onChange={(v) => patchSettings({ notifyLikes: v })}
        />
        <Row
          id="n-comments"
          label="Comments and replies"
          checked={settings.notifyComments}
          onChange={(v) => patchSettings({ notifyComments: v })}
        />
        <Row
          id="n-followers"
          label="New followers"
          checked={settings.notifyFollowers}
          onChange={(v) => patchSettings({ notifyFollowers: v })}
        />
        <Row
          id="n-messages"
          label="Messages"
          checked={settings.notifyMessages}
          onChange={(v) => patchSettings({ notifyMessages: v })}
        />
      </section>

      <Separator />

      <section aria-labelledby="appearance-heading" className="space-y-3">
        <h2 id="appearance-heading" className="text-sm font-semibold text-muted-foreground">
          Appearance
        </h2>
        <div className="flex gap-2">
          {(["light", "dark", "system"] as ThemeMode[]).map((option) => (
            <Button
              key={option}
              size="sm"
              variant={mode === option ? "default" : "secondary"}
              onClick={() => setMode(option)}
              className="capitalize"
            >
              {option}
            </Button>
          ))}
        </div>
      </section>

      <Separator />

      <section aria-labelledby="account-heading" className="space-y-3">
        <h2 id="account-heading" className="text-sm font-semibold text-muted-foreground">
          Account
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link to="/saved">Saved posts</Link>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link to="/forgot-password">Change password</Link>
          </Button>
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="mr-1.5 h-4 w-4" aria-hidden="true" /> Sign out
          </Button>
        </div>
      </section>
    </div>
  );
}

function Row({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <Label htmlFor={id}>{label}</Label>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
