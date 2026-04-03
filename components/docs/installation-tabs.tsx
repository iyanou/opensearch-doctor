"use client";

import { useState } from "react";
import Link from "next/link";

const BASE = "https://github.com/opensearch-doctor/agent/releases/latest/download";

interface Props {
  userApiKey: string | null;
  isLoggedIn: boolean;
}

type Tab = "linux" | "macos" | "windows";

function CodeBlock({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(children).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="not-prose relative group">
      <pre className="bg-muted border border-border/60 rounded-xl px-4 py-3.5 text-xs font-mono overflow-x-auto leading-relaxed">
        <code>{children}</code>
      </pre>
      <button
        onClick={copy}
        className="absolute top-2.5 right-2.5 text-[10px] font-semibold px-2 py-1 rounded bg-background border border-border/60 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}

function HonestBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="not-prose flex gap-2.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl px-4 py-3 text-sm text-amber-800 dark:text-amber-300 my-4">
      <span className="shrink-0 mt-0.5">ℹ️</span>
      <span>{children}</span>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 mt-6">
      <div className="shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
        {n}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm mb-2">{title}</p>
        {children}
      </div>
    </div>
  );
}

export function InstallationTabs({ userApiKey, isLoggedIn }: Props) {
  const [tab, setTab] = useState<Tab>("linux");

  const keyDisplay = userApiKey ?? "osd_your_key_here";

  const tabs: { id: Tab; label: string }[] = [
    { id: "linux",   label: "🐧 Linux" },
    { id: "macos",   label: "🍎 macOS" },
    { id: "windows", label: "🪟 Windows" },
  ];

  return (
    <div>
      {/* Tab switcher */}
      <div className="not-prose flex gap-1 p-1 bg-muted rounded-xl mb-6 border border-border/40">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 text-sm font-medium px-3 py-2 rounded-lg transition-all ${
              tab === t.id
                ? "bg-background text-foreground shadow-sm border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── LINUX ── */}
      {tab === "linux" && (
        <div>
          <h2>Linux Installation</h2>

          {/* One-liner */}
          <div className="not-prose bg-primary/5 border border-primary/20 rounded-xl px-5 py-4 mb-6">
            <p className="text-sm font-semibold text-primary mb-1">⚡ One-liner install (recommended)</p>
            <p className="text-xs text-muted-foreground mb-3">
              Downloads the binary, verifies the checksum, installs it to{" "}
              <code className="bg-muted px-1 py-0.5 rounded text-xs">/usr/local/bin</code>, and launches the setup wizard.
            </p>
            <CodeBlock>{`curl -sSL https://opensearchdoctor.com/install.sh | sudo bash`}</CodeBlock>
            {!isLoggedIn && (
              <p className="text-xs text-muted-foreground mt-2">
                <Link href="/login" className="text-primary hover:underline">Log in</Link> to see your API key pre-filled in the wizard prompt.
              </p>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            The installer will launch the interactive setup wizard (<code>--init</code>) which guides you through:
          </p>
          <ol className="text-sm mt-2 space-y-1 list-decimal list-inside text-muted-foreground">
            <li>Your OpenSearch cluster URL</li>
            <li>A display name for the cluster</li>
            <li>OpenSearch credentials (username/password or API key)</li>
            <li>TLS options (skip / system CA / custom CA file)</li>
            <li>Your OpenSearch Doctor API key{userApiKey ? ` — yours is: ` : ""}{userApiKey && <code className="text-foreground bg-muted px-1 py-0.5 rounded text-xs">{userApiKey}</code>}</li>
          </ol>

          <p className="mt-4 text-sm text-muted-foreground">
            After config, the wizard installs the agent as a <strong>systemd service</strong> — it starts automatically on every boot.
          </p>

          <h3>Manual installation</h3>
          <Step n={1} title="Download the binary">
            <CodeBlock>{`# x86_64
curl -Lo agent ${BASE}/agent-linux-amd64 && chmod +x agent

# ARM64
curl -Lo agent ${BASE}/agent-linux-arm64 && chmod +x agent`}</CodeBlock>
          </Step>

          <Step n={2} title="Run the setup wizard">
            <CodeBlock>./agent --init</CodeBlock>
          </Step>

          <Step n={3} title="Manual systemd setup (if you skipped it in --init)">
            <CodeBlock>{`sudo tee /etc/systemd/system/opensearch-doctor-agent.service > /dev/null <<EOF
[Unit]
Description=OpenSearch Doctor Agent
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/agent --config /etc/opensearch-doctor/config.yaml
Restart=always
RestartSec=30
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now opensearch-doctor-agent`}</CodeBlock>

            <p className="text-xs text-muted-foreground mt-2">Useful commands:</p>
            <CodeBlock>{`sudo systemctl status opensearch-doctor-agent
sudo journalctl -u opensearch-doctor-agent -f
sudo systemctl restart opensearch-doctor-agent`}</CodeBlock>
          </Step>
        </div>
      )}

      {/* ── MACOS ── */}
      {tab === "macos" && (
        <div>
          <h2>macOS Installation</h2>

          <HonestBanner>
            The agent works great on macOS for monitoring local or remote clusters.
            For always-on production monitoring, we recommend deploying it on your <strong>Linux server</strong> instead — the agent runs there as a systemd service that survives reboots automatically.
          </HonestBanner>

          <Step n={1} title="Download the binary">
            <CodeBlock>{`# Apple Silicon (M1/M2/M3)
curl -Lo agent ${BASE}/agent-darwin-arm64 && chmod +x agent

# Intel Mac
curl -Lo agent ${BASE}/agent-darwin-amd64 && chmod +x agent`}</CodeBlock>
          </Step>

          <Step n={2} title="Run the setup wizard">
            <CodeBlock>./agent --init</CodeBlock>
            <p className="text-xs text-muted-foreground mt-2">
              The same 5-step wizard as Linux — endpoint, name, credentials, TLS, API key. Tests both connections before writing anything.
            </p>
            {userApiKey && (
              <p className="text-xs text-muted-foreground mt-1">
                Your API key: <code className="bg-muted px-1 py-0.5 rounded text-xs">{userApiKey}</code>
              </p>
            )}
          </Step>

          <Step n={3} title="The agent starts in the background">
            <p className="text-xs text-muted-foreground mb-2">
              After <code>--init</code>, the agent starts automatically. To verify it&apos;s running:
            </p>
            <CodeBlock>{`pgrep -a agent`}</CodeBlock>

            <HonestBanner>
              <strong>Note:</strong> The agent will <strong>not</strong> restart automatically after a reboot.
              To start it again: <code className="font-mono">./agent --config config.yaml</code>
            </HonestBanner>
          </Step>

          <h3>Optional: persist across reboots with launchd</h3>
          <p className="text-sm text-muted-foreground">
            For persistent background monitoring on macOS (advanced):
          </p>
          <CodeBlock>{`sudo tee /Library/LaunchDaemons/com.opensearch-doctor.agent.plist > /dev/null <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.opensearch-doctor.agent</string>
  <key>ProgramArguments</key>
  <array>
    <string>/path/to/agent</string>
    <string>--config</string>
    <string>/path/to/config.yaml</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
</dict>
</plist>
EOF

sudo launchctl load /Library/LaunchDaemons/com.opensearch-doctor.agent.plist`}</CodeBlock>
        </div>
      )}

      {/* ── WINDOWS ── */}
      {tab === "windows" && (
        <div>
          <h2>Windows Installation</h2>

          <HonestBanner>
            The agent runs on Windows and includes the same interactive setup wizard as Linux and macOS.
            It <strong>will not restart automatically after a reboot</strong> without additional configuration (Task Scheduler).
            For production monitoring, we recommend running the agent on your <strong>Linux server</strong>.
          </HonestBanner>

          <Step n={1} title="Download the binary (PowerShell)">
            <CodeBlock>{`Invoke-WebRequest -Uri "${BASE}/agent-windows-amd64.exe" -OutFile agent.exe`}</CodeBlock>
          </Step>

          <Step n={2} title="Run the setup wizard">
            <CodeBlock>{`.\\agent.exe --init`}</CodeBlock>
            <p className="text-xs text-muted-foreground mt-2">
              The wizard walks you through 5 steps interactively:
            </p>
            <ol className="text-xs text-muted-foreground mt-1 space-y-0.5 list-decimal list-inside">
              <li>Your OpenSearch cluster URL (e.g. <code>https://localhost:9200</code>)</li>
              <li>A display name for the cluster</li>
              <li>Auth — choose username/password or API key</li>
              <li>TLS — skip verify / system CA / custom CA file path</li>
              <li>Your OpenSearch Doctor API key (<code>osd_...</code>)</li>
            </ol>
            {userApiKey && (
              <p className="text-xs text-muted-foreground mt-2">
                Your API key: <code className="bg-muted px-1 py-0.5 rounded text-xs">{userApiKey}</code>
              </p>
            )}
          </Step>

          <Step n={3} title="The agent starts in the background">
            <p className="text-xs text-muted-foreground mb-2">Verify it&apos;s running:</p>
            <CodeBlock>{`tasklist | findstr agent`}</CodeBlock>
            <p className="text-xs text-muted-foreground mt-2">To stop it:</p>
            <CodeBlock>{`taskkill /IM agent.exe /F`}</CodeBlock>

            <HonestBanner>
              <strong>Note:</strong> The agent will <strong>not</strong> restart after a reboot.
              To start it again: <code className="font-mono">.\agent.exe --config config.yaml</code>
            </HonestBanner>
          </Step>

          <h3>Optional: persist across reboots with Task Scheduler</h3>
          <p className="text-sm text-muted-foreground">For automatic startup on Windows (run PowerShell as Administrator):</p>
          <CodeBlock>{`$action  = New-ScheduledTaskAction -Execute "C:\\path\\to\\agent.exe" \`
           -Argument '--config "C:\\path\\to\\config.yaml"'
$trigger = New-ScheduledTaskTrigger -AtStartup
Register-ScheduledTask -TaskName "OpenSearch Doctor Agent" \`
  -Action $action -Trigger $trigger -RunLevel Highest
Start-ScheduledTask -TaskName "OpenSearch Doctor Agent"`}</CodeBlock>
        </div>
      )}

      {/* ── Shared bottom section ── */}
      <div className="mt-10 border-t border-border/60 pt-8">
        <h2>Verify it&apos;s working</h2>
        <p>
          After starting the agent, go to your{" "}
          <Link href="/dashboard">dashboard</Link>. The cluster appears within seconds
          (heartbeat interval is 5 minutes by default). The first diagnostic run starts immediately.
        </p>
        <p>To test locally without sending data to the platform:</p>
        <CodeBlock>./agent --config config.yaml --test</CodeBlock>
        <p className="text-sm text-muted-foreground">
          This prints a summary of what was collected and exits without sending anything.
        </p>

        <h2>CLI flags reference</h2>
        <div className="not-prose overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border/60">
                <th className="text-left py-2 pr-6 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Flag</th>
                <th className="text-left py-2 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {[
                ["--init", "Run the interactive setup wizard"],
                ["--config <path>", "Path to config file (default: config.yaml)"],
                ["--once", "Run diagnostics once and exit — good for cron"],
                ["--test", "Collect and print locally; do NOT send to platform"],
              ].map(([flag, desc]) => (
                <tr key={flag}>
                  <td className="py-2.5 pr-6 font-mono text-xs text-foreground align-top whitespace-nowrap">{flag}</td>
                  <td className="py-2.5 text-muted-foreground text-xs">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
