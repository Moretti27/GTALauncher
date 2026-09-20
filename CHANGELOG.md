# Changelog

## v0.31.0-alpha

- Embedded nine user-provided AmneziaWG/WARP .conf profiles in the Android APK.
- Added native Android methods to list, read and parse embedded profiles.
- Added Settings UI for selecting a profile and viewing Address, DNS, MTU, Endpoint, AllowedIPs and Amnezia parameters.
- The application reads the full embedded .conf files as requested.
- No AmneziaWG/VPN tunnel engine was added; profiles are parsed and available to the app.
- Kept the single universal START_SERVER.bat in PC Host.

## v0.30.0-alpha

- Replaced multiple Windows host BAT files with one universal `START_SERVER.bat`.
- The launcher automatically requests Administrator rights only when the TCP 22005 Firewall rule needs to be created.
- The launcher checks Node.js, installs missing npm dependencies, detects the LAN IPv4 address and starts the server.
- Removed `SETUP_NETWORK.bat` and `CHECK_CONNECTION.bat` from the PC Host.
- The same launcher structure is intended to remain compatible with future Host versions.
- Android/server versions synchronized to v0.30.

## v0.29.0-alpha

- Fixed false "main server unavailable" status in Android.
- Server health checks now use native Android HttpURLConnection first, with WebView fetch only as fallback.
- Added automatic reconnect after Wi-Fi/mobile-network changes.
- Added progressive WebSocket reconnect retry instead of a fixed reconnect loop.
- Fixed PC Host LAN address selection to prefer the HUAWEI AX3 network 192.168.3.x.
- Kept direct public endpoint 31.135.108.120:22005 and central server-config discovery.

## v0.28.0-alpha

- Removed Cloudflare Tunnel from the normal deployment path.
- Configured direct public endpoint `http://31.135.108.120:22005`.
- Kept central `server-config.json` discovery so the public IP can be changed without rebuilding installed APKs.
- Added direct public fallback to foreground and background Android connections.
- Added `SETUP_NETWORK.bat` to create the Windows Firewall rule for TCP 22005.
- Added `CHECK_CONNECTION.bat` for local/public health diagnostics.
- Updated PC Host startup output with LAN/public endpoints and port-forward reminder.
- Android users still do not enter a server IP or port.
- Note: the current direct-IP deployment is HTTP/WS and does not encrypt traffic in transit.

## v0.27.0-alpha

- Added automatic public server discovery through server-config.json.
- Removed manual server IP/port entry from normal Android user flow.
- Android background sync now uses the same discovered public endpoint.
- Added Cloudflare Tunnel Windows service setup for hosting the backend on a home PC.
- Added PUBLIC_ACCESS.md with production public-access instructions.
- Public endpoint can be changed centrally without rebuilding the APK.
- Preserved local-network fallback for development/testing.

## v0.26.0-alpha

- Reworked registration into a separate account-creation flow.
- Registration data is stored persistently on the PC Host.
- Added confirmation-password field and dedicated registration result screen.
- Server returns a permanent 8-digit UIN after account creation.
- Login is now a separate UIN + password flow.
- Added server-side account metadata including phone number, creation time and last login time.
- Passwords remain stored only as bcrypt hashes, never as plaintext.
- Added db.json backup file during writes to reduce risk of account data loss.

## v0.25.0-alpha

- Added offline cache for profile, contacts, groups and chat history.
- Added offline queue for text messages and profile/contact/group actions.
- App can open cached data when the PC server is temporarily unavailable.
- Replaced permanent foreground connection with periodic background event checks.
- Removed the permanent foreground service notification.
- Stopped duplicate/continuous online sounds on reconnect.
- Fixed foreground notification sound order so tray alerts do not duplicate while the app is open.

## v0.24.0-alpha

- Increased profile avatar upload limit from 2 MB to 100 MB.
- Updated avatar upload UI to reflect the new limit.

## v0.23.0-alpha

- Added user profile avatars stored on the PC server.
- Added avatar selection from the Android file/gallery picker.
- Avatars are center-cropped and compressed before upload.
- Added avatar removal and replacement from Settings.
- Avatars now appear in profile, contacts, chat header and call screen.
- Redesigned the call screen with a large avatar, name, connection state and round controls.
- Preserved v0.22 foreground notification behavior and call fixes.

## v0.22.0-alpha

- Improved audio and video WebRTC call handling.
- Removed the previously unverified external TURN fallback.
- Fixed incoming-call ICE candidate preservation.
- Improved remote audio playback.
- Suppressed duplicate Android tray notifications while the app is open.
- Kept in-app message sounds while foregrounded.
- Unified Android and server version labels to v0.22.
- Updated Windows server launcher and server documentation.

## v0.21.0-alpha

- Added persistent Android session storage through SharedPreferences.
- Saved UIN and login token outside WebView localStorage.
- Server now stores a persistent JWT signing secret.
- Temporary server outages no longer automatically erase the local login session.
- Extended server session lifetime.

## v0.20.0-alpha

- Added groups and group chat.
- Added arbitrary file transfer up to 100 MB.
- Reworked presence statuses.
- Moved phone number management to Settings.
- Redesigned the main interface.
- Reworked audio/video call signaling.

## v0.19.0-alpha

- Added user-provided custom sound for new contacts.
- Added user-provided custom message notification sound.

## v0.18.0-alpha

- Added phone-contact synchronization.
- Added retro-style application sounds and Android notifications.

## v0.17.0-alpha

- Fixed local HTTP access from Android WebView.
- Fixed registration/server connection on port 22005.

## v0.16.0-alpha

- Switched both Android client and PC server to TCP port 22005.

## v0.14.0-alpha

- Switched messaging architecture from unreliable peer-only messaging to a PC-hosted server.
