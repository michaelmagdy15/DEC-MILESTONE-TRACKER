import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wvzfjhovumhwlrcawcwf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2emZqaG92dW1od2xyY2F3Y3dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MDM0MjIsImV4cCI6MjA4NzA3OTQyMn0.MbDtyyPPl3d_HQ7-qwYjYOFnSl6aS69GQCHhd6sjG-c';

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        detectSessionInUrl: typeof window !== 'undefined' ? !window.location.pathname.startsWith('/emails/callback') : true,
    }
});
