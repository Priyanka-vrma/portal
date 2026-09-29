/**
 * The Haunted Arcade - Portal Application Logic (app.js)
 * Manages game catalog fetching, tombstone card rendering, live filtering,
 * search archives, procedural Web Audio spooky sound effects, and summon navigation.
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
        chassisWeight: "1,240 kg (50:50 distribution)",
        engineOutput: "620 BHP @ 8,200 RPM Twin-Turbo",
        lateralGripCoeff: "1.35 G (Dry) / 0.88 G (Drift Slip)",
        aerodynamicDrag: "0.31 Cd with active rear wing"
      },
      controls: {
        "Accelerate": "W / Up Arrow",
        "Brake / Reverse": "S / Down Arrow",
        "Steer": "A / D or Arrows",
        "Handbrake": "Spacebar",
        "Nitrous": "Left Shift"
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
        chassisWeight: "1,190 kg (FIA Rally spec)",
        engineOutput: "380 BHP @ 6,500 RPM Turbocharged",
        lateralGripCoeff: "0.82 G (Loose Gravel) / 1.10 G (Clay)",
        aerodynamicDrag: "0.38 Cd (High downforce package)"
      },
      controls: {
        "Accelerate": "W / Up Arrow",
        "Brake / Reverse": "S / Down Arrow",
        "Steer": "A / D or Arrows",
        "Handbrake": "Spacebar"
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
        chassisWeight: "1,420 kg (Carbon-monocoque chassis)",
        engineOutput: "1,100 BHP Quad-Turbo W16 Hybrid",
        lateralGripCoeff: "1.45 G at 250+ km/h (Active Aero Ground Effect)",
        aerodynamicDrag: "0.26 Cd in Low-Drag Mode"
      },
      controls: {
        "Accelerate": "W / Up Arrow",
        "Brake": "S / Down Arrow",
        "Steer": "A / D or Arrows",
        "DRS / Aero Wing": "Spacebar"
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
        chassisWeight: "798 kg (Formula Spec with Driver)",
        engineOutput: "1,000 BHP 1.6L V6 Turbo Hybrid",
        lateralGripCoeff: "3.80 G Peak (High Downforce High Speed Apex)",
        aerodynamicDrag: "0.72 Cd (High Downforce Configuration)"
      },
      controls: {
        "Throttle": "W / Up Arrow",
        "Trail-Brake": "S / Down Arrow",
        "Steer": "A / D or Arrows",
        "Overtake / ERS": "Spacebar"
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
        chassisWeight: "2,400 kg (Tubular steel spaceframe)",
        engineOutput: "925 BHP Naturally Aspirated V8",
        lateralGripCoeff: "0.75 G (Soft Dune Sand) / 0.95 G (Hard Pack)",
        aerodynamicDrag: "0.55 Cd (Open desert aero)"
      },
      controls: {
        "Throttle": "W / Up Arrow",
        "Brake": "S / Down Arrow",
        "Steer": "A / D or Arrows",
        "Rear Brake": "Spacebar"
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
        caliber: "9x39mm Subsonic AP / 5.7x28mm Armor Piercing",
        muzzleVelocity: "310 m/s (Suppressed Subsonic)",
        effectiveRange: "120 m tactical ceiling",
        recoilImpulse: "2.1 Ns (Low felt recoil with suppressor dampener)"
      },
      controls: {
        "Move": "W, A, S, D",
        "Aim": "Mouse Cursor",
        "Fire": "Left Mouse Click",
        "Tactical Roll": "Spacebar"
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
        caliber: ".338 Lapua Magnum (250 gr Scenar HPBT)",
        muzzleVelocity: "915 m/s (Extreme flat trajectory)",
        effectiveRange: "1,500+ meters",
        kineticEnergy: "6,700 Joules at muzzle"
      },
      controls: {
        "Move": "W, A, S, D",
        "Aim": "Mouse Cursor",
        "Hold Breath": "Right Mouse Click (Hold)",
        "Fire": "Left Mouse Click"
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
        "Destructible fortifications and modular upgrades"
      ],
      physicsSpecs: {
        ordnanceCaliber: "155mm L/52 Howitzer & 35mm Twin Autocannon",
        muzzleVelocity: "827 m/s (Howitzer HE) / 1,175 m/s (Autocannon APDS)",
        blastRadius: "45 meters lethal fragmentation zone",
        armorRating: "Level V Composite RHA & Spall Liner"
      },
      controls: {
        "Traverse Turret": "Mouse Cursor",
        "Autocannon Fire": "Left Mouse Click",
        "155mm Ordnance": "Right Mouse Click",
        "Tactical Drone": "Spacebar"
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
        serviceWeapons: "12-Gauge Breaching Shotgun & 5.56mm SBR Carbine",
        muzzleVelocity: "410 m/s (00 Buckshot) / 790 m/s (5.56 NATO)",
        doorBreachingImpulse: "14,000 N kinetic explosive detonation",
        flashbangStunRadius: "8 meters disorientation radius"
      },
      controls: {
        "Move Operator": "W, A, S, D",
        "Aim Reticle": "Mouse Cursor",
        "Fire Weapon": "Left Mouse Click",
        "Flashbang / Charge": "Right Mouse Click / G",
        "Squad Stack Command": "Spacebar"
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
        mechTonnage: "85 Metric Tons (Assault Battlemech Class)",
        topCruisingSpeed: "64.8 km/h (Powered by 340 Fusion Core)",
        torsoTwistAngle: "+/- 110 degrees independent traverse",
        heatCapacity: "60 Heat Units before emergency scram"
      },
      controls: {
        "Move Legs": "W / S",
        "Turn Chassis": "A / D",
        "Aim Torso": "Mouse Cursor",
        "Fire Group 1": "Left Mouse Click",
        "Fire Missiles": "Right Mouse Click",
        "Jump Jets": "Spacebar (Hold)"
      },
      engineMode: "combat",
      theme: "mech-frontline"
    }
  ];

  // Procedural Web Audio API Sound Effects Synthesizer for Haunted Arcade
  const SpookyAudio = {
    ctx: null,
    hasInteracted: false,

    init() {
      if (this.ctx) return;
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      } catch (e) {
        // Audio unavailable
      }
    },

    resume() {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    },

    // Cute ghostly whistle/whisper on card/button hover
    playGhostHover() {
      this.init();
      if (!this.ctx) return;
      this.resume();

      try {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        // Gentle airy sliding frequencies
        const baseFreq = 520 + Math.random() * 80;
        osc.frequency.setValueAtTime(baseFreq, t);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.35, t + 0.12);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.045, t + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.2);
      } catch (e) {}
    },

    // Playful ghostly boo / chime on click or filter switch
    playGhostChime() {
      this.init();
      if (!this.ctx) return;
      this.resume();

      try {
        const t = this.ctx.currentTime;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'triangle';

        osc1.frequency.setValueAtTime(440, t);
        osc1.frequency.exponentialRampToValueAtTime(659.25, t + 0.15); // A4 -> E5
        osc2.frequency.setValueAtTime(880, t);
        osc2.frequency.exponentialRampToValueAtTime(1046.5, t + 0.18); // A5 -> C6

        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(t);
        osc2.start(t);
        osc1.stop(t + 0.26);
        osc2.stop(t + 0.26);
      } catch (e) {}
    },

    // Grand triumphant ectoplasm summon chime
    playSummonSound() {
      this.init();
      if (!this.ctx) return;
      this.resume();

      try {
        const t = this.ctx.currentTime;
        const freqs = [329.63, 392.00, 493.88, 659.25, 987.77]; // E minor spectral arpeggio

        freqs.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = (idx % 2 === 0) ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(freq, t + idx * 0.05);

          const startTime = t + idx * 0.05;
          gain.gain.setValueAtTime(0.001, startTime);
          gain.gain.linearRampToValueAtTime(0.07, startTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.45);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + 0.5);
        });
      } catch (e) {}
    }
  };

  // State Management
  let allGames = [];
  let currentCategory = 'all'; // 'all' | 'racing' | 'combat'
  let currentSearchQuery = '';

  // DOM Elements Cache
  const elements = {
    grid: document.getElementById('games-grid') || document.querySelector('.games-grid') || document.querySelector('.tombstone-grid'),
    count: document.getElementById('games-count') || document.getElementById('game-counter') || document.querySelector('.games-count'),
    searchInput: document.getElementById('search-input') || document.querySelector('.search-input') || document.querySelector('input[type="search"]'),
    countAll: document.getElementById('count-all'),
    countRacing: document.getElementById('count-racing'),
    countCombat: document.getElementById('count-combat')
  };

  /**
   * Initializes The Haunted Arcade portal.
   */
  async function init() {
    injectTombstoneStyles();
    allGames = await loadGamesData();
    setupEventListeners();
    updateCategoryCounts();
    render();
  }

  /**
   * Injects tombstone card styling rules if not present in CSS,
   * guaranteeing the Haunted Arcade theme is flawless out-of-the-box.
   */
  function injectTombstoneStyles() {
    if (document.getElementById('haunted-tombstone-styles')) return;

    const style = document.createElement('style');
    style.id = 'haunted-tombstone-styles';
    style.textContent = `
      /* Haunted Arcade Tombstone Card Styles */
      .tombstone-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
        gap: 32px 26px;
        padding-top: 10px;
      }

      .tombstone-card {
        position: relative;
        background: linear-gradient(180deg, #1b2230 0%, #111622 25%, #0a0d14 100%);
        border: 2px solid rgba(0, 255, 136, 0.22);
        border-radius: 46px 46px 18px 18px;
        box-shadow: 0 14px 34px -8px rgba(0, 0, 0, 0.8), 0 0 15px rgba(0, 255, 136, 0.08);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.28s ease, border-color 0.28s ease;
        cursor: pointer;
      }

      .tombstone-card.spectral-combat-card {
        border-color: rgba(168, 85, 247, 0.28);
        box-shadow: 0 14px 34px -8px rgba(0, 0, 0, 0.8), 0 0 15px rgba(168, 85, 247, 0.08);
      }

      .tombstone-card:hover {
        transform: translateY(-8px) scale(1.015);
        border-color: #00ff88;
        box-shadow: 0 22px 48px -10px rgba(0, 0, 0, 0.95), 0 0 28px rgba(0, 255, 136, 0.35);
      }

      .tombstone-card.spectral-combat-card:hover {
        border-color: #c084fc;
        box-shadow: 0 22px 48px -10px rgba(0, 0, 0, 0.95), 0 0 28px rgba(168, 85, 247, 0.4);
      }

      /* Stone Arch Header */
      .tombstone-arch-header {
        position: relative;
        padding: 16px 20px 10px;
        text-align: center;
        background: radial-gradient(ellipse at 50% 0%, rgba(255, 255, 255, 0.06) 0%, transparent 80%);
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      }

      .tombstone-cracks-svg {
        position: absolute;
        top: 4px;
        right: 18px;
        width: 32px;
        height: 32px;
        stroke: rgba(255, 255, 255, 0.25);
        stroke-width: 1.5;
        fill: none;
        pointer-events: none;
      }

      .tombstone-rip-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-family: 'Creepster', 'Fredoka', cursive, sans-serif;
        font-size: 1.15rem;
        letter-spacing: 0.1em;
        color: #00ff88;
        text-shadow: 0 0 8px rgba(0, 255, 136, 0.6);
        background: rgba(0, 0, 0, 0.4);
        padding: 2px 14px;
        border-radius: 999px;
        border: 1px solid rgba(0, 255, 136, 0.35);
      }

      .spectral-combat-card .tombstone-rip-badge {
        color: #c084fc;
        text-shadow: 0 0 8px rgba(168, 85, 247, 0.6);
        border-color: rgba(168, 85, 247, 0.4);
      }

      .tombstone-serial-text {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.68rem;
        color: #8a99ad;
        margin-top: 3px;
        letter-spacing: 0.08em;
      }

      /* Media Poster Container */
      .tombstone-poster-wrap {
        position: relative;
        width: 100%;
        height: 200px;
        overflow: hidden;
        background: #06080d;
      }

      .tombstone-poster-wrap img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.4s ease;
      }

      .tombstone-card:hover .tombstone-poster-wrap img {
        transform: scale(1.06);
      }

      .tombstone-badge-overlay {
        position: absolute;
        top: 10px;
        left: 12px;
        right: 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        pointer-events: none;
      }

      .tombstone-badge-cat {
        font-family: 'Fredoka', sans-serif;
        font-size: 0.76rem;
        font-weight: 600;
        padding: 4px 10px;
        border-radius: 999px;
        background: rgba(7, 10, 20, 0.88);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: #f3f4f6;
        backdrop-filter: blur(8px);
      }

      .tombstone-badge-rating {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.74rem;
        font-weight: 700;
        padding: 4px 10px;
        border-radius: 999px;
        background: rgba(0, 255, 136, 0.16);
        border: 1px solid rgba(0, 255, 136, 0.4);
        color: #00ff88;
        backdrop-filter: blur(8px);
      }

      .spectral-combat-card .tombstone-badge-rating {
        background: rgba(168, 85, 247, 0.18);
        border-color: rgba(168, 85, 247, 0.45);
        color: #c084fc;
      }

      /* Hover Summon Banner */
      .tombstone-hover-summon {
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at center, rgba(0, 255, 136, 0.25) 0%, rgba(7, 10, 20, 0.75) 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.24s ease;
        pointer-events: none;
      }

      .spectral-combat-card .tombstone-hover-summon {
        background: radial-gradient(circle at center, rgba(168, 85, 247, 0.3) 0%, rgba(7, 10, 20, 0.75) 100%);
      }

      .tombstone-card:hover .tombstone-hover-summon {
        opacity: 1;
      }

      .hover-summon-pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 22px;
        background: #00ff88;
        color: #070a14;
        font-family: 'Fredoka', sans-serif;
        font-weight: 700;
        font-size: 0.95rem;
        border-radius: 999px;
        box-shadow: 0 0 20px rgba(0, 255, 136, 0.7);
        transform: translateY(6px);
        transition: transform 0.24s ease;
      }

      .spectral-combat-card .hover-summon-pill {
        background: #c084fc;
        box-shadow: 0 0 20px rgba(168, 85, 247, 0.8);
      }

      .tombstone-card:hover .hover-summon-pill {
        transform: translateY(0);
      }

      /* Inscription Body */
      .tombstone-inscriptions {
        padding: 20px;
        display: flex;
        flex-direction: column;
        flex: 1;
      }

      .tombstone-game-title {
        font-family: 'Fredoka', 'Creepster', sans-serif;
        font-size: 1.35rem;
        font-weight: 700;
        color: #ffffff;
        margin-bottom: 4px;
        line-height: 1.25;
      }

      .tombstone-curse-title {
        font-family: 'Creepster', cursive;
        font-size: 1.02rem;
        color: #00ff88;
        letter-spacing: 0.05em;
        margin-bottom: 6px;
      }

      .spectral-combat-card .tombstone-curse-title {
        color: #c084fc;
      }

      .tombstone-desc {
        font-size: 0.86rem;
        color: #cbd5e1;
        line-height: 1.5;
        margin-bottom: 14px;
      }

      /* Haunting Warning Box */
      .tombstone-warning-box {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        padding: 8px 12px;
        background: rgba(239, 68, 68, 0.08);
        border: 1px dashed rgba(239, 68, 68, 0.32);
        border-radius: 8px;
        margin-bottom: 14px;
        font-size: 0.78rem;
        color: #fca5a5;
        line-height: 1.4;
      }

      .tombstone-warning-box .warning-ghost-icon {
        font-size: 1rem;
        flex-shrink: 0;
      }

      /* Physics Specs Pills */
      .tombstone-specs-row {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 12px;
      }

      .tombstone-spec-chip {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.72rem;
        padding: 3px 8px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 6px;
        color: #94a3b8;
      }

      .tombstone-spec-chip strong {
        color: #f1f5f9;
      }

      /* Phantom Tags */
      .tombstone-tags-row {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        margin-bottom: 18px;
      }

      .tombstone-tag-pill {
        font-size: 0.72rem;
        padding: 2px 8px;
        border-radius: 999px;
        background: rgba(0, 255, 136, 0.08);
        border: 1px solid rgba(0, 255, 136, 0.2);
        color: #00ff88;
      }

      .spectral-combat-card .tombstone-tag-pill {
        background: rgba(168, 85, 247, 0.1);
        border-color: rgba(168, 85, 247, 0.25);
        color: #d8b4fe;
      }

      /* Footer & Summon Button */
      .tombstone-card-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: auto;
        padding-top: 12px;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
      }

      .tombstone-author-info {
        font-size: 0.76rem;
        color: #64748b;
        font-family: 'JetBrains Mono', monospace;
      }

      .btn-summon-game {
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 18px;
        background: linear-gradient(135deg, #00ff88, #10b981);
        color: #070a14;
        font-family: 'Fredoka', sans-serif;
        font-size: 0.88rem;
        font-weight: 700;
        border-radius: 10px;
        box-shadow: 0 0 16px rgba(0, 255, 136, 0.45);
        text-decoration: none;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .spectral-combat-card .btn-summon-game {
        background: linear-gradient(135deg, #c084fc, #9333ea);
        color: #ffffff;
        box-shadow: 0 0 16px rgba(168, 85, 247, 0.5);
      }

      .btn-summon-game:hover {
        transform: scale(1.05);
        box-shadow: 0 0 24px rgba(0, 255, 136, 0.7);
      }

      .spectral-combat-card .btn-summon-game:hover {
        box-shadow: 0 0 24px rgba(168, 85, 247, 0.8);
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Loads games from data/games.json with fallback.
   */
  async function loadGamesData() {
    try {
      const response = await fetch('data/games.json', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) return data;
      throw new Error('Parsed games array is empty');
    } catch (err) {
      console.info('Loaded fallback embedded games dataset:', err.message);
      return FALLBACK_GAMES;
    }
  }

  /**
   * Configures event listeners for search, filter tabs, and audio.
   */
  function setupEventListeners() {
    // Search input
    if (elements.searchInput) {
      elements.searchInput.addEventListener('input', (e) => {
        currentSearchQuery = (e.target.value || '').trim().toLowerCase();
        render();
      });
    }

    // Filter tabs
    const tabButtons = document.querySelectorAll('[data-category], .filter-pill, .filter-btn');
    tabButtons.forEach((tab) => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        SpookyAudio.playGhostChime();
        const category = tab.getAttribute('data-category') || getCategoryFromText(tab.textContent);
        setCategory(category, tab);
      });

      tab.addEventListener('mouseenter', () => {
        SpookyAudio.playGhostHover();
      });
    });

    // Keyboard shortcut '/' to focus search
    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== elements.searchInput && elements.searchInput) {
        e.preventDefault();
        elements.searchInput.focus();
      }
    });

    // Lazy init audio on first user touch/click/keypress anywhere
    const triggerAudio = () => {
      SpookyAudio.init();
      SpookyAudio.resume();
      window.removeEventListener('pointerdown', triggerAudio);
      window.removeEventListener('keydown', triggerAudio);
    };
    window.addEventListener('pointerdown', triggerAudio, { passive: true });
    window.addEventListener('keydown', triggerAudio, { passive: true });
  }

  /**
   * Helper to determine category key from text.
   */
  function getCategoryFromText(text) {
    const t = (text || '').toLowerCase();
    if (t.includes('race') || t.includes('racing') || t.includes('phantom')) return 'racing';
    if (t.includes('combat') || t.includes('arms') || t.includes('spectral')) return 'combat';
    return 'all';
  }

  /**
   * Sets the active category filter and updates UI.
   */
  function setCategory(categoryKey) {
    currentCategory = (categoryKey || 'all').toLowerCase();

    const tabButtons = document.querySelectorAll('[data-category], .filter-pill, .filter-btn');
    tabButtons.forEach((btn) => {
      const bCat = (btn.getAttribute('data-category') || getCategoryFromText(btn.textContent)).toLowerCase();
      const isActive = (bCat === currentCategory) || (currentCategory === 'all' && (bCat === 'all' || bCat === ''));
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    render();
  }

  /**
   * Updates pill counts in filter tabs.
   */
  function updateCategoryCounts() {
    const allCount = allGames.length;
    const racingCount = allGames.filter(g => (g.categoryKey || '').toLowerCase() === 'racing').length;
    const combatCount = allGames.filter(g => (g.categoryKey || '').toLowerCase() === 'combat').length;

    if (elements.countAll) elements.countAll.textContent = String(allCount);
    if (elements.countRacing) elements.countRacing.textContent = String(racingCount);
    if (elements.countCombat) elements.countCombat.textContent = String(combatCount);
  }

  /**
   * Filters games according to active category and search query.
   */
  function getFilteredGames() {
    return allGames.filter((game) => {
      // Category filter
      const gameCat = (game.categoryKey || (game.category && game.category.toLowerCase().includes('race') ? 'racing' : 'combat')).toLowerCase();
      if (currentCategory !== 'all' && currentCategory !== '' && gameCat !== currentCategory) {
        return false;
      }

      // Live search filter across title, subtitle, description, tags, curse, warning, and physics specs
      if (currentSearchQuery) {
        const q = currentSearchQuery;
        const inTitle = (game.title || '').toLowerCase().includes(q);
        const inSubtitle = (game.subtitle || '').toLowerCase().includes(q);
        const inDesc = (game.description || '').toLowerCase().includes(q);
        const inCurse = (game.curse || '').toLowerCase().includes(q);
        const inWarning = (game.hauntingWarning || '').toLowerCase().includes(q);
        const inCat = (game.category || '').toLowerCase().includes(q);
        const inCart = (game.cursedCartridgeNumber || '').toLowerCase().includes(q);
        const inSerial = (game.cursedSerial || '').toLowerCase().includes(q);
        const inTags = Array.isArray(game.tags) && game.tags.some(tag => tag.toLowerCase().includes(q));
        const inSpecs = game.physicsSpecs && Object.values(game.physicsSpecs).some(val => String(val).toLowerCase().includes(q));

        if (!inTitle && !inSubtitle && !inDesc && !inCurse && !inWarning && !inCat && !inCart && !inSerial && !inTags && !inSpecs) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Renders tombstone cards into the grid container.
   */
  function render() {
    const grid = elements.grid || document.getElementById('games-grid') || document.querySelector('.tombstone-grid') || document.querySelector('.games-grid');
    if (!grid) return;

    const filtered = getFilteredGames();

    // Update live counter badge ("Showing X of 10 Spirits")
    updateCounter(filtered.length, allGames.length);

    // Empty state
    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 4rem 1.5rem; background: rgba(15, 23, 42, 0.7); border: 2px dashed rgba(0, 255, 136, 0.3); border-radius: 20px; color: #94a3b8;">
          <div style="font-size: 3.5rem; margin-bottom: 1rem; animation: float 3s ease-in-out infinite;">👻</div>
          <h3 style="color: #f3f4f6; font-family: 'Creepster', cursive; font-size: 1.8rem; margin-bottom: 0.5rem; letter-spacing: 0.05em;">No Restless Spirits Manifested</h3>
          <p style="margin-bottom: 1.5rem; font-size: 0.95rem;">No cursed cartridge matched your incantation: "<strong>${escapeHtml(currentSearchQuery)}</strong>"</p>
          <button id="reset-filter-btn" style="background: linear-gradient(135deg, #00ff88, #10b981); color: #070a14; border: none; padding: 0.75rem 1.75rem; border-radius: 999px; cursor: pointer; font-weight: 700; font-family: 'Fredoka', sans-serif; font-size: 1rem; box-shadow: 0 0 16px rgba(0,255,136,0.5);">Cleanse Crypt Search</button>
        </div>
      `;

      const resetBtn = document.getElementById('reset-filter-btn');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          SpookyAudio.playGhostChime();
          currentSearchQuery = '';
          currentCategory = 'all';
          if (elements.searchInput) elements.searchInput.value = '';
          setCategory('all');
        });
      }
      return;
    }

    // Render tombstone cards
    grid.innerHTML = filtered.map((game) => createTombstoneCardHtml(game)).join('');

    // Attach card click & hover audio handlers
    const cards = grid.querySelectorAll('.tombstone-card, .game-card');
    cards.forEach((card) => {
      const gameId = card.getAttribute('data-game-id');
      if (!gameId) return;

      // Play soft ghostly sound on hover
      card.addEventListener('mouseenter', () => {
        SpookyAudio.playGhostHover();
      });

      // Navigation handler with summon sound
      const handleSummon = (e) => {
        if (e) e.preventDefault();
        SpookyAudio.playSummonSound();
        setTimeout(() => {
          window.location.href = `play.html?id=${encodeURIComponent(gameId)}`;
        }, 120);
      };

      card.addEventListener('click', (e) => {
        handleSummon(e);
      });

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (e.target === card) {
            e.preventDefault();
            handleSummon(e);
          }
        }
      });
    });
  }

  /**
   * Generates HTML markup for a single Tombstone Game Card.
   */
  function createTombstoneCardHtml(game) {
    const isRacing = (game.categoryKey === 'racing') || (game.category && game.category.toLowerCase().includes('race'));
    const cardClass = isRacing ? 'phantom-racer-card' : 'spectral-combat-card';
    const categoryLabel = isRacing ? '🏎️ Phantom Racer' : '⚔️ Spectral Combat';
    const categoryBadgeClass = isRacing ? 'badge-racing' : 'badge-combat';
    const ripBadge = game.cursedCartridgeNumber || (isRacing ? 'CURSED #01' : 'CURSED #06');
    const serial = game.cursedSerial || `GHOST-CART-${game.id.toUpperCase()}`;
    const ectoRating = game.ectoRating || `${Number(game.rating).toFixed(1)} Ecto-Stars`;

    // 2 key physics specs
    const specsEntries = game.physicsSpecs ? Object.entries(game.physicsSpecs).slice(0, 2) : [];
    const specsChips = specsEntries.map(([k, v]) => `
      <span class="tombstone-spec-chip spec-pill" title="${escapeHtml(k)}: ${escapeHtml(v)}">
        <strong>${escapeHtml(formatKey(k))}:</strong> ${escapeHtml(v)}
      </span>
    `).join('');

    // Tags
    const tagsHtml = (game.tags || []).slice(0, 3).map((tag) => `
      <span class="tombstone-tag-pill tag-pill">${escapeHtml(tag)}</span>
    `).join('');

    const thumbnailSrc = game.thumbnail || `assets/${game.id}.svg`;

    return `
      <article class="tombstone-card game-card ${cardClass}" data-game-id="${escapeHtml(game.id)}" tabindex="0" role="button" aria-label="${escapeHtml(game.title)}">
        <!-- Tombstone Stone Arch Top -->
        <div class="tombstone-arch-header">
          <!-- Crack Detailing SVG -->
          <svg class="tombstone-cracks-svg" viewBox="0 0 40 40" aria-hidden="true">
            <path d="M 5 2 L 18 16 L 14 24 L 28 32 L 24 38 M 18 16 L 26 12 L 35 18" />
          </svg>
          <div class="tombstone-rip-badge">${escapeHtml(ripBadge)}</div>
          <div class="tombstone-serial-text">SERIAL: ${escapeHtml(serial)}</div>
        </div>

        <!-- Poster Image Media Wrap -->
        <div class="tombstone-poster-wrap card-media">
          <img src="${thumbnailSrc}" alt="${escapeHtml(game.title)}" class="card-thumb" loading="lazy" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'400\\' height=\\'225\\' viewBox=\\'0 0 400 225\\'><rect width=\\'400\\' height=\\'225\\' fill=\\'%23070a14\\'/><text x=\\'50%\\' y=\\'50%\\' fill=\\'%2300ff88\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' font-family=\\'sans-serif\\' font-weight=\\'bold\\' font-size=\\'16\\'>${encodeURIComponent(game.title)}</text></svg>';">
          <div class="tombstone-badge-overlay card-badge-wrap">
            <span class="tombstone-badge-cat category-pill ${categoryBadgeClass}">${categoryLabel}</span>
            <span class="tombstone-badge-rating rating-pill">⭐ ${escapeHtml(ectoRating)}</span>
          </div>
          <div class="tombstone-hover-summon card-hover-overlay">
            <span class="hover-summon-pill hover-play-btn">
              <span class="icon">🔮</span> SUMMON GAME
            </span>
          </div>
        </div>

        <!-- Tombstone Inscription Content Body -->
        <div class="tombstone-inscriptions card-body">
          <h3 class="tombstone-game-title card-title">${escapeHtml(game.title)}</h3>
          <div class="tombstone-curse-title">${escapeHtml(game.curse || 'Ancient Cartridge Curse')}</div>
          <p class="tombstone-desc card-desc">${escapeHtml(truncate(game.description, 115))}</p>

          <!-- Hilarious Haunting Warning -->
          <div class="tombstone-warning-box">
            <span class="warning-ghost-icon">👻</span>
            <span>${escapeHtml(game.hauntingWarning || 'Warning: May manifest supernatural thrills during gameplay.')}</span>
          </div>

          <!-- Key Physics & Ballistics Specs -->
          <div class="tombstone-specs-row card-specs">
            ${specsChips}
          </div>

          <!-- Phantom Tags -->
          <div class="tombstone-tags-row card-tags">
            ${tagsHtml}
          </div>

          <!-- Card Footer with Summon Button -->
          <div class="tombstone-card-footer card-footer">
            <span class="tombstone-author-info author-label">${escapeHtml(game.author || 'Ghost Interactive')}</span>
            <a href="play.html?id=${encodeURIComponent(game.id)}" class="btn-summon-game btn-launch" onclick="event.stopPropagation();">
              <span>Summon Game</span>
              <span aria-hidden="true">🔮</span>
            </a>
          </div>
        </div>
      </article>
    `;
  }

  /**
   * Updates game counter elements ("Showing X of 10 Spirits").
   */
  function updateCounter(filteredCount, totalCount) {
    const counterElements = document.querySelectorAll('#games-count, #game-counter, .games-count, .game-count-label');
    const text = (currentCategory === 'all' && !currentSearchQuery)
      ? `Showing all ${filteredCount} Spirits`
      : `Showing ${filteredCount} of ${totalCount} Spirits`;

    counterElements.forEach((el) => {
      el.textContent = text;
    });
  }

  /**
   * Truncates text with ellipsis.
   */
  function truncate(str, maxLen) {
    if (!str) return '';
    return str.length > maxLen ? str.substring(0, maxLen).trim() + '...' : str;
  }

  /**
   * Helper to format camelCase keys into Title Case labels.
   */
  function formatKey(key) {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
  }

  /**
   * Escapes HTML to avoid injection.
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

  // Auto-init on DOMContentLoaded or immediate if ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export to window for testing / debugging
  window.GhostApp = {
    init,
    setCategory,
    getFilteredGames,
    getGames: () => allGames,
    SpookyAudio
  };
})();
