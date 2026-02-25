import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wvzfjhovumhwlrcawcwf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2emZqaG92dW1od2xyY2F3Y3dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MDM0MjIsImV4cCI6MjA4NzA3OTQyMn0.MbDtyyPPl3d_HQ7-qwYjYOFnSl6aS69GQCHhd6sjG-c';

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
