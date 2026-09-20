# ICQ Reborn Server v0.30

ICQ Reborn uses a PC-hosted Node.js server on TCP port **22005**.

## One-file Windows launcher

The PC Host now uses only one BAT file:

```
START_SERVER.bat
```

Run it normally. On the first launch, if the Windows Firewall rule is missing, the launcher automatically requests Administrator rights and creates the inbound TCP 22005 rule.

The same launcher then:

- checks that Node.js is installed;
- installs server dependencies when `node_modules` is missing;
- detects the LAN IPv4 address, preferring `192.168.3.x`;
- shows local, LAN and public endpoints;
- reminds you about router port forwarding;
- starts `server/server.js`.

Configured public endpoint:

```
http://31.135.108.120:22005
```

Router forwarding should remain:

```
TCP 22005 -> 192.168.3.3:22005
```

## Persistent data

Keep the entire `server/data/` directory when updating the Host.

It contains accounts, contacts, messages, groups, uploaded files and `server_secret.txt`.

Deleting `server/data/server_secret.txt` invalidates existing login sessions.

## Security note

The current direct-IP deployment uses HTTP/WS, so traffic is not encrypted in transit. A production deployment should move to HTTPS/WSS with a valid hostname and certificate.

## Calls

Audio/video calls use WebRTC. Some restrictive mobile networks may still require a TURN server for reliable calls.
