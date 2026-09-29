(function () {
  'use strict';
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  const elHealth = document.getElementById('hud-health');
  const elHealthBar = document.getElementById('hud-health-bar');
  const elWave = document.getElementById('hud-wave');
  const elTargets = document.getElementById('hud-targets');
  const elArtillery = document.getElementById('hud-artillery');

  class DefenseAudio {
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
    cannon() {
      if (!this.init || this.muted) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.41);
    }
    ciws() {
      if (!this.init || this.muted) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.06);
    }
    explosion() {
      if (!this.init || this.muted) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(80, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.51);
    }
    toggleMute() {
      this.muted = !this.muted;
      return this.muted;
    }
  }
  const sound = new DefenseAudio();

  const mouse = { x: 640, y: 360 };
  let baseHealth = 100;
  let wave = 1;
  let cannonCooldown = 0;
  let isPaused = false;

  let shells = [];
  let explosions = [];
  let enemies = [];
  let ciwsBullets = [];

  const base = {
    x: 640, y: 680, width: 280, height: 80,
    turretAngle: -Math.PI / 2
  };

  window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  window.addEventListener('mousedown', (e) => {
    sound.start();
    if (e.button === 0) fireHowitzer();
  });

  window.addEventListener('keydown', (e) => {
    sound.start();
    if (e.code === 'Space') fireCIWS();
    if (e.code === 'KeyP') isPaused = !isPaused;
    if (e.code === 'KeyR') reset();
    if (e.code === 'KeyM') sound.toggleMute();
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
    baseHealth = 100; wave = 1; cannonCooldown = 0;
    shells = []; explosions = []; ciwsBullets = [];
    spawnWave();
  }

  function spawnWave() {
    enemies = [];
    const count = 6 + wave * 2;
    for (let i = 0; i < count; i++) {
      enemies.push({
        x: 100 + Math.random() * (canvas.width - 200),
        y: -50 - i * 90,
        speed: 35 + Math.random() * 25,
        hp: 2,
        type: Math.random() > 0.4 ? 'tank' : 'drone'
      });
    }
  }
  spawnWave();

  function fireHowitzer() {
    if (isPaused || cannonCooldown > 0) return;
    cannonCooldown = 0.8;
    sound.cannon();

    const startX = base.x;
    const startY = base.y - 30;
    const targetX = mouse.x;
    const targetY = mouse.y;

    shells.push({
      x: startX, y: startY,
      targetX, targetY,
      progress: 0,
      duration: 0.6
    });
  }

  function fireCIWS() {
    if (isPaused) return;
    sound.ciws();
    for (let i = 0; i < 4; i++) {
      const spread = (Math.random() - 0.5) * 0.15;
      const angle = base.turretAngle + spread;
      ciwsBullets.push({
        x: base.x + 80, y: base.y - 20,
        vx: Math.cos(angle) * 850,
        vy: Math.sin(angle) * 850,
        life: 0.9
      });
    }
  }

  function update(dt) {
    if (isPaused) return;

    base.x = canvas.width / 2;
    base.y = canvas.height - 20;

    base.turretAngle = Math.atan2(mouse.y - (base.y - 30), mouse.x - base.x);
    cannonCooldown = Math.max(0, cannonCooldown - dt);

    // Update Shells
    for (let i = shells.length - 1; i >= 0; i--) {
      const s = shells[i];
      s.progress += dt / s.duration;
      if (s.progress >= 1.0) {
        // Detonate at target
        explosions.push({ x: s.targetX, y: s.targetY, radius: 10, maxRadius: 75, life: 0.4 });
        sound.explosion();
        shells.splice(i, 1);
      }
    }

    // Update Explosions & Damage
    for (let i = explosions.length - 1; i >= 0; i--) {
      const exp = explosions[i];
      exp.radius += (exp.maxRadius - exp.radius) * 12 * dt;
      exp.life -= dt;

      // Hit enemies
      enemies.forEach((e) => {
        const d = Math.hypot(e.x - exp.x, e.y - exp.y);
        if (d < exp.radius) {
          e.hp -= 2;
        }
      });

      if (exp.life <= 0) explosions.splice(i, 1);
    }

    // Update CIWS Bullets
    for (let i = ciwsBullets.length - 1; i >= 0; i--) {
      const b = ciwsBullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;

      enemies.forEach((e) => {
        if (e.hp > 0 && Math.hypot(e.x - b.x, e.y - b.y) < 22) {
          e.hp -= 1;
          b.life = 0;
        }
      });

      if (b.life <= 0) ciwsBullets.splice(i, 1);
    }

    // Update Enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      e.y += e.speed * dt;

      if (e.hp <= 0) {
        explosions.push({ x: e.x, y: e.y, radius: 5, maxRadius: 40, life: 0.3 });
        enemies.splice(i, 1);
        continue;
      }

      // Reached base
      if (e.y > base.y - 40) {
        baseHealth = Math.max(0, baseHealth - 12);
        explosions.push({ x: e.x, y: e.y, radius: 10, maxRadius: 50, life: 0.4 });
        enemies.splice(i, 1);
      }
    }

    if (enemies.length === 0) {
      wave++;
      spawnWave();
    }

    // HUD
    elHealth.textContent = `${Math.round(baseHealth)}%`;
    elHealthBar.style.width = `${Math.round(baseHealth)}%`;
    elHealthBar.style.background = baseHealth > 50 ? '#22c55e' : (baseHealth > 25 ? '#f59e0b' : '#ef4444');
    elWave.textContent = `WAVE ${wave}`;
    elTargets.textContent = `HOSTILES: ${enemies.length} INBOUND`;
    elArtillery.textContent = cannonCooldown <= 0 ? 'READY' : `${cannonCooldown.toFixed(1)}s`;
    elArtillery.style.color = cannonCooldown <= 0 ? '#22c55e' : '#f59e0b';
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Combat Zone Floor
    ctx.fillStyle = '#0a101d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid Radar lines
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.lineWidth = 1;
    for (let y = 0; y < canvas.height; y += 80) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // Fortress Base Structure
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(base.x - base.width / 2, base.y - 30, base.width, base.height);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.strokeRect(base.x - base.width / 2, base.y - 30, base.width, base.height);

    // Heavy Howitzer Cannon Barrel
    ctx.save();
    ctx.translate(base.x, base.y - 30);
    ctx.rotate(base.turretAngle);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(0, -7, 55, 14);
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Automated CIWS Turret
    ctx.fillStyle = '#475569';
    ctx.beginPath(); ctx.arc(base.x + 80, base.y - 20, 12, 0, Math.PI * 2); ctx.fill();

    // Draw Shells in flight
    shells.forEach((s) => {
      const curX = s.x + (s.targetX - s.x) * s.progress;
      const arcHeight = Math.sin(s.progress * Math.PI) * 120;
      const curY = (s.y + (s.targetY - s.y) * s.progress) - arcHeight;

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.arc(curX, curY, 6, 0, Math.PI * 2); ctx.fill();
    });

    // Draw CIWS Bullets
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ciwsBullets.forEach((b) => {
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x - b.vx * 0.02, b.y - b.vy * 0.02);
      ctx.stroke();
    });

    // Draw Explosions
    explosions.forEach((exp) => {
      const expGrad = ctx.createRadialGradient(exp.x, exp.y, 0, exp.x, exp.y, exp.radius);
      expGrad.addColorStop(0, 'rgba(254, 240, 138, 0.9)');
      expGrad.addColorStop(0.5, 'rgba(239, 68, 68, 0.7)');
      expGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = expGrad;
      ctx.beginPath(); ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2); ctx.fill();
    });

    // Draw Enemies (Tanks & Attack Drones)
    enemies.forEach((e) => {
      if (e.type === 'tank') {
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(e.x - 16, e.y - 20, 32, 40);
        ctx.fillStyle = '#171717';
        ctx.fillRect(e.x - 20, e.y - 22, 6, 44); // Left tread
        ctx.fillRect(e.x + 14, e.y - 22, 6, 44); // Right tread
      } else {
        // Flying Drone
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(e.x, e.y + 16);
        ctx.lineTo(e.x - 18, e.y - 14);
        ctx.lineTo(e.x + 18, e.y - 14);
        ctx.closePath();
        ctx.fill();
      }
    });

    // Crosshair
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, 14, 0, Math.PI * 2);
    ctx.stroke();
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
