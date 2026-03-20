import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/page-header";
import { AgentKeysPanel } from "@/components/settings/agent-keys-panel";
import { AgentDownloadPanel } from "@/components/settings/agent-download-panel";
import { BillingPanel } from "@/components/settings/billing-panel";
import { NotificationChannelsPanel } from "@/components/settings/notification-channels-panel";
import { ApiKeysPanel } from "@/components/settings/api-keys-panel";
import { getPlanInfo } from "@/lib/plan";
import { KeyRound, CreditCard, Bell, Code2, Rocket } from "lucide-react";

const TABS = [
  { id: "install",       label: "Quick Start",    icon: Rocket },
  { id: "keys",          label: "Agent Keys",     icon: KeyRound },
  { id: "api-keys",      label: "API Keys",        icon: Code2 },
  { id: "billing",       label: "Billing & Plan",  icon: CreditCard },
  { id: "notifications", label: "Notifications",   icon: Bell },
];

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; success?: string }>;
}) {
  const session = await auth();
  const userId = session!.user!.id!;
  const { tab = "install", success } = await searchParams;

  const [keys, user, channels, apiKeys] = await Promise.all([
    prisma.agentKey.findMany({
      where: { userId, revokedAt: null },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, keyPrefix: true, lastUsedAt: true, createdAt: true, clusterId: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        plan: true,
        trialEndsAt: true,
        subscription: {
          select: { currentPeriodEnd: true, cancelAtPeriodEnd: true, status: true },
        },
      },
    }),
    prisma.notificationChannel.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, type: true, name: true, enabled: true, config: true },
    }),
    prisma.apiKey.findMany({
      where: { userId, revokedAt: null },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, keyPrefix: true, lastUsedAt: true, createdAt: true },
    }),
  ]);

  if (!user) return null;
  const planInfo = getPlanInfo(user);

  return (
    <div className="min-h-full">
      <PageHeader
        title="Settings"
        description="Manage your agent keys, API access, notifications, and billing"
      />

      <div className="p-4 md:p-6 max-w-3xl">
        {/* Tabs */}
        <div className="flex gap-0.5 bg-muted/50 rounded-xl p-1 mb-8 border border-border/40 overflow-x-auto scrollbar-none">
          {TABS.map(({ id, label, icon: Icon }) => (
            <a
              key={id}
              href={`/settings?tab=${id}`}
              className={`flex-none sm:flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer select-none whitespace-nowrap ${
                tab === id
                  ? "bg-background shadow-sm text-foreground border border-border/40"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/60"
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{label}</span>
            </a>
          ))}
        </div>

        {/* Panel content */}
        <div>
          {tab === "install" && <AgentDownloadPanel />}
          {tab === "keys" && <AgentKeysPanel initialKeys={keys} />}
          {tab === "api-keys" && <ApiKeysPanel initialKeys={apiKeys} />}
          {tab === "billing" && (
            <BillingPanel
              plan={user.plan}
              trialDaysLeft={planInfo.trialDaysLeft}
              isTrialActive={planInfo.isTrialActive}
              isTrialExpired={planInfo.isTrialExpired}
              hasSubscription={!!user.subscription}
              subscriptionStatus={user.subscription?.status ?? null}
              currentPeriodEnd={user.subscription?.currentPeriodEnd ?? null}
              cancelAtPeriodEnd={user.subscription?.cancelAtPeriodEnd ?? false}
              successMessage={success === "1"}
            />
          )}
          {tab === "notifications" && (
            <NotificationChannelsPanel
              initialChannels={channels.map((c) => ({
                ...c,
                config: c.config as Record<string, string>,
              }))}
            />
          )}
        </div>
      </div>
    </div>
  );
}
