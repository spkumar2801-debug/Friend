import { useEffect, useState } from "react";
import { formatFullDate, timeAgo } from "@/lib/text";

export function useRelativeTime(date: Date | null | undefined): string {
  const [text, setText] = useState(() => timeAgo(date));

  useEffect(() => {
    setText(timeAgo(date));
    if (!date || isNaN(date.getTime())) return;

    // Refresh every 20 seconds so "Just now" transitions into "1 min ago", "2 mins ago" seamlessly
    const interval = setInterval(() => {
      setText(timeAgo(date));
    }, 20000);

    return () => clearInterval(interval);
  }, [date ? date.getTime() : null]);

  return text;
}

export function RelativeTime({
  date,
  prefix = "",
  className,
}: {
  date: Date | null | undefined;
  prefix?: string;
  className?: string;
}) {
  const text = useRelativeTime(date);
  const full = formatFullDate(date);

  if (!date) {
    return <span className={className}>{prefix}Just now</span>;
  }

  return (
    <time dateTime={date.toISOString()} title={full} className={className}>
      {prefix}
      {text}
    </time>
  );
}
