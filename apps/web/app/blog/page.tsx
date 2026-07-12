import { posts } from "./_posts";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogIndex() {
  return (
    <main className="mx-auto max-w-[720px] px-6 pb-28 pt-20">
      <p className="text-[13px] font-medium uppercase tracking-[0.16em] text-white/40">Blog</p>
      <h1 className="mt-3 text-[40px] font-semibold leading-[1.05] tracking-[-0.03em] text-white sm:text-[52px]">
        Notes on machine-native payments.
      </h1>
      <p className="mt-4 max-w-[52ch] text-[18px] leading-[1.6] text-white/55">
        How autonomous agents pay for APIs, tools, and data — the ideas behind Tael and the x402
        protocol.
      </p>

      <div className="mt-16 flex flex-col divide-y divide-white/10 border-t border-white/10">
        {posts.map((post) => (
          <a key={post.slug} href={`/blog/${post.slug}`} className="group block py-8">
            <div className="flex items-center gap-3 text-[13px] text-white/40">
              <time dateTime={post.date}>{formatDate(post.date)}</time>
              <span aria-hidden>·</span>
              <span>{post.readingTime}</span>
            </div>
            <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.02em] text-white transition-colors group-hover:text-accent sm:text-[28px]">
              {post.title}
            </h2>
            <p className="mt-2 max-w-[58ch] text-[16px] leading-[1.6] text-white/55">
              {post.description}
            </p>
            <span className="mt-3 inline-flex items-center gap-1.5 text-[14px] font-medium text-accent">
              Read
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </a>
        ))}
      </div>
    </main>
  );
}
