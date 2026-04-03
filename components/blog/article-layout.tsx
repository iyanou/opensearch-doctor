import Link from "next/link";
import { Activity, ArrowLeft, Clock, Calendar } from "lucide-react";
import { formatDate } from "@/lib/blog";

interface ArticleLayoutProps {
  title: string;
  description: string;
  publishedAt: string;
  readingMinutes: number;
  tags: string[];
  children: React.ReactNode;
}

export function ArticleLayout({
  title, description, publishedAt, readingMinutes, tags, children,
}: ArticleLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <Activity className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-base tracking-tight">OpenSearch Doctor</span>
          </Link>
          <Link
            href="/blog"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> All articles
          </Link>
        </div>
      </header>

      {/* Article */}
      <main className="max-w-2xl mx-auto px-6 py-14">

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-5">
          {tags.map((tag) => (
            <span key={tag} className="text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full">
              {tag}
            </span>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight mb-4">
          {title}
        </h1>

        {/* Description */}
        <p className="text-lg text-muted-foreground leading-relaxed mb-6">{description}</p>

        {/* Meta */}
        <div className="flex items-center gap-5 text-sm text-muted-foreground pb-8 border-b border-border/60 mb-10">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(publishedAt)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {readingMinutes} min read
          </span>
        </div>

        {/* Body */}
        <div className="prose prose-sm dark:prose-invert max-w-none
          prose-headings:font-bold prose-headings:tracking-tight
          prose-h2:text-xl prose-h2:mt-12 prose-h2:mb-4
          prose-h3:text-base prose-h3:mt-8 prose-h3:mb-3
          prose-p:leading-relaxed prose-p:text-[0.95rem]
          prose-li:text-[0.95rem] prose-li:my-1
          prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
          prose-pre:bg-muted prose-pre:border prose-pre:border-border/60 prose-pre:rounded-xl prose-pre:text-xs
          prose-blockquote:border-l-primary/40 prose-blockquote:text-muted-foreground
          prose-a:text-primary prose-a:no-underline hover:prose-a:underline
          prose-strong:text-foreground
        ">
          {children}
        </div>

        {/* CTA */}
        <div className="mt-16 rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Try it free</p>
          <h3 className="text-xl font-bold mb-3">OpenSearch Doctor detects all of this automatically</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            A lightweight agent runs on your server, checks 50+ things, and tells you exactly what&apos;s wrong and how to fix it. Free for 1 cluster, no credit card.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Get started free →
          </Link>
        </div>

        {/* Back link */}
        <div className="mt-10 pt-6 border-t border-border/60">
          <Link href="/blog" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to all articles
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 py-8 mt-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-muted-foreground">© {new Date().getFullYear()} OpenSearch Doctor</span>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/docs" className="hover:text-foreground transition-colors">Docs</Link>
            <Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
