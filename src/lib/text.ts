export const USERNAME_RE = /^[a-z0-9._]{3,24}$/;

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9._]/g, "");
}

export function validateUsername(value: string): string | null {
  const v = value.trim().toLowerCase();
  if (!v) return "Pick a username.";
  if (v.length < 3) return "Usernames need at least 3 characters.";
  if (v.length > 24) return "Usernames can be at most 24 characters.";
  if (!USERNAME_RE.test(v))
    return "Use only lowercase letters, numbers, dots and underscores.";
  if (v.startsWith(".") || v.endsWith(".")) return "Usernames can't start or end with a dot.";
  return null;
}

export function validatePassword(value: string): string | null {
  if (value.length < 8) return "Use at least 8 characters.";
  if (!/[a-zA-Z]/.test(value) || !/[0-9]/.test(value))
    return "Include at least one letter and one number.";
  return null;
}

export function validateEmail(value: string): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())) return "Enter a valid email address.";
  return null;
}

export function extractHashtags(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(/#([\p{L}0-9_]{1,50})/gu)) if (m[1]) out.add(m[1].toLowerCase());
  return [...out];
}

export function extractMentions(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(/@([a-zA-Z0-9._]{3,24})/g)) if (m[1]) out.add(m[1].toLowerCase());
  return [...out];
}

/** Splits caption text into plain / hashtag / mention tokens for safe rendering. */
export type Token = { type: "text" | "hashtag" | "mention"; value: string };

export function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  const re = /(#[\p{L}0-9_]{1,50})|(@[a-zA-Z0-9._]{3,24})/gu;
  let last = 0;
  for (const m of text.matchAll(re)) {
    const index = m.index ?? 0;
    if (index > last) tokens.push({ type: "text", value: text.slice(last, index) });
    tokens.push({
      type: m[0].startsWith("#") ? "hashtag" : "mention",
      value: m[0].slice(1),
    });
    last = index + m[0].length;
  }
  if (last < text.length) tokens.push({ type: "text", value: text.slice(last) });
  return tokens;
}

export function timeAgo(date: Date | null | undefined): string {
  if (!date) return "Just now";
  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

  // If under 1 minute or just uploaded
  if (diffSec < 60) return "Just now";

  const mins = Math.floor(diffSec / 60);
  if (mins < 60) {
    return mins === 1 ? "1 min ago" : `${mins} mins ago`;
  }

  const hours = Math.floor(diffSec / 3600);
  if (hours < 24) {
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  }

  const days = Math.floor(diffSec / 86400);
  if (days <= 7) {
    return days === 1 ? "1 day ago" : `${days} days ago`;
  }

  // More than 7 days ago: mention the date (e.g. "Sep 10" or "Sep 10, 2025")
  const now = new Date();
  const isSameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(isSameYear ? {} : { year: "numeric" }),
  });
}

export function formatFullDate(date: Date | null | undefined): string {
  if (!date) return "";
  try {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return date.toLocaleString();
  }
}

export function compact(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n % 1000 < 100 ? 0 : 1)}k`;
  return `${(n / 1_000_000).toFixed(1)}m`;
}
