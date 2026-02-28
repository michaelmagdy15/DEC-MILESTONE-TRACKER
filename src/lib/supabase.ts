import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error(
        'Missing Supabase environment variables. ' +
        'Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env'
    );
}

/**
 * Detect whether this page load is a Zoho OAuth callback.
 * Zoho redirects back with ?code=...&location=...&accounts-server=...
 * Supabase would interpret ?code= as its own PKCE auth code, corrupting the session.
 */
const isZohoCallback = typeof window !== 'undefined' && (() => {
    const params = new URLSearchParams(window.location.search);
    return params.has('code') && (params.has('accounts-server') || params.has('location'));
})();

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        detectSessionInUrl: !isZohoCallback,
        persistSession: true,
        storageKey: 'dec-tracker-auth',
        flowType: 'implicit',
        // Disable Navigator Lock API — it frequently times out on Cloud Run
        // (10s wait), blocking ALL database operations.  The no-op lock
        // executes the callback immediately; session races are unlikely
        // because flowType:'implicit' avoids PKCE server-side exchanges.
        lock: async (_name: string, _acquireTimeout: number, cb: () => Promise<any>) => {
            return await cb();
        },
    },
    global: {
        fetch: (url, options = {}) => {
            // 15-second timeout on all Supabase network requests
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000);
            return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeout));
        }
    }
});
