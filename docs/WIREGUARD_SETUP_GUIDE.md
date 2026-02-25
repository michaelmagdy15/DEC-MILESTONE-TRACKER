# WireGuard VPN Setup Guide — DEC Milestone Tracker

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                  OFFICE SERVER                   │
│            (WireGuard VPN Server)                │
│         WireGuard IP: 10.10.0.1/24              │
│         Public IP: [your server IP]              │
│         Port: 51820/UDP                          │
└──────────────┬───────────────────────────────────┘
               │ WireGuard Tunnel
     ┌─────────┼──────────┐
     │         │          │
┌────┴───┐ ┌───┴────┐ ┌───┴────┐
│ Eng 1  │ │ Eng 2  │ │ Eng 3  │
│10.10.0.2│ │10.10.0.3│ │10.10.0.4│
└────────┘ └────────┘ └────────┘

All traffic → exits via SERVER's public IP → Cloud Run whitelists that IP
```

---

## Part 1: Server Setup (Linux — Ubuntu/Debian)

### Step 1: Install WireGuard

```bash
sudo apt update
sudo apt install wireguard -y
```

### Step 2: Generate Server Keys

```bash
# Generate private and public keys
wg genkey | tee /etc/wireguard/server_private.key | wg pubkey > /etc/wireguard/server_public.key

# Secure the private key
chmod 600 /etc/wireguard/server_private.key

# View the keys (you'll need the public key for clients)
cat /etc/wireguard/server_private.key
cat /etc/wireguard/server_public.key
```

### Step 3: Create Server Config

Create `/etc/wireguard/wg0.conf`:

```ini
[Interface]
# Paste your server private key here
PrivateKey = <SERVER_PRIVATE_KEY>
Address = 10.10.0.1/24
ListenPort = 51820

# Enable IP forwarding and NAT (so clients can access the internet through this server)
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

# --- ENGINEER PEERS (add one [Peer] block per engineer) ---

# Engineer 1 — [Name]
[Peer]
PublicKey = <ENGINEER_1_PUBLIC_KEY>
AllowedIPs = 10.10.0.2/32

# Engineer 2 — [Name]
[Peer]
PublicKey = <ENGINEER_2_PUBLIC_KEY>
AllowedIPs = 10.10.0.3/32

# Engineer 3 — [Name]
[Peer]
PublicKey = <ENGINEER_3_PUBLIC_KEY>
AllowedIPs = 10.10.0.4/32

# Add more engineers as needed, incrementing the IP (10.10.0.5, 10.10.0.6, etc.)
```

> **Note**: Replace `eth0` with your actual network interface name. Run `ip a` to find it (it might be `ens3`, `enp0s3`, etc.).

### Step 4: Enable IP Forwarding

```bash
echo "net.ipv4.ip_forward = 1" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### Step 5: Start WireGuard

```bash
# Start the VPN
sudo wg-quick up wg0

# Enable auto-start on boot
sudo systemctl enable wg-quick@wg0

# Check status
sudo wg show
```

### Step 6: Open Firewall Port

```bash
sudo ufw allow 51820/udp
```

---

## Part 2: Server Setup (Windows Server)

### Step 1: Download & Install

1. Download WireGuard from https://www.wireguard.com/install/
2. Run the installer

### Step 2: Create Tunnel

1. Open WireGuard app
2. Click **"Add Tunnel"** → **"Add empty tunnel..."**
3. It will auto-generate keys. **Save the public key** — you'll need it for clients.
4. Replace the config with:

```ini
[Interface]
PrivateKey = <AUTO_GENERATED — already filled in>
Address = 10.10.0.1/24
ListenPort = 51820

[Peer]
# Engineer 1
PublicKey = <ENGINEER_1_PUBLIC_KEY>
AllowedIPs = 10.10.0.2/32
```

5. Click **Save** → **Activate**

### Step 3: Enable Routing (Windows)

Open PowerShell as Administrator:

```powershell
# Enable IP routing
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters" -Name "IPEnableRouter" -Value 1

# Enable NAT (replace "Ethernet" with your actual internet adapter name)
New-NetNat -Name "WireGuardNAT" -InternalIPInterfaceAddressPrefix "10.10.0.0/24"

# Open firewall port
New-NetFirewallRule -DisplayName "WireGuard" -Direction Inbound -Protocol UDP -LocalPort 51820 -Action Allow

# Restart to apply routing changes
Restart-Computer
```

---

## Part 3: Engineer Client Setup (Windows)

Each engineer does this on their PC:

### Step 1: Install WireGuard

Download from https://www.wireguard.com/install/

### Step 2: Create Tunnel

1. Open WireGuard → **"Add Tunnel"** → **"Add empty tunnel..."**
2. **Copy the auto-generated public key** — send it to the admin for the server config
3. Paste this config:

```ini
[Interface]
PrivateKey = <AUTO_GENERATED — already filled in>
Address = 10.10.0.2/24
DNS = 1.1.1.1, 8.8.8.8

[Peer]
PublicKey = <SERVER_PUBLIC_KEY>
Endpoint = <SERVER_PUBLIC_IP>:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
```

> **Important**: Each engineer gets a unique IP:
> - Engineer 1: `10.10.0.2`
> - Engineer 2: `10.10.0.3`
> - Engineer 3: `10.10.0.4`
> - ... and so on

4. Click **Save** → **Activate**

### Step 3: Verify

After connecting, the engineer should visit https://whatismyip.com — it should show the **server's public IP**, not their home/office IP.

---

## Part 4: Update nginx.conf

Once WireGuard is running, get your server's public IP and update the whitelist:

```nginx
# Replace the broad 41.41. range with your server's static VPN exit IP
if ($http_x_forwarded_for ~* "(YOUR_SERVER_PUBLIC_IP)") {
    set $is_allowed 1;
}
```

---

## Quick Reference: Adding a New Engineer

1. Engineer installs WireGuard and creates a new tunnel
2. Engineer sends you their **public key**
3. On the server, add a new `[Peer]` block to `/etc/wireguard/wg0.conf`:
   ```ini
   [Peer]
   PublicKey = <NEW_ENGINEER_PUBLIC_KEY>
   AllowedIPs = 10.10.0.X/32
   ```
4. Reload: `sudo wg-quick down wg0 && sudo wg-quick up wg0`
5. Send the engineer: server public key, server IP, and their assigned IP

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Can't connect | Check firewall port 51820/UDP is open |
| Connected but no internet | Verify IP forwarding is enabled and NAT rules are correct |
| "Invalid handshake" | Double check public/private keys (they're NOT interchangeable) |
| Slow speeds | Remove `PersistentKeepalive` or increase the value |

---

## Security Notes

- **Never share private keys** — each device has its own key pair
- **Back up your server config** — losing it means reconfiguring all clients
- **Revoke access** by removing the engineer's `[Peer]` block from the server config
- WireGuard uses state-of-the-art cryptography (Curve25519, ChaCha20, Poly1305)
