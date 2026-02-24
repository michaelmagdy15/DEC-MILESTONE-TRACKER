/**
 * Zoho Mail integration utility functions.
 * Manages OAuth flow and fetching emails from Zoho using the VITE proxy.
 */

// We use relative paths in development which map to the Vite Proxy.
// In production, these should map to the Nginx proxy configured in nginx.conf.
const ZOHO_ACCOUNTS_URL = import.meta.env.VITE_ZOHO_ACCOUNTS_URL || '/zoho-accounts';
const ZOHO_MAIL_URL = import.meta.env.VITE_ZOHO_MAIL_URL || '/zoho-mail';

const CLIENT_ID = import.meta.env.VITE_ZOHO_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_ZOHO_CLIENT_SECRET;
const REDIRECT_URI = import.meta.env.VITE_ZOHO_REDIRECT_URI;

export interface ZohoTokenRequestOptions {
    code?: string;
    refresh_token?: string;
    grant_type: 'authorization_code' | 'refresh_token';
}

export interface ZohoTokenResponse {
    access_token: string;
    refresh_token?: string;
    api_domain?: string;
    token_type: string;
    expires_in: number;
    error?: string;
}

/**
 * Get the login URL to redirect the user to Zoho for authentication.
 */
export const getZohoAuthUrl = () => {
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: CLIENT_ID,
        scope: 'ZohoMail.accounts.READ,ZohoMail.messages.READ', // Scopes required for reading mail
        redirect_uri: REDIRECT_URI,
        access_type: 'offline', // Offline access gives us a refresh token
        prompt: 'consent' // Force consent to ensure we always get a refresh token
    });

    // Use the real Zoho accounts URL for the initial redirect since the user needs to log in on Zoho's domain.
    return `https://accounts.zoho.com/oauth/v2/auth?${params.toString()}`;
};

/**
 * Exchange the authorization code for an access token and refresh token.
 */
export const exchangeCodeForTokens = async (code: string): Promise<ZohoTokenResponse> => {
    const params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        code: code
    });

    const response = await fetch(`${ZOHO_ACCOUNTS_URL}/oauth/v2/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString()
    });

    if (!response.ok) {
        throw new Error('Failed to exchange code for tokens');
    }

    return response.json();
};

/**
 * Refresh an expired access token using the refresh token.
 */
export const refreshAccessToken = async (refreshToken: string): Promise<ZohoTokenResponse> => {
    const params = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: refreshToken
    });

    const response = await fetch(`${ZOHO_ACCOUNTS_URL}/oauth/v2/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString()
    });

    if (!response.ok) {
        throw new Error('Failed to refresh token');
    }

    return response.json();
};

/**
 * LocalStorage keys for saving the auth state temporarily.
 * Note: In a production app, refresh tokens should ideally be saved on the backend or Supabase user profiles,
 * but localStorage works for a simple client-side integration.
 */
export const ZOHO_TOKENS_KEYS = {
    ACCESS: 'zoho_access_token',
    REFRESH: 'zoho_refresh_token',
    EXPIRES_AT: 'zoho_expires_at'
};

export const clearZohoTokens = () => {
    localStorage.removeItem(ZOHO_TOKENS_KEYS.ACCESS);
    localStorage.removeItem(ZOHO_TOKENS_KEYS.REFRESH);
    localStorage.removeItem(ZOHO_TOKENS_KEYS.EXPIRES_AT);
};

export const saveZohoTokens = (response: ZohoTokenResponse) => {
    if (response.access_token) {
        localStorage.setItem(ZOHO_TOKENS_KEYS.ACCESS, response.access_token);
        // Expires generally in 3600 seconds. Save the exact timestamp.
        const expiresAt = Date.now() + (response.expires_in * 1000);
        localStorage.setItem(ZOHO_TOKENS_KEYS.EXPIRES_AT, expiresAt.toString());
    }

    if (response.refresh_token) {
        localStorage.setItem(ZOHO_TOKENS_KEYS.REFRESH, response.refresh_token);
    }
};

/**
 * Get a valid access token. Will automatically use the refresh token if expired.
 */
export const getValidAccessToken = async (): Promise<string | null> => {
    const accessToken = localStorage.getItem(ZOHO_TOKENS_KEYS.ACCESS);
    const refreshToken = localStorage.getItem(ZOHO_TOKENS_KEYS.REFRESH);
    const expiresAt = localStorage.getItem(ZOHO_TOKENS_KEYS.EXPIRES_AT);

    if (!accessToken || !refreshToken) return null;

    // If token is expired (or close to expiring, within 1 min), refresh it
    if (!expiresAt || Date.now() > parseInt(expiresAt) - 60000) {
        try {
            const refreshed = await refreshAccessToken(refreshToken);
            saveZohoTokens(refreshed);
            return refreshed.access_token;
        } catch (err) {
            console.error('Failed to refresh Zoho token', err);
            clearZohoTokens();
            return null;
        }
    }

    return accessToken;
};

// --- Mail API Functions ---

export interface ZohoMailAccount {
    accountId: string;
    primaryEmailAddress: string;
    displayName: string;
}

/**
 * Fetch the user's Zoho Mail accounts.
 */
export const fetchZohoAccounts = async (accessToken: string): Promise<ZohoMailAccount[]> => {
    const response = await fetch(`${ZOHO_MAIL_URL}/api/accounts`, {
        headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch Zoho accounts');
    }

    const data = await response.json();
    return data.data; // Zoho wraps response in `data` array
};

/**
 * Fetch messages/emails from a specific account.
 */
export const fetchZohoEmails = async (
    accessToken: string,
    accountId: string,
    limit: number = 20
) => {
    // Query for recent emails in inbox. 
    // Depending on Zoho's specific endpoint structure:
    // Usually /api/accounts/{accountId}/messages/view
    const response = await fetch(`${ZOHO_MAIL_URL}/api/accounts/${accountId}/messages/view?limit=${limit}`, {
        headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch Zoho emails');
    }

    const data = await response.json();
    return data.data;
};
