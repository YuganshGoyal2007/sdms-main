/**
 * Safely extract a human-readable error message from an axios/fetch error.
 *
 * axios throws errors where:
 *   - e.response.data is an object with { message, error } on a JSON 4xx/5xx
 *   - e.response.data is a string (raw HTML) when the server returns the SPA shell
 *     (Vite serves index.html for unknown routes)
 *   - e.message is the network error or axios parse error
 *
 * sonner tries to render the message as JSX, so we MUST strip out anything
 * that starts with '<' or contains HTML tags, otherwise React throws
 * "Invalid value '<'" and the toast shows a confusing parse error.
 */
export const safeErrorMessage = (err: unknown, fallback = "Something went wrong"): string => {
    if (!err) return fallback;
    const errorObj = err as { response?: { data?: { message?: unknown; error?: unknown } | string }; message?: string };

    // axios JSON response
    const data = errorObj?.response?.data;
    if (data && typeof data === "object") {
        if (typeof data.message === "string" && data.message && !data.message.startsWith("<")) return data.message;
        if (typeof data.error === "string" && data.error && !data.error.startsWith("<")) return data.error;
    }

    // axios string response (HTML body from Vite/dev proxy)
    if (typeof data === "string") {
        if (data.startsWith("<")) return "Server returned an HTML page (route may not exist or proxy is misconfigured)";
        if (data.length > 0 && data.length < 200) return data;
        return fallback;
    }

    // Plain Error message (network, parse, etc.)
    const msg = errorObj?.message;
    if (typeof msg === "string" && msg && !msg.startsWith("<")) {
        // Strip noisy "Unexpected token" parts that contain HTML
        if (msg.includes("Unexpected token")) return "Network or parse error (see browser console)";
        return msg;
    }

    return fallback;
};
