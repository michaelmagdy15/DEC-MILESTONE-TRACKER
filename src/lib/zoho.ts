/**
 * Zoho Mail integration utility functions.
 * Manages OAuth flow and fetching emails from Zoho using the VITE proxy.
 * Supports folder listing, email content fetching, and Supabase token persistence.
 */

import { supabase } from './supabase';

// We use relative paths in development which map to the Vite Proxy.
// In production, these should map to the Nginx proxy configured in nginx.conf.
const ZOHO_ACCOUNTS_URL = import.meta.env.VITE_ZOHO_ACCOUNTS_URL || '/zoho-accounts';
const ZOHO_MAIL_URL = import.meta.env.VITE_ZOHO_MAIL_URL || '/zoho-mail';

const CLIENT_ID = import.meta.env.VITE_ZOHO_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_ZOHO_CLIENT_SECRET;
// Always use current origin so auth request and token exchange use the same URI.
// This works for both localhost:5173 (dev) and the Cloud Run domain (prod).
const REDIRECT_URI = typeof window !== 'undefined' ? `${window.location.origin}/emails/callback` : (import.meta.env.VITE_ZOHO_REDIRECT_URI || '');

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
        scope: 'ZohoMail.accounts.READ,ZohoMail.messages.READ,ZohoMail.folders.READ', // Scopes for reading mail + folders
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

    const data = await response.json();

    if (!response.ok || data.error) {
        console.error('Zoho token exchange failed:', { status: response.status, body: data });
        throw new Error(`Zoho token exchange failed: ${data.error || response.statusText} (HTTP ${response.status})`);
    }

    return data;
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

    const data = await response.json();

    if (!response.ok || data.error) {
        console.error('Zoho token refresh failed:', { status: response.status, body: data });
        throw new Error(`Zoho refresh failed: ${data.error || response.statusText} (HTTP ${response.status})`);
    }

    return data;
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
        const errBody = await response.text().catch(() => '');
        console.error('Zoho accounts fetch failed:', { status: response.status, body: errBody });
        throw new Error(`Failed to fetch Zoho accounts (HTTP ${response.status})`);
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
    const response = await fetch(`${ZOHO_MAIL_URL}/api/accounts/${accountId}/messages/view?limit=${limit}`, {
        headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`
        }
    });

    if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        console.error('Zoho emails fetch failed:', { status: response.status, body: errBody });
        throw new Error(`Failed to fetch Zoho emails (HTTP ${response.status})`);
    }

    const data = await response.json();
    return data.data;
};

// --- Folder API ---

export interface ZohoFolder {
    folderId: string;
    folderName: string;
    folderType: string;
    messageCount?: number;
    unreadMessageCount?: number;
}

/**
 * Fetch all folders for an account.
 */
export const fetchZohoFolders = async (accessToken: string, accountId: string): Promise<ZohoFolder[]> => {
    const response = await fetch(`${ZOHO_MAIL_URL}/api/accounts/${accountId}/folders`, {
        headers: { Authorization: `Zoho-oauthtoken ${accessToken}` }
    });

    if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        console.error('Zoho folders fetch failed:', { status: response.status, body: errBody });
        throw new Error(`Failed to fetch Zoho folders (HTTP ${response.status})`);
    }

    const data = await response.json();
    return data.data || [];
};

/**
 * Fetch emails from a specific folder by folderId.
 */
export const fetchZohoEmailsByFolder = async (
    accessToken: string,
    accountId: string,
    folderId: string,
    limit: number = 20
) => {
    const response = await fetch(
        `${ZOHO_MAIL_URL}/api/accounts/${accountId}/messages/view?folderId=${folderId}&limit=${limit}`,
        { headers: { Authorization: `Zoho-oauthtoken ${accessToken}` } }
    );

    if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        console.error('Zoho folder emails fetch failed:', { status: response.status, body: errBody });
        throw new Error(`Failed to fetch folder emails (HTTP ${response.status})`);
    }

    const data = await response.json();
    return data.data || [];
};

/**
 * Fetch the full HTML content of a specific email.
 */
export const fetchZohoEmailContent = async (
    accessToken: string,
    accountId: string,
    folderId: string,
    messageId: string
): Promise<string> => {
    const response = await fetch(
        `${ZOHO_MAIL_URL}/api/accounts/${accountId}/folders/${folderId}/messages/${messageId}/content?includeBlockContent=true`,
        { headers: { Authorization: `Zoho-oauthtoken ${accessToken}` } }
    );

    if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        console.error('Zoho email content fetch failed:', { status: response.status, body: errBody });
        throw new Error(`Failed to fetch email content (HTTP ${response.status})`);
    }

    const data = await response.json();
    return data.data?.content || '';
};

// --- Supabase Token Persistence ---

/**
 * Save Zoho refresh token and account ID to the user's engineer record in Supabase.
 */
export const saveZohoTokensToSupabase = async (
    userId: string,
    refreshToken: string,
    accountId: string
) => {
    const { error } = await supabase
        .from('engineers')
        .update({ zoho_refresh_token: refreshToken, zoho_account_id: accountId })
        .eq('id', userId);

    if (error) {
        console.error('Failed to save Zoho tokens to Supabase:', error.message);
    }
};

/**
 * Load Zoho refresh token and account ID from Supabase for a given user.
 */
export const loadZohoTokensFromSupabase = async (
    userId: string
): Promise<{ refreshToken: string | null; accountId: string | null }> => {
    const { data, error } = await supabase
        .from('engineers')
        .select('zoho_refresh_token, zoho_account_id')
        .eq('id', userId)
        .single();

    if (error || !data) {
        return { refreshToken: null, accountId: null };
    }

    return {
        refreshToken: data.zoho_refresh_token || null,
        accountId: data.zoho_account_id || null
    };
};

/**
 * Clear Zoho tokens from Supabase for a given user.
 */
export const clearZohoTokensFromSupabase = async (userId: string) => {
    await supabase
        .from('engineers')
        .update({ zoho_refresh_token: null, zoho_account_id: null })
        .eq('id', userId);
};
