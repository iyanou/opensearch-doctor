import Link from "next/link";
import { Activity, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Privacy Policy — OpenSearch Doctor",
  description: "How OpenSearch Doctor collects, uses, and protects your data.",
};

const LAST_UPDATED = "June 2025";

export default function PrivacyPage() {
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
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Legal</p>
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="prose prose-sm max-w-none text-foreground space-y-8">

          <section>
            <p className="text-muted-foreground leading-relaxed">
              OpenSearch Doctor (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates the OpenSearch Doctor
              platform (the &quot;Service&quot;). This Privacy Policy explains how we collect,
              use, disclose, and safeguard your information when you use our Service.
              By using the Service you agree to this policy.
            </p>
          </section>

          <Section title="1. Information We Collect">
            <Subsection title="Account information">
              When you sign up we collect your name, email address, and profile picture
              (from Google OAuth or direct registration). This is used to authenticate you
              and personalise your experience.
            </Subsection>
            <Subsection title="Billing information">
              Payment is processed by PayPal. We never store your card number or bank
              details. We retain only PayPal subscription IDs and subscription status needed
              to manage your plan.
            </Subsection>
            <Subsection title="Diagnostic data">
              The OpenSearch Doctor agent runs on your server and collects diagnostic
              metrics — health scores, node stats, shard counts, index metadata, and
              similar operational data. <strong>Your OpenSearch credentials and raw data
              (documents, queries, business data) are never sent to our platform.</strong> Only
              aggregated diagnostic information is transmitted.
            </Subsection>
            <Subsection title="Usage data">
              We automatically collect standard server logs (IP address, browser type,
              pages visited, timestamps) to operate and improve the Service.
            </Subsection>
          </Section>

          <Section title="2. How We Use Your Information">
            <ul className="space-y-2 text-muted-foreground list-disc pl-5">
              <li>Provide, maintain, and improve the Service</li>
              <li>Process billing and manage your subscription via PayPal</li>
              <li>Send transactional emails (alerts, diagnostic reports, account notices) via Resend</li>
              <li>Respond to support requests</li>
              <li>Monitor uptime and diagnose technical problems</li>
              <li>Comply with legal obligations</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              We do not sell your personal data to third parties. We do not use your
              diagnostic data for advertising.
            </p>
          </Section>

          <Section title="3. Data Sharing">
            <p className="text-muted-foreground leading-relaxed">
              We share your information only with the following service providers, and
              only to the extent necessary to operate the Service:
            </p>
            <div className="mt-4 rounded-xl border border-border/60 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 border-b border-border/60">
                    <th className="text-left px-4 py-3 font-semibold">Provider</th>
                    <th className="text-left px-4 py-3 font-semibold">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-muted-foreground">
                  <tr><td className="px-4 py-3">PayPal</td><td className="px-4 py-3">Payment processing</td></tr>
                  <tr><td className="px-4 py-3">Resend</td><td className="px-4 py-3">Transactional email delivery</td></tr>
                  <tr><td className="px-4 py-3">Google OAuth</td><td className="px-4 py-3">Authentication (optional)</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We may disclose information when required by law or to protect the rights
              and safety of our users.
            </p>
          </Section>

          <Section title="4. Data Retention">
            <p className="text-muted-foreground leading-relaxed">
              Diagnostic data and metric snapshots are retained according to your plan
              (30 days on the Free Trial, 90 days on Pro). Account data is retained
              while your account is active. After account deletion, personal data is
              purged within 30 days, except where required by law or for fraud prevention.
            </p>
          </Section>

          <Section title="5. Security">
            <p className="text-muted-foreground leading-relaxed">
              We implement reasonable technical and organisational measures to protect
              your data: HTTPS-only transport, encrypted database connections, hashed API
              keys, and HTTP-only secure cookies. No method of transmission over the
              internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </Section>

          <Section title="6. Cookies">
            <p className="text-muted-foreground leading-relaxed">
              We use only strictly necessary cookies to maintain your authenticated
              session. We do not use advertising or tracking cookies. Session cookies
              expire after 30 days of inactivity.
            </p>
          </Section>

          <Section title="7. Your Rights">
            <p className="text-muted-foreground leading-relaxed">
              You may request access to, correction of, or deletion of your personal
              data at any time by emailing{" "}
              <a href="mailto:support@opensearchdoctor.com" className="text-primary hover:underline">
                support@opensearchdoctor.com
              </a>
              . You may also delete your account from the settings page, which will
              initiate purging of your data. If you are located in the European Economic
              Area you additionally have rights under the GDPR to data portability and
              to lodge a complaint with your local supervisory authority.
            </p>
          </Section>

          <Section title="8. Children">
            <p className="text-muted-foreground leading-relaxed">
              The Service is not directed to children under the age of 16. We do not
              knowingly collect personal data from children.
            </p>
          </Section>

          <Section title="9. Changes to This Policy">
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you
              of material changes by email or via a notice in the Service. The &quot;Last
              updated&quot; date at the top of this page will always reflect the current version.
            </p>
          </Section>

          <Section title="10. Contact">
            <p className="text-muted-foreground leading-relaxed">
              For privacy-related questions or requests:{" "}
              <a href="mailto:support@opensearchdoctor.com" className="text-primary hover:underline">
                support@opensearchdoctor.com
              </a>
            </p>
          </Section>

        </div>
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
            <Link href="/privacy" className="text-foreground font-medium">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} OpenSearch Doctor
          </p>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <h3 className="font-semibold text-sm">{title}</h3>
      <p className="text-muted-foreground leading-relaxed text-sm">{children}</p>
    </div>
  );
}
