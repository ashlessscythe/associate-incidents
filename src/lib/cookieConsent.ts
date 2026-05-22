export const COOKIE_CONSENT_STORAGE_KEY = "cookieConsent";

/** necessary = only essential storage; all = acknowledged / optional allowed if added later */
export type CookieConsentChoice = "necessary" | "all";

export interface StoredCookieConsent {
  choice: CookieConsentChoice;
  updatedAt: string;
}

export function getStoredCookieConsent(): StoredCookieConsent | null {
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredCookieConsent;
    if (parsed.choice !== "necessary" && parsed.choice !== "all") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function hasCookieConsentChoice(): boolean {
  return getStoredCookieConsent() !== null;
}

export function setCookieConsentChoice(choice: CookieConsentChoice): void {
  const value: StoredCookieConsent = {
    choice,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(value));
}

/** Use before enabling non-essential cookies or analytics. */
export function allowsOptionalCookies(): boolean {
  return getStoredCookieConsent()?.choice === "all";
}
