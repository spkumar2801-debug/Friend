import { useEffect, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Clapperboard,
  Home,
  MessageCircle,
  PlusSquare,
  Search,
  Settings,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "@/context/auth";
import { FriendLogo, FriendMark } from "./logo";
import { UserAvatar } from "./user-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useUnreadCounts } from "@/hooks/use-unread";

const primary = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/search", label: "Search", icon: Search },
  { to: "/explore", label: "Reels", icon: Clapperboard },
  { to: "/messages", label: "Messages", icon: MessageCircle },
  { to: "/notifications", label: "Activity", icon: Bell },
  { to: "/create", label: "Create", icon: PlusSquare },
] as const;

const mobile = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/explore", label: "Reels", icon: Clapperboard },
  { to: "/create", label: "Create", icon: PlusSquare },
  { to: "/notifications", label: "Activity", icon: Bell },
] as const;

function Badge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground">
      {count > 9 ? "9+" : count}
    </span>
  );
}

export function AppShell({ children, wide }: { children: ReactNode; wide?: boolean }) {
  const { profile, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const counts = useUnreadCounts();

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate({ to: "/login", replace: true });
  }, [loading, isAuthenticated, navigate]);

  if (loading || !profile) {
    return (
      <div className="mx-auto max-w-xl space-y-4 p-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-56 w-full rounded-2xl" />
        <Skeleton className="h-56 w-full rounded-2xl" />
      </div>
    );
  }

  const countFor = (to: string) =>
    to === "/notifications" ? counts.notifications : to === "/messages" ? counts.messages : 0;

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#friend-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur md:hidden">
        <Link to="/home" aria-label="Friend home">
          <FriendLogo />
        </Link>
        <div className="flex items-center gap-1">
          <Link
            to="/search"
            aria-label="Search"
            className="relative rounded-full p-2.5 hover:bg-secondary"
          >
            <Search className="h-5 w-5" aria-hidden="true" />
          </Link>
          <Link
            to="/messages"
            aria-label="Messages"
            className="relative rounded-full p-2.5 hover:bg-secondary"
          >
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
            <Badge count={counts.messages} />
          </Link>
        </div>
      </header>

      <div className="md:flex">
        {/* Desktop sidebar */}
        <nav
          aria-label="Main"
          className="sticky top-0 hidden h-screen shrink-0 flex-col justify-between border-r border-border px-3 py-6 md:flex lg:w-60 lg:px-4"
        >
          <div className="space-y-1">
            <Link to="/home" className="mb-6 block px-2" aria-label="Friend home">
              <span className="hidden lg:inline">
                <FriendLogo />
              </span>
              <span className="lg:hidden">
                <FriendMark />
              </span>
            </Link>
            {primary.map((item) => {
              const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-secondary",
                    active && "bg-secondary font-semibold",
                  )}
                >
                  <span className="relative">
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                    <Badge count={countFor(item.to)} />
                  </span>
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              );
            })}
            <Link
              to="/profile/$username"
              params={{ username: profile.username }}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-secondary",
                pathname === `/profile/${profile.username}` && "bg-secondary font-semibold",
              )}
            >
              <UserAvatar photoURL={profile.photoURL} name={profile.displayName} size={22} />
              <span className="hidden lg:inline">Profile</span>
            </Link>
          </div>
          <Link
            to="/settings"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-secondary"
          >
            <Settings className="h-5 w-5" aria-hidden="true" />
            <span className="hidden lg:inline">Settings</span>
          </Link>
        </nav>

        <main
          id="friend-main"
          className={cn(
            "min-w-0 flex-1 px-0 pb-24 md:px-6 md:pb-10",
            wide ? "" : "mx-auto w-full max-w-5xl",
          )}
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Main"
        className="safe-bottom fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-border bg-background/95 backdrop-blur md:hidden"
      >
        {mobile.map((item) => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className="relative flex min-h-14 min-w-14 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px]"
            >
              <span className="relative">
                <item.icon
                  className={cn("h-6 w-6", active ? "text-primary" : "text-muted-foreground")}
                  aria-hidden="true"
                />
                <Badge count={countFor(item.to)} />
              </span>
              <span className={active ? "text-primary" : "text-muted-foreground"}>
                {item.label}
              </span>
            </Link>
          );
        })}
        <Link
          to="/profile/$username"
          params={{ username: profile.username }}
          aria-label="Profile"
          className="flex min-h-14 min-w-14 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] text-muted-foreground"
        >
          <UserAvatar photoURL={profile.photoURL} name={profile.displayName} size={24} />
          Profile
        </Link>
      </nav>
    </div>
  );
}

export { UserIcon };
