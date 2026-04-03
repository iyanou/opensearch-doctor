import Link from "next/link";
import { Activity, ArrowLeft, Mail, MessageCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContactForm } from "./contact-form";

export const metadata = {
  title: "Contact — OpenSearch Doctor",
  description: "Get in touch with the OpenSearch Doctor team. We respond within one business day.",
};

export default function ContactPage() {
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
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to home
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Get in touch</p>
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">Contact us</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            We&apos;re a small, focused team. We read every message and respond within one business day.
          </p>
        </div>

        {/* Contact channel cards */}
        <div className="grid sm:grid-cols-3 gap-5 mb-14">
          <ContactCard
            icon={Mail}
            title="General support"
            description="Questions about the product, your account, or getting started."
            href="mailto:support@opensearchdoctor.com"
            label="support@opensearchdoctor.com"
            color="text-blue-600 bg-blue-100 dark:bg-blue-900/20"
          />
          <ContactCard
            icon={FileText}
            title="Billing & subscriptions"
            description="Invoice requests, payment issues, plan changes, and cancellations."
            href="mailto:support@opensearchdoctor.com"
            label="support@opensearchdoctor.com"
            color="text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20"
          />
          <ContactCard
            icon={MessageCircle}
            title="Privacy & legal"
            description="Data requests, privacy questions, and legal enquiries."
            href="mailto:support@opensearchdoctor.com"
            label="support@opensearchdoctor.com"
            color="text-violet-600 bg-violet-100 dark:bg-violet-900/20"
          />
        </div>

        {/* Contact form */}
        <div className="rounded-2xl border border-border/60 bg-card p-8 mb-10">
          <h2 className="font-bold text-lg mb-1">Send us a message</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Prefer a form? Fill this in and we&apos;ll reply to your email.
          </p>
          <ContactForm />
        </div>

        {/* Quick FAQ */}
        <div className="rounded-2xl border border-border/60 bg-card p-8 space-y-6">
          <h2 className="font-bold text-lg">Before you write</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Many common questions are already answered on our{" "}
            <Link href="/pricing#faq" className="text-primary hover:underline">Pricing & FAQ page</Link>{" "}
            and in the{" "}
            <Link href="/docs" className="text-primary hover:underline">documentation</Link>.
          </p>
          <div className="space-y-4">
            {[
              {
                q: "I installed the agent but no data is showing.",
                a: "Check that the agent key is correct and that the server can reach opensearchdoctor.com on port 443. Review the agent logs (agent.log) for connection errors.",
              },
              {
                q: "How do I cancel my subscription?",
                a: "Go to Settings → Billing → Manage subscription. Cancellation takes effect at the end of the billing period.",
              },
              {
                q: "Can I request a refund?",
                a: "Email support@opensearchdoctor.com within 30 days of the charge with the details. We review refund requests case by case.",
              },
              {
                q: "I need to delete my account and all my data.",
                a: "Go to Settings → Account → Delete account. Data is purged within 30 days. Alternatively email support and we will handle it manually.",
              },
            ].map(({ q, a }) => (
              <div key={q} className="border-l-2 border-primary/30 pl-4 space-y-1">
                <p className="font-semibold text-sm">{q}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-10">
          We aim to respond within one business day (Mon–Fri, UTC+1).
        </p>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 py-8 mt-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold">OpenSearch Doctor</span>
          </Link>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <Link href="/#features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/docs" className="hover:text-foreground transition-colors">Docs</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/contact" className="text-foreground font-medium">Contact</Link>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} OpenSearch Doctor</p>
        </div>
      </footer>
    </div>
  );
}

function ContactCard({
  icon: Icon, title, description, href, label, color,
}: {
  icon: React.ElementType; title: string; description: string;
  href: string; label: string; color: string;
}) {
  return (
    <a
      href={href}
      className="group block rounded-2xl border border-border/60 bg-card p-6 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 space-y-3"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="font-semibold text-sm mb-1">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
      <p className="text-xs text-primary font-medium group-hover:underline break-all">{label}</p>
    </a>
  );
}
