# DEC Companion App

A background script to automatically track active windows and software for engineers, logging them to the Supabase `app_usage_log` table. This provides insights into engineering context switching and overall tool usage.

## Setup

1. Requirements: **Node.js** must be installed on the machine.
2. Navigate to this directory in your terminal: `cd companion-app`
3. Run `npm install` to install dependencies.
4. Create a `.env` file in this directory with the following variables:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ENGINEER_ID=the_engineers_uuid_from_the_system
   ```
5. Note: You need a valid `ENGINEER_ID` matching the specific engineer whose machine this is running on. You can obtain this from the Admin panel of the DEC Milestone Tracker web app.

## Running the App

To run standard: 
```bash
npm start
```

### Running in Background
To run it continuously in the background (hidden from the user), we recommend using **pm2**:
```bash
# Install pm2 globally
npm install -g pm2

# Start the companion app
pm2 start index.js --name dec-companion

# Save the process list so it starts on boot
pm2 save
pm2 startup
```

## How it works
- The script checks the active OS window every 10 seconds.
- When the window changes, it calculates how long the previous window was focused.
- If the duration is more than 10 seconds, it pushes a log to Supabase.
