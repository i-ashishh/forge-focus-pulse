# FORGE — Focus Pulse v0.2

A Manifest V3 Chrome extension that stays in the background and periodically places a focus/discipline card over the webpage currently being used.

## Install
1. Extract this folder.
2. Open `chrome://extensions`.
3. Enable Developer mode.
4. Click Load unpacked.
5. Select this folder.

## Behavior
- No New Tab override.
- Default pulse interval: 15 minutes.
- Overlay appears on normal HTTP/HTTPS pages.
- Chrome notification is used as fallback on restricted pages or when overlay delivery fails.
- Popup controls interval, category, JEE mode, and quiet hours.
- Content is bundled locally. No remote requests or analytics.

## Limitations
Browser-restricted pages such as `chrome://` and some extension/system pages cannot accept normal content scripts. The extension falls back to a system notification where possible.

Chrome alarms are periodic rather than hard real-time timers. Chrome documents that alarms can be delayed and do not wake a sleeping device; missed alarms are handled after wake. See Chrome's alarms documentation.
