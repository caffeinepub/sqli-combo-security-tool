# SQLi Combo Defense Console

## Current State
AttackPage renders cards from `ATTACK_SCENARIOS` array in `data.ts`. Currently 10 attack scenarios: SQLi, XSS, Session Hijack, Rate-Limit Bypass, CSRF, Command Injection, Directory Traversal, MITM, DNS Spoofing, Buffer Overflow.

PreventPage renders collapsible guide cards from `PREVENTION_GUIDES` array in `data.ts`. Currently 6 guides for the newer attack types (CSRF, Command Injection, Directory Traversal, MITM, DNS Spoofing, Buffer Overflow).

`SCENARIO_META` in `data.ts` maps scenario names to hacker IP, attack type, and reattack loop for popup alerts.

## Requested Changes (Diff)

### Add
- **Script Injection attack** in `ATTACK_SCENARIOS` -- a distinct attack from XSS, focusing on inline script execution via event handlers and javascript: URIs in DOM contexts, not just `<script>` tags. Severity: high.
- **Forced Login attack** (credential stuffing / authentication bypass) in `ATTACK_SCENARIOS` -- distinct from Brute Force, uses breached credential databases and account enumeration. Severity: critical.
- **Scenario metadata** for both new attacks in `SCENARIO_META` (hackerIp, attackType, reattackLoop).
- **Prevention guide for Script Injection** in `PREVENTION_GUIDES` with attack vector description, 4 mitigation steps, code example, OWASP A03:2021, NIST SP 800-53: SI-10, SI-15 references.
- **Prevention guide for Forced Login** in `PREVENTION_GUIDES` with attack vector description, 4 mitigation steps, code example, OWASP A07:2021, NIST SP 800-53: AC-2, IA-5 references.

### Modify
- Nothing (purely additive)

### Remove
- Nothing

## Implementation Plan
1. Add two new `AttackScenario` objects to `ATTACK_SCENARIOS` in `src/frontend/src/data.ts`.
2. Add two new entries to `SCENARIO_META` in `data.ts`.
3. Add two new `PreventionGuide` objects to `PREVENTION_GUIDES` in `data.ts`.
4. No page file changes needed -- both arrays are already wired up to render cards automatically.
5. Run lint + typecheck + build to verify no regressions.
