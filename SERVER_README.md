# ICQ Reborn Server v0.22

ICQ Reborn uses a PC-hosted Node.js server on TCP port **22005**.

## Windows

1. Use the automatic PC Host package, or install Node.js 20+.
2. Run `START_SERVER.bat`.
3. Keep the server window open.
4. On the phone, use the PC LAN address, for example:

```
http://192.168.3.3:22005
```

The exact IPv4 address depends on the PC/network.

## Persistent data

All persistent server data is under:

```
server/data/
```

Important files/directories:

- `db.json` — accounts, contacts, messages, groups.
- `files/` — uploaded chat/group files.
- `server_secret.txt` — persistent JWT signing secret.

**Do not delete `server_secret.txt`** unless you intentionally want all saved sessions to become invalid.

## Features

- UIN registration/login.
- Persistent sessions.
- Contact list and phone-contact matching.
- Presence statuses: ONLINE, AWAY, DND, OCCUPIED, INVISIBLE, OFFLINE.
- Direct messages.
- Groups and group chat.
- File transfer up to 100 MB per file.
- WebSocket signaling for audio/video calls.

## Network

For devices on the same Wi-Fi/LAN, connect directly to the PC IPv4 address.

For access from outside the home network, use HTTPS/WSS behind a secure reverse proxy or tunnel. Plain public HTTP is not recommended.

Audio/video calls use WebRTC. Direct LAN calls should work without TURN; calls across restrictive NAT/CGNAT networks may require a TURN server.
