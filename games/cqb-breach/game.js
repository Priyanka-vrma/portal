(function () {
  'use strict';
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  const elSquad = document.getElementById('hud-squad');
  const elCmd = document.getElementById('hud-cmd');
  const elRooms = document.getElementById('hud-rooms');
  const elThreat = document.getElementById('hud-threat');
  const elBreach = document.getElementById('hud-breach');

  class CQBAudio {
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
    shot() {
      if (!this.init || this.muted) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(280, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.13);
    }
    breach() {
      if (!this.init || this.muted) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(90, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + 0.45);
      gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.46);
    }
    toggleMute() {
      this.muted = !this.muted;
      return this.muted;
    }
  }
  const sound = new CQBAudio();

  const keys = { w: false, a: false, s: false, d: false };
  const mouse = { x: 640, y: 360 };

  const squadLeader = {
    x: 180, y: 360, angle: 0, speed: 170, hp: 100
  };

  // 3 squad followers (stack behind leader)
  const squad = [
    { x: 140, y: 360, role: 'Breacher' },
    { x: 100, y: 360, role: 'Rifleman' },
    { x: 60, y: 360, role: 'Support' }
  ];

  let doors = [
    { x: 380, y: 310, w: 20, h: 100, breached: false, label: 'SECTOR ALPHA' },
    { x: 780, y: 310, w: 20, h: 100, breached: false, label: 'SECTOR BRAVO' }
  ];

  let hostiles = [
    { x: 550, y: 280, hp: 2, alive: true },
    { x: 600, y: 440, hp: 2, alive: true },
    { x: 950, y: 260, hp: 2, alive: true },
    { x: 1050, y: 460, hp: 2, alive: true }
  ];

  let c4Count = 2;
  let flashCount = 3;
  let bullets = [];
  let isPaused = false;
  let flashEffect = 0;

  window.addEventListener('keydown', (e) => {
    sound.start();
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.w = true;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.a = true;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.s = true;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.d = true;
    if (e.code === 'Space') breachNearestDoor();
    if (e.code === 'KeyE') cycleSquadCommand();
    if (e.code === 'KeyP') isPaused = !isPaused;
    if (e.code === 'KeyR') reset();
    if (e.code === 'KeyM') sound.toggleMute();
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.w = false;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.a = false;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.s = false;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.d = false;
  });

  window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  window.addEventListener('mousedown', (e) => {
    if (e.button === 0) fireCarbine();
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
    squadLeader.x = 180; squadLeader.y = 360;
    c4Count = 2; flashCount = 3; bullets = [];
    doors.forEach((d) => d.breached = false);
    hostiles.forEach((h) => { h.hp = 2; h.alive = true; });
  }

  function breachNearestDoor() {
    doors.forEach((d) => {
      const dist = Math.hypot(d.x - squadLeader.x, (d.y + d.h / 2) - squadLeader.y);
      if (dist < 120 && !d.breached && c4Count > 0) {
        d.breached = true;
        c4Count--;
        flashEffect = 1.0;
        sound.breach();
      }
    });
  }

  function cycleSquadCommand() {
    const cmds = ['ADVANCE & CLEAR', 'STACK ON DOOR', 'HOLD POSITION'];
    const curIdx = cmds.indexOf(elCmd.textContent.replace('COMMAND: ', '').replace(' [E]', ''));
    const nextIdx = (curIdx + 1) % cmds.length;
    elCmd.textContent = `COMMAND: ${cmds[nextIdx]} [E]`;
  }

  function fireCarbine() {
    if (isPaused) return;
    sound.shot();

    const vx = Math.cos(squadLeader.angle) * 800;
    const vy = Math.sin(squadLeader.angle) * 800;
    bullets.push({
      x: squadLeader.x + Math.cos(squadLeader.angle) * 22,
      y: squadLeader.y + Math.sin(squadLeader.angle) * 22,
      vx, vy, life: 1.0
    });
  }

  function update(dt) {
    if (isPaused) return;

    if (flashEffect > 0) flashEffect = Math.max(0, flashEffect - dt * 2.5);

    // Movement
    let mx = 0, my = 0;
    if (keys.w) my -= 1;
    if (keys.s) my += 1;
    if (keys.a) mx -= 1;
    if (keys.d) mx += 1;

    const len = Math.hypot(mx, my);
    if (len > 0) {
      squadLeader.x += (mx / len) * squadLeader.speed * dt;
      squadLeader.y += (my / len) * squadLeader.speed * dt;
    }

    squadLeader.angle = Math.atan2(mouse.y - squadLeader.y, mouse.x - squadLeader.x);

    // Update Squad Followers
    let targetX = squadLeader.x;
    let targetY = squadLeader.y;
    squad.forEach((member, i) => {
      const offset = (i + 1) * 35;
      const angle = squadLeader.angle + Math.PI;
      const idealX = targetX + Math.cos(angle) * offset;
      const idealY = targetY + Math.sin(angle) * offset;
      member.x += (idealX - member.x) * 10 * dt;
      member.y += (idealY - member.y) * 10 * dt;
    });

    // Update Bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;

      // Hit hostiles
      hostiles.forEach((h) => {
        if (h.alive && Math.hypot(h.x - b.x, h.y - b.y) < 22) {
          h.hp--;
          if (h.hp <= 0) h.alive = false;
          b.life = 0;
        }
      });

      if (b.life <= 0) bullets.splice(i, 1);
    }

    // HUD
    const cleared = doors.filter((d) => d.breached).length;
    elRooms.textContent = `ROOM ${cleared + 1}/3`;
    elBreach.textContent = `${c4Count} C4 • ${flashCount} FLASH`;
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Compound Concrete Floor
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Compound Walls
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(380, 0, 20, 310);
    ctx.fillRect(380, 410, 20, canvas.height - 410);

    ctx.fillRect(780, 0, 20, 310);
    ctx.fillRect(780, 410, 20, canvas.height - 410);

    // Doors
    doors.forEach((d) => {
      if (d.breached) {
        // Splintered breached door
        ctx.fillStyle = '#78350f';
        ctx.fillRect(d.x - 10, d.y + 20, 40, 10);
      } else {
        // Closed steel tactical door
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(d.x, d.y, d.w, d.h);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(d.x, d.y, d.w, d.h);
      }
    });

    // Draw Hostiles
    hostiles.forEach((h) => {
      if (!h.alive) {
        ctx.fillStyle = '#450a0a';
        ctx.beginPath(); ctx.arc(h.x, h.y, 12, 0, Math.PI * 2); ctx.fill();
        return;
      }
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(h.x, h.y, 14, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fca5a5';
      ctx.stroke();

      // Weapon
      ctx.fillStyle = '#171717';
      ctx.fillRect(h.x - 18, h.y - 3, 14, 6);
    });

    // Draw Bullets
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 3;
    bullets.forEach((b) => {
      ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - b.vx * 0.02, b.y - b.vy * 0.02); ctx.stroke();
    });

    // Draw Squad Members
    squad.forEach((m) => {
      ctx.fillStyle = '#1e3a8a';
      ctx.beginPath(); ctx.arc(m.x, m.y, 12, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#60a5fa'; ctx.stroke();
    });

    // Draw Squad Leader (SWAT Operator)
    ctx.save();
    ctx.translate(squadLeader.x, squadLeader.y);
    ctx.rotate(squadLeader.angle);

    // Tactical Flashlight Cone
    const flashGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 320);
    flashGrad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    flashGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = flashGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.arc(0, 0, 320, -0.4, 0.4); ctx.closePath(); ctx.fill();

    // Body
    ctx.fillStyle = '#0f172a';
    ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#00ff88'; ctx.lineWidth = 2; ctx.stroke();

    // Carbine
    ctx.fillStyle = '#334155';
    ctx.fillRect(10, 2, 22, 5);

    ctx.restore();

    // Flashbang Screen Flash
    if (flashEffect > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${flashEffect * 0.75})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
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
