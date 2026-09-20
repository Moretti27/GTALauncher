# ICQ Reborn

ICQ Reborn is an experimental Android messenger inspired by the feel of classic instant messengers, with its own PC-hosted backend.

Current development version: **v0.22.0-alpha**

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

## Current v0.22 changes

- Reworked audio/video WebRTC call handling.
- Removed the unverified external TURN fallback from the client.
- Improved ICE candidate handling for incoming calls.
- Improved remote audio playback.
- Tray notifications are suppressed while the app is open.
- Persistent Android-side session storage remains enabled.
- Server/application versions aligned to v0.22.

## Development status

This is an alpha project. LAN use is the main tested architecture. Reliable calls across arbitrary mobile networks / CGNAT may require a dedicated TURN server.

For public Internet deployment, put the server behind HTTPS/WSS rather than exposing plain HTTP directly.
