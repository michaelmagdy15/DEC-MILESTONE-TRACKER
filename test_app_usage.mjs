import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://wvzfjhovumhwlrcawcwf.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2emZqaG92dW1od2xyY2F3Y3dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MDM0MjIsImV4cCI6MjA4NzA3OTQyMn0.MbDtyyPPl3d_HQ7-qwYjYOFnSl6aS69GQCHhd6sjG-c";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    const { data, error } = await supabase.from('app_usage_log').select('*');
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('App Usage Logs (count):', data.length);
        console.log('Last 5 logs:', data.slice(-5));
    }
}

check();
