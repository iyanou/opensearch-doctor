import Link from "next/link";
import Image from "next/image";
import { FileSearch } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-background">
      <div className="flex items-center gap-2.5 mb-10">
        <Image src="/favicon.svg" alt="OpenSearch Doctor" width={28} height={28} />
        <span className="font-bold text-sm tracking-tight">OpenSearch Doctor</span>
      </div>

      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-5 border border-border/60">
        <FileSearch className="w-7 h-7 text-muted-foreground" />
      </div>

      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">
        404
      </p>
      <h1 className="text-2xl font-bold mb-2 text-foreground">Page not found</h1>
      <p className="text-sm text-muted-foreground mb-8 max-w-xs leading-relaxed">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      <Link
        href="/dashboard"
        className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
