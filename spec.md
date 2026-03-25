# SQLi Combo Security Tool

## Current State
App.tsx has an auto-attack timer (every 90 seconds) that fires `setAttackPopup(autoAttack)` regardless of any mode setting. UsersPage.tsx has a System Scanner section and user activity cards but no Auto/Manual tab.

## Requested Changes (Diff)

### Add
- `attackMode` state (`'auto' | 'manual'`) in App.tsx, defaulting to `'auto'`
- `onSetAttackMode` and `onTriggerManualAttack` props passed to `UsersPage`
- An **Attack Mode** tab panel in `UsersPage`, placed below the System Scanner section
- The tab panel contains:
  - A large toggle/switch labeled AUTO / MANUAL
  - When AUTO: shows status "Auto alerts fire every 90 seconds"
  - When MANUAL: shows a "TRIGGER ATTACK NOW" button that fires a manual popup immediately
  - A small log showing the last 5 triggered attacks (timestamp, type, city, mode)

### Modify
- Auto-attack timer in App.tsx: only fires if `attackMode === 'auto'`
- `onTriggerManualAttack` in App.tsx calls `generateAutoAttack()` and fires `setAttackPopup` immediately (same logic as auto-timer)
- `UsersPage` props extended with `attackMode`, `onSetAttackMode`, `onTriggerManualAttack`
- `UsersPage` renders the new Attack Mode tab after the scanner grid

### Remove
- Nothing

## Implementation Plan
1. Add `attackMode` state to App.tsx, guard auto-timer with it, add `handleTriggerManualAttack`, pass props to `UsersPage`
2. In `UsersPage`, add `attackMode`, `onSetAttackMode`, `onTriggerManualAttack` to props interface
3. Add Attack Mode panel section below the scanner grid in `UsersPage` with toggle and trigger button, attack log
