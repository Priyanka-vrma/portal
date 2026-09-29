# Ghost Gaming Portal - Haunted Arcade 👻🕹️

Welcome to **The Haunted Arcade**, an elegant yet playful, spooky-themed browser-based gaming portal built using modern HTML5, CSS3, and WebGL/Canvas technologies. The portal features a curated library of **10 unique, copyright-free games** (5 Realistic Physics Racing titles and 5 Tactical Arms/Combat simulators)—all running 100% client-side in the browser with zero downloads, zero plug-ins, and zero latency.

---

## 🌟 Key Features

- **Playful "Haunted Arcade" Aesthetic**: Abandoning sterile corporate designs, the portal embraces a retro haunted arcade vibe with deep midnight blues (`#070a14`), glowing ectoplasm greens (`#00ff88`), and spectral purples (`#a855f7`).
- **Clever Thematic UI & Animations**:
  - Cute floating background ghosts with smooth floating CSS keyframe animations.
  - Playful spooky typography featuring Google Fonts `'Creepster'` and `'Fredoka'`.
  - Floating tombstone-shaped game cartridges with hover jiggle animations and glowing neon drop-shadows.
  - Loading screen featuring a funny CSS-animated ghost frantically chasing a glowing loading bar.
- **100% Browser-Only Execution**: Every game runs directly in the browser via dedicated HTML5 Canvas 2D engines running at a silky-smooth 60 frames per second.
- **Dynamic JSON Catalog**: Game metadata, physics parameters, key bindings, and descriptions are dynamically loaded from `data/games.json` with embedded offline fallback support.
- **Universal Cabinet Runner (`play.html`)**: Seamlessly mounts either standalone game iframes or the canvas simulation engine with theater/fullscreen mode, HUD controls (Pause, Restart, Sound Mute), and real-time telemetry.
- **Procedural Web Audio Synthesis**: All engine sounds, tire screeches, gunshots, explosions, and UI clicks are generated procedurally using the browser's Web Audio API—no external audio files required.
- **Fully Responsive**: Optimized for desktop monitors, tablets, and mobile devices with touch controls and virtual analog inputs.

---

## 🎮 Games Catalog (10 Dedicated Titles)

### 🏎️ Realistic Racing Games (Physics-Driven Vehicle Dynamics)

1. **Apex Drift: Tokyo Nights** (`games/apex-drift/`)
   - *Theme*: Realistic street racing and drifting physics in a neon-lit Tokyo city environment.
   - *Mechanics*: Lateral tire slip angles, counter-steering, weight transfer, permanent tire skid marks, nitrous boost, and dynamic drift combo multipliers.
2. **Canyon Apex: Rally Cross** (`games/canyon-apex/`)
   - *Theme*: Off-road dirt track racing with realistic vehicle suspension and mud physics.
   - *Mechanics*: Multi-link suspension travel over terrain ruts, dynamic loose gravel traction variance, projectile mud roost particles, and handbrake hairpin cuts.
3. **Velocity: Autobahn Pursuit** (`games/velocity/`)
   - *Theme*: High-speed highway racing focusing on aerodynamic drag and traffic weaving.
   - *Mechanics*: Exponential aerodynamic drag, turbulent slipstream drafting behind traffic, near-miss combo scoring, and 330+ km/h top speeds.
4. **Circuit Master Pro** (`games/circuit-master/`)
   - *Theme*: Professional open-wheel asphalt racing with precise tire wear and grip mechanics.
   - *Mechanics*: Formula 1 aerodynamics, tire thermal degradation and wear models, DRS rear wing activation, and precision racing line delta telemetry.
5. **Baja Dunes: 4x4 Offroad** (`games/baja-dunes/`)
   - *Theme*: Heavy vehicle desert racing with dynamic sand deformation and realistic weight transfer.
   - *Mechanics*: 4x4 Trophy Truck suspension bounce, dynamic weight shift over dune crests, airborne jump air-time tracking, and sand particle trails.

---

### ⚔️ Arms / Combat Games (Tactical Marksmanship & Squad Operations)

6. **Covert Ops: Neon Sector** (`games/covert-ops/`)
   - *Theme*: Tactical top-down stealth shooter focusing on stealth and silenced weapons.
   - *Mechanics*: Operative movement, dynamic guard vision cones/flashlights, silenced subsonic ballistics, stealth alarm states, and laser targeting.
7. **Sniper Ghost: Desert Storm** (`games/sniper-ghost/`)
   - *Theme*: Precision marksmanship simulator factoring in wind, distance, and bullet drop.
   - *Mechanics*: Precision sniper optical reticle with mil-dot markings, dynamic crosswind vector drift, bullet drop over 1,000+ meters, and breath-holding scope stabilization.
8. **Iron Guard: Base Defense** (`games/iron-guard/`)
   - *Theme*: Modern military defense using realistic heavy artillery and automated turrets.
   - *Mechanics*: Mouse-aimed 155mm heavy Howitzer artillery shells with explosive blast radiuses, automated Vulcan CIWS anti-air turrets, and incoming mechanized assault waves.
9. **CQB: Tactical Breach** (`games/cqb-breach/`)
   - *Theme*: Close-quarters combat room-clearing game with tactical squad commands.
   - *Mechanics*: 4-man SWAT squad stack formation, explosive door breach charges (C4), flashbang disorientation effects, squad tactical commands, and room clearance.
