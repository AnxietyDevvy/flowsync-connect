# Idle Screen Sprite Update

## Goal
Replace the current idle screen’s centered logo/text block with the uploaded pixel-art “IDLE” sprite, while keeping the animated bubble background and the existing welcome-back behavior.

## What will change
1. **Asset upload**
   - Upload `Idle_sprite.png` via Lovable Assets to `src/assets/idle-sprite.png.asset.json`.

2. **IdleOverlay.tsx refactor**
   - Keep the bubble animation layer unchanged.
   - Replace the centered `FlowSyncLogo` + headline block with:
     - The uploaded sprite as a centered illustration.
     - The "In Idle Mode" / "Welcome back, {name}" text rendered below the image.
     - The "Move your mouse or press any key to resume" / "Resuming your session…" helper text.
   - Make the image responsive: `max-w-full max-h-[50vh]` on mobile, larger on desktop, with `object-contain`.
   - Preserve the fade-in/wake-out opacity transitions.

3. **No behavior changes**
   - `useIdle` timeout stays at 30 s.
   - Waking state and text swap remain the same.

## Verification
- Preview the Office route, trigger idle (or temporarily lower the timeout in a local test), and confirm the sprite appears centered with bubbles behind and text below.
- Check that waking up still fades the overlay out and restores the app.
