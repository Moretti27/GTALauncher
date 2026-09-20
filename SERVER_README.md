# ICQ Reborn Server v0.28

ICQ Reborn uses a PC-hosted Node.js server on TCP port **22005**.

## Windows setup

1. Keep the existing `server/data/` folder when updating.
2. Run `SETUP_NETWORK.bat` once as Administrator. It creates the Windows Firewall inbound rule for TCP 22005.
3. Keep the HUAWEI AX3 port-forward rule: TCP 22005 -> this PC's LAN IPv4 address:22005.
4. Run `START_SERVER.bat`.
5. Run `CHECK_CONNECTION.bat` to verify local and public access.

Configured public endpoint:

```
http://31.135.108.120:22005
```

Health endpoint:

```
http://31.135.108.120:22005/health
```

Android clients discover this endpoint through the repository `server-config.json` file, so users do not enter an IP address or port.

## Persistent data

All persistent server data is stored under:

```
server/data/
```

Important files/directories:

- `db.json` — accounts, contacts, messages, groups and events.
- `db.json.bak` — previous database backup created during writes.
- `files/` — uploaded chat/group files.
- `server_secret.txt` — persistent JWT signing secret.

Do not delete `server/data/` or `server_secret.txt` during an update.

## Internet access

The server listens on `0.0.0.0:22005`, so the router can forward TCP 22005 to it.

For public access to work, the Windows PC must be online, the Node.js server must be running, Windows Firewall must allow TCP 22005, and the router port-forward must point to the PC's current LAN IPv4 address.

If the ISP changes the public IPv4 address, update `publicBaseUrl` in `server-config.json`. Installed v0.28 clients will discover the new address automatically.

## Security note

The current direct-IP test deployment uses plain HTTP/WS. This is suitable for connectivity testing but does not encrypt login credentials or message traffic in transit. A production deployment should move to HTTPS/WSS with a valid certificate and hostname.

## Calls

Audio/video calls use WebRTC. Some mobile networks and restrictive NAT environments may still require a TURN server for reliable calls.
