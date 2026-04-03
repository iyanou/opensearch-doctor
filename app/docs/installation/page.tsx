import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { InstallationTabs } from "@/components/docs/installation-tabs";
import Link from "next/link";

export const metadata = {
  title: "Installation — OpenSearch Doctor Docs",
  description: "Install the OpenSearch Doctor agent on Linux, macOS, or Windows in minutes.",
};

export default async function InstallationPage() {
  // Fetch session and first API key if logged in — used to pre-fill key in the docs
  const session = await auth();
  let userApiKey: string | null = null;

  if (session?.user?.id) {
    const key = await prisma.agentKey.findFirst({
      where: { userId: session.user.id, revokedAt: null },
      select: { keyPrefix: true },
      orderBy: { createdAt: "asc" },
    });
    userApiKey = key?.keyPrefix ? `${key.keyPrefix}...` : null;
  }

  return (
    <div>
      <h1>Installation</h1>
      <p className="lead text-muted-foreground">
        The agent is a single binary — no runtime, no Docker, no dependencies.
        Download it, run <code>--init</code>, and your cluster appears in the dashboard within seconds.
      </p>

      <h2>Requirements</h2>
      <ul>
        <li>Linux, macOS, or Windows (x86_64 or ARM64)</li>
        <li>Network access from the agent host to your OpenSearch cluster</li>
        <li>Network access from the agent host to <code>opensearchdoctor.com</code> on port 443</li>
        <li>An OpenSearch user with read-only access — see <Link href="/docs/faq#permissions">minimum permissions</Link></li>
        <li>
          An agent key from your dashboard —{" "}
          {session ? (
            <Link href="/settings?tab=keys">Settings → Agent Keys</Link>
          ) : (
            <>
              <Link href="/login">log in</Link> then go to Settings → Agent Keys
            </>
          )}
        </li>
      </ul>

      <InstallationTabs
        userApiKey={userApiKey}
        isLoggedIn={!!session}
      />

      <div className="not-prose mt-8 flex gap-4">
        <Link href="/docs/configuration" className="text-sm text-primary hover:underline font-medium">
          Next: Configuration reference →
        </Link>
      </div>
    </div>
  );
}
