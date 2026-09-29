(function () {
  'use strict';
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  const elAmmo = document.getElementById('hud-ammo');
  const elStealth = document.getElementById('hud-stealth');
  const elGuards = document.getElementById('hud-guards');
  const elKills = document.getElementById('hud-kills');

  class StealthAudio {
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
    shoot() {
      if (!this.init || this.muted) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      // Silenced "pfft" sound: bandpassed noise burst
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    }
    hit() {
      if (!this.init || this.muted) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.07);
    }
    toggleMute() {
      this.muted = !this.muted;
      return this.muted;
    }
  }
  const sound = new StealthAudio();

  const keys = { w: false, a: false, s: false, d: false, space: false };
  const mouse = { x: 0, y: 0 };

  window.addEventListener('keydown', (e) => {
    sound.start();
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.w = true;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.a = true;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.s = true;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.d = true;
    if (e.code === 'Space') keys.space = true;
    if (e.code === 'KeyR') reload();
    if (e.code === 'KeyP') isPaused = !isPaused;
    if (e.code === 'KeyM') sound.toggleMute();
  });
  window.addEventListener('keyup', (e) => {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.w = false;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.a = false;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.s = false;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.d = false;
    if (e.code === 'Space') keys.space = false;
  });

  window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  window.addEventListener('mousedown', (e) => {
    if (e.button === 0) fireWeapon();
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

  const player = {
    x: 200, y: 200, angle: 0, speed: 180,
    ammo: 15, maxAmmo: 15, reloading: false, reloadTimer: 0
  };

  let bullets = [];
  let enemies = [];
  let kills = 0;
  let isAlerted = false;
  let isPaused = false;

  function reset() {
    player.x = 200; player.y = 200; player.ammo = 15;
    player.reloading = false; bullets = []; kills = 0; isAlerted = false;
    initEnemies();
  }

  function initEnemies() {
    enemies = [
      { x: 500, y: 250, patrolX1: 450, patrolX2: 850, angle: 0, speed: 60, dir: 1, alive: true },
      { x: 900, y: 450, patrolX1: 750, patrolX2: 1100, angle: Math.PI, speed: 70, dir: -1, alive: true },
      { x: 350, y: 550, patrolX1: 300, patrolX2: 600, angle: 0, speed: 50, dir: 1, alive: true },
      { x: 750, y: 650, patrolX1: 650, patrolX2: 950, angle: 0, speed: 65, dir: 1, alive: true },
      { x: 1100, y: 250, patrolX1: 1000, patrolX2: 1200, angle: Math.PI / 2, speed: 55, dir: 1, alive: true },
      { x: 600, y: 380, patrolX1: 500, patrolX2: 750, angle: 0, speed: 50, dir: 1, alive: true }
    ];
  }
  initEnemies();

  function reload() {
    if (player.reloading || player.ammo === player.maxAmmo) return;
    player.reloading = true;
    player.reloadTimer = 1.2;
  }

  function fireWeapon() {
    if (isPaused || player.reloading) return;
    if (player.ammo <= 0) { reload(); return; }

    player.ammo--;
    sound.shoot();

    // Spawn suppressed bullet
    const vx = Math.cos(player.angle) * 750;
    const vy = Math.sin(player.angle) * 750;
    bullets.push({
      x: player.x + Math.cos(player.angle) * 22,
      y: player.y + Math.sin(player.angle) * 22,
      vx, vy, life: 1.2
    });
  }

  function update(dt) {
    if (isPaused) return;

    // Reload timer
    if (player.reloading) {
      player.reloadTimer -= dt;
      if (player.reloadTimer <= 0) {
        player.ammo = player.maxAmmo;
        player.reloading = false;
      }
    }

    // Player Move
    let mx = 0, my = 0;
    if (keys.w) my -= 1;
    if (keys.s) my += 1;
    if (keys.a) mx -= 1;
    if (keys.d) mx += 1;

    const len = Math.hypot(mx, my);
    if (len > 0) {
      const spd = (keys.space ? player.speed * 1.5 : player.speed);
      player.x += (mx / len) * spd * dt;
      player.y += (my / len) * spd * dt;
    }

    player.x = Math.max(30, Math.min(canvas.width - 30, player.x));
    player.y = Math.max(30, Math.min(canvas.height - 30, player.y));

    // Player Angle towards mouse
    player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);

    // Update Bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;

      // Bullet hit enemy
      enemies.forEach((enemy) => {
        if (enemy.alive) {
          const d = Math.hypot(enemy.x - b.x, enemy.y - b.y);
          if (d < 22) {
            enemy.alive = false;
            b.life = 0;
            kills++;
            sound.hit();
          }
        }
      });

      if (b.life <= 0) bullets.splice(i, 1);
    }

    // Update Enemies & Vision Cones
    let spotted = false;
    enemies.forEach((e) => {
      if (!e.alive) return;
      e.x += e.speed * e.dir * dt;
      if (e.x > e.patrolX2) { e.dir = -1; e.angle = Math.PI; }
      else if (e.x < e.patrolX1) { e.dir = 1; e.angle = 0; }

      // Check vision cone towards player
      const dist = Math.hypot(player.x - e.x, player.y - e.y);
      if (dist < 260) {
        const angleToPlayer = Math.atan2(player.y - e.y, player.x - e.x);
        let diff = Math.abs(e.angle - angleToPlayer);
        while (diff > Math.PI) diff -= Math.PI * 2;
        if (Math.abs(diff) < 0.65) {
          spotted = true;
        }
      }
    });

    isAlerted = spotted;

    // HUD
    elAmmo.textContent = player.reloading ? 'RELOADING...' : `${player.ammo} / ${player.maxAmmo}`;
    elStealth.textContent = isAlerted ? '⚠️ COMPROMISED [ALARM]' : 'GHOST [UNDETECTED]';
    elStealth.style.color = isAlerted ? '#ef4444' : '#00ff88';
    const aliveGuards = enemies.filter((e) => e.alive).length;
    elGuards.textContent = `PATROLS: ${aliveGuards} ACTIVE`;
    elKills.textContent = `${kills} / ${enemies.length}`;
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dark Facility Floor
    ctx.fillStyle = '#060d1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Facility Wall Grid / Pillars
    ctx.fillStyle = '#0f172a';
    for (let x = 100; x < canvas.width; x += 300) {
      for (let y = 100; y < canvas.height; y += 240) {
        ctx.fillRect(x, y, 40, 40);
        ctx.strokeStyle = '#1e293b';
        ctx.strokeRect(x, y, 40, 40);
      }
    }

    // Draw Enemies & Flashlight Vision Cones
    enemies.forEach((e) => {
      if (!e.alive) {
        // Neutralized marker
        ctx.fillStyle = 'rgba(100, 116, 139, 0.4)';
        ctx.beginPath();
        ctx.arc(e.x, e.y, 10, 0, Math.PI * 2);
        ctx.fill();
        return;
      }

      // Flashlight cone
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.rotate(e.angle);

      const coneGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 240);
      coneGrad.addColorStop(0, isAlerted ? 'rgba(239, 68, 68, 0.45)' : 'rgba(254, 240, 138, 0.28)');
      coneGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = coneGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 240, -0.5, 0.5);
      ctx.closePath();
      ctx.fill();

      // Guard Body
      ctx.fillStyle = isAlerted ? '#ef4444' : '#64748b';
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.stroke();

      // Gun Barrel
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(8, -3, 14, 6);

      ctx.restore();
    });

    // Draw Bullets (Subsonic tracers)
    bullets.forEach((b) => {
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x - b.vx * 0.02, b.y - b.vy * 0.02);
      ctx.stroke();
    });

    // Draw Stealth Operative Player
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    // Laser Sight
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.6)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(18, 5);
    ctx.lineTo(350, 5);
    ctx.stroke();
    ctx.setLineDash([]);

    // Operative Body (Tactical Black Suit)
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Silenced Submachine Gun
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(8, 2, 14, 6);
    // Suppressor Can
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(22, 3, 10, 4);

    ctx.restore();

    // Crosshair at mouse
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, 8, 0, Math.PI * 2);
    ctx.moveTo(mouse.x - 14, mouse.y); ctx.lineTo(mouse.x + 14, mouse.y);
    ctx.moveTo(mouse.x, mouse.y - 14); ctx.lineTo(mouse.x, mouse.y + 14);
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
