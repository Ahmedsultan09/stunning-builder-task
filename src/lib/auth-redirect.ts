export function getSafeRedirectPath(value: unknown, fallback = "/") {
  if (typeof value !== "string" || !value.startsWith("/")) return fallback;

  try {
    const base = new URL("https://buildbrief.invalid");
    const destination = new URL(value, base);

    if (destination.origin !== base.origin) return fallback;
  } catch {
    return fallback;
  }

  return value;
}
