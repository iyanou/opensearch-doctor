export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  publishedAt: string; // YYYY-MM-DD
  readingMinutes: number;
  tags: string[];
}

export const POSTS: BlogPost[] = [
  {
    slug: "8-opensearch-problems",
    title: "8 OpenSearch Problems That Will Eventually Kill Your Cluster",
    description:
      "Most OpenSearch failures don't happen suddenly. They build quietly over weeks. Here are the 8 issues most teams discover too late — and how to catch them before they hurt you.",
    publishedAt: "2025-04-01",
    readingMinutes: 9,
    tags: ["OpenSearch", "Operations", "Reliability"],
  },
  {
    slug: "monitor-opensearch-cluster",
    title: "How to Monitor a Self-Managed OpenSearch Cluster in 2026",
    description:
      "You're not on a managed service. There's no built-in dashboard. The _cat APIs are cryptic. Here's a practical guide to what you should actually monitor and the tools available to do it.",
    publishedAt: "2025-04-03",
    readingMinutes: 8,
    tags: ["OpenSearch", "Monitoring", "DevOps"],
  },
  {
    slug: "opensearch-unassigned-shards",
    title: "OpenSearch Unassigned Shards: Causes, Diagnosis, and How to Fix Them",
    description:
      "Unassigned shards are one of the most common — and most misunderstood — OpenSearch problems. This post covers every root cause, how to diagnose each one, and exactly how to fix them.",
    publishedAt: "2025-04-07",
    readingMinutes: 10,
    tags: ["OpenSearch", "Shards", "Troubleshooting"],
  },
  {
    slug: "opensearch-jvm-heap",
    title: "OpenSearch JVM Heap Usage: When to Worry and What to Do",
    description:
      "JVM heap pressure is the single most common cause of OpenSearch instability. This guide explains what heap usage means, which thresholds matter, and what to do when the numbers climb.",
    publishedAt: "2025-04-10",
    readingMinutes: 8,
    tags: ["OpenSearch", "JVM", "Performance"],
  },
  {
    slug: "pulse-vs-opensearch-doctor",
    title: "Pulse vs OpenSearch Doctor: Which Is Right for Your Team?",
    description:
      "Two products, very different audiences. An honest comparison of Pulse and OpenSearch Doctor — what each does well, what it doesn't, and who should use which.",
    publishedAt: "2025-04-14",
    readingMinutes: 6,
    tags: ["OpenSearch", "Comparison", "Tools"],
  },
  {
    slug: "opensearch-ism-policies",
    title: "OpenSearch ISM Policies: Common Mistakes and How to Avoid Them",
    description:
      "Index State Management is one of the most powerful — and most misused — features in OpenSearch. Here are the mistakes that cause silent failures and how to build policies that actually work.",
    publishedAt: "2025-04-17",
    readingMinutes: 9,
    tags: ["OpenSearch", "ISM", "Index Management"],
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