10. **Mech Assault: Frontline** (`games/mech-assault/`)
    - *Theme*: Heavy armored mech combat featuring customizable kinetic and energy loadouts.
    - *Mechanics*: Bipedal titan battlemech locomotion, dual 40mm arm autocannons, shoulder-mounted lock-on missile swarms, jump jets, and reactor core heat management.

---

## 🚀 Installation & Local Execution

Because modern web browsers enforce strict Security/CORS policies when loading local JSON and iframe assets via the `file:///` protocol, **you should run the portal using a local HTTP server**.

### Option 1: Python HTTP Server (Recommended - Quickest)
If you have Python installed, open your terminal, navigate to the `ghost-gaming-portal/` folder, and run:
```bash
# Python 3.x
python3 -m http.server 8080
```
Then open your browser and navigate to:
```
http://localhost:8080/
```

### Option 2: VS Code Live Server Extension
1. Open the `ghost-gaming-portal/` folder in Visual Studio Code.
2. Install the **Live Server** extension by Ritwick Dey (if not already installed).
3. Right-click on `index.html` and select **"Open with Live Server"**.

### Option 3: Node.js `serve` / `http-server`
If you have Node.js and npm installed:
```bash
# Using npx (no install needed)
npx serve ghost-gaming-portal
```
or
```bash
npx http-server ghost-gaming-portal -p 8080
```

---

## 📁 Directory Structure

```text
ghost-gaming-portal/
├── index.html                  # Main Haunted Arcade portal homepage & catalog
├── play.html                   # Arcade cabinet game runner (iframe/canvas container)
├── contact.html                # Cryptmaster contact & inquiry page (pv101298@gmail.com)
├── style.css                   # Haunted Arcade dark theme, tombstone styling & animations
├── app.js                      # Catalog logic, dynamic JSON loader, search & audio FX
├── play.js                     # Cabinet runner logic, metadata parser & control relays
├── README.md                   # Project overview, game catalog & setup guide
├── LICENSE.txt                 # MIT Open Source License (Copyright 2026 Priyanka)
├── PRIVACY.md                  # Privacy policy (localStorage-only, zero user tracking)
│
├── assets/                     # Vector artwork & game poster thumbnails
│   ├── apex-drift.svg
│   ├── canyon-apex.svg
│   ├── velocity.svg
│   ├── circuit-master.svg
│   ├── baja-dunes.svg
│   ├── covert-ops.svg
│   ├── sniper-ghost.svg
│   ├── iron-guard.svg
│   ├── cqb-breach.svg
│   └── mech-assault.svg
│
├── data/
│   └── games.json              # Exact database of all 10 game profiles & physics specs
│
├── developer/
│   └── workingprompt.md        # State preservation and task checklist
│
└── games/                      # Dedicated playable standalone game engines
    ├── prototype-engine.js     # Shared baseline Canvas 2D engine
    ├── apex-drift/             # Tokyo Nights Drift (index.html + game.js)
    ├── canyon-apex/            # Rally Cross Dirt (index.html + game.js)
    ├── velocity/               # Autobahn Highway (index.html + game.js)
    ├── circuit-master/         # Formula Grand Prix (index.html + game.js)
    ├── baja-dunes/             # 4x4 Desert Trophy (index.html + game.js)
    ├── covert-ops/             # Neon Stealth Shooter (index.html + game.js)
    ├── sniper-ghost/           # Ballistics Desert Sniper (index.html + game.js)
    ├── iron-guard/             # Base Howitzer Defense (index.html + game.js)
    ├── cqb-breach/             # Tactical Room Clearing (index.html + game.js)
    └── mech-assault/           # Frontline Titan Mech (index.html + game.js)
```

---

## ⌨️ Global Controls Summary

| Key / Action | Racing Mode | Combat Mode |
| :--- | :--- | :--- |
| **W / Up Arrow** | Accelerate / Gas | Move Forward / North |
| **S / Down Arrow** | Brake / Reverse | Move Backward / South |
| **A / D or Arrows** | Steer Left / Right | Strafe Left / Right |
| **Spacebar** | Drift Handbrake / DRS Boost | Breach / Missiles / Special Attack |
| **Left Shift** | Nitrous Overdrive Boost | Sprint / Jump Jets / Steady Breath |
| **Mouse Aim** | N/A | High-Precision Crosshair Aiming |
| **Left-Click** | N/A | Fire Primary Weapon |
| **P / ESC** | Pause / Resume Game | Pause / Resume Game |
| **R** | Restart Session | Reload Weapon / Restart Session |
| **M** | Toggle Sound (Mute/Unmute) | Toggle Sound (Mute/Unmute) |
| **F** | Toggle Fullscreen Mode | Toggle Fullscreen Mode |

---

## 📜 License, Privacy & Contact

- **License**: Released under the open-source **MIT License** (Copyright © 2026 Priyanka). See [`LICENSE.txt`](LICENSE.txt) for full details.
- **Privacy Policy**: 100% private, client-side only. We do not track, collect, or transmit any user data. See [`PRIVACY.md`](PRIVACY.md).
- **Creator & Copyright**: Priyanka
- **Contact**: Reach out via [`contact.html`](contact.html) or email directly to `pv101298@gmail.com`.
