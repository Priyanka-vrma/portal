(function () {
  'use strict';
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  const elWind = document.getElementById('hud-wind');
  const elDrop = document.getElementById('hud-drop');
  const elRange = document.getElementById('hud-range');
  const elBreath = document.getElementById('hud-breath');
  const elScore = document.getElementById('hud-score');
  const elBullet = document.getElementById('hud-bullet');

  class SniperAudio {
    constructor() {
      this.ctx = null; this.init = false; this.muted = false;
    }
    start() {
      if (this.init) return;
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
        this.init = true;
      } catch (e) {}
    }
    fire() {
      if (!this.init || this.muted) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      // Heavy .50 cal rifle blast
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.36);
    }
    hit() {
      if (!this.init || this.muted) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.16);
    }
    toggleMute() {
      this.muted = !this.muted;
      return this.muted;
    }
  }
  const sound = new SniperAudio();

  const mouse = { x: 640, y: 360 };
  const scope = { x: 640, y: 360, swayX: 0, swayY: 0, zoom: 1 };
  let holdingBreath = false;
  let windSpeed = 3.5; // m/s to right
  let score = 0;
  let chamberReady = true;
  let isPaused = false;
  let bulletImpacts = [];

  const targets = [
    { x: 380, y: 360, range: 450, vx: 20, alive: true },
    { x: 650, y: 375, range: 680, vx: -15, alive: true },
    { x: 920, y: 350, range: 820, vx: 25, alive: true },
    { x: 520, y: 390, range: 550, vx: -20, alive: true },
    { x: 780, y: 340, range: 1050, vx: 10, alive: true }
  ];

  window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  window.addEventListener('keydown', (e) => {
    sound.start();
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') holdingBreath = true;
    if (e.code === 'Space') {
      scope.zoom = scope.zoom === 1 ? 1.8 : 1;
      e.preventDefault();
    }
    if (e.code === 'KeyP') isPaused = !isPaused;
    if (e.code === 'KeyR') reset();
    if (e.code === 'KeyM') sound.toggleMute();
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') holdingBreath = false;
  });

  window.addEventListener('mousedown', (e) => {
    if (e.button === 0) fireSniper();
  });

  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'forward_keyup') {
      window.dispatchEvent(new KeyboardEvent('keyup', { code: e.data.code, key: e.data.key, shiftKey: e.data.shiftKey }));
    }
    if (e.data && e.data.type === 'forward_keydown') {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: e.data.code, key: e.data.key, shiftKey: e.data.shiftKey }));
    }
    if (e.data && e.data.type === 'control') {
      if (e.data.action === 'pause') isPaused = !isPaused;
      if (e.data.action === 'reset') reset();
      if (e.data.action === 'sound') sound.toggleMute();
    }
  });

  function reset() {
    targets.forEach((t) => t.alive = true);
    score = 0; chamberReady = true; bulletImpacts = [];
  }

  function fireSniper() {
    if (isPaused || !chamberReady) return;
    chamberReady = false;
    sound.fire();

    // Bullet physics: affected by wind and distance drop
    const aimX = scope.x;
    const aimY = scope.y;

    // Check hit on targets
    let hitFound = false;
    targets.forEach((t) => {
      if (!t.alive) return;
      // Drop increases with range: at 680m, drop is ~35px down, wind drifts target X
      const bulletDrop = (t.range / 1000) * 45;
      const windDrift = (t.range / 1000) * (windSpeed * 8);

      const impactX = aimX + windDrift;
      const impactY = aimY + bulletDrop;

      const dist = Math.hypot(t.x - impactX, t.y - impactY);
      if (dist < 26) {
        t.alive = false;
        hitFound = true;
        score++;
        sound.hit();
        bulletImpacts.push({ x: impactX, y: impactY, hit: true, life: 1.5 });
      }
    });

    if (!hitFound) {
      bulletImpacts.push({ x: aimX + (windSpeed * 5), y: aimY + 30, hit: false, life: 1.0 });
    }

    // Chamber reload cooldown (1.4s)
    setTimeout(() => {
      chamberReady = true;
    }, 1400);
  }

  function update(dt) {
    if (isPaused) return;

    // Scope Sway
    const swayFactor = holdingBreath ? 0.08 : 0.8;
    scope.swayX = Math.sin(performance.now() * 0.002) * 16 * swayFactor;
    scope.swayY = Math.cos(performance.now() * 0.003) * 12 * swayFactor;

    scope.x = mouse.x + scope.swayX;
    scope.y = mouse.y + scope.swayY;

    // Targets moving horizontally
    targets.forEach((t) => {
      if (!t.alive) return;
      t.x += t.vx * dt;
      if (t.x > 1150) t.vx = -Math.abs(t.vx);
      if (t.x < 150) t.vx = Math.abs(t.vx);
    });

    // Impacts fade
    for (let i = bulletImpacts.length - 1; i >= 0; i--) {
      bulletImpacts[i].life -= dt;
      if (bulletImpacts[i].life <= 0) bulletImpacts.splice(i, 1);
    }

    // Dynamic wind modulation
    windSpeed += (Math.random() - 0.5) * 0.2 * dt;
    windSpeed = Math.max(1.0, Math.min(7.5, windSpeed));

    // HUD
    elWind.innerHTML = `${windSpeed.toFixed(1)} M/S ➔`;
    elBreath.textContent = holdingBreath ? 'BREATH HOLD: [STEADY] 🫁' : 'BREATH HOLD: [SHIFT]';
    elBreath.style.color = holdingBreath ? '#00ff88' : '#6ee7b7';
    elScore.textContent = `${score} / ${targets.length}`;
    elBullet.textContent = chamberReady ? 'CHAMBER: .50 BMG READY' : 'CHAMBERING ROUND...';
    elBullet.style.color = chamberReady ? '#10b981' : '#f59e0b';
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desert Outpost Landscape
    // Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 300);
    skyGrad.addColorStop(0, '#fde68a');
    skyGrad.addColorStop(1, '#d97706');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, 320);

    // Distant Mountain Ridges
    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    ctx.moveTo(0, 260);
    ctx.lineTo(240, 210); ctx.lineTo(500, 270); ctx.lineTo(800, 190);
    ctx.lineTo(1100, 260); ctx.lineTo(canvas.width, 220); ctx.lineTo(canvas.width, 350); ctx.lineTo(0, 350);
    ctx.fill();

    // Desert Terrain Ground
    ctx.fillStyle = '#b45309';
    ctx.fillRect(0, 320, canvas.width, canvas.height - 320);

    // Outpost Watchtowers & Bunkers
    ctx.fillStyle = '#78350f';
    ctx.fillRect(400, 280, 80, 70); // Bunker 1
    ctx.fillRect(720, 260, 60, 90); // Watchtower

    // Draw Targets (Soldier silhouettes)
    targets.forEach((t) => {
      if (!t.alive) {
        ctx.fillStyle = 'rgba(69, 26, 3, 0.7)';
        ctx.fillRect(t.x - 10, t.y + 12, 20, 4);
        return;
      }
      ctx.fillStyle = '#1c1917'; // Hostile soldier
      // Head
      ctx.beginPath();
      ctx.arc(t.x, t.y - 12, 4, 0, Math.PI * 2);
      ctx.fill();
      // Body
      ctx.fillRect(t.x - 3, t.y - 8, 6, 14);
      // Rifle
      ctx.fillRect(t.x + 2, t.y - 4, 10, 2);
    });

    // Bullet impacts (Dust puffs / Spark)
    bulletImpacts.forEach((imp) => {
      ctx.fillStyle = imp.hit ? '#ef4444' : '#fef08a';
      ctx.beginPath();
      ctx.arc(imp.x, imp.y, 8, 0, Math.PI * 2);
      ctx.fill();
    });

    // Precision Sniper Reticle Overlay
    // Dark Scope Vignette (Blackout outside scope circle)
    const scopeRadius = 260;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.arc(scope.x, scope.y, scopeRadius, 0, Math.PI * 2, true);
    ctx.fillStyle = 'rgba(2, 6, 23, 0.94)';
    ctx.fill();

    // Scope Outer Ring
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(scope.x, scope.y, scopeRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshair Lines with Mil-Dots
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 1.5;

    // Horizontal wire
    ctx.beginPath();
    ctx.moveTo(scope.x - scopeRadius, scope.y);
    ctx.lineTo(scope.x + scopeRadius, scope.y);
    ctx.stroke();

    // Vertical wire
    ctx.beginPath();
    ctx.moveTo(scope.x, scope.y - scopeRadius);
    ctx.lineTo(scope.x, scope.y + scopeRadius);
    ctx.stroke();

    // Mil-Dot ticks
    for (let m = -180; m <= 180; m += 30) {
      if (m === 0) continue;
      // Horiz ticks
      ctx.beginPath();
      ctx.moveTo(scope.x + m, scope.y - 4);
      ctx.lineTo(scope.x + m, scope.y + 4);
      ctx.stroke();
      // Vert ticks (Drop elevation markings)
      ctx.beginPath();
      ctx.moveTo(scope.x - 4, scope.y + m);
      ctx.lineTo(scope.x + 4, scope.y + m);
      ctx.stroke();
    }

    ctx.restore();
  }

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();
})();
