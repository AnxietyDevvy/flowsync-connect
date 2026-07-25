## Office Idle Screen

Add an inactivity overlay on the Office side only. After 30s of no activity, fade in an animated bubble background with "In Idle Mode". On any interaction, briefly show "Welcome back" then fade out.

### Behavior
- Scope: `/office` routes only (not landing, Production, Admin, Dev, Print, or Unlock).
- Trigger: 30s without `mousemove`, `mousedown`, `keydown`, `touchstart`, or `scroll`.
- Activity while idle: show "Welcome back, {name}" for ~1.2s, then fade the overlay out.
- Transitions: 500ms fade for enter/exit using existing `animate-fade-in` / `animate-fade-out` utilities.
- Pause: don't count typing in inputs as inactivity (any keystroke resets the timer, which already covers this).
- Print flow: suppress the idle overlay while `printing` state is active so it never covers the print sheet.

### Visual
- Full-screen fixed overlay above app content (`z-50`), themed background (respects Red / Light / Dark themes via existing tokens).
- 12–16 softly floating translucent circles ("bubbles") animated with CSS keyframes (rise + gentle horizontal drift, staggered delays/sizes). Pure CSS, no libs.
- Centered content: FlowSync logo, large "In Idle Mode" heading, subtle "Move your mouse to resume" hint. Swaps to "Welcome back, {name}" on wake.

### Files
- New `src/components/flowsync/IdleOverlay.tsx` — overlay UI, bubble animation, welcome-back state, accepts `userName` prop.
- New `src/hooks/use-idle.ts` — tracks idle state with a configurable timeout, returns `{ isIdle, justWoke }`.
- Update `src/styles.css` — add `@keyframes bubble-rise` and a `.bubble` utility (only new CSS; no token changes).
- Update `src/routes/_gated/office.tsx` — mount `<IdleOverlay />` inside `OfficeApp` (after password gate), pass `userName`, and skip mounting while `printing`.

No backend, store, or business-logic changes.