import { getCachedSettings } from "./businessSettings";

/**
 * Returns the Google Play Store URL configured via env or business settings,
 * with a fallback.
 */
export const getPlayStoreUrl = () => {
  const envUrl = import.meta.env.VITE_PLAYSTORE_URL;
  if (typeof envUrl === "string" && envUrl.trim().startsWith("http")) {
    return envUrl.trim();
  }

  const cached = getCachedSettings();
  const reviewUrl = cached?.coinSettings?.reviewUrl;
  if (typeof reviewUrl === "string" && reviewUrl.trim().startsWith("http")) {
    return reviewUrl.trim();
  }

  return "https://play.google.com/store/apps/details?id=com.zinzoo.user";
};

/**
 * Generates direct web signup link prefilled with referral code.
 */
export const getReferralSignupUrl = (code) => {
  if (typeof window === "undefined") return "";
  const origin = window.location.origin;
  const cleanCode = String(code || "").trim().toUpperCase();
  return `${origin}/food/user/auth/login${cleanCode ? `?ref=${encodeURIComponent(cleanCode)}` : ""}`;
};

/**
 * Builds the comprehensive referral share message with app download link
 * and 1-tap registration link.
 */
export const generateReferralShareMessage = ({ companyName = "ZinZooX", referralCode = "" }) => {
  const appName = companyName || "ZinZooX";
  const code = String(referralCode || "").trim().toUpperCase();
  const playStoreUrl = getPlayStoreUrl();

  return [
    `🎉 Join me on ${appName}!`,
    ``,
    `Order delicious food, fresh groceries & more delivered right to your door! 🍔🍕🛍️`,
    ``,
    `📲 Download the App from Google Play Store:`,
    `${playStoreUrl}`,
    ``,
    `🎁 My Referral Code:`,
    `👉 ${code}`,
    ``,
    `Use my code during signup to unlock welcome bonus & rewards! ❤️`
  ].join("\n");
};

/**
 * Handles Web Share API, Clipboard copy, and WhatsApp fallback.
 */
export const executeReferralShare = async ({ companyName, referralCode, toast }) => {
  const code = String(referralCode || "").trim().toUpperCase();
  if (!code) {
    toast?.error?.("Referral code unavailable");
    return false;
  }

  const message = generateReferralShareMessage({ companyName, referralCode: code });
  const appName = companyName || "ZinZooX";

  try {
    if (navigator.share) {
      await navigator.share({
        title: `${appName} Referral`,
        text: message,
      });
      return true;
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(message);
      toast?.success?.("Referral link copied to clipboard!");
    }

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    return true;
  } catch (error) {
    if (error?.name !== "AbortError") {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    }
    return false;
  }
};
