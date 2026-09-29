(function () {
  'use strict';

  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  // HUD Elements
  const elSpeed = document.getElementById('hud-speed');
  const elGear = document.getElementById('hud-gear');
  const elDrift = document.getElementById('hud-drift');
  const elCombo = document.getElementById('hud-combo');
  const elNitro = document.getElementById('hud-nitro');
  const elLap = document.getElementById('hud-lap');

  // Audio Synthesizer
  class SoundSynth {
    constructor() {
      this.ctx = null;
      this.muted = false;
      this.oscEngine = null;
      this.gainEngine = null;
      this.noiseNode = null;
      this.gainSkid = null;
      this.initialized = false;
    }

    init() {
      if (this.initialized) return;
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
        // Engine tone
        this.oscEngine = this.ctx.createOscillator();
        this.gainEngine = this.ctx.createGain();
        this.oscEngine.type = 'sawtooth';
        this.oscEngine.frequency.value = 65;
        this.gainEngine.gain.value = 0.04;
        this.oscEngine.connect(this.gainEngine);
        this.gainEngine.connect(this.ctx.destination);
        this.oscEngine.start();

        // Skid noise
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        this.noiseNode = this.ctx.createBufferSource();
        this.noiseNode.buffer = buffer;
        this.noiseNode.loop = true;
        this.gainSkid = this.ctx.createGain();
        this.gainSkid.gain.value = 0;
        this.noiseNode.connect(this.gainSkid);
        this.gainSkid.connect(this.ctx.destination);
        this.noiseNode.start();

        this.initialized = true;
      } catch (e) {
        // AudioContext might be blocked until gesture
      }
    }

    update(speedKmh, isDrifting, isNitro) {
      if (!this.initialized || this.muted) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      // Modulate engine pitch
      const freq = 65 + (speedKmh * 1.8) + (isNitro ? 80 : 0);
      this.oscEngine.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.05);
      this.gainEngine.gain.setTargetAtTime(0.03 + (speedKmh / 350) * 0.05, this.ctx.currentTime, 0.05);

      // Modulate skid volume
      const skidVol = isDrifting ? Math.min(0.12, (speedKmh / 150) * 0.12) : 0;
      this.gainSkid.gain.setTargetAtTime(skidVol, this.ctx.currentTime, 0.05);
    }

    toggleMute() {
      this.muted = !this.muted;
      if (this.gainEngine) this.gainEngine.gain.value = this.muted ? 0 : 0.04;
      if (this.gainSkid) this.gainSkid.gain.value = 0;
      return this.muted;
    }
  }

  const sound = new SoundSynth();

  // Input State
  const keys = {
    up: false, down: false, left: false, right: false,
    space: false, shift: false
  };

  window.addEventListener('keydown', (e) => {
    sound.init();
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.up = true;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.down = true;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = true;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = true;
    if (e.code === 'Space') { keys.space = true; e.preventDefault(); }
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.shift = true;
    if (e.code === 'KeyP') isPaused = !isPaused;
    if (e.code === 'KeyR') resetGame();
    if (e.code === 'KeyM') sound.toggleMute();
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.up = false;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.down = false;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = false;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = false;
    if (e.code === 'Space') keys.space = false;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.shift = false;
  });

  // Parent Window postMessage Handler
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'forward_keyup') {
      window.dispatchEvent(new KeyboardEvent('keyup', { code: e.data.code, key: e.data.key, shiftKey: e.data.shiftKey }));
    }
    if (e.data && e.data.type === 'forward_keydown') {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: e.data.code, key: e.data.key, shiftKey: e.data.shiftKey }));
    }
    if (e.data && e.data.type === 'control') {
      if (e.data.action === 'pause') isPaused = !isPaused;
      if (e.data.action === 'reset') resetGame();
      if (e.data.action === 'sound') sound.toggleMute();
    }
  });

  // Offscreen Skidmarks Canvas
  const skidCanvas = document.createElement('canvas');
  skidCanvas.width = 2400;
  skidCanvas.height = 1800;
  const skidCtx = skidCanvas.getContext('2d');

  // Track Definition
  const track = {
    width: 2400,
    height: 1800,
    points: [
      { x: 400, y: 350 }, { x: 1200, y: 300 }, { x: 1900, y: 450 },
      { x: 2050, y: 900 }, { x: 1750, y: 1450 }, { x: 1100, y: 1550 },
      { x: 450, y: 1350 }, { x: 300, y: 800 }
    ],
    roadWidth: 220
  };

  // Car State
  const car = {
    x: 400,
    y: 350,
    angle: 0,
    speed: 0,
    vx: 0,
    vy: 0,
    maxSpeed: 17,
    accel: 0.16,
    brake: 0.28,
    friction: 0.982,
    driftFriction: 0.965,
    steerAngle: 0,
    driftAngle: 0,
    nitro: 100,
    isDrifting: false
  };

  let driftScore = 0;
  let currentDriftPoints = 0;
  let comboMultiplier = 1.0;
  let lapTime = 0;
  let isPaused = false;
  let particles = [];

  function resetGame() {
    car.x = 400;
    car.y = 350;
    car.angle = 0;
    car.speed = 0;
    car.vx = 0;
    car.vy = 0;
    car.nitro = 100;
    driftScore = 0;
    currentDriftPoints = 0;
    comboMultiplier = 1.0;
    lapTime = 0;
    particles = [];
    skidCtx.clearRect(0, 0, skidCanvas.width, skidCanvas.height);
  }

  // Particle System
  function addParticle(x, y, vx, vy, color, size, life) {
    particles.push({ x, y, vx, vy, color, size, life, maxLife: life });
  }

  // Update Game Logic
  function update(dt) {
    if (isPaused) return;

    lapTime += dt;

    // Throttle & Nitro
    let effectiveMaxSpeed = car.maxSpeed;
    let isNitroActive = false;
    if (keys.shift && car.nitro > 0 && keys.up) {
      effectiveMaxSpeed *= 1.35;
      car.nitro = Math.max(0, car.nitro - 28 * dt);
      isNitroActive = true;
      // Exhaust flame particles
      const exX = car.x - Math.cos(car.angle) * 32;
      const exY = car.y - Math.sin(car.angle) * 32;
      addParticle(exX, exY, -Math.cos(car.angle) * 4 + (Math.random() - 0.5) * 2, -Math.sin(car.angle) * 4 + (Math.random() - 0.5) * 2, '#8b5cf6', 6, 0.25);
    } else {
      car.nitro = Math.min(100, car.nitro + 12 * dt);
    }

    if (keys.up) {
      car.speed = Math.min(effectiveMaxSpeed, car.speed + car.accel);
    } else if (keys.down) {
      car.speed = Math.max(-5, car.speed - car.brake);
    } else {
      car.speed *= car.friction;
    }

    // Steering & Drift Handbrake
    const steerSpeed = (0.045 * (car.speed / (car.maxSpeed * 0.6)));
    if (keys.left) car.angle -= steerSpeed;
    if (keys.right) car.angle += steerSpeed;

    const movingSpeed = Math.hypot(car.vx, car.vy);
    const headingX = Math.cos(car.angle);
    const headingY = Math.sin(car.angle);

    // Lateral drift calculation
    const isHandbraking = keys.space && movingSpeed > 3;
    const grip = isHandbraking ? car.driftFriction : car.friction;

    // Target velocity towards heading
    const targetVx = headingX * car.speed;
    const targetVy = headingY * car.speed;

    car.vx = car.vx * grip + targetVx * (1 - grip);
    car.vy = car.vy * grip + targetVy * (1 - grip);

    car.x += car.vx;
    car.y += car.vy;

    // Calculate drift angle (angle difference between movement vector and vehicle heading)
    let moveAngle = Math.atan2(car.vy, car.vx);
    let angleDiff = Math.abs(car.angle - moveAngle);
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    angleDiff = Math.abs(angleDiff);

    car.isDrifting = movingSpeed > 5 && (angleDiff > 0.32 || isHandbraking);

    if (car.isDrifting) {
      const pts = Math.round(movingSpeed * angleDiff * 14);
      currentDriftPoints += pts;
      comboMultiplier = Math.min(5.0, comboMultiplier + 0.008);

      // Add tire smoke & skid marks
      const rearLeftX = car.x - Math.cos(car.angle) * 22 + Math.sin(car.angle) * 14;
      const rearLeftY = car.y - Math.sin(car.angle) * 22 - Math.cos(car.angle) * 14;
      const rearRightX = car.x - Math.cos(car.angle) * 22 - Math.sin(car.angle) * 14;
      const rearRightY = car.y - Math.sin(car.angle) * 22 + Math.cos(car.angle) * 14;

      skidCtx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
      skidCtx.lineWidth = 5;
      skidCtx.beginPath();
      skidCtx.arc(rearLeftX, rearLeftY, 3, 0, Math.PI * 2);
      skidCtx.arc(rearRightX, rearRightY, 3, 0, Math.PI * 2);
      skidCtx.stroke();

      addParticle(rearLeftX, rearLeftY, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, 'rgba(168, 85, 247, 0.45)', 8, 0.4);
      addParticle(rearRightX, rearRightY, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, 'rgba(0, 255, 136, 0.45)', 8, 0.4);
    } else {
      if (currentDriftPoints > 0) {
        driftScore += Math.round(currentDriftPoints * comboMultiplier);
        currentDriftPoints = 0;
        comboMultiplier = 1.0;
      }
    }

    // Keep car within boundary
    car.x = Math.max(80, Math.min(track.width - 80, car.x));
    car.y = Math.max(80, Math.min(track.height - 80, car.y));

    // Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }

    // Sound update
    const speedKmh = Math.round(movingSpeed * 14);
    sound.update(speedKmh, car.isDrifting, isNitroActive);

    // Update HUD
    elSpeed.innerHTML = `${speedKmh} <span style="font-size:0.85rem;color:#00ff88;">KM/H</span>`;
    const gear = speedKmh === 0 ? 'N' : Math.min(6, Math.floor(speedKmh / 42) + 1);
    const rpm = Math.min(8500, Math.round(1500 + (speedKmh % 45) * 155));
    elGear.textContent = `GEAR: ${gear} • ${rpm} RPM`;

    elDrift.textContent = String(driftScore + Math.round(currentDriftPoints * comboMultiplier));
    elCombo.textContent = `COMBO x${comboMultiplier.toFixed(1)}${car.isDrifting ? ' 🔥' : ''}`;
    elNitro.style.width = `${Math.round(car.nitro)}%`;

    const mins = Math.floor(lapTime / 60);
    const secs = (lapTime % 60).toFixed(1).padStart(4, '0');
    elLap.textContent = `LAP 1/3 • ${mins}:${secs}`;
  }

  // Draw Function
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Camera follow car
    ctx.save();
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    ctx.translate(cx, cy);
    ctx.translate(-car.x, -car.y);

    // 1. Cyber Tokyo Neon Grid Background
    ctx.fillStyle = '#060912';
    ctx.fillRect(0, 0, track.width, track.height);

    // Grid lines
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < track.width; x += 80) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, track.height); ctx.stroke();
    }
    for (let y = 0; y < track.height; y += 80) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(track.width, y); ctx.stroke();
    }

    // 2. Draw Circuit Road
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Outer kerb glow
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.4)';
    ctx.lineWidth = track.roadWidth + 30;
    ctx.beginPath();
    track.points.forEach((pt, i) => { if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y); });
    ctx.closePath();
    ctx.stroke();

    // Dark asphalt
    ctx.strokeStyle = '#101524';
    ctx.lineWidth = track.roadWidth;
    ctx.stroke();

    // Center neon dashed line
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.85)';
    ctx.lineWidth = 4;
    ctx.setLineDash([25, 25]);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Draw Persistent Skidmarks
    ctx.drawImage(skidCanvas, 0, 0);

    // 4. Draw Particles
    particles.forEach((p) => {
      const alpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1 + (1 - alpha)), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // 5. Draw Car Body
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle);

    // Underglow
    const glowGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 48);
    glowGrad.addColorStop(0, car.isDrifting ? 'rgba(0, 255, 136, 0.8)' : 'rgba(168, 85, 247, 0.6)');
    glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(-45, -30, 90, 60);

    // Car Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(-32, -17, 64, 34);

    // Car Chassis
    ctx.fillStyle = '#1e1b4b'; // Deep violet coupe
    ctx.beginPath();
    ctx.roundRect(-30, -15, 60, 30, 6);
    ctx.fill();
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Windshield & Roof
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.roundRect(-12, -12, 28, 24, 4);
    ctx.fill();

    // Headlights
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(26, -13, 4, 6);
    ctx.fillRect(26, 7, 4, 6);

    // Taillights
    ctx.fillStyle = keys.down || keys.space ? '#ff0055' : '#880022';
    ctx.fillRect(-30, -12, 3, 5);
    ctx.fillRect(-30, 7, 3, 5);

    // Rear Spoiler
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-28, -14, 4, 28);

    ctx.restore(); // Car restore

    ctx.restore(); // Camera restore
  }

  // Game Loop
  let lastTime = performance.now();
  function gameLoop(now) {
    const dt = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;

    update(dt);
    draw();

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);

  // Resize canvas cleanly
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();
})();
