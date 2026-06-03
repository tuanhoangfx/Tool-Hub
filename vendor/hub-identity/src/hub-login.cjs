"use strict";

const HUB_ID_EMAIL_DOMAIN = "@id.hub.x1z10.local";

function isHubSyntheticEmail(email) {
  const v = String(email ?? "").trim().toLowerCase();
  return v.endsWith(HUB_ID_EMAIL_DOMAIN);
}

function looksLikeEmail(input) {
  return String(input).includes("@");
}

function normalizeLoginId(raw) {
  const id = String(raw ?? "").trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(id)) return null;
  return id;
}

function resolveHubLogin(input) {
  const trimmed = String(input ?? "").trim().toLowerCase();
  if (!trimmed) return { error: "Missing login" };
  if (looksLikeEmail(trimmed)) {
    return { authEmail: trimmed, loginId: null, isEmailLogin: true };
  }
  const loginId = normalizeLoginId(trimmed);
  if (!loginId) return { error: "Invalid user ID" };
  return {
    authEmail: `${loginId}${HUB_ID_EMAIL_DOMAIN}`,
    loginId,
    isEmailLogin: false,
  };
}

function hubAuthEmailFromLoginOrEmail({ loginId, email }) {
  const mail = String(email ?? "").trim().toLowerCase();
  if (mail) return { authEmail: mail, loginId: null };
  const id = normalizeLoginId(String(loginId ?? "").trim());
  if (!id) return { error: "login_id or email required" };
  return { authEmail: `${id}${HUB_ID_EMAIL_DOMAIN}`, loginId: id };
}

module.exports = {
  HUB_ID_EMAIL_DOMAIN,
  isHubSyntheticEmail,
  normalizeLoginId,
  resolveHubLogin,
  hubAuthEmailFromLoginOrEmail,
};
