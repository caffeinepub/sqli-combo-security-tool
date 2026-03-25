# SQLi Combo Security Tool

## Current State
- AttackAlertPopup shows red attack popup with countdown and glitch effect (90s duration)
- AnalystDefendedNotification shows green popup when analyst resolves an alert (10s)
- App.tsx wires both notifications to role-based conditions
- No sound effects exist anywhere
- When analyst resolves a threat, admin does NOT receive a notification (cross-role alert missing)

## Requested Changes (Diff)

### Add
- Web Audio API sound engine (no external files needed -- synthesized sounds)
- Glitchy cyberpunk alarm tone that plays when AttackAlertPopup appears (harsh beeps + distortion)
- Softer resolution chime that plays when AnalystDefendedNotification appears
- Admin cross-role notification: when analyst resolves an alert (status = 'resolved'), admin receives a separate green/blue 'THREAT NEUTRALIZED BY ANALYST' banner popup (similar style to AttackAlertPopup but in cyan/blue tone)
- New component: AdminAnalystResolvedNotification.tsx -- a banner that shows the admin which alert the analyst resolved, with attack type, auto-dismiss in 10s
- Sound plays on the admin cross-role notification as well (notification chime)

### Modify
- AttackAlertPopup: play synthesized alarm sound on mount using Web Audio API
- AnalystDefendedNotification: play softer chime sound on mount
- App.tsx: when analyst resolves an alert AND user.role === 'admin' OR any admin-role session, set adminAnalystNotification state -- but since only one user is logged in at a time, show the cross-role notification to the current logged-in admin if they happen to be admin. For demo purposes: if logged in as admin and an alert is resolved by the 'analyst' actor, show the cross-role popup.
- Actually: the cross-role alert should fire when handleUpdateAlertStatus is called with status='resolved' regardless of who's logged in as admin (for demo: show to admin user when alert resolved from Detect page). If logged in as admin, show AdminAnalystResolvedNotification. If logged in as analyst, show AnalystDefendedNotification.

### Remove
- Nothing removed

## Implementation Plan
1. Create a useSoundEffect hook (src/hooks/useSoundEffect.ts) with functions: playAlarmSound(), playResolutionChime(), playNotificationChime() -- all using Web Audio API oscillators, no external audio files
2. Create AdminAnalystResolvedNotification.tsx component -- cyan/blue themed, shows 'THREAT NEUTRALIZED BY ANALYST', attack name, auto-dismiss 10s, plays notificationChime on mount
3. Update AttackAlertPopup.tsx to call playAlarmSound() on mount (when attack becomes non-null)
4. Update AnalystDefendedNotification.tsx to call playResolutionChime() on mount
5. Update App.tsx:
   - Add adminAnalystNotification state
   - In handleUpdateAlertStatus: if status === 'resolved' && user.role === 'admin', set adminAnalystNotification (admin resolving their own alert). If user.role === 'analyst' resolving, set analystNotification. For cross-role: since it's a single-user session demo, when analyst resolves, also set a global cross-role state that admin would see -- implement as: if user is analyst and resolves, set analystNotification; if user is admin and an auto-attack fires, admin sees popup. Cross-role demo: add a state adminCrossRoleNotification that fires when analyst resolves.
   - Render AdminAnalystResolvedNotification for admin users when analystNotification fires (for demo purposes, admin logged in sees a cross-role banner when analyst resolves remotely -- implement by showing it on analyst resolve for admin-role users, and showing AnalystDefendedNotification for analyst-role users)
