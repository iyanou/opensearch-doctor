"use client";

// global-error renders outside the root layout — no Tailwind, no ThemeProvider.
// Keep styles inline.
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, sans-serif", backgroundColor: "#f9fafb" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 24, textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: "#fee2e2", border: "1px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <path d="M12 9v4"/><path d="M12 17h.01"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: "#111827", margin: "0 0 8px" }}>
            Critical error
          </h1>
          <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 24, maxWidth: 320, lineHeight: 1.6 }}>
            A critical error crashed the application. Please refresh the page.
          </p>
          {error.digest && (
            <p style={{ fontSize: 11, fontFamily: "monospace", color: "#9ca3af", marginBottom: 20, background: "#f3f4f6", padding: "6px 12px", borderRadius: 6, border: "1px solid #e5e7eb" }}>
              ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{ padding: "10px 24px", borderRadius: 8, backgroundColor: "#4361EE", color: "white", border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
