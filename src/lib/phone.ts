/**
 * Real phone calling uses the platform dialer via a tel: link.
 * We never record calls. This only opens the phone app when the
 * device supports it (typical on a real phone).
 */

export function hasUsablePhoneNumber(phoneNumber: string): boolean {
  const digits = phoneNumber.replace(/\D/g, "");
  return digits.length >= 8;
}

export function toTelHref(phoneNumber: string): string {
  const trimmed = phoneNumber.trim();
  const normalized = trimmed.startsWith("+")
    ? `+${trimmed.slice(1).replace(/\D/g, "")}`
    : trimmed.replace(/\D/g, "");
  return `tel:${normalized}`;
}

/** Opens the device phone app. Returns false if the number is missing. */
export function startPhoneCall(phoneNumber: string): boolean {
  if (!hasUsablePhoneNumber(phoneNumber)) return false;
  window.location.href = toTelHref(phoneNumber);
  return true;
}
