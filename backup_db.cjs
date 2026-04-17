const fs = require('fs');

const SUPABASE_URL = "https://wvzfjhovumhwlrcawcwf.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2emZqaG92dW1od2xyY2F3Y3dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MDM0MjIsImV4cCI6MjA4NzA3OTQyMn0.MbDtyyPPl3d_HQ7-qwYjYOFnSl6aS69GQCHhd6sjG-c";

async function dumpTable(tableName) {
    let allData = [];
    let offset = 0;
    while(true) {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?select=*&offset=${offset}&limit=1000`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        const data = await response.json();
        
        if (data.error) {
            console.error("Error fetching", tableName, data.error);
            break;
        }

        if(!data || data.length === 0) break;
        allData = allData.concat(data);
        offset += data.length;
        if(data.length < 1000) break;
    }
    return allData;
}

async function run() {
    const backup = {};
    const tables = ['app_usage_log', 'audit_log', 'time_entries', 'projects', 'engineers', 'entries', 'tasks'];
    
    for(const t of tables) {
        console.log(`Backing up ${t}...`);
        backup[t] = await dumpTable(t);
        console.log(`Saved ${t}: ${backup[t] ? backup[t].length : 0} rows`);
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `Security_Evidence_Backup_${timestamp}.json`;
    fs.writeFileSync(filename, JSON.stringify(backup, null, 2));
    console.log(`CRITICAL EVIDENCE DOWNLOADED: ${filename}`);
}

run();
