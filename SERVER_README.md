# ICQ Reborn Server v0.16

Windows:
1. Install Node.js 20+.
2. Run START_SERVER.bat.
3. On the PC, run `ipconfig` and note the IPv4 address, e.g. `192.168.1.50`.
4. In ICQ Reborn on a phone connected to the same Wi-Fi, set the server to:
   `http://192.168.1.50:22005`

For access from mobile Internet outside your home network, the PC must be reachable from the Internet:
- port-forward TCP 22005 on the router to the PC, or
- use a secure tunnel/reverse proxy.
If your ISP uses CGNAT, ordinary port forwarding may not work.

Before public use, set a strong JWT_SECRET and put the server behind HTTPS/WSS.
User passwords are stored as bcrypt hashes.
