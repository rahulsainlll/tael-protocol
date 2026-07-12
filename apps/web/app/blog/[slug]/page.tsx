import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPost, posts } from "../_posts";

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  const url = `https://taelprotocol.xyz/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      url,
      siteName: "Tael",
      title: post.title,
      description: post.description,
      publishedTime: post.date,
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.description },
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const Body = post.body;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { "@type": "Organization", name: "Tael", url: "https://taelprotocol.xyz" },
    publisher: { "@type": "Organization", name: "Tael", url: "https://taelprotocol.xyz" },
    mainEntityOfPage: `https://taelprotocol.xyz/blog/${post.slug}`,
  };

  return (
    <main className="mx-auto max-w-[680px] px-6 pb-28 pt-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <a
        href="/blog"
        className="inline-flex items-center gap-1.5 text-[14px] text-white/45 transition-colors hover:text-white"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M15 18l-6-6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Blog
      </a>

      <article className="mt-8">
        <div className="flex items-center gap-3 text-[13px] text-white/40">
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          <span aria-hidden>·</span>
          <span>{post.readingTime}</span>
        </div>
        <h1 className="mt-3 text-[38px] font-semibold leading-[1.08] tracking-[-0.03em] text-white sm:text-[46px]">
          {post.title}
        </h1>
        <div className="mt-10">
          <Body />
        </div>
      </article>
    </main>
  );
}
