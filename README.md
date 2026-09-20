# ICQ Reborn

ICQ Reborn is an experimental Android messenger inspired by the feel of classic instant messengers, with its own PC-hosted backend.

Current development version: **v0.28.0-alpha**

## What is included

- Android client package: `com.icq.reborn`
- UIN-based accounts
- Persistent login/session storage
- Contact list
- Phone contact matching by hashed phone variants
- Presence statuses:
  - ONLINE
  - AWAY
  - DND
  - OCCUPIED
  - INVISIBLE
  - OFFLINE
- Direct chat
- Group creation and group chat
- File transfer up to 100 MB
- Audio calls
- Video calls
- Retro-style notification sounds
- Custom friend-add/message sounds
- Foreground behavior: when the app is open, message alerts do not create duplicate tray notifications
- Background Android notifications when the app is not in the foreground
- PC server on TCP port **22005**

## Repository structure

```
app/                  Android application
server/               Node.js backend
START_SERVER.bat      Windows server launcher
SERVER_README.md      Server setup and data notes
.github/workflows/    APK build workflow
```

## Build Android APK

The repository includes a GitHub Actions workflow that builds an installable APK on pushes to `main`.

Local requirements:

- JDK 17
- Android SDK / compileSdk 36
- Gradle 8.11.x

## Run the server

See [SERVER_README.md](SERVER_README.md).

Default port:

```
22005
```

Typical LAN address:

```
http://192.168.3.3:22005
```

The actual PC IPv4 address depends on the network.

## Persistent data

Keep the entire `server/data/` directory when upgrading the server.

It contains:

- users/accounts
- contacts
- message history
- groups
- uploaded files
- the persistent server signing secret

Deleting `server/data/server_secret.txt` invalidates existing saved login sessions.

## Current v0.28 changes

- Removed Cloudflare Tunnel from the normal deployment path.
- Android clients connect directly to the configured public IPv4 endpoint.
- Current public endpoint: `http://31.135.108.120:22005`.
- `server-config.json` remains the central endpoint registry, so an IP change does not require an APK rebuild.
- Added Windows Firewall setup and public-connection diagnostics to the PC Host package.
- Normal Android users still do not enter an IP address or port.
- All UIN registration, offline cache, background notifications, groups, files, avatars and calls remain.

## Development status

This is an alpha project. The current direct public-IP deployment uses HTTP/WS on TCP 22005. This enables Wi-Fi and mobile-network connectivity when router forwarding and Windows Firewall are configured, but it does not encrypt traffic in transit.

For production use, migrate the same endpoint to HTTPS/WSS with a valid certificate and hostname. Reliable calls across restrictive mobile networks / CGNAT may also require a dedicated TURN server.
