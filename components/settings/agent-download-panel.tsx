import { Button } from "@/components/ui/button";
import { Download, Terminal } from "lucide-react";

const PLATFORMS = [
  { label: "Linux (x64)",          file: "opensearch-doctor-agent-linux-amd64.tar.gz" },
  { label: "Linux (ARM64)",         file: "opensearch-doctor-agent-linux-arm64.tar.gz" },
  { label: "macOS (Intel)",         file: "opensearch-doctor-agent-darwin-amd64.tar.gz" },
  { label: "macOS (Apple Silicon)", file: "opensearch-doctor-agent-darwin-arm64.tar.gz" },
  { label: "Windows (x64)",         file: "opensearch-doctor-agent-windows-amd64.exe-pkg.zip" },
];

const RELEASE_BASE = "https://github.com/opensearch-doctor/agent/releases/latest/download";

export function AgentDownloadPanel() {
  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border/60 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
          <Download className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-sm font-bold">Download Agent</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Install on the server where your OpenSearch cluster is accessible
          </p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PLATFORMS.map((p) => (
            <a
              key={p.file}
              href={`${RELEASE_BASE}/${p.file}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm" className="w-full justify-start gap-2 font-medium">
                <Download className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                {p.label}
              </Button>
            </a>
          ))}
        </div>

        <div className="rounded-xl bg-muted/60 border border-border/60 overflow-hidden">
          <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border/40">
            <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground">Quick start (Linux/macOS)</span>
          </div>
          <pre className="text-xs font-mono p-4 whitespace-pre-wrap leading-relaxed text-foreground">
{`# 1. Download and extract
tar -xzf opensearch-doctor-agent-linux-amd64.tar.gz

# 2. Edit config.yaml with your cluster + API key
#    (get your API key from Agent Keys section below)

# 3. Test connection (no data sent to SaaS)
./opensearch-doctor-agent --config config.yaml --test

# 4. Run
./opensearch-doctor-agent --config config.yaml`}
          </pre>
        </div>
      </div>
    </div>
  );
}
