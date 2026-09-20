# ICQ Reborn

ICQ Reborn is an experimental Android messenger inspired by the feel of classic instant messengers, with its own PC-hosted backend.

Current development version: **v0.27.0-alpha**

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

## Current v0.27 changes

- Android clients discover the server automatically from `server-config.json`.
- Normal users no longer enter a server IP address or port.
- The backend can remain on the owner's Windows PC and be published through Cloudflare Tunnel.
- Background sync uses the same public endpoint as foreground messaging.
- The public hostname can be changed centrally without rebuilding the Android APK.
- Added Windows public-access setup and deployment documentation.
- All v0.26 account/UIN registration and v0.25 offline behavior remain.

## Development status

This is an alpha project. Public HTTPS/WSS access is supported through the configured tunnel endpoint. Reliable calls across arbitrary mobile networks / CGNAT may still require a dedicated TURN server.

For public Internet deployment, put the server behind HTTPS/WSS rather than exposing plain HTTP directly.
