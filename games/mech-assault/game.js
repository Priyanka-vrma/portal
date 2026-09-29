(function () {
  'use strict';
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  const elHeat = document.getElementById('hud-heat');
  const elHeatBar = document.getElementById('hud-heat-bar');
  const elArmor = document.getElementById('hud-armor');
  const elMechs = document.getElementById('hud-mechs');
  const elWeapon = document.getElementById('hud-weapon');

  class MechAudio {
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
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + 0.16);
      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.16);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.17);
    }
    missile() {
      if (!this.init || this.muted) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(600, this.ctx.currentTime + 0.28);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.29);
    }
    toggleMute() {
      this.muted = !this.muted;
      return this.muted;
    }
  }
  const sound = new MechAudio();

  const keys = { w: false, a: false, s: false, d: false, space: false, shift: false };
  const mouse = { x: 640, y: 360 };

  const mech = {
    x: 640, y: 550, legAngle: 0, torsoAngle: 0,
    speed: 130, armor: 100, heat: 0, overheated: false
  };

  let enemyMechs = [
    { x: 350, y: 220, hp: 8, maxHp: 8, angle: Math.PI / 2, alive: true },
    { x: 640, y: 160, hp: 12, maxHp: 12, angle: Math.PI / 2, alive: true },
    { x: 920, y: 240, hp: 8, maxHp: 8, angle: Math.PI / 2, alive: true }
  ];

  let bullets = [];
  let missiles = [];
  let explosions = [];
  let isPaused = false;

  window.addEventListener('keydown', (e) => {
    sound.start();
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.w = true;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.a = true;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.s = true;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.d = true;
    if (e.code === 'Space') fireMissiles();
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.shift = true;
    if (e.code === 'KeyP') isPaused = !isPaused;
    if (e.code === 'KeyR') reset();
    if (e.code === 'KeyM') sound.toggleMute();
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.w = false;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.a = false;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.s = false;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.d = false;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.shift = false;
  });

  window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  window.addEventListener('mousedown', (e) => {
    sound.start();
    if (e.button === 0) fireAutocannon();
    if (e.button === 2) { fireMissiles(); e.preventDefault(); }
  });
  window.addEventListener('contextmenu', (e) => e.preventDefault());

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
    mech.x = 640; mech.y = 550; mech.armor = 100; mech.heat = 0; mech.overheated = false;
    bullets = []; missiles = []; explosions = [];
    enemyMechs.forEach((em) => { em.hp = em.maxHp; em.alive = true; });
  }

  function fireAutocannon() {
    if (isPaused || mech.overheated) return;
    sound.cannon();
    mech.heat = Math.min(100, mech.heat + 8);
    if (mech.heat >= 100) mech.overheated = true;

    // Dual alternating cannons
    const leftArmX = mech.x + Math.cos(mech.torsoAngle - 0.7) * 32;
    const leftArmY = mech.y + Math.sin(mech.torsoAngle - 0.7) * 32;
    const rightArmX = mech.x + Math.cos(mech.torsoAngle + 0.7) * 32;
    const rightArmY = mech.y + Math.sin(mech.torsoAngle + 0.7) * 32;

    const vx = Math.cos(mech.torsoAngle) * 900;
    const vy = Math.sin(mech.torsoAngle) * 900;

    bullets.push({ x: leftArmX, y: leftArmY, vx, vy, life: 1.0 });
    bullets.push({ x: rightArmX, y: rightArmY, vx, vy, life: 1.0 });
  }

  function fireMissiles() {
    if (isPaused || mech.overheated) return;
    sound.missile();
    mech.heat = Math.min(100, mech.heat + 22);
    if (mech.heat >= 100) mech.overheated = true;

    for (let i = 0; i < 4; i++) {
      const spreadAngle = mech.torsoAngle + (i - 1.5) * 0.25;
      missiles.push({
        x: mech.x, y: mech.y,
        vx: Math.cos(spreadAngle) * 450,
        vy: Math.sin(spreadAngle) * 450,
        targetX: mouse.x, targetY: mouse.y,
        life: 1.5
      });
    }
  }

  function update(dt) {
    if (isPaused) return;

    // Heat sink cooling
    mech.heat = Math.max(0, mech.heat - 24 * dt);
    if (mech.heat < 30) mech.overheated = false;

    // Locomotion
    let mx = 0, my = 0;
    if (keys.w) my -= 1;
    if (keys.s) my += 1;
    if (keys.a) mx -= 1;
    if (keys.d) mx += 1;

    const len = Math.hypot(mx, my);
    if (len > 0) {
      mech.legAngle = Math.atan2(my, mx);
      const spd = keys.shift ? mech.speed * 1.8 : mech.speed; // Jump jets dash
      mech.x += (mx / len) * spd * dt;
      mech.y += (my / len) * spd * dt;
    }

    mech.torsoAngle = Math.atan2(mouse.y - mech.y, mouse.x - mech.x);

    // Update Bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;

      enemyMechs.forEach((em) => {
        if (em.alive && Math.hypot(em.x - b.x, em.y - b.y) < 35) {
          em.hp--;
          if (em.hp <= 0) em.alive = false;
          b.life = 0;
        }
      });

      if (b.life <= 0) bullets.splice(i, 1);
    }

    // Update Missiles
    for (let i = missiles.length - 1; i >= 0; i--) {
      const m = missiles[i];
      // Steer slightly towards target
      const toTarget = Math.atan2(m.targetY - m.y, m.targetX - m.x);
      m.vx = m.vx * 0.92 + Math.cos(toTarget) * 650 * 0.08;
      m.vy = m.vy * 0.92 + Math.sin(toTarget) * 650 * 0.08;

      m.x += m.vx * dt;
      m.y += m.vy * dt;
      m.life -= dt;

      enemyMechs.forEach((em) => {
        if (em.alive && Math.hypot(em.x - m.x, em.y - m.y) < 38) {
          em.hp -= 3;
          if (em.hp <= 0) em.alive = false;
          explosions.push({ x: m.x, y: m.y, radius: 10, maxRadius: 50, life: 0.35 });
          m.life = 0;
        }
      });

      if (m.life <= 0) {
        explosions.push({ x: m.x, y: m.y, radius: 8, maxRadius: 35, life: 0.3 });
        missiles.splice(i, 1);
      }
    }

    // Update Explosions
    for (let i = explosions.length - 1; i >= 0; i--) {
      const exp = explosions[i];
      exp.radius += (exp.maxRadius - exp.radius) * 10 * dt;
      exp.life -= dt;
      if (exp.life <= 0) explosions.splice(i, 1);
    }

    // HUD
    elHeat.textContent = mech.overheated ? 'OVERHEAT! [VENTING]' : `${Math.round(mech.heat)}%`;
    elHeat.style.color = mech.overheated ? '#ef4444' : '#c084fc';
    elHeatBar.style.width = `${Math.round(mech.heat)}%`;
    elHeatBar.style.background = mech.overheated ? '#ef4444' : (mech.heat > 60 ? '#f59e0b' : '#22c55e');

    const activeMechs = enemyMechs.filter((em) => em.alive).length;
    elMechs.textContent = `HOSTILE MECHS: ${activeMechs} DETECTED`;
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Wasteland terrain
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ruined structures / building debris
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(150, 150, 120, 120);
    ctx.fillRect(1000, 180, 140, 100);

    // Draw Enemy Mechs
    enemyMechs.forEach((em) => {
      if (!em.alive) {
        ctx.fillStyle = '#334155';
        ctx.fillRect(em.x - 25, em.y - 25, 50, 50);
        return;
      }
      ctx.save();
      ctx.translate(em.x, em.y);
      ctx.rotate(em.angle);

      // Enemy Chassis
      ctx.fillStyle = '#dc2626';
      ctx.beginPath(); ctx.roundRect(-24, -20, 48, 40, 8); ctx.fill();
      ctx.strokeStyle = '#f87171'; ctx.lineWidth = 2; ctx.stroke();

      // Autocannon Barrels
      ctx.fillStyle = '#111827';
      ctx.fillRect(18, -12, 22, 6);
      ctx.fillRect(18, 6, 22, 6);

      // Health bar above enemy
      ctx.restore();
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(em.x - 25, em.y - 40, 50, 6);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(em.x - 25, em.y - 40, 50 * (em.hp / em.maxHp), 6);
    });

    // Draw Bullets
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 4;
    bullets.forEach((b) => {
      ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - b.vx * 0.02, b.y - b.vy * 0.02); ctx.stroke();
    });

    // Draw Missiles & Exhaust smoke trails
    missiles.forEach((m) => {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.arc(m.x, m.y, 4, 0, Math.PI * 2); ctx.fill();
      // Smoke puff
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath(); ctx.arc(m.x - m.vx * 0.03, m.y - m.vy * 0.03, 3, 0, Math.PI * 2); ctx.fill();
    });

    // Draw Explosions
    explosions.forEach((exp) => {
      const grad = ctx.createRadialGradient(exp.x, exp.y, 0, exp.x, exp.y, exp.radius);
      grad.addColorStop(0, '#fef08a');
      grad.addColorStop(0.5, '#ea580c');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2); ctx.fill();
    });

    // Draw Player Titan Battlemech
    ctx.save();
    ctx.translate(mech.x, mech.y);

    // Legs Layer
    ctx.save();
    ctx.rotate(mech.legAngle);
    ctx.fillStyle = '#334155';
    ctx.fillRect(-18, -26, 12, 22); // Left leg
    ctx.fillRect(-18, 4, 12, 22);  // Right leg
    ctx.restore();

    // Torso Layer (Rotates to mouse)
    ctx.rotate(mech.torsoAngle);

    // Jump Jet glow
    if (keys.shift) {
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(-24, 0, 18, 0, Math.PI * 2);
      ctx.fill();
    }

    // Heavy Torso Chassis
    ctx.fillStyle = '#581c87';
    ctx.beginPath(); ctx.roundRect(-26, -24, 52, 48, 8); ctx.fill();
    ctx.strokeStyle = '#c084fc'; ctx.lineWidth = 2.5; ctx.stroke();

    // Left Arm Dual 40mm Autocannon
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(8, -28, 34, 8);
    // Right Arm Dual 40mm Autocannon
    ctx.fillRect(8, 20, 34, 8);

    // Shoulder Missile Pod
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-14, -20, 16, 10);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-12, -18, 4, 6);

    // Cockpit Canopy / Reactor Core
    ctx.fillStyle = mech.overheated ? '#ef4444' : '#00ff88';
    ctx.beginPath(); ctx.arc(4, 0, 8, 0, Math.PI * 2); ctx.fill();

    ctx.restore();

    // Crosshair Reticle
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 16, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeRect(mouse.x - 10, mouse.y - 10, 20, 20);
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
