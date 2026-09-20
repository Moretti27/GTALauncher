# Changelog

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
