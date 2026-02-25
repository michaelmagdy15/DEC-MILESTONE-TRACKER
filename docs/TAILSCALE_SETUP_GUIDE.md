# Tailscale VPN Setup — DEC Milestone Tracker

## How It Works

```
┌──────────────────────────────────┐
│     OFFICE SERVER / PC           │
│  (Tailscale Exit Node)           │
│  Public IP: X.X.X.X ◄── this IP gets whitelisted in nginx.conf
└──────────┬───────────────────────┘
           │ Tailscale VPN
    ┌──────┼──────┐
    │      │      │
  Eng 1  Eng 2  Eng 3
    │      │      │
    └──────┼──────┘
           ▼
    Cloud Run App (only allows X.X.X.X)
```

All engineer traffic routes through the exit node → Cloud Run sees one consistent IP → that IP is whitelisted.

---

## Step 1: Create a Tailscale Account (Admin — you)

1. Go to **https://login.tailscale.com/start**
2. Sign up with your **Google account** (or Microsoft/GitHub)
3. This creates your "tailnet" (your private network)

---

## Step 2: Set Up the Exit Node (Office Server/PC)

This is the machine whose public IP all traffic will go through.

1. Download Tailscale from **https://tailscale.com/download/windows**
2. Install and sign in with the **same account** from Step 1
3. **Enable Exit Node** — right-click the Tailscale icon in system tray:
   - Click **"Exit Node"** → **"Run as exit node..."**
4. **Approve it** in the admin console:
   - Go to **https://login.tailscale.com/admin/machines**
   - Find the server machine → click **"..."** → **"Edit route settings"**
   - Toggle **"Use as exit node"** → **Save**

> ⚠️ This PC must stay **ON and connected** during office hours.

---

## Step 3: Engineer Setup (Each Engineer's PC)

Send these instructions to your engineers:

1. Download Tailscale from **https://tailscale.com/download/windows**
2. Install and **sign in with their Google account**
3. You (admin) approve them at **https://login.tailscale.com/admin/machines**
4. Right-click the Tailscale tray icon → **"Exit Node"** → select the **office server**
5. Done! ✅

### To verify it's working:
- Visit **https://whatismyip.com** — should show the **office server's IP**, not their home IP

---

## Step 4: Get the Exit Node's Public IP

On the office server PC, visit **https://whatismyip.com** and note the IP address.

---

## Step 5: Update nginx.conf

Once you have the exit node's public IP, tell me and I'll update the whitelist. Or update it yourself:

```nginx
# Add your Tailscale exit node IP
if ($http_x_forwarded_for ~* "(YOUR_EXIT_NODE_IP)") {
    set $is_allowed 1;
}
```

Then rebuild (`npm run build`) and redeploy to Cloud Run.

---

## Managing Engineers

| Action | How |
|---|---|
| **Add engineer** | They install Tailscale → you approve at admin console |
| **Remove engineer** | Remove them at https://login.tailscale.com/admin/machines |
| **See who's online** | Check https://login.tailscale.com/admin/machines |

---

## Important Notes

- 🆓 Tailscale is **free for up to 100 devices**
- 🔒 Traffic is encrypted end-to-end (WireGuard under the hood)
- 💻 The exit node PC must be **running and connected** for engineers to access the app
- 🌐 Engineers should **enable the exit node** only during work — when off, they use their normal internet
- 📱 Tailscale also works on **phones/tablets** if needed
