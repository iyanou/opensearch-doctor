import Link from "next/link";
import { Activity, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Terms of Service — OpenSearch Doctor",
  description: "Terms and conditions for using OpenSearch Doctor.",
};

const LAST_UPDATED = "April 2026";

export default function TermsPage() {
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
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="space-y-8">

          <p className="text-muted-foreground leading-relaxed">
            These Terms of Service (&quot;Terms&quot;) govern your access to and use of
            OpenSearch Doctor (the &quot;Service&quot;). By creating an account or using
            the Service you agree to be bound by these Terms.
          </p>

          <Section title="1. Eligibility">
            <p className="text-muted-foreground leading-relaxed">
              You must be at least 16 years old to use the Service. By using it you
              represent that you meet this requirement and that all information you
              provide is accurate.
            </p>
          </Section>

          <Section title="2. Your Account">
            <p className="text-muted-foreground leading-relaxed">
              You are responsible for maintaining the confidentiality of your account
              credentials and for all activity that occurs under your account. Notify us
              immediately at{" "}
              <a href="mailto:support@opensearchdoctor.com" className="text-primary hover:underline">
                support@opensearchdoctor.com
              </a>{" "}
              if you suspect any unauthorised access.
            </p>
          </Section>

          <Section title="3. Plans and Billing">
            <Subsection title="Free Plan">
              The Free plan is available at no cost with no time limit. It includes 1
              cluster and 7-day data retention. No credit card is required.
            </Subsection>
            <Subsection title="Paid Plans (Starter, Pro, Scale)">
              Paid plans are billed monthly or annually at the published price. All fees
              are charged in advance. Payment is processed securely by Paddle. Prices may
              change with 30 days&apos; prior notice.
            </Subsection>
            <Subsection title="Cancellation">
              You may cancel your subscription at any time from the billing settings page.
              Cancellation takes effect at the end of the current billing period. You
              retain access to paid features until the period ends.
            </Subsection>
          </Section>

          <Section title="4. Refund Policy">
            <div id="refund" className="space-y-3">
              <p className="text-muted-foreground leading-relaxed">
                We want you to be satisfied with OpenSearch Doctor. Our refund policy is as follows:
              </p>
              <ul className="space-y-2 text-muted-foreground list-disc pl-5">
                <li>
                  <strong className="text-foreground">30-day money-back guarantee:</strong> If you are
                  not satisfied with your paid subscription, contact us within 30 days of
                  your first payment and we will issue a full refund — no questions asked.
                </li>
                <li>
                  <strong className="text-foreground">Service outages:</strong> If you experience a
                  significant outage attributable to our infrastructure, contact us within
                  30 days of the incident for a pro-rated refund consideration.
                </li>
                <li>
                  <strong className="text-foreground">Renewal charges:</strong> If you forget to
                  cancel before a renewal and contact us within 7 days of the charge, we
                  will refund the renewal in full.
                </li>
                <li>
                  <strong className="text-foreground">No partial-month refunds:</strong> Outside of
                  the above cases, we do not provide pro-rated refunds for partial billing
                  periods.
                </li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                To request a refund, contact us at{" "}
                <a href="mailto:support@opensearchdoctor.com" className="text-primary hover:underline">
                  support@opensearchdoctor.com
                </a>{" "}
                with your account email and reason. We process all refund requests within
                5 business days.
              </p>
            </div>
          </Section>

          <Section title="5. Acceptable Use">
            <p className="text-muted-foreground leading-relaxed">You agree not to:</p>
            <ul className="space-y-2 text-muted-foreground list-disc pl-5 mt-2">
              <li>Use the Service to monitor clusters you do not own or have explicit permission to monitor</li>
              <li>Attempt to gain unauthorised access to our systems or another user&apos;s account</li>
              <li>Reverse-engineer, decompile, or scrape the Service</li>
              <li>Use the Service in any way that violates applicable law</li>
              <li>Circumvent any rate limits, usage quotas, or access controls</li>
            </ul>
          </Section>

          <Section title="6. Intellectual Property">
            <p className="text-muted-foreground leading-relaxed">
              The Service, including all software, design, trademarks, and content, is
              owned by us and protected by intellectual property laws. You are granted a
              limited, non-exclusive, non-transferable licence to use the Service solely
              for your internal operational purposes.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Diagnostic data you submit remains yours. You grant us a limited licence
              to process it for the sole purpose of providing the Service.
            </p>
          </Section>

          <Section title="7. Data and Security">
            <p className="text-muted-foreground leading-relaxed">
              We implement reasonable security measures as described in our Privacy
              Policy. You are responsible for the security of your own infrastructure,
              including the server on which the agent runs and the OpenSearch credentials
              you configure.
            </p>
          </Section>

          <Section title="8. Availability and SLA">
            <p className="text-muted-foreground leading-relaxed">
              We aim to keep the Service available but do not guarantee uninterrupted
              access. We may perform scheduled maintenance with advance notice. We are
              not liable for downtime caused by third-party infrastructure, force
              majeure, or events outside our reasonable control.
            </p>
          </Section>

          <Section title="9. Disclaimer of Warranties">
            <p className="text-muted-foreground leading-relaxed">
              THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS
              OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY,
              FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. WE DO NOT WARRANT
              THAT DIAGNOSTIC RESULTS ARE ERROR-FREE OR THAT THE SERVICE WILL MEET YOUR
              SPECIFIC REQUIREMENTS.
            </p>
          </Section>

          <Section title="10. Limitation of Liability">
            <p className="text-muted-foreground leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, OUR AGGREGATE LIABILITY FOR ANY
              CLAIMS ARISING FROM OR RELATED TO THE SERVICE SHALL NOT EXCEED THE AMOUNT
              YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM. IN NO EVENT ARE WE
              LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES,
              INCLUDING LOSS OF PROFITS OR DATA.
            </p>
          </Section>

          <Section title="11. Termination">
            <p className="text-muted-foreground leading-relaxed">
              You may delete your account at any time from the settings page. We may
              suspend or terminate your account for material breach of these Terms, with
              or without prior notice. Upon termination, your access ceases immediately.
              Your data will be purged within 30 days as described in our Privacy Policy.
            </p>
          </Section>

          <Section title="12. Changes to These Terms">
            <p className="text-muted-foreground leading-relaxed">
              We may update these Terms from time to time. We will notify you of material
              changes by email at least 14 days before they take effect. Continued use of
              the Service after that date constitutes acceptance of the updated Terms.
            </p>
          </Section>

          <Section title="13. Governing Law">
            <p className="text-muted-foreground leading-relaxed">
              These Terms are governed by applicable law. Any disputes shall be resolved
              by the competent courts in the jurisdiction where we are established, unless
              mandatory consumer protection law in your country provides otherwise.
            </p>
          </Section>

          <Section title="14. Contact">
            <p className="text-muted-foreground leading-relaxed">
              Questions about these Terms:{" "}
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
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="text-foreground font-medium">Terms</Link>
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
