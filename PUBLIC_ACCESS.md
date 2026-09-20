# ICQ Reborn public access

ICQ Reborn v0.27 uses a central bootstrap file:

`server-config.json`

Android clients fetch this file and automatically connect to `publicBaseUrl`. Users do not enter an IP address or port.

## Recommended production layout

Android client -> HTTPS/WSS public hostname -> Cloudflare Tunnel -> http://localhost:22005

The Node.js server can stay on the owner's Windows PC.

## One-time setup

1. Start `START_SERVER.bat` and verify `http://localhost:22005/health`.
2. In Cloudflare Dashboard create a remotely-managed Tunnel.
3. Add a Public Hostname and set the origin service to `http://localhost:22005`.
4. Copy the tunnel token.
5. Run `SETUP_PUBLIC_ACCESS.bat` as Administrator and paste the token.
6. Update `server-config.json`:
   ```json
   {
     "version": 1,
     "publicBaseUrl": "https://api.your-domain.example",
     "fallbacks": []
   }
   ```
7. Restart ICQ Reborn on Android. No APK rebuild is required when the public hostname is changed later.

## Security

Never commit the Cloudflare tunnel token, API tokens, passwords, or `server/data/server_secret.txt` to GitHub.

The public service should use HTTPS/WSS. Do not expose TCP port 22005 directly to the Internet when the tunnel is used.

## Availability

If the PC is turned off, asleep, disconnected from the Internet, or the Node.js server is stopped, the messenger backend is unavailable.
