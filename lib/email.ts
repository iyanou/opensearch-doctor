/**
 * Normalizes email addresses to a canonical form.
 * For Gmail (gmail.com / googlemail.com):
 *   - Strips dots from the local part (a.b.c == abc for Gmail)
 *   - Strips +alias suffix (user+tag == user for Gmail)
 *   - Maps googlemail.com → gmail.com
 * For all addresses: lowercased and trimmed.
 *
 * Used at signup and login to prevent trial abuse via email variations.
 */
export function normalizeEmail(email: string): string {
  const lower = email.toLowerCase().trim();
  const atIdx = lower.lastIndexOf("@");
  if (atIdx === -1) return lower;

  const local = lower.slice(0, atIdx);
  const domain = lower.slice(atIdx + 1);

  if (domain === "gmail.com" || domain === "googlemail.com") {
    const withoutAlias = local.split("+")[0];
    const withoutDots = withoutAlias.replace(/\./g, "");
    return `${withoutDots}@gmail.com`;
  }

  return lower;
}
