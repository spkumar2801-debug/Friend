import { Link } from "@tanstack/react-router";
import { tokenize } from "@/lib/text";

/** Renders captions/comments as plain text plus safe hashtag & mention links. */
export function RichText({ text, className }: { text: string; className?: string }) {
  return (
    <span className={className}>
      {tokenize(text).map((token, i) => {
        if (token.type === "hashtag") {
          return (
            <Link
              key={i}
              to="/hashtag/$tag"
              params={{ tag: token.value }}
              className="text-primary hover:underline"
            >
              #{token.value}
            </Link>
          );
        }
        if (token.type === "mention") {
          return (
            <Link
              key={i}
              to="/profile/$username"
              params={{ username: token.value }}
              className="text-primary hover:underline"
            >
              @{token.value}
            </Link>
          );
        }
        return <span key={i}>{token.value}</span>;
      })}
    </span>
  );
}
