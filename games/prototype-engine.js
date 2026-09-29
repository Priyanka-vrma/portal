/**
 * Ghost Gaming Portal - Universal Prototype Engine (prototype-engine.js)
 * High-performance, modular HTML5 Canvas 2D game engine providing authentic
 * simulation baselines for both Realistic Racing and Tactical Arms & Combat titles.
 *
 * Includes:
 * - Real 2D physics (vehicle drift dynamics, tire slip, aero drag, ballistics, wind drift, collisions)
 * - Procedural Web Audio API sound synthesizer (no external sound files required)
 * - Particle engine (smoke, sparks, mud, fire, bullet tracers, shockwaves)
 * - Custom themes & environments per game ID
 * - Full telemetry HUD, Minimap radar, and touch/gamepad controls support
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PrototypeEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // =========================================================================
  // 1. PROCEDURAL AUDIO SYNTHESIZER (WEB AUDIO API)
  // =========================================================================
  class AudioSynth {
    constructor() {
      this.ctx = null;
      this.muted = false;
      this.masterGain = null;
      this.engineOsc = null;
      this.engineFilter = null;
      this.engineGain = null;
      this.isEngineRunning = false;
      this.tireNoiseNode = null;
      this.tireGain = null;
    }

    init() {
      if (this.ctx) return;
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.6, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      } catch (e) {
        console.warn('Web Audio initialization failed:', e);
      }
    }

    resume() {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }

    setMuted(muted) {
      this.muted = muted;
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.6, this.ctx.currentTime);
      }
    }

    toggleMute() {
      this.setMuted(!this.muted);
      return this.muted;
    }

    // Vehicle Engine Sound Generator
    startEngineSound() {
      if (!this.ctx || this.isEngineRunning) return;
      try {
        this.engineOsc = this.ctx.createOscillator();
        this.engineOsc.type = 'sawtooth';
        this.engineOsc.frequency.setValueAtTime(55, this.ctx.currentTime);

        this.engineFilter = this.ctx.createBiquadFilter();
        this.engineFilter.type = 'lowpass';
        this.engineFilter.frequency.setValueAtTime(350, this.ctx.currentTime);
        this.engineFilter.Q.setValueAtTime(3.0, this.ctx.currentTime);

        this.engineGain = this.ctx.createGain();
        this.engineGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

        this.engineOsc.connect(this.engineFilter);
        this.engineFilter.connect(this.engineGain);
        this.engineGain.connect(this.masterGain);

        this.engineOsc.start();
        this.isEngineRunning = true;
      } catch (e) {}
    }

    updateEngineSound(rpmRatio, throttle) {
      if (!this.ctx || !this.isEngineRunning || !this.engineOsc) return;
      const t = this.ctx.currentTime;
      const baseFreq = 50 + rpmRatio * 160;
      const filterFreq = 300 + rpmRatio * 1200 + (throttle ? 400 : 0);
      const volume = (0.04 + rpmRatio * 0.12 + (throttle ? 0.05 : 0)) * (this.muted ? 0 : 1);

      this.engineOsc.frequency.setTargetAtTime(baseFreq, t, 0.05);
      this.engineFilter.frequency.setTargetAtTime(filterFreq, t, 0.05);
      this.engineGain.gain.setTargetAtTime(volume, t, 0.05);
    }

    stopEngineSound() {
      if (this.engineOsc) {
        try {
          this.engineOsc.stop();
          this.engineOsc.disconnect();
        } catch (e) {}
        this.engineOsc = null;
        this.isEngineRunning = false;
      }
    }

    // Tire Screech Noise
    playTireScreech(intensity = 0.5) {
      if (!this.ctx || this.muted) return;
      const bufferSize = this.ctx.sampleRate * 0.08;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1100 + Math.random() * 400, this.ctx.currentTime);
      filter.Q.setValueAtTime(4, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(Math.min(0.18, intensity * 0.18), this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      noise.start();
    }

    // Weapons / Combat Sounds
    playGunshot(type = 'rifle') {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;

      // Click / Transient Oscillator
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      if (type === 'silenced' || type === 'smg') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(380, t);
        osc.frequency.exponentialRampToValueAtTime(70, t + 0.06);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.07);
      } else if (type === 'sniper') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.35);
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.45);
        this.playNoiseCrack(0.35, 800, 0.4);
      } else if (type === 'cannon' || type === 'mortar') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, t);
        osc.frequency.exponentialRampToValueAtTime(20, t + 0.6);
        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.65);
        this.playNoiseCrack(0.5, 400, 0.5);
      } else if (type === 'laser' || type === 'ppc') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(900, t);
        osc.frequency.exponentialRampToValueAtTime(90, t + 0.18);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.2);
      } else {
        // Standard Shotgun / Assault Rifle
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.12);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.13);
        this.playNoiseCrack(0.2, 1200, 0.15);
      }
    }

    playNoiseCrack(duration, freq, volume) {
      if (!this.ctx || this.muted) return;
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      noise.start();
    }

    playExplosion() {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(90, t);
      osc.frequency.exponentialRampToValueAtTime(25, t + 0.6);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.65);
      this.playNoiseCrack(0.7, 500, 0.45);
    }

    playHit() {
      if (!this.ctx || this.muted) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    }

    playReload() {
      if (!this.ctx || this.muted) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(700, this.ctx.currentTime);
      osc.frequency.setValueAtTime(900, this.ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.16);
    }

    playChime() {
      if (!this.ctx || this.muted) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, this.ctx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.42);
    }
  }

  // =========================================================================
  // 2. PARTICLE SYSTEM
  // =========================================================================
  class ParticleEmitter {
    constructor() {
      this.particles = [];
      this.maxParticles = 600;
    }

    emit(config) {
      if (this.particles.length >= this.maxParticles) {
        this.particles.splice(0, 10);
      }
      this.particles.push({
        x: config.x,
        y: config.y,
        vx: config.vx || 0,
        vy: config.vy || 0,
        color: config.color || '#ffffff',
        size: config.size || 3,
        alpha: config.alpha !== undefined ? config.alpha : 1.0,
        decay: config.decay || 0.03,
        grow: config.grow || 0,
        shape: config.shape || 'circle'
      });
    }

    emitBurst(x, y, count, options = {}) {
      for (let i = 0; i < count; i++) {
        const speed = (options.speed || 3) * (0.3 + Math.random() * 0.7);
        const angle = options.angle !== undefined
          ? options.angle + (Math.random() - 0.5) * (options.spread || Math.PI * 0.5)
          : Math.random() * Math.PI * 2;
        this.emit({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: options.color || '#ff8800',
          size: options.size || (2 + Math.random() * 3),
          alpha: options.alpha || 1.0,
          decay: options.decay || (0.02 + Math.random() * 0.03),
          grow: options.grow || 0,
          shape: options.shape || 'circle'
        });
      }
    }

    update() {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.size += p.grow;
        p.alpha -= p.decay;
        if (p.alpha <= 0 || p.size <= 0) {
          this.particles.splice(i, 1);
        }
      }
    }

    draw(ctx) {
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        if (p.shape === 'rect') {
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(0.5, p.size), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    clear() {
      this.particles = [];
    }
  }

  // =========================================================================
  // 3. UNIVERSAL PROTOTYPE ENGINE CLASS
  // =========================================================================
  class PrototypeEngine {
    constructor(canvas, gameData = {}, options = {}) {
      if (!canvas) throw new Error('A valid canvas element is required for PrototypeEngine.');
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.game = gameData;
      this.options = options;
      this.audio = new AudioSynth();
      this.particles = new ParticleEmitter();

      // Mode resolution
      this.mode = (gameData.engineMode || (gameData.categoryKey === 'combat' ? 'combat' : 'racing')).toLowerCase();
      this.gameId = gameData.id || 'apex-drift';
      this.theme = gameData.theme || (this.mode === 'racing' ? 'tokyo-night' : 'cyber-stealth');

      // State flags
      this.isRunning = false;
      this.isPaused = false;
      this.lastTimestamp = 0;
      this.animationFrameId = null;

      // Camera
      this.camera = { x: 0, y: 0, zoom: 1.0, shake: 0 };

      // Input state
      this.keys = {};
      this.mouse = {
        x: this.canvas.width / 2,
        y: this.canvas.height / 2,
        worldX: 0,
        worldY: 0,
        down: false,
        rightDown: false
      };

      // Virtual touch joystick state
      this.touchJoystick = {
        active: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        dirX: 0,
        dirY: 0
      };

      // Common score & timing state
      this.score = 0;
      this.sessionTime = 0;

      // Initialize mode-specific subsystems
      if (this.mode === 'racing') {
        this.initRacingState();
      } else {
        this.initCombatState();
      }

      this.bindEvents();
      this.resizeCanvas();
    }

    // -----------------------------------------------------------------------
    // MODE: RACING INITIALIZATION & LOGIC
    // -----------------------------------------------------------------------
    initRacingState() {
      this.player = {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        angle: -Math.PI / 2, // Facing up
        angularVelocity: 0,
        steerAngle: 0,
        speed: 0,
        gear: 1,
        rpm: 1000,
        driftScore: 0,
        driftMultiplier: 1,
        isDrifting: false,
        driftAngle: 0,
        nitro: 100,
        isBoosting: false,
        lap: 1,
        maxLaps: 3,
        currentLapTime: 0,
        bestLapTime: null,
        checkpointIndex: 0,
        tireTemp: 70 // °C
      };

      // Vehicle Specs (tuned by theme/game)
      this.vehicleSpecs = {
        mass: 1200,
        accelForce: 360,
        brakeForce: 450,
        maxSteer: 0.045,
        drag: 0.0008,
        tireGrip: 0.88,
        driftGrip: 0.94,
        nitroMult: 1.7
      };

      // Tune specs by game ID
      if (this.gameId === 'circuit-master') {
        this.vehicleSpecs.accelForce = 440;
        this.vehicleSpecs.tireGrip = 0.92;
        this.vehicleSpecs.maxSteer = 0.052;
      } else if (this.gameId === 'velocity') {
        this.vehicleSpecs.accelForce = 480;
        this.vehicleSpecs.drag = 0.0004;
      } else if (this.gameId === 'canyon-apex' || this.gameId === 'baja-dunes') {
        this.vehicleSpecs.tireGrip = 0.82;
        this.vehicleSpecs.driftGrip = 0.90;
      }

      // Track layout generation
      this.buildRacetrack();

      // Skid marks buffer
      this.skidMarks = [];

      // AI Opponents
      this.aiCars = [
        { x: -35, y: 15, angle: -Math.PI / 2, speed: 0, color: '#ef4444', targetWp: 1 },
        { x: 35, y: 30, angle: -Math.PI / 2, speed: 0, color: '#3b82f6', targetWp: 1 }
      ];
    }

    buildRacetrack() {
      // Waypoint loop defining the circuit
      this.waypoints = [
        { x: 0, y: 0 },
        { x: 0, y: -900 },
        { x: 450, y: -1400 },
        { x: 1100, y: -1400 },
        { x: 1500, y: -800 },
        { x: 1200, y: -200 },
        { x: 1600, y: 500 },
        { x: 1200, y: 1200 },
        { x: 200, y: 1300 },
        { x: -700, y: 900 },
        { x: -900, y: 200 },
        { x: -400, y: -100 }
      ];

      this.trackWidth = 220;
      this.player.x = this.waypoints[0].x;
      this.player.y = this.waypoints[0].y + 60;
    }

    updateRacing(dt) {
      const p = this.player;
      p.currentLapTime += dt;
      this.sessionTime += dt;

      // Read Inputs
      const throttle = this.keys['KeyW'] || this.keys['ArrowUp'] || (this.touchJoystick.dirY < -0.2);
      const brake = this.keys['KeyS'] || this.keys['ArrowDown'] || (this.touchJoystick.dirY > 0.3);
      const steerLeft = this.keys['KeyA'] || this.keys['ArrowLeft'] || (this.touchJoystick.dirX < -0.2);
      const steerRight = this.keys['KeyD'] || this.keys['ArrowRight'] || (this.touchJoystick.dirX > 0.2);
      const handbrake = this.keys['Space'] || this.mouse.rightDown;
      const nitroActive = (this.keys['ShiftLeft'] || this.keys['ShiftRight']) && p.nitro > 0;

      // Steering
      let steerTarget = 0;
      if (steerLeft) steerTarget -= 1;
      if (steerRight) steerTarget += 1;
      if (this.touchJoystick.active) steerTarget = this.touchJoystick.dirX;

      // Speed-dependent steering sensitivity
      const speedRatio = Math.min(1.0, Math.hypot(p.vx, p.vy) / 25);
      const currentSteerRate = this.vehicleSpecs.maxSteer * (1.1 - speedRatio * 0.45);
      p.angle += steerTarget * currentSteerRate * (handbrake ? 1.4 : 1.0);

      // Forward / Lateral vectors
      const fwdX = Math.cos(p.angle);
      const fwdY = Math.sin(p.angle);
      const rightX = -Math.sin(p.angle);
      const rightY = Math.cos(p.angle);

      // Decompose velocity
      const fwdSpeed = p.vx * fwdX + p.vy * fwdY;
      const latSpeed = p.vx * rightX + p.vy * rightY;

      // Nitro & Acceleration
      p.isBoosting = nitroActive && throttle;
      if (p.isBoosting) {
        p.nitro = Math.max(0, p.nitro - 22 * dt);
        this.camera.shake = Math.max(this.camera.shake, 2.5);
      } else {
        p.nitro = Math.min(100, p.nitro + 6 * dt);
      }

      let engineAccel = throttle ? this.vehicleSpecs.accelForce : 0;
      if (p.isBoosting) engineAccel *= this.vehicleSpecs.nitroMult;

      if (brake) {
        engineAccel -= this.vehicleSpecs.brakeForce;
      }

      // Apply forward thrust
      p.vx += fwdX * engineAccel * dt * 0.05;
      p.vy += fwdY * engineAccel * dt * 0.05;

      // Drift Slip & Lateral Friction
      const grip = handbrake ? 0.72 : (Math.abs(latSpeed) > 4 ? this.vehicleSpecs.driftGrip : this.vehicleSpecs.tireGrip);
      p.vx = (fwdSpeed * fwdX) + (latSpeed * rightX * grip);
      p.vy = (fwdSpeed * fwdY) + (latSpeed * rightY * grip);

      // Aerodynamic Drag & Rolling Resistance
      const curSpeed = Math.hypot(p.vx, p.vy);
      const dragFactor = 1.0 - (0.015 + curSpeed * this.vehicleSpecs.drag);
      p.vx *= dragFactor;
      p.vy *= dragFactor;

      // Update Position
      p.x += p.vx;
      p.y += p.vy;
      p.speed = Math.round(curSpeed * 18); // Convert to km/h scale

      // Transmission & RPM simulation
      const speedKm = p.speed;
      if (speedKm < 40) p.gear = 1;
      else if (speedKm < 85) p.gear = 2;
      else if (speedKm < 135) p.gear = 3;
      else if (speedKm < 195) p.gear = 4;
      else if (speedKm < 260) p.gear = 5;
      else p.gear = 6;

      const gearSpeedRanges = [0, 40, 85, 135, 195, 260, 350];
      const gearMin = gearSpeedRanges[p.gear - 1];
      const gearMax = gearSpeedRanges[p.gear];
      const gearFraction = Math.max(0, Math.min(1, (speedKm - gearMin) / (gearMax - gearMin || 1)));
      p.rpm = Math.floor(1800 + gearFraction * 6800);

      // Audio engine update
      this.audio.updateEngineSound(p.rpm / 8600, throttle || p.isBoosting);

      // Drift Scoring & Skidmarks
      const driftSlip = Math.abs(latSpeed);
      if (driftSlip > 3.2 && curSpeed > 4) {
        p.isDrifting = true;
        p.driftAngle = Math.round(Math.abs(Math.atan2(latSpeed, fwdSpeed)) * (180 / Math.PI));
        p.driftScore += Math.floor(driftSlip * 15 * p.driftMultiplier);
        p.driftMultiplier = Math.min(5, p.driftMultiplier + dt * 0.4);

        this.audio.playTireScreech(Math.min(1, driftSlip / 8));

        // Add skid marks
        const rearDist = -18;
        const halfWidth = 11;
        const leftSkidX = p.x + fwdX * rearDist - rightX * halfWidth;
        const leftSkidY = p.y + fwdY * rearDist - rightY * halfWidth;
        const rightSkidX = p.x + fwdX * rearDist + rightX * halfWidth;
        const rightSkidY = p.y + fwdY * rearDist + rightY * halfWidth;

        this.skidMarks.push({ x1: leftSkidX, y1: leftSkidY, x2: rightSkidX, y2: rightSkidY, alpha: 0.7 });
        if (this.skidMarks.length > 250) this.skidMarks.shift();

        // Smoke particles
        const smokeColor = (this.gameId === 'canyon-apex' || this.gameId === 'baja-dunes') ? '#c29a6b' : '#ffffff';
        this.particles.emit({
          x: leftSkidX + (Math.random() - 0.5) * 6,
          y: leftSkidY + (Math.random() - 0.5) * 6,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5,
          color: smokeColor,
          size: 4 + Math.random() * 5,
          grow: 0.4,
          alpha: 0.5,
          decay: 0.03
        });
      } else {
        if (p.isDrifting) {
          // Bank drift score to total score
          this.score += p.driftScore;
          p.driftScore = 0;
          p.driftMultiplier = 1;
        }
        p.isDrifting = false;
      }

      // Nitro exhaust flame particles
      if (p.isBoosting) {
        const exhaustX = p.x - fwdX * 22;
        const exhaustY = p.y - fwdY * 22;
        this.particles.emit({
          x: exhaustX + (Math.random() - 0.5) * 4,
          y: exhaustY + (Math.random() - 0.5) * 4,
          vx: -fwdX * 8 + (Math.random() - 0.5) * 2,
          vy: -fwdY * 8 + (Math.random() - 0.5) * 2,
          color: (Math.random() > 0.5) ? '#06b6d4' : '#8b5cf6',
          size: 5 + Math.random() * 4,
          alpha: 0.8,
          decay: 0.08
        });
      }

      // Checkpoint progression
      this.updateCheckpoints(p);

      // AI Cars Update
      this.updateAICars(dt);

      // Camera smoothly tracks player
      this.camera.x += (p.x - this.camera.x) * 0.1;
      this.camera.y += (p.y - this.camera.y) * 0.1;
    }

    updateCheckpoints(p) {
      const nextWp = this.waypoints[p.checkpointIndex];
      const dist = Math.hypot(p.x - nextWp.x, p.y - nextWp.y);
      if (dist < 180) {
        p.checkpointIndex = (p.checkpointIndex + 1) % this.waypoints.length;
        // Completed full lap?
        if (p.checkpointIndex === 0) {
          this.audio.playChime();
          if (p.bestLapTime === null || p.currentLapTime < p.bestLapTime) {
            p.bestLapTime = p.currentLapTime;
          }
          p.lap++;
          p.currentLapTime = 0;
          this.score += 5000;
        }
      }
    }

    updateAICars(dt) {
      for (let i = 0; i < this.aiCars.length; i++) {
        const ai = this.aiCars[i];
        const target = this.waypoints[ai.targetWp];
        const dx = target.x - ai.x;
        const dy = target.y - ai.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 140) {
          ai.targetWp = (ai.targetWp + 1) % this.waypoints.length;
        }

        const desiredAngle = Math.atan2(dy, dx);
        let angleDiff = desiredAngle - ai.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        ai.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), 0.04);
        ai.speed = Math.min(13, ai.speed + 4 * dt);

        ai.x += Math.cos(ai.angle) * ai.speed;
        ai.y += Math.sin(ai.angle) * ai.speed;
      }
    }

    drawRacing(ctx) {
      const p = this.player;

      // 1. Draw Ground / Terrain background
      this.drawRacingTerrain(ctx);

      // 2. Draw Track Ribbon
      this.drawRacingTrack(ctx);

      // 3. Draw Skidmarks
      for (let i = 0; i < this.skidMarks.length; i++) {
        const s = this.skidMarks[i];
        ctx.save();
        ctx.strokeStyle = `rgba(15, 17, 23, ${s.alpha})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(s.x1, s.y1);
        ctx.lineTo(s.x2, s.y2);
        ctx.stroke();
        ctx.restore();
      }

      // 4. Draw Particles
      this.particles.draw(ctx);

      // 5. Draw AI Vehicles
      for (let i = 0; i < this.aiCars.length; i++) {
        this.drawVehicleBody(ctx, this.aiCars[i].x, this.aiCars[i].y, this.aiCars[i].angle, this.aiCars[i].color, false);
      }

      // 6. Draw Player Vehicle
      const playerColor = (this.gameId === 'velocity') ? '#38bdf8' : ((this.gameId === 'baja-dunes') ? '#f59e0b' : '#a855f7');
      this.drawVehicleBody(ctx, p.x, p.y, p.angle, playerColor, true);

      // 7. Render Telemetry HUD
      this.drawRacingHUD(ctx);
    }

    drawRacingTerrain(ctx) {
      const halfW = this.canvas.width / 2;
      const halfH = this.canvas.height / 2;
      const bgColors = {
        'tokyo-night': '#090b10',
        'canyon-dirt': '#1c130d',
        'autobahn': '#0b0f14',
        'grand-prix': '#0e141b',
        'desert-dunes': '#241a0d'
      };
      const bgColor = bgColors[this.theme] || '#0d0f12';

      ctx.fillStyle = bgColor;
      ctx.fillRect(this.camera.x - halfW - 200, this.camera.y - halfH - 200, this.canvas.width + 400, this.canvas.height + 400);

      // Ambient Grid / Terrain Texture
      ctx.save();
      ctx.strokeStyle = (this.theme === 'tokyo-night') ? 'rgba(139, 92, 246, 0.05)' : 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      const gridSize = 120;
      const startX = Math.floor((this.camera.x - halfW) / gridSize) * gridSize;
      const endX = this.camera.x + halfW;
      const startY = Math.floor((this.camera.y - halfH) / gridSize) * gridSize;
      const endY = this.camera.y + halfH;

      ctx.beginPath();
      for (let x = startX; x <= endX; x += gridSize) {
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
      }
      for (let y = startY; y <= endY; y += gridSize) {
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    drawRacingTrack(ctx) {
      if (this.waypoints.length < 2) return;
      ctx.save();

      // Outer Kerbs / Glow
      ctx.beginPath();
      ctx.moveTo(this.waypoints[0].x, this.waypoints[0].y);
      for (let i = 1; i < this.waypoints.length; i++) {
        ctx.lineTo(this.waypoints[i].x, this.waypoints[i].y);
      }
      ctx.closePath();

      // Track Border Kerb styling
      ctx.strokeStyle = (this.theme === 'tokyo-night') ? '#8b5cf6' : ((this.theme === 'grand-prix') ? '#ef4444' : '#574129');
      ctx.lineWidth = this.trackWidth + 24;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Track Asphalt
      ctx.strokeStyle = (this.theme === 'canyon-dirt' || this.theme === 'desert-dunes') ? '#382b1d' : '#151922';
      ctx.lineWidth = this.trackWidth;
      ctx.stroke();

      // Dashed Centerline
      ctx.setLineDash([25, 25]);
      ctx.strokeStyle = (this.theme === 'tokyo-night') ? 'rgba(6, 182, 212, 0.4)' : 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.setLineDash([]);

      // Start / Finish Line
      const p1 = this.waypoints[0];
      ctx.save();
      ctx.translate(p1.x, p1.y);
      ctx.fillStyle = '#ffffff';
      for (let b = -this.trackWidth / 2; b < this.trackWidth / 2; b += 20) {
        ctx.fillRect(b, -8, 10, 16);
      }
      ctx.restore();

      // Draw Checkpoints
      for (let i = 0; i < this.waypoints.length; i++) {
        const wp = this.waypoints[i];
        const isNext = (i === this.player.checkpointIndex);
        ctx.beginPath();
        ctx.arc(wp.x, wp.y, isNext ? 45 : 20, 0, Math.PI * 2);
        ctx.strokeStyle = isNext ? 'rgba(16, 185, 129, 0.8)' : 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = isNext ? 4 : 2;
        ctx.stroke();
      }

      ctx.restore();
    }

    drawVehicleBody(ctx, x, y, angle, bodyColor, isPlayer) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Underglow (if player in tokyo-night)
      if (isPlayer && this.theme === 'tokyo-night') {
        ctx.save();
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 18;
        ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.fillRect(-22, -12, 44, 24);
        ctx.restore();
      }

      // Wheels
      ctx.fillStyle = '#0a0a0c';
      ctx.fillRect(-17, -15, 10, 5); // Front left
      ctx.fillRect(7, -15, 10, 5);  // Front right
      ctx.fillRect(-17, 10, 10, 5);  // Rear left
      ctx.fillRect(7, 10, 10, 5);   // Rear right

      // Main Chassis Body
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.roundRect(-22, -12, 44, 24, 6);
      ctx.fill();

      // Cockpit / Windshield
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.roundRect(-4, -9, 18, 18, 3);
      ctx.fill();

      // Headlights (Projecting Forward Rays)
      ctx.fillStyle = 'rgba(254, 240, 138, 0.9)';
      ctx.fillRect(20, -10, 3, 5);
      ctx.fillRect(20, 5, 3, 5);

      // Light beam cones
      ctx.save();
      const grad = ctx.createLinearGradient(22, 0, 140, 0);
      grad.addColorStop(0, 'rgba(254, 240, 138, 0.35)');
      grad.addColorStop(1, 'rgba(254, 240, 138, 0.0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(22, -10);
      ctx.lineTo(130, -35);
      ctx.lineTo(130, 35);
      ctx.lineTo(22, 10);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Taillights
      ctx.fillStyle = (this.player.vx * Math.cos(angle) < 0 || this.keys['KeyS']) ? '#ff0000' : '#880000';
      ctx.fillRect(-23, -10, 2, 4);
      ctx.fillRect(-23, 6, 2, 4);

      ctx.restore();
    }

    drawRacingHUD(ctx) {
      const p = this.player;
      const w = this.canvas.width;
      const h = this.canvas.height;

      ctx.save();
      // Reset transform for screen space HUD
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      // 1. Digital Speedometer & Tachometer (Bottom-Right)
      const gaugeX = w - 130;
      const gaugeY = h - 110;

      // Gauge Circular Background
      ctx.beginPath();
      ctx.arc(gaugeX, gaugeY, 70, 0.75 * Math.PI, 2.25 * Math.PI);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 10;
      ctx.stroke();

      // Tachometer / RPM Arc
      const rpmFrac = Math.min(1.0, p.rpm / 8500);
      ctx.beginPath();
      ctx.arc(gaugeX, gaugeY, 70, 0.75 * Math.PI, 0.75 * Math.PI + rpmFrac * 1.5 * Math.PI);
      ctx.strokeStyle = (rpmFrac > 0.85) ? '#ef4444' : '#8b5cf6';
      ctx.lineWidth = 10;
      ctx.stroke();

      // Digital Speed Text
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f3f4f6';
      ctx.font = 'bold 36px "Segoe UI", sans-serif';
      ctx.fillText(p.speed, gaugeX, gaugeY + 6);

      ctx.font = '11px monospace';
      ctx.fillStyle = '#8a99ad';
      ctx.fillText('KM / H', gaugeX, gaugeY + 22);

      // Gear Indicator
      ctx.fillStyle = '#a855f7';
      ctx.font = 'bold 18px monospace';
      ctx.fillText(`GEAR ${p.gear}`, gaugeX, gaugeY - 26);

      // Nitro Bar (Below Speedometer)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(w - 200, h - 24, 140, 8);
      ctx.fillStyle = p.isBoosting ? '#06b6d4' : '#3b82f6';
      ctx.fillRect(w - 200, h - 24, (p.nitro / 100) * 140, 8);

      ctx.fillStyle = '#8a99ad';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('NITRO [SHIFT]', w - 210, h - 17);

      // 2. Lap & Timing HUD (Top-Left)
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(18, 21, 26, 0.75)';
      ctx.beginPath();
      ctx.roundRect(16, 16, 210, 95, 8);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.stroke();

      ctx.fillStyle = '#8b5cf6';
      ctx.font = 'bold 14px "Segoe UI", sans-serif';
      ctx.fillText(`LAP ${p.lap} / ${p.maxLaps}`, 30, 40);

      ctx.fillStyle = '#f3f4f6';
      ctx.font = '13px monospace';
      ctx.fillText(`TIME: ${p.currentLapTime.toFixed(2)}s`, 30, 62);
      ctx.fillText(`BEST: ${p.bestLapTime ? p.bestLapTime.toFixed(2) + 's' : '--:--'}`, 30, 82);
      ctx.fillText(`SCORE: ${this.score}`, 30, 100);

      // 3. Drift Multiplier Banner (Top-Center)
      if (p.isDrifting) {
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
        ctx.font = 'bold 22px "Segoe UI", sans-serif';
        ctx.fillText(`DRIFT +${p.driftScore} (x${p.driftMultiplier.toFixed(1)})`, w / 2, 50);
      }

      ctx.restore();
    }

    // -----------------------------------------------------------------------
    // MODE: COMBAT INITIALIZATION & LOGIC
    // -----------------------------------------------------------------------
    initCombatState() {
      this.player = {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        angle: 0,
        health: 100,
        maxHealth: 100,
        armor: 100,
        ammo: 30,
        maxAmmo: 30,
        isReloading: false,
        reloadTime: 1.5,
        reloadTimer: 0,
        fireCooldown: 0,
        torsoAngle: 0, // For mech
        kills: 0,
        wave: 1
      };

      // Weapon specs per game
      this.weapon = {
        type: 'assault',
        fireRate: 0.12,
        damage: 25,
        bulletSpeed: 28,
        pellets: 1,
        spread: 0.04,
        isSilenced: false,
        soundType: 'rifle',
        windDrift: false
      };

      if (this.gameId === 'covert-ops') {
        this.weapon.type = 'smg';
        this.weapon.fireRate = 0.09;
        this.weapon.damage = 22;
        this.weapon.isSilenced = true;
        this.weapon.soundType = 'silenced';
        this.player.maxAmmo = 32;
        this.player.ammo = 32;
      } else if (this.gameId === 'sniper-ghost') {
        this.weapon.type = 'sniper';
        this.weapon.fireRate = 0.95;
        this.weapon.damage = 110;
        this.weapon.bulletSpeed = 48;
        this.weapon.soundType = 'sniper';
        this.weapon.windDrift = true;
        this.player.maxAmmo = 5;
        this.player.ammo = 5;
      } else if (this.gameId === 'iron-guard') {
        this.weapon.type = 'artillery';
        this.weapon.fireRate = 0.2;
        this.weapon.damage = 45;
        this.weapon.bulletSpeed = 30;
        this.weapon.soundType = 'cannon';
        this.player.maxAmmo = 60;
        this.player.ammo = 60;
      } else if (this.gameId === 'cqb-breach') {
        this.weapon.type = 'shotgun';
        this.weapon.fireRate = 0.55;
        this.weapon.damage = 16;
        this.weapon.pellets = 7;
        this.weapon.spread = 0.22;
        this.weapon.soundType = 'shotgun';
        this.player.maxAmmo = 8;
        this.player.ammo = 8;
      } else if (this.gameId === 'mech-assault') {
        this.weapon.type = 'energy';
        this.weapon.fireRate = 0.25;
        this.weapon.damage = 50;
        this.weapon.bulletSpeed = 32;
        this.weapon.soundType = 'laser';
        this.player.maxAmmo = 40;
        this.player.ammo = 40;
      }

      // Wind Vector (affects sniper ballistics)
      this.wind = {
        speed: 8.5 + Math.random() * 8, // m/s
        angle: Math.random() * Math.PI * 2
      };

      // Projectiles & Shells
      this.bullets = [];

      // Destructible Barricades / Cover
      this.barricades = [];
      this.generateBarricades();

      // Enemy Targets / AI combatants
      this.enemies = [];
      this.spawnEnemyWave(5);
    }

    generateBarricades() {
      this.barricades = [
        { x: -160, y: -120, w: 90, h: 30, health: 100, maxHealth: 100 },
        { x: 120, y: -140, w: 30, h: 100, health: 100, maxHealth: 100 },
        { x: -180, y: 150, w: 120, h: 30, health: 100, maxHealth: 100 },
        { x: 160, y: 130, w: 80, h: 30, health: 100, maxHealth: 100 },
        { x: 0, y: -260, w: 140, h: 30, health: 100, maxHealth: 100 },
        { x: -300, y: 0, w: 30, h: 140, health: 100, maxHealth: 100 },
        { x: 320, y: -60, w: 30, h: 140, health: 100, maxHealth: 100 }
      ];
    }

    spawnEnemyWave(count) {
      for (let i = 0; i < count; i++) {
        const dist = 350 + Math.random() * 300;
        const ang = Math.random() * Math.PI * 2;
        this.enemies.push({
          x: Math.cos(ang) * dist,
          y: Math.sin(ang) * dist,
          vx: 0,
          vy: 0,
          angle: 0,
          health: 60,
          maxHealth: 60,
          speed: 1.8 + Math.random() * 1.2,
          state: 'ALERT',
          fireCooldown: 1.0 + Math.random() * 1.5,
          color: '#ef4444'
        });
      }
    }

    updateCombat(dt) {
      const p = this.player;
      this.sessionTime += dt;

      // Movement inputs (WASD)
      let moveX = 0;
      let moveY = 0;
      if (this.keys['KeyW'] || this.keys['ArrowUp']) moveY -= 1;
      if (this.keys['KeyS'] || this.keys['ArrowDown']) moveY += 1;
      if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
      if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;

      // Touch joystick movement
      if (this.touchJoystick.active) {
        moveX = this.touchJoystick.dirX;
        moveY = this.touchJoystick.dirY;
      }

      // Sprinting
      const isSprinting = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
      const moveSpeed = isSprinting ? 5.2 : 3.4;

      const moveLen = Math.hypot(moveX, moveY);
      if (moveLen > 0) {
        p.vx = (moveX / moveLen) * moveSpeed;
        p.vy = (moveY / moveLen) * moveSpeed;
      } else {
        p.vx *= 0.7;
        p.vy *= 0.7;
      }

      p.x += p.vx;
      p.y += p.vy;

      // Convert mouse screen coordinates to world coordinates
      const worldMouseX = this.mouse.x - this.canvas.width / 2 + this.camera.x;
      const worldMouseY = this.mouse.y - this.canvas.height / 2 + this.camera.y;
      this.mouse.worldX = worldMouseX;
      this.mouse.worldY = worldMouseY;

      // Calculate aiming angle toward mouse
      const aimDx = worldMouseX - p.x;
      const aimDy = worldMouseY - p.y;
      p.angle = Math.atan2(aimDy, aimDx);

      // Weapon Cooldown & Reloading
      if (p.fireCooldown > 0) p.fireCooldown -= dt;

      if (p.isReloading) {
        p.reloadTimer -= dt;
        if (p.reloadTimer <= 0) {
          p.isReloading = false;
          p.ammo = p.maxAmmo;
          this.audio.playReload();
        }
      }

      // Reload trigger
      if (this.keys['KeyR'] && !p.isReloading && p.ammo < p.maxAmmo) {
        p.isReloading = true;
        p.reloadTimer = p.reloadTime;
        this.audio.playReload();
      }

      // Fire weapon
      const wantsFire = this.mouse.down || this.keys['Space'];
      if (wantsFire && p.fireCooldown <= 0) {
        if (p.ammo > 0 && !p.isReloading) {
          this.fireWeapon();
        } else if (p.ammo <= 0 && !p.isReloading) {
          p.isReloading = true;
          p.reloadTimer = p.reloadTime;
          this.audio.playReload();
        }
      }

      // Update Bullets
      this.updateBullets(dt);

      // Update Enemies
      this.updateEnemies(dt);

      // Check wave completion
      if (this.enemies.length === 0) {
        p.wave++;
        this.score += 2000;
        this.audio.playChime();
        this.spawnEnemyWave(4 + p.wave * 2);
      }

      // Camera follows player
      this.camera.x += (p.x - this.camera.x) * 0.15;
      this.camera.y += (p.y - this.camera.y) * 0.15;
    }

    fireWeapon() {
      const p = this.player;
      p.fireCooldown = this.weapon.fireRate;
      p.ammo--;

      // Muzzle kick recoil & camera shake
      this.camera.shake = Math.min(10, this.camera.shake + (this.weapon.type === 'sniper' ? 8 : 3.5));
      this.audio.playGunshot(this.weapon.soundType);

      // Muzzle flash particle
      const muzzleX = p.x + Math.cos(p.angle) * 26;
      const muzzleY = p.y + Math.sin(p.angle) * 26;
      this.particles.emit({
        x: muzzleX,
        y: muzzleY,
        color: '#fef08a',
        size: 9,
        decay: 0.12,
        alpha: 1.0
      });

      // Spawn projectile(s)
      for (let i = 0; i < this.weapon.pellets; i++) {
        const spreadAngle = p.angle + (Math.random() - 0.5) * this.weapon.spread;
        this.bullets.push({
          x: muzzleX,
          y: muzzleY,
          vx: Math.cos(spreadAngle) * this.weapon.bulletSpeed,
          vy: Math.sin(spreadAngle) * this.weapon.bulletSpeed,
          damage: this.weapon.damage,
          life: 2.0,
          color: (this.weapon.type === 'energy') ? '#06b6d4' : '#f59e0b',
          isSniper: (this.weapon.type === 'sniper'),
          fromPlayer: true
        });
      }
    }

    updateBullets(dt) {
      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const b = this.bullets[i];

        // Apply wind drift to sniper rounds
        if (b.isSniper && this.weapon.windDrift) {
          const windAx = Math.cos(this.wind.angle) * this.wind.speed * 0.015;
          const windAy = Math.sin(this.wind.angle) * this.wind.speed * 0.015;
          b.vx += windAx;
          b.vy += windAy;
        }

        b.x += b.vx;
        b.y += b.vy;
        b.life -= dt;

        // Smoke tracer trail
        if (Math.random() > 0.4) {
          this.particles.emit({
            x: b.x,
            y: b.y,
            color: b.color,
            size: 2,
            alpha: 0.6,
            decay: 0.08
          });
        }

        // Bullet vs Barricades collision
        let bulletRemoved = false;
        for (let j = this.barricades.length - 1; j >= 0; j--) {
          const bar = this.barricades[j];
          if (b.x >= bar.x && b.x <= bar.x + bar.w && b.y >= bar.y && b.y <= bar.y + bar.h) {
            bar.health -= b.damage;
            this.audio.playHit();
            this.particles.emitBurst(b.x, b.y, 6, { color: '#9ca3af', speed: 2 });

            if (bar.health <= 0) {
              this.particles.emitBurst(bar.x + bar.w / 2, bar.y + bar.h / 2, 20, { color: '#6b7280', speed: 4, size: 5 });
              this.audio.playExplosion();
              this.barricades.splice(j, 1);
            }

            this.bullets.splice(i, 1);
            bulletRemoved = true;
            break;
          }
        }
        if (bulletRemoved) continue;

        // Player bullet vs Enemies
        if (b.fromPlayer) {
          for (let eIdx = this.enemies.length - 1; eIdx >= 0; eIdx--) {
            const enemy = this.enemies[eIdx];
            const dist = Math.hypot(b.x - enemy.x, b.y - enemy.y);
            if (dist < 18) {
              enemy.health -= b.damage;
              this.audio.playHit();
              this.particles.emitBurst(b.x, b.y, 8, { color: '#ef4444', speed: 3 });

              if (enemy.health <= 0) {
                this.audio.playExplosion();
                this.particles.emitBurst(enemy.x, enemy.y, 25, { color: '#f59e0b', speed: 5 });
                this.enemies.splice(eIdx, 1);
                this.player.kills++;
                this.score += 250;
              }

              this.bullets.splice(i, 1);
              bulletRemoved = true;
              break;
            }
          }
        } else {
          // Enemy bullet vs Player
          const distToPlayer = Math.hypot(b.x - this.player.x, b.y - this.player.y);
          if (distToPlayer < 18) {
            if (this.player.armor > 0) {
              this.player.armor = Math.max(0, this.player.armor - b.damage * 0.7);
            } else {
              this.player.health = Math.max(0, this.player.health - b.damage);
            }
            this.audio.playHit();
            this.camera.shake = 6;
            this.particles.emitBurst(this.player.x, this.player.y, 10, { color: '#38bdf8', speed: 3 });

            this.bullets.splice(i, 1);
            bulletRemoved = true;
          }
        }

        if (!bulletRemoved && b.life <= 0) {
          this.bullets.splice(i, 1);
        }
      }
    }

    updateEnemies(dt) {
      const p = this.player;

      for (let i = 0; i < this.enemies.length; i++) {
        const e = this.enemies[i];
        const dx = p.x - e.x;
        const dy = p.y - e.y;
        const dist = Math.hypot(dx, dy);

        e.angle = Math.atan2(dy, dx);

        // Advance towards player if too far, strafe if close
        if (dist > 180) {
          e.x += Math.cos(e.angle) * e.speed;
          e.y += Math.sin(e.angle) * e.speed;
        } else if (dist < 100) {
          e.x -= Math.cos(e.angle) * e.speed;
          e.y -= Math.sin(e.angle) * e.speed;
        }

        // Enemy firing logic
        e.fireCooldown -= dt;
        if (e.fireCooldown <= 0 && dist < 450) {
          e.fireCooldown = 1.4 + Math.random() * 1.2;
          this.bullets.push({
            x: e.x + Math.cos(e.angle) * 18,
            y: e.y + Math.sin(e.angle) * 18,
            vx: Math.cos(e.angle) * 12,
            vy: Math.sin(e.angle) * 12,
            damage: 12,
            life: 2.5,
            color: '#ef4444',
            fromPlayer: false
          });
          this.audio.playGunshot('silenced');
        }
      }
    }

    drawCombat(ctx) {
      const p = this.player;

      // 1. Draw Combat Sector Floor
      this.drawCombatFloor(ctx);

      // 2. Draw Destructible Barricades
      this.drawBarricades(ctx);

      // 3. Draw Laser Sight Line
      this.drawLaserSight(ctx);

      // 4. Draw Bullets & Tracers
      for (let i = 0; i < this.bullets.length; i++) {
        const b = this.bullets[i];
        ctx.save();
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.isSniper ? 4 : 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 5. Draw Particles
      this.particles.draw(ctx);

      // 6. Draw Enemies
      for (let i = 0; i < this.enemies.length; i++) {
        const e = this.enemies[i];
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(e.angle);

        // Body
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();

        // Gun Barrel
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, -3, 20, 6);

        // Health bar over head
        ctx.rotate(-e.angle);
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(-16, -26, 32, 5);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-16, -26, (e.health / e.maxHealth) * 32, 5);
        ctx.restore();
      }

      // 7. Draw Player Operator / Mech
      this.drawPlayerCombatActor(ctx);

      // 8. Draw Reticle at mouse position
      this.drawCombatCrosshair(ctx);

      // 9. Combat HUD (Health, Armor, Ammo, Minimap, Wind)
      this.drawCombatHUD(ctx);
    }

    drawCombatFloor(ctx) {
      const halfW = this.canvas.width / 2;
      const halfH = this.canvas.height / 2;
      ctx.fillStyle = '#0a0d13';
      ctx.fillRect(this.camera.x - halfW - 200, this.camera.y - halfH - 200, this.canvas.width + 400, this.canvas.height + 400);

      // Tactical Sector Grid
      ctx.save();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = 100;
      const startX = Math.floor((this.camera.x - halfW) / gridSize) * gridSize;
      const endX = this.camera.x + halfW;
      const startY = Math.floor((this.camera.y - halfH) / gridSize) * gridSize;
      const endY = this.camera.y + halfH;

      ctx.beginPath();
      for (let x = startX; x <= endX; x += gridSize) {
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
      }
      for (let y = startY; y <= endY; y += gridSize) {
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    drawBarricades(ctx) {
      for (let i = 0; i < this.barricades.length; i++) {
        const b = this.barricades[i];
        ctx.save();
        ctx.fillStyle = '#1e2430';
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 2;
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.strokeRect(b.x, b.y, b.w, b.h);

        // Damaged crack texture if damaged
        if (b.health < b.maxHealth) {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
          ctx.fillRect(b.x, b.y, (1 - b.health / b.maxHealth) * b.w, b.h);
        }
        ctx.restore();
      }
    }

    drawLaserSight(ctx) {
      const p = this.player;
      ctx.save();
      ctx.strokeStyle = (this.gameId === 'covert-ops') ? 'rgba(6, 182, 212, 0.45)' : 'rgba(239, 68, 68, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(this.mouse.worldX, this.mouse.worldY);
      ctx.stroke();
      ctx.restore();
    }

    drawPlayerCombatActor(ctx) {
      const p = this.player;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);

      if (this.gameId === 'mech-assault') {
        // Heavy Mech Chassis
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.roundRect(-24, -20, 48, 40, 6);
        ctx.fill();

        // Dual Shoulder Cannons
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(10, -18, 22, 6);
        ctx.fillRect(10, 12, 22, 6);

        // Mech Core / Cockpit
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Tactical Operator
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();

        // Tactical Vest
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(0, 0, 11, 0, Math.PI * 2);
        ctx.fill();

        // Primary Weapon Barrel
        ctx.fillStyle = '#475569';
        ctx.fillRect(6, -4, 22, 8);
      }

      ctx.restore();
    }

    drawCombatCrosshair(ctx) {
      const mx = this.mouse.worldX;
      const my = this.mouse.worldY;

      ctx.save();
      ctx.translate(mx, my);
      ctx.strokeStyle = (this.weapon.type === 'sniper') ? '#06b6d4' : '#ef4444';
      ctx.lineWidth = 1.5;

      // Outer circle
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.stroke();

      // Crosshair lines
      ctx.beginPath();
      ctx.moveTo(-20, 0); ctx.lineTo(-6, 0);
      ctx.moveTo(6, 0); ctx.lineTo(20, 0);
      ctx.moveTo(0, -20); ctx.lineTo(0, -6);
      ctx.moveTo(0, 6); ctx.lineTo(0, 20);
      ctx.stroke();

      ctx.restore();
    }

    drawCombatHUD(ctx) {
      const p = this.player;
      const w = this.canvas.width;
      const h = this.canvas.height;

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      // 1. Health & Armor Gauges (Bottom-Left)
      ctx.fillStyle = 'rgba(18, 21, 26, 0.85)';
      ctx.beginPath();
      ctx.roundRect(16, h - 85, 230, 68, 8);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.stroke();

      // Health bar
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(85, h - 72, (p.health / p.maxHealth) * 145, 12);
      ctx.fillStyle = '#f3f4f6';
      ctx.font = 'bold 11px "Segoe UI", sans-serif';
      ctx.fillText(`HP: ${Math.round(p.health)}%`, 28, h - 62);

      // Armor bar
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(85, h - 45, (p.armor / 100) * 145, 10);
      ctx.fillStyle = '#93c5fd';
      ctx.font = 'bold 11px "Segoe UI", sans-serif';
      ctx.fillText(`ARM: ${Math.round(p.armor)}%`, 28, h - 36);

      // 2. Ammo & Reload Counter (Bottom-Right)
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(18, 21, 26, 0.85)';
      ctx.beginPath();
      ctx.roundRect(w - 200, h - 85, 184, 68, 8);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.stroke();

      if (p.isReloading) {
        ctx.fillStyle = '#eab308';
        ctx.font = 'bold 18px monospace';
        ctx.fillText('RELOADING...', w - 24, h - 50);
      } else {
        ctx.fillStyle = (p.ammo <= 5) ? '#ef4444' : '#f3f4f6';
        ctx.font = 'bold 32px monospace';
        ctx.fillText(`${p.ammo} / ${p.maxAmmo}`, w - 24, h - 48);
      }

      ctx.fillStyle = '#8a99ad';
      ctx.font = '11px monospace';
      ctx.fillText(`CALIBER: ${this.weapon.type.toUpperCase()}`, w - 24, h - 28);

      // 3. Tactical Minimap Radar (Top-Right)
      const radarX = w - 80;
      const radarY = 80;
      const radarRadius = 55;
      const radarScale = 0.08;

      ctx.beginPath();
      ctx.arc(radarX, radarY, radarRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(13, 17, 23, 0.85)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Radar Sweep line
      const sweepAngle = (this.sessionTime * 3) % (Math.PI * 2);
      ctx.beginPath();
      ctx.moveTo(radarX, radarY);
      ctx.lineTo(radarX + Math.cos(sweepAngle) * radarRadius, radarY + Math.sin(sweepAngle) * radarRadius);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
      ctx.stroke();

      // Player blip (center)
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(radarX, radarY, 3, 0, Math.PI * 2);
      ctx.fill();

      // Enemy blips
      ctx.fillStyle = '#ef4444';
      for (let i = 0; i < this.enemies.length; i++) {
        const e = this.enemies[i];
        const ex = radarX + (e.x - p.x) * radarScale;
        const ey = radarY + (e.y - p.y) * radarScale;
        if (Math.hypot(ex - radarX, ey - radarY) < radarRadius - 2) {
          ctx.beginPath();
          ctx.arc(ex, ey, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 4. Wind Vector (For Sniper Ghost)
      if (this.weapon.windDrift) {
        ctx.textAlign = 'left';
        ctx.fillStyle = '#06b6d4';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(`CROSSWIND: ${this.wind.speed.toFixed(1)} m/s`, 18, 30);

        // Wind Direction Arrow
        const arrowX = 180;
        const arrowY = 26;
        ctx.save();
        ctx.translate(arrowX, arrowY);
        ctx.rotate(this.wind.angle);
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-10, 0); ctx.lineTo(10, 0);
        ctx.lineTo(6, -4);
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
    }

    // -----------------------------------------------------------------------
    // ENGINE LIFECYCLE & EVENT HANDLERS
    // -----------------------------------------------------------------------
    start() {
      if (this.isRunning) return;
      this.isRunning = true;
      this.isPaused = false;
      this.lastTimestamp = performance.now();
      if (this.mode === 'racing') {
        this.audio.startEngineSound();
      }
      this.loop = this.loop.bind(this);
      this.animationFrameId = requestAnimationFrame(this.loop);
    }

    pause() {
      this.isPaused = true;
      this.audio.stopEngineSound();
    }

    resume() {
      if (!this.isRunning) {
        this.start();
        return;
      }
      this.isPaused = false;
      this.lastTimestamp = performance.now();
      if (this.mode === 'racing') {
        this.audio.startEngineSound();
      }
    }

    togglePause() {
      if (this.isPaused) this.resume();
      else this.pause();
      return this.isPaused;
    }

    reset() {
      this.score = 0;
      this.sessionTime = 0;
      this.particles.clear();
      if (this.mode === 'racing') {
        this.initRacingState();
        this.audio.startEngineSound();
      } else {
        this.initCombatState();
      }
    }

    toggleSound() {
      return this.audio.toggleMute();
    }

    setMuted(muted) {
      this.audio.setMuted(muted);
    }

    destroy() {
      this.isRunning = false;
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
      this.audio.stopEngineSound();
      this.unbindEvents();
    }

    resizeCanvas() {
      const rect = this.canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = rect.width || 800;
      const height = rect.height || 500;

      if (this.canvas.width !== width * dpr || this.canvas.height !== height * dpr) {
        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
      }
    }

    loop(timestamp) {
      if (!this.isRunning) return;

      const dt = Math.min(0.1, (timestamp - this.lastTimestamp) / 1000);
      this.lastTimestamp = timestamp;

      if (!this.isPaused) {
        // Screen shake decay
        if (this.camera.shake > 0) {
          this.camera.shake = Math.max(0, this.camera.shake - dt * 15);
        }

        // Mode simulation update
        if (this.mode === 'racing') {
          this.updateRacing(dt);
        } else {
          this.updateCombat(dt);
        }

        this.particles.update();
      }

      // Render Frame
      this.render();

      this.animationFrameId = requestAnimationFrame(this.loop);
    }

    render() {
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Apply Camera Transform & Screen Shake
      ctx.save();
      const shakeX = (Math.random() - 0.5) * this.camera.shake * 3;
      const shakeY = (Math.random() - 0.5) * this.camera.shake * 3;

      ctx.translate(w / 2 + shakeX, h / 2 + shakeY);
      ctx.translate(-this.camera.x, -this.camera.y);

      if (this.mode === 'racing') {
        this.drawRacing(ctx);
      } else {
        this.drawCombat(ctx);
      }

      ctx.restore();

      // Render Pause Screen Overlay
      if (this.isPaused) {
        ctx.save();
        ctx.fillStyle = 'rgba(13, 15, 18, 0.82)';
        ctx.fillRect(0, 0, w, h);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#f3f4f6';
        ctx.font = 'bold 32px "Segoe UI", sans-serif';
        ctx.fillText('MISSION PAUSED', w / 2, h / 2 - 15);
        ctx.font = '14px monospace';
        ctx.fillStyle = '#8a99ad';
        ctx.fillText('Press [P] or Click Resume to Continue', w / 2, h / 2 + 20);
        ctx.restore();
      }
    }

    // -----------------------------------------------------------------------
    // EVENT BINDINGS
    // -----------------------------------------------------------------------
    bindEvents() {
      this._onKeyDown = (e) => {
        this.audio.init();
        this.audio.resume();

        // Prevent window scrolling on arrow keys and space
        if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
          e.preventDefault();
        }

        this.keys[e.code] = true;

        if (e.code === 'KeyP') {
          this.togglePause();
        }
        if (e.code === 'KeyM') {
          this.toggleSound();
        }
      };

      this._onKeyUp = (e) => {
        this.keys[e.code] = false;
      };

      this._onMouseMove = (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.mouse.x = (e.clientX - rect.left) * dpr;
        this.mouse.y = (e.clientY - rect.top) * dpr;
      };

      this._onMouseDown = (e) => {
        this.audio.init();
        this.audio.resume();
        if (e.button === 0) this.mouse.down = true;
        if (e.button === 2) {
          e.preventDefault();
          this.mouse.rightDown = true;
        }
      };

      this._onMouseUp = (e) => {
        if (e.button === 0) this.mouse.down = false;
        if (e.button === 2) this.mouse.rightDown = false;
      };

      this._onContextMenu = (e) => {
        e.preventDefault();
      };

      // Touch handlers for mobile
      this._onTouchStart = (e) => {
        this.audio.init();
        this.audio.resume();
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        this.touchJoystick.active = true;
        this.touchJoystick.startX = touch.clientX - rect.left;
        this.touchJoystick.startY = touch.clientY - rect.top;
        this.mouse.down = true;
      };

      this._onTouchMove = (e) => {
        if (!this.touchJoystick.active) return;
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const curX = touch.clientX - rect.left;
        const curY = touch.clientY - rect.top;
        const dx = curX - this.touchJoystick.startX;
        const dy = curY - this.touchJoystick.startY;
        const dist = Math.hypot(dx, dy);
        const maxDist = 50;

        this.touchJoystick.dirX = Math.max(-1, Math.min(1, dx / maxDist));
        this.touchJoystick.dirY = Math.max(-1, Math.min(1, dy / maxDist));
      };

      this._onTouchEnd = () => {
        this.touchJoystick.active = false;
        this.touchJoystick.dirX = 0;
        this.touchJoystick.dirY = 0;
        this.mouse.down = false;
      };

      this._onResize = () => {
        this.resizeCanvas();
      };

      window.addEventListener('keydown', this._onKeyDown);
      window.addEventListener('keyup', this._onKeyUp);
      this.canvas.addEventListener('mousemove', this._onMouseMove);
      this.canvas.addEventListener('mousedown', this._onMouseDown);
      window.addEventListener('mouseup', this._onMouseUp);
      this.canvas.addEventListener('contextmenu', this._onContextMenu);

      this.canvas.addEventListener('touchstart', this._onTouchStart, { passive: true });
      this.canvas.addEventListener('touchmove', this._onTouchMove, { passive: true });
      this.canvas.addEventListener('touchend', this._onTouchEnd, { passive: true });
      window.addEventListener('resize', this._onResize);
    }

    unbindEvents() {
      window.removeEventListener('keydown', this._onKeyDown);
      window.removeEventListener('keyup', this._onKeyUp);
      this.canvas.removeEventListener('mousemove', this._onMouseMove);
      this.canvas.removeEventListener('mousedown', this._onMouseDown);
      window.removeEventListener('mouseup', this._onMouseUp);
      this.canvas.removeEventListener('contextmenu', this._onContextMenu);

      this.canvas.removeEventListener('touchstart', this._onTouchStart);
      this.canvas.removeEventListener('touchmove', this._onTouchMove);
      this.canvas.removeEventListener('touchend', this._onTouchEnd);
      window.removeEventListener('resize', this._onResize);
    }
  }

  return PrototypeEngine;
});
