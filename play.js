/**
 * The Haunted Arcade - Player & Cabinet Runner Controller (play.js)
 * Manages URL query resolution, funny ghost chasing loading sequence,
 * Grimoire metadata binding, HUD controls wiring, and PrototypeEngine mounting.
 */

(function () {
  'use strict';

  // Complete embedded fallback dataset in case of local file:// CORS restrictions
  const FALLBACK_GAMES = [
    {
      id: "apex-drift",
      title: "Apex Drift: Tokyo Nights",
      cursedCartridgeNumber: "CURSED #01",
      cursedSerial: "GHOST-CART-1984-01",
      category: "Phantom Racers",
      categoryKey: "racing",
      subtitle: "High-octane urban drifting on neon-slicked asphalt",
      description: "Experience precision counter-steering, dynamic weight shift, and lateral tire slip through the rain-slicked highways and tight alleyways of Tokyo. Features an authentic vehicle physics model factoring in tire temperature, camber slip angles, and turbo spool boost.",
      curse: "Curse of the Eternal Midnight Redline",
      hauntingWarning: "Warning: High-speed drifting may manifest phantom tire screeching in your hallway at 3:00 AM.",
      thumbnail: "assets/apex-drift.svg",
      year: 2026,
      author: "Ghost Interactive",
      rating: 4.9,
      ectoRating: "4.9 Ecto-Stars",
      ratingCount: 4820,
      tags: ["Street Drift", "Phantom Tires", "Tokyo Cyber", "Spectral Asphalt", "Ecto-Nitro"],
      features: [
        "Dynamic lateral friction slip & counter-steer physics",
        "Progressive tire thermal degradation and ectoplasm smoke particles",
        "Nitrous oxide injection system with high-G acceleration",
        "Procedural neon street environment with wet road reflections",
        "Interactive telemetry HUD with drift score multiplier"
      ],
      physicsSpecs: {
        "Chassis Weight": "1,240 kg (50:50 distribution)",
        "Engine Output": "620 BHP @ 8,200 RPM Twin-Turbo",
        "Lateral Grip Coeff": "1.35 G (Dry) / 0.88 G (Drift Slip)",
        "Aerodynamic Drag": "0.31 Cd with active rear wing",
        "Drivetrain": "RWD with 1.5-way mechanical LSD",
        "Suspension": "Double wishbone with adjustable coil-overs"
      },
      controls: {
        "Accelerate": "W / Up Arrow",
        "Brake / Reverse": "S / Down Arrow",
        "Steering Control": "A / D or Left / Right",
        "Handbrake (Initiate Drift)": "Spacebar",
        "Nitrous Boost": "Left Shift",
        "Pause Curse": "P",
        "Toggle Ecto-Sound": "M"
      },
      engineMode: "racing",
      theme: "tokyo-night"
    },
    {
      id: "canyon-apex",
      title: "Canyon Apex: Rally Cross",
      cursedCartridgeNumber: "CURSED #02",
      cursedSerial: "GHOST-CART-1984-02",
      category: "Phantom Racers",
      categoryKey: "racing",
      subtitle: "Brutal gravel stages and unyielding canyon switchbacks",
      description: "Tear through punishing gravel, deep mud ruts, and razor-sharp cliff turns. Models multi-link rally suspension travel, dynamic surface traction variance between loose gravel and packed clay, and mid-air vehicle pitch control.",
      curse: "The Poltergeist Hairpin Hex",
      hauntingWarning: "Warning: Spectral gravel kicked up by this rally beast has been known to pelt bedroom windows.",
      thumbnail: "assets/canyon-apex.svg",
      year: 2026,
      author: "Apex Rally Sim Labs",
      rating: 4.8,
      ectoRating: "4.8 Ecto-Stars",
      ratingCount: 3210,
      tags: ["Rally Cross", "Gravel Physics", "Mud Tracks", "Haunted Canyon", "Reiger Damping"],
      features: [
        "Loose-surface particle physics and projectile mud roost",
        "Multi-link long travel suspension damping simulation",
        "Dynamic all-wheel torque vectoring with center differential locking",
        "Hazardous canyon cliff drop-offs and switchback hairpins"
      ],
      physicsSpecs: {
        "Chassis Weight": "1,190 kg (FIA Rally spec)",
        "Engine Output": "380 BHP @ 6,500 RPM Turbocharged",
        "Lateral Grip Coeff": "0.82 G (Loose Gravel) / 1.10 G (Clay)",
        "Aerodynamic Drag": "0.38 Cd (High downforce package)",
        "Drivetrain": "AWD with electro-hydraulic center differential",
        "Suspension": "300mm travel Reiger rally dampers"
      },
      controls: {
        "Accelerate": "W / Up Arrow",
        "Brake / Reverse": "S / Down Arrow",
        "Counter-Steer": "A / D or Left / Right",
        "Handbrake Hairpin Cut": "Spacebar",
        "Pause Game": "P"
      },
      engineMode: "racing",
      theme: "canyon-dirt"
    },
    {
      id: "velocity",
      title: "Velocity: Autobahn Pursuit",
      cursedCartridgeNumber: "CURSED #03",
      cursedSerial: "GHOST-CART-1984-03",
      category: "Phantom Racers",
      categoryKey: "racing",
      subtitle: "Unrestricted top-speed cruising and slipstream overtakes",
      description: "Command an exotic hypercar exceeding 350 km/h on the unrestricted German Autobahn. Emphasizes turbulent slipstream drafting, exponential aerodynamic drag resistance, and razor-thin collision envelopes through heavy commuter traffic.",
      curse: "The Doppler Specter Phenomenon",
      hauntingWarning: "Warning: Driving past 380 km/h will temporarily displace your soul into the adjacent passing lane.",
      thumbnail: "assets/velocity.svg",
      year: 2026,
      author: "Ghost Interactive",
      rating: 4.7,
      ectoRating: "4.7 Ecto-Stars",
      ratingCount: 4120,
      tags: ["Autobahn", "Hypersonic", "Slipstream Vortex", "Ghostly Traffic", "Hypercar Aero"],
      features: [
        "Real aerodynamic drag curve scaling with velocity squared",
        "Aerodynamic slipstream vortex drafting zone behind traffic",
        "High-speed gyroscopic stability and subtle downforce compression"
      ],
      physicsSpecs: {
        "Chassis Weight": "1,420 kg (Carbon-monocoque chassis)",
        "Engine Output": "1,100 BHP Quad-Turbo W16 Hybrid",
        "Lateral Grip Coeff": "1.45 G at 250+ km/h (Active Aero)",
        "Aerodynamic Drag": "0.26 Cd in Low-Drag Mode",
        "Drivetrain": "Intelligent AWD with active yaw control"
      },
      controls: {
        "Accelerate": "W / Up Arrow",
        "Brake / Airbrake": "S / Down Arrow",
        "Lane Weave": "A / D or Left / Right",
        "DRS Wing Drag Reduction": "Spacebar",
        "Hybrid Boost Surge": "Left Shift"
      },
      engineMode: "racing",
      theme: "autobahn"
    },
    {
      id: "circuit-master",
      title: "Circuit Master Pro",
      cursedCartridgeNumber: "CURSED #04",
      cursedSerial: "GHOST-CART-1984-04",
      category: "Phantom Racers",
      categoryKey: "racing",
      subtitle: "Formula-tier open wheel precision on legendary asphalt tracks",
      description: "Built for uncompromising simulation purists. Master racing line apices, tire thermal windows (soft vs hard compounds), ground-effect downforce tunnels, and precision trail-braking without lockups.",
      curse: "The Hex of the Unforgiving Apex",
      hauntingWarning: "Warning: Missing the kerb by 2 centimeters will summon the angry ghost of a 1970s pit crew chief.",
      thumbnail: "assets/circuit-master.svg",
      year: 2026,
      author: "Precision Sim Engineering",
      rating: 4.9,
      ectoRating: "4.9 Ecto-Stars",
      ratingCount: 5100,
      tags: ["Formula Open-Wheel", "Pacejka Curve", "Tire Thermal Window", "Ghost Lap Delta", "Ground Effect"],
      features: [
        "Pacejka tire model for realistic grip-slip curves",
        "Dynamic tire degradation and blistering thermal model",
        "Realistic aerodynamic downforce tunnel simulation"
      ],
      physicsSpecs: {
        "Chassis Weight": "798 kg (Formula Spec with Driver)",
        "Engine Output": "1,000 BHP 1.6L V6 Turbo Hybrid",
        "Lateral Grip Coeff": "3.80 G Peak (High Downforce Apex)",
        "Aerodynamic Drag": "0.72 Cd (High Downforce Package)",
        "Drivetrain": "RWD with 8-speed seamless-shift gearbox"
      },
      controls: {
        "Full Throttle": "W / Up Arrow",
        "Trail-Braking": "S / Down Arrow",
        "Apex Steering": "A / D or Left / Right",
        "ERS Overtake Boost": "Spacebar",
        "Telemetry": "T"
      },
      engineMode: "racing",
      theme: "grand-prix"
    },
    {
      id: "baja-dunes",
      title: "Baja Dunes: 4x4 Offroad",
      cursedCartridgeNumber: "CURSED #05",
      cursedSerial: "GHOST-CART-1984-05",
      category: "Phantom Racers",
      categoryKey: "racing",
      subtitle: "Heavy trophy truck conqueror of shifting desert dunes",
      description: "Conquer unpredictable shifting sand dunes and boulder washes in a 900 BHP trophy truck. Features dynamic sand resistance, chassis weight transfer over massive crests, and long-travel bypass shock absorber simulation.",
      curse: "The Shifting Phantom Dune Hex",
      hauntingWarning: "Warning: Trophy truck landings are so violent they will rattle dust out of nearby picture frames.",
      thumbnail: "assets/baja-dunes.svg",
      year: 2026,
      author: "Ghost Interactive",
      rating: 4.7,
      ectoRating: "4.7 Ecto-Stars",
      ratingCount: 2690,
      tags: ["Baja 1000", "Trophy Truck", "Sand Displacement", "32-Inch Bypass", "Desert Mirage"],
      features: [
        "Dynamic sand displacement and rim sink resistance",
        "Chassis pitch, roll, and heavy weight transfer physics",
        "32-inch wheel travel with internal bypass dampers"
      ],
      physicsSpecs: {
        "Chassis Weight": "2,400 kg (Tubular steel spaceframe)",
        "Engine Output": "925 BHP Naturally Aspirated V8",
        "Lateral Grip Coeff": "0.75 G (Soft Sand) / 0.95 G (Hard Pack)",
        "Suspension": "Fox 4.0 bypass shocks with external reservoirs"
      },
      controls: {
        "Throttle Surge": "W / Up Arrow",
        "Brakes": "S / Down Arrow",
        "Steering": "A / D or Left / Right",
        "Rear Brake Cut": "Spacebar",
        "Mid-Air Pitch Control": "W / S in mid-air"
      },
      engineMode: "racing",
      theme: "desert-dunes"
    },
    {
      id: "covert-ops",
      title: "Covert Ops: Neon Sector",
      cursedCartridgeNumber: "CURSED #06",
      cursedSerial: "GHOST-CART-1984-06",
      category: "Spectral Combat",
      categoryKey: "combat",
      subtitle: "Top-down tactical espionage and suppressed CQB precision",
      description: "Infiltrate a fortified cyberpunk corporate megastructure under the cover of darkness. Features line-of-sight vision cones, sound propagation detection, subsonic suppressed ballistics, and tactical laser designators.",
      curse: "The Ecto-Subsonic Silencer Curse",
      hauntingWarning: "Warning: Suppressed gunshots are so quiet even the ghost watching over your shoulder won't hear them.",
      thumbnail: "assets/covert-ops.svg",
      year: 2026,
      author: "Ghost Interactive",
      rating: 4.9,
      ectoRating: "4.9 Ecto-Stars",
      ratingCount: 6430,
      tags: ["Stealth Espionage", "Subsonic 9x39mm", "Raycast Occlusion", "Acoustic Footprint", "Thermal Cloak"],
      features: [
        "Dynamic line-of-sight raycasting and shadow occlusion",
        "Sound radius acoustics for footsteps and silenced shots",
        "Subsonic ballistic trajectory with minimal muzzle flash"
      ],
      physicsSpecs: {
        "Caliber": "9x39mm Subsonic AP & 5.7x28mm Armor Piercing",
        "Muzzle Velocity": "310 m/s (Suppressed Subsonic)",
        "Effective Range": "120 m tactical ceiling",
        "Sound Footprint": "12 dB (Negligible acoustic footprint beyond 5m)"
      },
      controls: {
        "Move Operator": "W, A, S, D",
        "Aim / Rotate": "Mouse Cursor",
        "Fire Suppressed Weapon": "Left Mouse Click",
        "Tactical Roll / Dash": "Spacebar",
        "Reload Magazine": "R"
      },
      engineMode: "combat",
      theme: "cyber-stealth"
    },
    {
      id: "sniper-ghost",
      title: "Sniper Ghost: Desert Storm",
      cursedCartridgeNumber: "CURSED #07",
      cursedSerial: "GHOST-CART-1984-07",
      category: "Spectral Combat",
      categoryKey: "combat",
      subtitle: "Long-range ballistics, Coriolis drift, and extreme marksmanship",
      description: "Deploy as an elite sniper operative in hostile desert territory. Calculate ballistic trajectory by reading real-time wind speed, air density, distance elevation, and bullet drop over extreme combat ranges.",
      curse: "The Coriolis Poltergeist Deviation",
      hauntingWarning: "Warning: Bullet flight time exceeds 2.5 seconds—long enough to contemplate your mortal existence.",
      thumbnail: "assets/sniper-ghost.svg",
      year: 2026,
      author: "Vanguard Ballistics Lab",
      rating: 4.8,
      ectoRating: "4.8 Ecto-Stars",
      ratingCount: 5420,
      tags: ["Extreme Ballistics", ".338 Lapua", "Coriolis Drift", "Mildot Stadiametric", "Kinetic Shock"],
      features: [
        "Full 3D exterior ballistic flight model with wind drift vectors",
        "Mildot reticle with range-finding elevation stadiametric hashmarks",
        "Dynamic variable crosswind with mirage shimmer indicators"
      ],
      physicsSpecs: {
        "Caliber": ".338 Lapua Magnum (250 gr Scenar HPBT)",
        "Muzzle Velocity": "915 m/s (Extreme flat trajectory)",
        "Effective Range": "1,500+ meters",
        "Kinetic Energy": "6,700 Joules at muzzle"
      },
      controls: {
        "Reposition Scout": "W, A, S, D",
        "Aim Reticle": "Mouse Cursor",
        "Hold Breath / Zoom Scope": "Right Mouse Click (Hold)",
        "Fire Round": "Left Mouse Click",
        "Reload Chamber": "R"
      },
      engineMode: "combat",
      theme: "sniper-oasis"
    },
    {
      id: "iron-guard",
      title: "Iron Guard: Base Defense",
      cursedCartridgeNumber: "CURSED #08",
      cursedSerial: "GHOST-CART-1984-08",
      category: "Spectral Combat",
      categoryKey: "combat",
      subtitle: "Heavy ordnance artillery and automated perimeter fortification",
      description: "Command forward operating base defenses against relentless armored mechanized waves. Direct 155mm howitzer artillery batteries, deploy twin-linked CIWS autocannons, and withstand heavy armor siege tactics.",
      curse: "The Siege of the Restless Citadel",
      hauntingWarning: "Warning: 155mm howitzer shockwaves may cause slight poltergeist levitation of small desk objects.",
      thumbnail: "assets/iron-guard.svg",
      year: 2026,
      author: "Ghost Interactive",
      rating: 4.8,
      ectoRating: "4.8 Ecto-Stars",
      ratingCount: 3890,
      tags: ["Artillery Defense", "155mm Blast Wave", "CIWS Intercept", "Composite Armor", "Ecto-Flak"],
      features: [
        "Kinetic projectile ballistics with splash radius shockwaves",
        "Automated radar-guided CIWS anti-projectile defense intercept",
        "Destructible concrete fortifications and barricades"
      ],
      physicsSpecs: {
        "Ordnance Caliber": "155mm L/52 Howitzer & 35mm Twin Autocannon",
        "Muzzle Velocity": "827 m/s (Howitzer HE) / 1,175 m/s (Autocannon APDS)",
        "Blast Radius": "45 meters lethal fragmentation zone",
        "Armor Rating": "Level V Composite RHA & Spall Liner"
      },
      controls: {
        "Traverse Turret": "Mouse Cursor",
        "Primary Fire (Twin Autocannon)": "Left Mouse Click",
        "Secondary Ordnance (155mm Shell)": "Right Mouse Click",
        "Deploy Tactical Drone": "Spacebar"
      },
      engineMode: "combat",
      theme: "iron-fortress"
    },
    {
      id: "cqb-breach",
      title: "CQB: Tactical Breach",
      cursedCartridgeNumber: "CURSED #09",
      cursedSerial: "GHOST-CART-1984-09",
      category: "Spectral Combat",
      categoryKey: "combat",
      subtitle: "High-intensity room clearing and squad tactical coordination",
      description: "Lead an elite four-operator tactical team into high-threat barricaded hostage environments. Coordinate flashbang entries, door charges, corner slicing, and instantaneous target discrimination.",
      curse: "The Haunted Threshold Breach",
      hauntingWarning: "Warning: Breaching charges are so forceful they kick down doors in parallel dimensions.",
      thumbnail: "assets/cqb-breach.svg",
      year: 2026,
      author: "Ghost Tactical Studios",
      rating: 4.9,
      ectoRating: "4.9 Ecto-Stars",
      ratingCount: 5780,
      tags: ["CQB Room Clear", "12-Gauge Kinetic", "Flashbang Stun", "Wall Dispersion", "Spectral Squad"],
      features: [
        "Dynamic procedural room layout with destructible interior doors",
        "Tactical squad stacking, flash-and-clear command orders",
        "Shotgun pellet spread dispersion and wall penetration mechanics"
      ],
      physicsSpecs: {
        "Service Weapons": "12-Gauge Breaching Shotgun & 5.56mm SBR",
        "Muzzle Velocity": "410 m/s (00 Buckshot) / 790 m/s (5.56 NATO)",
        "Door Breaching Impulse": "14,000 N kinetic explosive detonation",
        "Flashbang Stun Radius": "8 meters disorientation radius"
      },
      controls: {
        "Move Pointman": "W, A, S, D",
        "Aim Weapon / Reticle": "Mouse Cursor",
        "Fire Primary Weapon": "Left Mouse Click",
        "Throw Flashbang / Breach Charge": "Right Mouse Click / G",
        "Command Squad Stack": "Spacebar"
      },
      engineMode: "combat",
      theme: "cqb-compound"
    },
    {
      id: "mech-assault",
      title: "Mech Assault: Frontline",
      cursedCartridgeNumber: "CURSED #10",
      cursedSerial: "GHOST-CART-1984-10",
      category: "Spectral Combat",
      categoryKey: "combat",
      subtitle: "85-ton bipedal war machine devastation and thermal management",
      description: "Pilot a heavily armored assault mech across shattered futuristic battlefields. Balance torso twist independent of leg movement, manage weapon heat dissipation, and unleash devastating particle projection cannons.",
      curse: "The 85-Ton Spectral Reactor Scram",
      hauntingWarning: "Warning: Firing an alpha strike will superheat your cockpit to temperatures only demons enjoy.",
      thumbnail: "assets/mech-assault.svg",
      year: 2026,
      author: "Iron Titan Simulation",
      rating: 4.8,
      ectoRating: "4.8 Ecto-Stars",
      ratingCount: 4940,
      tags: ["Mech Assault", "PPC Particle Cannons", "Torso Twist Decoupled", "Heat Dissipation", "Jump Jet Thrust"],
      features: [
        "Independent torso twist rotation decoupled from bipedal leg chassis",
        "Weapon heat dissipation and thermal shutdown emergency override",
        "Multi-weapon alpha strikes: Gauss rifles, PPCs, and swarm missiles"
      ],
      physicsSpecs: {
        "Mech Tonnage": "85 Metric Tons (Assault Battlemech Class)",
        "Top Speed": "64.8 km/h (340 Fusion Core)",
        "Torso Twist Traverse": "+/- 110 degrees independent traverse",
        "Heat Capacity": "60 Heat Units before emergency scram",
        "Composite Armor": "18.5 Tons Ferro-Fibrous Armor Plate"
      },
      controls: {
        "Move Legs Forward / Reverse": "W / S",
        "Turn Leg Chassis": "A / D",
        "Aim Torso & Turret": "Mouse Cursor",
        "Primary Weapon (PPC Energy)": "Left Mouse Click",
        "Secondary Missiles": "Right Mouse Click",
        "Jump Jets": "Spacebar (Hold)",
        "Coolant Flush": "C"
      },
      engineMode: "combat",
      theme: "mech-frontline"
    }
  ];

  let currentGame = null;
  let engineInstance = null;

  /**
   * Initializes the Haunted Arcade cabinet runner.
   */
  async function initPlay() {
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = (urlParams.get('id') || 'apex-drift').trim().toLowerCase();

    // 1. Fetch game metadata
    const games = await loadGames();
    currentGame = games.find((g) => g.id.toLowerCase() === gameId) || games[0];

    // 2. Populate metadata in Grimoire drawer & HUD
    renderGameMetadata(currentGame);

    // 3. Setup HUD buttons
    setupPlayerControls();

    // 4. Run the funny ghost chasing loading sequence (~1.5s)
    runLoadingSequence(() => {
      // 5. Mount standalone game or fallback engine
      mountGame(currentGame);
    });
  }

  /**
   * Loads games from data/games.json with fallback.
   */
  async function loadGames() {
    try {
      const response = await fetch('data/games.json', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) return data;
      throw new Error('Empty json array');
    } catch (e) {
      console.info('Using fallback embedded dataset in runner:', e.message);
      return FALLBACK_GAMES;
    }
  }

  /**
   * Runs the funny ghost chasing loading bar animation for ~1.5s.
   * Flips flavor messages:
   * "Summoning ectoplasm..." -> "Polishing phantom spark plugs..." ->
   * "Loading poltergeist physics..." -> "Ready to spook!"
   */
  function runLoadingSequence(onComplete) {
    const loadingScreen = document.getElementById('loading-screen');
    const fillEl = document.getElementById('loading-bar-fill');
    const statusTextEl = document.getElementById('loading-status-text');
    const chaseGhost = document.getElementById('chase-ghost');
    const chaseTargetSoul = document.getElementById('chase-target-soul');

    if (!loadingScreen) {
      if (typeof onComplete === 'function') onComplete();
      return;
    }

    const DURATION = 1500; // 1.5 seconds
    const startTime = performance.now();

    const flavorSteps = [
      { threshold: 0, text: "Summoning ectoplasm... 🔮" },
      { threshold: 0.32, text: "Polishing phantom spark plugs... ⚡" },
      { threshold: 0.68, text: "Loading poltergeist physics... 👻" },
      { threshold: 0.92, text: "Ready to spook! 🎮" }
    ];

    function updateProgress(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1.0, elapsed / DURATION);

      // Update loading bar width
      if (fillEl) {
        fillEl.style.width = `${Math.round(progress * 100)}%`;
      }

      // Update chasing ghost position across arena
      if (chaseGhost) {
        const offsetPct = progress * 72;
        chaseGhost.style.transform = `translateX(${offsetPct}%)`;
      }

      // Pulse target soul token when ghost gets close
      if (chaseTargetSoul && progress > 0.8) {
        chaseTargetSoul.style.transform = `scale(${1 + (progress - 0.8) * 1.5})`;
      }

      // Update flavor text
      if (statusTextEl) {
        for (let i = flavorSteps.length - 1; i >= 0; i--) {
          if (progress >= flavorSteps[i].threshold) {
            statusTextEl.textContent = flavorSteps[i].text;
            break;
          }
        }
      }

      if (progress < 1.0) {
        requestAnimationFrame(updateProgress);
      } else {
        // Complete! Fade out smoothly
        setTimeout(() => {
          loadingScreen.style.transition = 'opacity 0.4s ease, visibility 0.4s ease';
          loadingScreen.style.opacity = '0';
          loadingScreen.style.pointerEvents = 'none';

          setTimeout(() => {
            loadingScreen.style.display = 'none';
            if (typeof onComplete === 'function') {
              onComplete();
            }
          }, 420);
        }, 120);
      }
    }

    requestAnimationFrame(updateProgress);
  }

  /**
   * Populates DOM metadata panels with spooky lore & physics specs.
   */
  function renderGameMetadata(game) {
    // Update Page Title
    document.title = `${game.title} // The Haunted Arcade`;

    // Title & Category
    const titleEls = document.querySelectorAll('#game-title, .game-title');
    titleEls.forEach((el) => { el.textContent = game.title; });

    const isRacing = (game.categoryKey === 'racing') || (game.category && game.category.toLowerCase().includes('race'));
    const catEls = document.querySelectorAll('#game-category, .game-category');
    catEls.forEach((el) => {
      el.textContent = isRacing ? '🏎️ PHANTOM RACER' : '⚔️ SPECTRAL COMBAT';
      el.className = `category-pill ${isRacing ? 'badge-racing' : 'badge-combat'}`;
    });

    // Subtitle & Description
    const subEls = document.querySelectorAll('#game-subtitle, .game-subtitle');
    subEls.forEach((el) => { el.textContent = game.subtitle || ''; });

    const descEls = document.querySelectorAll('#game-desc, #game-description, .game-description');
    descEls.forEach((el) => { el.textContent = game.description; });

    // Rating
    const ratingEls = document.querySelectorAll('#game-rating, .game-rating');
    const ratingText = game.ectoRating ? `⭐ ${game.ectoRating}` : `★ ${Number(game.rating).toFixed(1)} Astral Grade`;
    ratingEls.forEach((el) => {
      el.textContent = ratingText;
    });

    // Author & Year
    const authorEls = document.querySelectorAll('#game-author, .game-author');
    authorEls.forEach((el) => {
      el.textContent = `${game.author || 'Ghost Interactive'} • Cursed Edition 1984`;
    });

    // Physics Specs Panel
    const specsContainer = document.getElementById('physics-specs') || document.querySelector('.physics-specs');
    if (specsContainer && game.physicsSpecs) {
      const entries = Object.entries(game.physicsSpecs);
      specsContainer.innerHTML = entries.map(([key, value]) => `
        <div class="spec-item" style="display:flex; justify-content:space-between; padding:0.5rem 0.75rem; background:rgba(0,255,136,0.04); border-radius:8px; margin-bottom:0.4rem; border:1px solid rgba(0,255,136,0.12);">
          <span class="spec-label" style="color:#94a3b8; font-size:0.85rem; font-family:'Fredoka', sans-serif;">${escapeHtml(formatKey(key))}</span>
          <strong class="spec-val" style="color:#f1f5f9; font-size:0.85rem; font-family:'JetBrains Mono', monospace;">${escapeHtml(String(value))}</strong>
        </div>
      `).join('');
    }

    // Controls Guide Panel
    const controlsContainer = document.getElementById('controls-guide') || document.querySelector('.controls-guide');
    if (controlsContainer && game.controls) {
      const controlsEntries = Object.entries(game.controls);
      controlsContainer.innerHTML = controlsEntries.map(([action, key]) => `
        <div class="control-row" style="display:flex; justify-content:space-between; align-items:center; padding:0.45rem 0.65rem; border-bottom:1px solid rgba(255,255,255,0.06);">
          <span class="control-action" style="color:#cbd5e1; font-size:0.85rem; font-family:'Fredoka', sans-serif;">${escapeHtml(action)}</span>
          <kbd class="control-key" style="background:#131a29; border:1px solid rgba(0,255,136,0.25); border-radius:6px; padding:0.25rem 0.6rem; font-family:'JetBrains Mono', monospace; font-size:0.8rem; color:#00ff88; box-shadow:0 2px 0 rgba(0,0,0,0.5);">${escapeHtml(key)}</kbd>
        </div>
      `).join('');
    }

    // Features List
    const featuresContainer = document.getElementById('game-features') || document.querySelector('.game-features');
    if (featuresContainer && Array.isArray(game.features)) {
      featuresContainer.innerHTML = game.features.map((feat) => `
        <li style="margin-bottom:0.45rem; color:#cbd5e1; font-size:0.88rem; display:flex; align-items:flex-start; gap:8px;">
          <span style="color:#00ff88; font-size:1rem;">⚡</span>
          <span>${escapeHtml(feat)}</span>
        </li>
      `).join('');
    }

    // Tags
    const tagsContainer = document.getElementById('game-tags') || document.querySelector('.game-tags');
    if (tagsContainer && Array.isArray(game.tags)) {
      tagsContainer.innerHTML = game.tags.map((tag) => `
        <span class="tag-pill" style="display:inline-block; margin-right:0.35rem; margin-bottom:0.35rem; padding:0.3rem 0.75rem; background:rgba(0,255,136,0.1); border:1px solid rgba(0,255,136,0.28); border-radius:999px; font-size:0.75rem; color:#00ff88; font-family:'Fredoka', sans-serif;">${escapeHtml(tag)}</span>
      `).join('');
    }
  }

  let gameIframe = null;
  let isIframePaused = false;
  let isIframeMuted = false;

  /**
   * Mounts either the dedicated standalone game iframe (games/[id]/index.html)
   * or falls back to PrototypeEngine on the canvas.
   */
  function mountGame(game) {
    const iframe = document.getElementById('game-frame');
    const canvas = document.getElementById('game-canvas');

    if (iframe && game && game.id) {
      gameIframe = iframe;
      iframe.style.display = 'block';
      if (canvas) canvas.style.display = 'none';

      const gameUrl = `games/${encodeURIComponent(game.id)}/index.html`;
      iframe.src = gameUrl;

      // Focus iframe upon load so controls are immediately responsive
      iframe.onload = () => {
        try {
          if (iframe.contentWindow) {
            iframe.contentWindow.focus();
          }
        } catch (e) {}
      };

      // Also allow clicking anywhere on the cabinet or wrapper to focus the iframe
      const wrapper = document.getElementById('canvas-wrapper');
      if (wrapper) {
        wrapper.addEventListener('click', () => {
          if (iframe.contentWindow) iframe.contentWindow.focus();
        });
      }

      // Forward keys from parent window to iframe if parent has focus
      window.addEventListener('keydown', (e) => {
        if (iframe && iframe.contentWindow && document.activeElement !== iframe) {
          if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
            try {
              iframe.contentWindow.postMessage({
                type: 'forward_keydown',
                code: e.code,
                key: e.key,
                shiftKey: e.shiftKey
              }, '*');
            } catch (err) {}
          }
        }
      });

      window.addEventListener('keyup', (e) => {
        if (iframe && iframe.contentWindow && document.activeElement !== iframe) {
          if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
            try {
              iframe.contentWindow.postMessage({
                type: 'forward_keyup',
                code: e.code,
                key: e.key,
                shiftKey: e.shiftKey
              }, '*');
            } catch (err) {}
          }
        }
      });
      return;
    }

    // Fallback: mount canvas engine directly
    mountEngineFallback(game);
  }

  function mountEngineFallback(game) {
    let canvas = document.getElementById('game-canvas') || document.querySelector('canvas#game-canvas') || document.querySelector('canvas');

    if (!canvas) {
      const container = document.getElementById('canvas-wrapper') || document.querySelector('.canvas-container') || document.body;
      canvas = document.createElement('canvas');
      canvas.id = 'game-canvas';
      canvas.width = 1280;
      canvas.height = 720;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';
      container.appendChild(canvas);
    }
    canvas.style.display = 'block';

    const EngineClass = window.PrototypeEngine;
    if (!EngineClass) {
      console.warn('PrototypeEngine class not found! Using iframe mode.');
      return;
    }

    if (engineInstance) {
      engineInstance.destroy();
      engineInstance = null;
    }

    engineInstance = new EngineClass(canvas, game);
    engineInstance.start();
    canvas.focus();
  }

  /**
   * Wires HUD buttons:
   * - Banish to Crypt (Back to index.html)
   * - Pause Curse / Resume Curse
   * - Resurrect Session (Reset)
   * - Ecto-Sound (Toggle Audio)
   * - Ascend Fullscreen
   */
  function setupPlayerControls() {
    // 1. Back: Banish to Crypt
    const backBtn = document.getElementById('back-btn') || document.querySelector('[data-action="back"]');
    if (backBtn) {
      backBtn.addEventListener('click', (e) => {
        if (backBtn.tagName.toLowerCase() !== 'a') {
          e.preventDefault();
          window.location.href = 'index.html';
        }
      });
    }

    // 2. Pause Curse / Resume Curse
    const pauseBtn = document.getElementById('pause-btn') || document.querySelector('[data-action="pause"]');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        if (gameIframe && gameIframe.contentWindow) {
          isIframePaused = !isIframePaused;
          try {
            gameIframe.contentWindow.postMessage({ type: 'control', action: 'pause' }, '*');
          } catch (e) {}
          pauseBtn.innerHTML = isIframePaused
            ? '<span class="icon">▶</span> <span class="btn-label">Resume Curse</span>'
            : '<span class="icon">⏸</span> <span class="btn-label">Pause Curse</span>';
          pauseBtn.classList.toggle('active', isIframePaused);
          return;
        }

        if (!engineInstance) return;
        const isPaused = engineInstance.togglePause();
        pauseBtn.innerHTML = isPaused
          ? '<span class="icon">▶</span> <span class="btn-label">Resume Curse</span>'
          : '<span class="icon">⏸</span> <span class="btn-label">Pause Curse</span>';
        pauseBtn.classList.toggle('active', isPaused);
      });
    }

    // 3. Resurrect Session
    const resetBtn = document.getElementById('reset-btn') || document.querySelector('[data-action="reset"]');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (gameIframe && gameIframe.contentWindow) {
          try {
            gameIframe.contentWindow.postMessage({ type: 'control', action: 'reset' }, '*');
          } catch (e) {}
          isIframePaused = false;
          if (pauseBtn) {
            pauseBtn.innerHTML = '<span class="icon">⏸</span> <span class="btn-label">Pause Curse</span>';
            pauseBtn.classList.remove('active');
          }
          return;
        }

        if (!engineInstance) return;
        engineInstance.reset();
        if (pauseBtn) {
          pauseBtn.innerHTML = '<span class="icon">⏸</span> <span class="btn-label">Pause Curse</span>';
          pauseBtn.classList.remove('active');
        }
      });
    }

    // 4. Ecto-Sound Toggle
    const soundBtn = document.getElementById('sound-btn') || document.querySelector('[data-action="sound"]');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        if (gameIframe && gameIframe.contentWindow) {
          isIframeMuted = !isIframeMuted;
          try {
            gameIframe.contentWindow.postMessage({ type: 'control', action: 'sound' }, '*');
          } catch (e) {}
          soundBtn.innerHTML = isIframeMuted
            ? '<span class="icon">🔇</span> <span class="btn-label">Ecto-Sound: Off</span>'
            : '<span class="icon">🔊</span> <span class="btn-label">Ecto-Sound: On</span>';
          soundBtn.classList.toggle('muted', isIframeMuted);
          return;
        }

        if (!engineInstance) return;
        const isMuted = engineInstance.toggleSound();
        soundBtn.innerHTML = isMuted
          ? '<span class="icon">🔇</span> <span class="btn-label">Ecto-Sound: Off</span>'
          : '<span class="icon">🔊</span> <span class="btn-label">Ecto-Sound: On</span>';
        soundBtn.classList.toggle('muted', isMuted);
      });
    }

    // 5. Ascend to Fullscreen
    const fsBtn = document.getElementById('fullscreen-btn') || document.querySelector('[data-action="fullscreen"]');
    if (fsBtn) {
      fsBtn.addEventListener('click', () => {
        toggleFullscreen();
      });
    }

    // Global Key Bindings
    window.addEventListener('keydown', (e) => {
      if (e.key === 'f' || e.key === 'F') {
        if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
          e.preventDefault();
          toggleFullscreen();
        }
      }
    });
  }

  /**
   * Toggles browser fullscreen mode.
   */
  function toggleFullscreen() {
    const target = document.querySelector('.arcade-cabinet-frame') || document.getElementById('canvas-wrapper') || document.getElementById('game-canvas');
    if (!target) return;

    if (!document.fullscreenElement) {
      if (target.requestFullscreen) {
        target.requestFullscreen();
      } else if (target.webkitRequestFullscreen) {
        target.webkitRequestFullscreen();
      } else if (target.msRequestFullscreen) {
        target.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  /**
   * Formats camelCase keys to Title Case.
   */
  function formatKey(key) {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
  }

  /**
   * Escapes HTML for security.
   */
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPlay);
  } else {
    initPlay();
  }

  // Export to window
  window.GhostPlayer = {
    init: initPlay,
    getEngine: () => engineInstance,
    getCurrentGame: () => currentGame
  };
})();
