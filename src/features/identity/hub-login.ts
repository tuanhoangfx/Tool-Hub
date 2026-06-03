/** Internal auth email domain for User ID sign-in (Supabase requires an email). */
export const HUB_ID_EMAIL_DOMAIN = "@id.hub.x1z10.local";

export function isHubSyntheticEmail(email: string | null | undefined): boolean {
  const v = String(email ?? "").trim().toLowerCase();
  return v.endsWith(HUB_ID_EMAIL_DOMAIN);
}

export function loginIdFromSyntheticEmail(email: string | null | undefined): string | null {
  if (!email || !isHubSyntheticEmail(email)) return null;
  const local = email.split("@")[0]?.trim().toLowerCase();
  return local || null;
}

export function looksLikeEmail(input: string): boolean {
  return input.includes("@");
}

/** Workspace user ID: 3–32 chars, lowercase letter/digit/._- */
export function normalizeLoginId(raw: string): string | null {
  const id = raw.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(id)) return null;
  return id;
}

export function hubAuthEmailFromLogin(input: string): string {
  const trimmed = input.trim().toLowerCase();
  if (looksLikeEmail(trimmed)) return trimmed;
  const loginId = normalizeLoginId(trimmed);
  if (!loginId) throw new Error("Invalid user ID (use 3–32 letters, numbers, . _ -)");
  return `${loginId}${HUB_ID_EMAIL_DOMAIN}`;
}

export type ResolvedLogin = {
  authEmail: string;
  loginId: string | null;
  isEmailLogin: boolean;
};

export function resolveHubLogin(input: string): ResolvedLogin {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) throw new Error("Enter your user ID or email");
  if (looksLikeEmail(trimmed)) {
    return { authEmail: trimmed, loginId: null, isEmailLogin: true };
  }
  const loginId = normalizeLoginId(trimmed);
  if (!loginId) throw new Error("Invalid user ID (use 3–32 letters, numbers, . _ -)");
  return {
    authEmail: `${loginId}${HUB_ID_EMAIL_DOMAIN}`,
    loginId,
    isEmailLogin: false,
  };
}

/** Email shown in UI (contact / linked), not the internal auth address. */
export function hubDisplayEmail(opts: {
  authEmail?: string | null;
  contactEmail?: string | null;
  profileEmail?: string | null;
}): string {
  const contact = (opts.contactEmail ?? opts.profileEmail ?? "").trim();
  if (contact && !isHubSyntheticEmail(contact)) return contact;
  const auth = (opts.authEmail ?? "").trim();
  if (auth && !isHubSyntheticEmail(auth)) return auth;
  return "";
}

export function hubDisplayLoginId(opts: {
  loginId?: string | null;
  authEmail?: string | null;
}): string {
  const explicit = (opts.loginId ?? "").trim();
  if (explicit) return explicit;
  return loginIdFromSyntheticEmail(opts.authEmail) ?? "";
}

export function canUseEmailPasswordRecovery(email: string | null | undefined): boolean {
  const v = (email ?? "").trim();
  return Boolean(v) && !isHubSyntheticEmail(v) && looksLikeEmail(v);
}
