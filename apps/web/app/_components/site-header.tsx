"use client";

import { useEffect, useState } from "react";
import { WaitlistTrigger } from "./waitlist-trigger";

const NAV_LINKS = ["Products", "Community", "Blog", "Docs"];

// Real destinations for nav links that have one; others fall back to "#".
const NAV_HREFS: Record<string, string> = {
  Community: "https://discord.gg/tcb6b7ZYha",
  Blog: "/blog",
  Docs: "/docs",
};

// Flip to the light theme once the hero gradient behind the nav goes light
// (roughly when the headline/input have scrolled up toward the nav).
const FLIP_AT = 300;

const linkBase = "py-3 text-[13px] font-medium tracking-[-0.005em] transition-colors";

export function SiteHeader() {
  const [light, setLight] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setLight(y > FLIP_AT);
      // Hide while scrolling down through the hero (so it never covers the
      // orbit icons); reveal instantly when scrolling up or near the top.
      setHidden(y > 96 && y > last);
      last = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const activeLink = light
    ? "border-b-2 border-black text-black"
    : "border-b-2 border-white text-white";
  const idleLink = light
    ? "px-0.5 text-[#606169] hover:text-black"
    : "px-0.5 text-[#CECECE] hover:text-white";

  return (
    <header
      className={`sticky top-0 z-50 border-b backdrop-blur-md transition-[transform,background-color,border-color] duration-300 ${
        hidden ? "-translate-y-full" : "translate-y-0"
      } ${light ? "border-black/10 bg-white/80" : "border-white/[0.12] bg-black/80"}`}
    >
      <div className="mx-auto flex h-12 max-w-[1440px] items-center justify-between px-6 md:px-[120px]">
        {/* Wordmark */}
        <a href="/" className="flex items-center gap-1">
          <span className="font-display text-[20px] leading-none text-accent">t</span>
          <span
            className={`text-[20px] font-medium tracking-[0.01em] transition-colors ${
              light ? "text-black" : "text-white"
            }`}
          >
            tael
          </span>
        </a>

        {/* Primary nav */}
        <nav className="hidden items-center gap-3 md:flex">
          {NAV_LINKS.map((label, i) => {
            const href = NAV_HREFS[label] ?? "#";
            const external = href.startsWith("http");
            return (
              <a
                key={i}
                href={href}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className={`${linkBase} ${i === 0 ? activeLink : idleLink}`}
              >
                {label}
              </a>
            );
          })}
        </nav>

        {/* CTA */}
        <WaitlistTrigger className={`${linkBase} ${idleLink}`}>Join waitlist</WaitlistTrigger>
      </div>
    </header>
  );
}
