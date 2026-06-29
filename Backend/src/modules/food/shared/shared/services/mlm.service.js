const DEFAULT_TIMEOUT_MS = 8000;

const getMlmBaseUrl = () => String(process.env.MLM_API_BASE_URL || "").trim().replace(/\/+$/, "");

export async function verifyReferralCode(referralCode) {
    const code = String(referralCode || "").trim();
    if (!code) {
        return { valid: false, error: "Referral code is required" };
    }

    const baseUrl = getMlmBaseUrl();
    if (!baseUrl) {
        return { valid: false, error: "MLM API base URL is not configured" };
    }

    const controller = new AbortController();
    const timeoutMs = Number(process.env.MLM_API_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
    const timeout = setTimeout(() => controller.abort(), Number.isFinite(timeoutMs) ? timeoutMs : DEFAULT_TIMEOUT_MS);

    try {
        const url = `${baseUrl}/api/User/users/get-member-details-by-ref/${encodeURIComponent(code)}`;
        const response = await fetch(url, {
            method: "GET",
            signal: controller.signal
        });

        let payload = null;
        try {
            payload = await response.json();
        } catch {
            payload = null;
        }

        // Treat only explicit success as valid.
        // 204 (No Content) should not be considered a valid referral.
        if (response.status === 200) {
            return { valid: true, data: payload };
        }

        return { valid: false, error: payload?.message || `MLM responded with ${response.status}` };
    } catch (error) {
        const message = error?.name === "AbortError" ? "MLM request timed out" : (error?.message || "MLM request failed");
        return { valid: false, error: message };
    } finally {
        clearTimeout(timeout);
    }
}
