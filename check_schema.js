import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProjectsSchema() {
    const { data, error } = await supabase.from('projects').select('*').limit(1);
    if (error) {
        console.error("Error fetching projects:", error);
    } else {
        console.log("Success. First project data:");
        console.log(JSON.stringify(data, null, 2));
    }
}

checkProjectsSchema();
