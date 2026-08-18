# 🚀 Deployment & DevOps Guide: Docker + Cloudflare Tunnel

Comprehensive setup, deployment, and troubleshooting guide for self-hosting **Artist Discography** on a local Linux server (e.g. Ubuntu / Beelink Mini PC / Raspberry Pi / Homelab) and exposing it securely to the public internet using **Cloudflare Tunnels** and **Docker Compose**.

---

## 📑 Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Domain & DNS Setup (Squarespace to Cloudflare)](#2-domain--dns-setup-squarespace-to-cloudflare)
3. [Cloudflare Zero Trust & Tunnel Configuration](#3-cloudflare-zero-trust--tunnel-configuration)
4. [Server Host Setup & Docker Deployment](#4-server-host-setup--docker-deployment)
5. [Data Persistence & Linux File Permissions (Crucial)](#5-data-persistence--linux-file-permissions-crucial)
6. [Production Hardening & Admin Protection](#6-production-hardening--admin-protection)
7. [Maintenance & Routine Operations](#7-maintenance--routine-operations)
8. [Troubleshooting Playbook](#8-troubleshooting-playbook)

---

## 1. Architecture Overview

```
[ Public Visitor (Internet) ]
             │
             ▼ (HTTPS / HTTP3)
   [ Cloudflare Edge CDN ]
   ├── DDoS Mitigation & Web Application Firewall (WAF)
   ├── Automatic SSL/TLS Certificate Termination
   └── Zero Trust Access Policies (Protects /_sys/_admin)
             │
             ▼ (Outbound Encrypted Tunnel - No Port Forwarding Required)
  [ Local Server / Homelab (Ubuntu / Beelink) ]
   ├── Container 1: `cloudflare-tunnel` (cloudflared connector)
   └── Container 2: `artist-discography` (Next.js 16 Standalone + FFmpeg + Sharp)
             │
             ▼ (Bind-Mount Volume)
      [ Host `./artist-discography/data` ]
      ├── `artist-data.json` (Artist metadata, track links, system flags)
      ├── `projects/` (Covers, audio masters)
      └── `cache/` (Optimized WebP images & transcoded audio variants)
```

### Key Security Benefits:
- **No Open Ports**: Your home router requires zero inbound port forwarding (`80`/`443` stay closed).
- **Hidden Origin IP**: Public traffic routes through Cloudflare's proxies, keeping your home IP address private.
- **Unprivileged Execution**: The application inside Docker runs as a non-root system user (`nextjs`, UID `1001`).
- **Localhost Binding**: Port `3000` is bound strictly to `127.0.0.1` on the host, preventing unencrypted LAN bypasses.

---

## 2. Domain & DNS Setup (Registrar to Cloudflare)

If your domain (e.g. `yourdomain.com`) was purchased on a registrar like Squarespace, Namecheap, Google, or GoDaddy:

1. **Add Domain to Cloudflare**:
   - Log into the [Cloudflare Dashboard](https://dash.cloudflare.com/).
   - Click **Add a domain** / **Add Site**, enter `yourdomain.com`, and select the **Free** plan.
   - Note the two assigned Cloudflare Nameservers (e.g. `aria.ns.cloudflare.com`, `todd.ns.cloudflare.com`).

2. **Delegate Nameservers in Registrar**:
   - Log into your domain registrar → Select your domain → **DNS Settings** (or **Nameservers**).
   - Select **Use custom nameservers**.
   - Enter both Cloudflare nameserver addresses and save.
   - DNS propagation typically takes between 5 to 30 minutes.

---

## 3. Cloudflare Zero Trust & Tunnel Configuration

### 3.1 Create the Tunnel
1. Go to the [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/).
2. Navigate to **Networks** → **Tunnels** → Click **Create a Tunnel**.
3. Select **Cloudflared** as the connector type.
4. Name the tunnel (e.g. `artist-discography-server`).
5. Copy the **Tunnel Token** (long base64 string provided in the setup screen).

### 3.2 Configure Public Hostname Routing
Under the **Public Hostname** tab in your tunnel:

| Field | Setting for Root Domain | Setting for WWW (Optional) |
|---|---|---|
| **Public Hostname** | `yourdomain.com` | `www.yourdomain.com` |
| **Path** | *Leave completely empty / blank* | *Leave completely empty / blank* |
| **Type** | `HTTP` | `HTTP` |
| **URL** | `app:3000` | `app:3000` |

> [!IMPORTANT]
> Keep the **Path** field blank. In Cloudflare Tunnels, `Path` acts as a literal path filter. Leaving it empty forwards all paths (`/`, `/api/*`, `/[slug]`) to the container.

### 3.3 Protect the Admin Portal with Cloudflare Access (WAF)
To prevent unauthorized access or automated brute-forcing against `/_sys/_admin`:
1. In Cloudflare Zero Trust, navigate to **Access** → **Applications** → **Add an application** → **Self-hosted**.
2. **Settings**:
   - **Application Name**: `Artist Discography Admin`
   - **Application domain**: `yourdomain.com`
   - **Path**: `_sys/_admin*` (add another for `sys/admin*`)
3. **Policy**:
   - **Action**: `Allow`
   - **Include**: `Emails` (enter your personal email address)
4. Visitors attempting to access the Admin Portal will now be challenged with a 6-digit email PIN before reaching your server.

---

## 4. Server Host Setup & Docker Deployment

### 4.1 Prerequisites on the Ubuntu Server
Connect to your server via SSH:
```bash
ssh user@your-server-ip
```

Install Docker and the Docker Compose plugin (if not already installed):
```bash
sudo apt update
sudo apt install -y docker.io docker-compose-v2
sudo usermod -aG docker $USER
```
*(Log out and log back in or run `newgrp docker` to apply group permissions).*

### 4.2 Clone the Repository
```bash
git clone https://github.com/danvanbueren/artist-discography.git
cd artist-discography
```

### 4.3 Configure `.env`
Create a `.env` file at the repository root:
```bash
nano .env
```
Paste your configuration and token:
```env
PORT=3000
NODE_ENV=production
CLOUDFLARE_TUNNEL_TOKEN=eyJhIjoi...your_actual_token_here...
```
*(Press `Ctrl+O`, `Enter` to save, and `Ctrl+X` to exit).*

### 4.4 Start the Stack
```bash
docker compose up -d --build
```

Verify containers are running:
```bash
docker compose ps
docker compose logs -f
```

---

## 5. Data Persistence & Linux File Permissions (Crucial)

### Why Permission Errors Happen on Linux
In `docker-compose.yml`, the host directory `./artist-discography/data` is mounted to `/app/data` inside the container:
- Files on your host machine are owned by your login account (UID `1000`).
- The application inside the Docker container runs securely under the unprivileged `nextjs` service user (UID `1001`).
- If the host folder permissions are restricted, the container cannot write to `/app/data/cache/images`, `/app/data/cache/audio`, or update `artist-data.json`.

### The Fix
Run this command from the repository root on your server:

```bash
# Option A: Grant full read/write/execute permissions to the data directory (Recommended for ease of editing)
sudo chmod -R 777 ./artist-discography/data

# Option B: Assign ownership directly to container UID 1001
sudo chown -R 1001:1001 ./artist-discography/data
```

After updating permissions, restart the application container:
```bash
docker compose restart app
```

---

## 6. Production Hardening & Admin Protection

Check [`artist-discography/data/artist-data.json`](file:///c:/Users/Dan/App%20Dev/artist-discography/artist-discography/data/artist-data.json) before public launch:

```json
{
  "adminAccess": true,
  "adminPassword": "YourStrongSecretPassphraseHere",
  "devAccess": false,
  "artist": { ... }
}
```

1. **`devAccess: false`**: Disables the developer test suite and OpenAPI explorer route (`/_sys/_dev`).
2. **`adminPassword`**: Change from `"admin123"` to a strong passphrase.
3. **`adminAccess: false`**: Set to `false` if you manage discography data exclusively via disk files.

---

## 7. Maintenance & Routine Operations

### Pulling Updates & Redeploying
When new features or bugfixes are pushed to GitHub:
```bash
cd ~/artist-discography
git pull origin main
docker compose up -d --build
```

### Restarting Containers
```bash
# Restart both app and tunnel
docker compose restart

# Restart only the app container
docker compose restart app

# Restart only the cloudflare tunnel
docker compose restart tunnel
```

### Viewing Logs
```bash
# Live logs for all services
docker compose logs -f

# Live logs for application only
docker compose logs -f app

# Live logs for Cloudflare tunnel only
docker compose logs -f tunnel
```

### Backing Up Data
All artist data, covers, audio, and configurations live in `artist-discography/data/`. To back up:
```bash
tar -czvf discography_backup_$(date +%F).tar.gz ./artist-discography/data/
```

---

## 8. Troubleshooting Playbook

### Issue 1: `EACCES: permission denied, mkdir '/app/data/cache/images'`
- **Cause**: Container user `nextjs` (UID 1001) does not have write access to host directory `./artist-discography/data`.
- **Solution**: Run `sudo chmod -R 777 ./artist-discography/data` on host and run `docker compose restart app`.

### Issue 2: Cloudflare Tunnel reports `Inactive`
- **Cause**: Incorrect `CLOUDFLARE_TUNNEL_TOKEN` in `.env` or container failed to start.
- **Solution**: Check `docker compose logs tunnel`. Verify that the token string in `.env` has no surrounding quotes or trailing spaces.

### Issue 3: Domain shows Error 502 / Bad Gateway
- **Cause**: Tunnel cannot reach `http://app:3000`.
- **Solution**:
  1. Check if the app container is healthy: `docker compose ps`.
  2. Verify that the Cloudflare Tunnel Public Hostname service is set to `http://app:3000` (NOT `http://localhost:3000` or `127.0.0.1:3000`, because inside Docker network, containers communicate via service names).
  3. Ensure `Path` in Cloudflare Tunnel is blank.

### Issue 4: Next.js App Crashes on Audio Transcode
- **Cause**: Missing FFmpeg binary in runtime environment.
- **Solution**: The provided multi-stage `Dockerfile` automatically installs `ffmpeg` in Stage 3 (`runner`). Rebuild the image with `docker compose build --no-cache app`.

### Issue 5: Shell Access to App Container for Debugging
```bash
docker compose exec app sh
```
Inside the container, test that data folder is writable:
```bash
touch /app/data/test.tmp && rm /app/data/test.tmp
```
