import activeWindow from 'active-win';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const ENGINEER_ID = process.env.ENGINEER_ID;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !ENGINEER_ID) {
    console.error("Missing environment variables. Please check your .env file.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TRACKING_INTERVAL_MS = 10000; // Check every 10 seconds for window changes
let lastWindow = null;
let lastLogTime = Date.now();

async function trackActivity() {
    try {
        const win = await activeWindow();
        if (!win) return;

        // Combine app name with window title for better context (e.g., "AutoCAD - Project1.dwg")
        const currentWindow = `${win.owner?.name || 'Unknown App'} - ${win.title}`;

        if (currentWindow !== lastWindow) {
            if (lastWindow) {
                const durationSeconds = Math.floor((Date.now() - lastLogTime) / 1000);
                if (durationSeconds > 10) {
                    await saveLog(lastWindow, durationSeconds);
                }
            }
            lastWindow = currentWindow;
            lastLogTime = Date.now();
        }
    } catch (error) {
        console.error("Error tracking window:", error);
    }
}

async function saveLog(windowName, durationSeconds) {
    console.log(`Logging: ${windowName} for ${durationSeconds}s`);
    try {
        const { error } = await supabase
            .from('app_usage_log')
            .insert([
                {
                    engineerId: ENGINEER_ID,
                    activeWindow: windowName,
                    durationSeconds: durationSeconds,
                    timestamp: new Date().toISOString()
                }
            ]);

        if (error) {
            console.error("Failed to save log to Supabase:", error);
        }
    } catch (e) {
        console.error("Exception saving log:", e);
    }
}

// Handle exit to log the last window
process.on('SIGINT', async () => {
    if (lastWindow) {
        const durationSeconds = Math.floor((Date.now() - lastLogTime) / 1000);
        if (durationSeconds > 10) {
            await saveLog(lastWindow, durationSeconds);
        }
    }
    console.log("Exiting Companion App.");
    process.exit();
});

console.log("DEC Companion App tracking started...");
setInterval(trackActivity, TRACKING_INTERVAL_MS);
trackActivity();
