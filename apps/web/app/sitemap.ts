import type { MetadataRoute } from "next";
import { posts } from "./blog/_posts";

const SITE_URL = "https://taelprotocol.xyz";

const paths = [
  "",
  "/blog",
  "/docs",
  "/docs/quickstart",
  "/docs/authentication",
  "/docs/accept-payments",
  "/docs/wrap-an-api",
  "/docs/sdk/node",
  "/docs/sdk/curl",
  ...posts.map((post) => `/blog/${post.slug}`),
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return paths.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}
