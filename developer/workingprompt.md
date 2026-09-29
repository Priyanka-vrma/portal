# Haunted Arcade: Comprehensive Systematic Audit, Testing & Playable Game Implementation

## Project Overview
Conduct a comprehensive systematic audit, testing, and debugging phase for all 10 games within the `ghost-gaming-portal/` to ensure they are fully playable. Fix all blank screens, broken inputs, and missing game logic by building dedicated standalone playable game files and robust `play.html` mounting.

---

## Phase 1: Audit & State Preservation (Manager)
- [x] Update task checklist in `developer/workingprompt.md`
- [x] Audit current state of `ghost-gaming-portal/games/`:
  - Found single prototype engine; physical standalone game directories (`games/[id]/index.html`) were missing.
  - Planned 10 dedicated standalone physical games with custom playable Canvas/WebGL logic.
- [x] Confirm strict isolation in `ghost-gaming-portal/` and NO GIT COMMIT/PUSH.

## Phase 2: Routing, Loading & play.html Architecture (@coder1)
- [ ] Build robust `play.html` runner supporting seamless iframe container (`#game-frame`) with full-screen, fallback canvas mounting, and URL param parsing (`?id=[game-id]`).
- [ ] Implement the funny CSS-animated ghost chasing the loading bar before game activation.
- [ ] Ensure seamless input focus forwarding, keyboard event propagation, and zero CORS/404 errors.
- [ ] Verify HUD controls (Banish to Crypt / Back, Pause, Restart, Sound Mute, Fullscreen) work seamlessly across all games.

## Phase 3: Dedicated Playable Game Logic for All 10 Games (@coder2)
- [ ] Build physical directory and game for each of the 10 titles:
  - Racing Games (5):
    1. `games/apex-drift/index.html` + `game.js`: Tokyo Nights street racing with real drift angle, tire slip, Tokyo neon grid, and skid marks.
    2. `games/canyon-apex/index.html` + `game.js`: Rally Cross dirt track racing with suspension simulation, mud roost particles, and off-road grip physics.
    3. `games/velocity/index.html` + `game.js`: Autobahn Pursuit highway traffic weaving, slipstream drafting, aerodynamic drag, and nitrous boost.
    4. `games/circuit-master/index.html` + `game.js`: Formula open-wheel asphalt racing with tire heat, tire wear, pit-stop/grip mechanics, and racing line telemetry.
    5. `games/baja-dunes/index.html` + `game.js`: 4x4 Offroad desert racing with sand deformation, vehicle suspension bounce, and weight transfer over dunes.
  - Combat Games (5):
    6. `games/covert-ops/index.html` + `game.js`: Neon Sector stealth tactical top-down shooter with vision cones, silenced weapons, patrol guards, and alarm state.
    7. `games/sniper-ghost/index.html` + `game.js`: Desert Storm marksmanship simulator with ballistic crosshair, dynamic wind vector, distance compensation, and bullet drop.
    8. `games/iron-guard/index.html` + `game.js`: Base Defense with player-controlled heavy artillery cannon, automated anti-air turrets, and waves of enemy mechanized units.
    9. `games/cqb-breach/index.html` + `game.js`: Tactical Breach close-quarters room-clearing with breach charges, flashbangs, squad commands, and hostile targets.
    10. `games/mech-assault/index.html` + `game.js`: Frontline heavy armored mech combat with dual weapon systems (kinetic autocannon + lock-on missile volleys), heat management, and destructible cover.
- [ ] Ensure all 10 games have active `requestAnimationFrame` game loops, keyboard/mouse input listeners, audio synthesizers (Web Audio API), and zero console errors.

## Phase 4: Systematic Verification & Testing (@tester)
- [ ] Systematically launch a local web server and verify every single game (1 to 10) loads via `play.html?id=[id]` and standalone.
- [ ] Verify canvas 2D contexts render non-blank frames, HUD updates, and controls respond to keydown/keyup and mouse clicks.
- [ ] Test filtering, search, and "Summon Game" navigation on `index.html`.
- [ ] Audit project isolation and confirm strictly 0 git commits and 0 git pushes.
