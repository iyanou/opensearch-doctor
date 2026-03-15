/**
 * Validates that a URL is safe to fetch (no SSRF risk).
 * Blocks localhost, private IP ranges, and cloud metadata endpoints.
 */

const BLOCKED_HOSTNAMES = [
  "localhost",
  "metadata.google.internal",
];

// Matches private/loopback/link-local ranges
const PRIVATE_IP_RE =
  /^(127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|::1$|fc00:|fe80:)/;

export function validateWebhookUrl(rawUrl: string): { ok: true; url: URL } | { ok: false; error: string } {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { ok: false, error: "Invalid URL" };
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { ok: false, error: "Only http/https URLs are allowed" };
  }

  const hostname = url.hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.includes(hostname)) {
    return { ok: false, error: "URL hostname is not allowed" };
  }

  if (PRIVATE_IP_RE.test(hostname)) {
    return { ok: false, error: "URL resolves to a private or reserved address" };
  }

  return { ok: true, url };
}
