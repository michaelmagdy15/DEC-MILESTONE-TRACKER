
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wvzfjhovumhwlrcawcwf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2emZqaG92dW1od2xyY2F3Y3dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MDM0MjIsImV4cCI6MjA4NzA3OTQyMn0.MbDtyyPPl3d_HQ7-qwYjYOFnSl6aS69GQCHhd6sjG-c';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    console.log('Verifying Supabase Connection...');

    // 1. Create a Project
    console.log('Creating Test Project...');
    const { data: project, error: pError } = await supabase.from('projects').insert({
        name: 'Supabase Test Project',
        hourly_rate: 150
    }).select().single();

    if (pError) {
        console.error('Failed to create project:', pError);
        return;
    }
    console.log('Project created:', project.id);

    // 2. Create an Engineer
    console.log('Creating Test Engineer...');
    const { data: engineer, error: eError } = await supabase.from('engineers').insert({
        name: 'Test Engineer',
        role: 'Tester'
    }).select().single();

    if (eError) {
        console.error('Failed to create engineer:', eError);
        return;
    }
    console.log('Engineer created:', engineer.id);

    // 3. Create an Entry
    console.log('Creating Test Entry...');
    const { data: entry, error: logError } = await supabase.from('entries').insert({
        project_id: project.id,
        engineer_id: engineer.id,
        date: new Date().toISOString(),
        task_description: 'Testing Database',
        time_spent: 1,
        software_used: ['VS Code']
    }).select().single();

    if (logError) {
        console.error('Failed to create entry:', logError);
        return;
    }
    console.log('Entry created:', entry.id);

    // 4. Verify Data Fetch
    console.log('Fetching Data...');
    const { data: entries } = await supabase.from('entries').select('*');
    if (entries && entries.length > 0) {
        console.log('SUCCESS: Data fetched successfully.');
        console.log('Entries count:', entries.length);
    } else {
        console.error('Failed to fetch entries.');
    }

    // Cleanup (optional, but good for repetitive testing)
    console.log('Cleaning up...');
    await supabase.from('entries').delete().eq('id', entry.id);
    await supabase.from('engineers').delete().eq('id', engineer.id);
    await supabase.from('projects').delete().eq('id', project.id);
    console.log('Cleanup complete.');
}

verify();
