"use client";

import { useState, type FormEvent } from "react";

type Status = "idle" | "loading" | "success" | "error";

export function WaitlistForm({ className = "mt-8 max-w-[464px]" }: { className?: string } = {}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const locked = status === "loading" || status === "success";

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (locked) return;
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Try again.");
        return;
      }
      setStatus("success");
      setMessage("You're on the list. Check your inbox for a confirmation.");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className={className}>
      <div className="relative">
        <input
          id="waitlist-email"
          type="email"
          name="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          autoComplete="email"
          required
          disabled={locked}
          placeholder="your@email.com"
          aria-label="Email address"
          className="w-full rounded-[18px] bg-white py-[18px] pl-6 pr-16 text-[16px] font-medium tracking-[0.0269em] text-ink shadow-[0_0_0_1px_rgba(0,0,0,0.1),0_1px_2px_0_rgba(0,0,0,0.16)] outline-none transition-shadow placeholder:text-[#9F9F9F] focus:shadow-[0_0_0_2px_rgba(21,109,252,0.5),0_1px_2px_0_rgba(0,0,0,0.16)] disabled:opacity-70"
        />
        <button
          type="submit"
          aria-label="Join waitlist"
          disabled={locked}
          className="absolute right-2.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-[13px] bg-accent text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {status === "loading" ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : status === "success" ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M5 13l4 4L19 7"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </div>

      {message && (
        <p
          role={status === "error" ? "alert" : "status"}
          className={`mt-3 text-[14px] tracking-[-0.01em] ${
            status === "error" ? "text-red-600" : "text-ink-soft"
          }`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
