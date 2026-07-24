"use client";

import { motion } from "framer-motion";
import type { AgentMessage } from "./types";
import { DiscordIcon } from "./icons";

/** A blinking three-dot indicator shown while the first token is in flight. */
export function TypingDots() {
  return (
    <span className="flex items-center gap-1 py-1" aria-label="Assistant is typing">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-white/50"
          animate={{ opacity: [0.25, 1, 0.25] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
}

/** Short relative time for the message meta line (e.g. "Just now", "3m", "2h"). */
function relativeTime(ts?: number): string {
  if (!ts) return "Just now";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 45) return "Just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

/** A Discord invite link in the reply → render it as a branded button, not raw text. */
const DISCORD_RE = /(?:https?:\/\/)?discord\.(?:gg|com\/invite)\/[A-Za-z0-9-]+/i;

/**
 * One message row. No per-message avatar (the brand mark lives in the header/
 * teaser boxes only). The visitor gets a white bubble on the right; the assistant
 * gets a #2c2d31 bubble on the left, with an optional "Tael · AI Agent · time"
 * meta below the latest reply. A Discord invite in the reply renders as a button.
 */
export function MessageBubble({
  message,
  showMeta,
}: {
  message: AgentMessage;
  showMeta?: boolean;
}) {
  const isUser = message.role === "user";
  const empty = message.content.length === 0;

  // Pull a Discord invite out of the assistant's text and show it as a button.
  const discord = isUser ? null : (message.content.match(DISCORD_RE)?.[0] ?? null);
  const text = discord
    ? message.content
        .replace(DISCORD_RE, "")
        .replace(/[\s:•-]+$/, "")
        .trim()
    : message.content;
  const showBubble = empty || text.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`flex flex-col gap-1.5 ${isUser ? "items-end" : "items-start"}`}
    >
      {showBubble ? (
        <div
          className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
            isUser
              ? "rounded-br-sm bg-white text-[#14161a]"
              : "rounded-bl-sm bg-[#2c2d31] text-zinc-100"
          }`}
        >
          {empty ? (
            <TypingDots />
          ) : (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="whitespace-pre-wrap"
            >
              {text}
            </motion.p>
          )}
        </div>
      ) : null}

      {discord ? (
        <a
          href={discord.startsWith("http") ? discord : `https://${discord}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-[#5865F2] px-3.5 py-2 text-[13px] font-medium text-white transition-all duration-150 ease-out hover:bg-[#4752c4] active:scale-[0.98]"
        >
          <DiscordIcon className="h-4 w-4" /> Join our Discord
        </a>
      ) : null}

      {!isUser && showMeta && !empty ? (
        <span className="text-xs text-white/40">
          Tael • AI Agent • {relativeTime(message.createdAt)}
        </span>
      ) : null}
    </motion.div>
  );
}
