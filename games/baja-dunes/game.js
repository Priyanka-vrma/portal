(function () {
  'use strict';
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  const elSpeed = document.getElementById('hud-speed');
  const elAir = document.getElementById('hud-air');
  const elPitch = document.getElementById('hud-pitch');
  const elWaypoint = document.getElementById('hud-waypoint');
  const elDist = document.getElementById('hud-dist');

  class DesertAudio {
    constructor() {
      this.ctx = null; this.osc = null; this.gain = null; this.init = false; this.muted = false;
    }
    start() {
      if (this.init) return;
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
        this.osc = this.ctx.createOscillator();
        this.gain = this.ctx.createGain();
        this.osc.type = 'sawtooth';
        this.osc.frequency.value = 50;
        this.gain.gain.value = 0.05;
        this.osc.connect(this.gain);
        this.gain.connect(this.ctx.destination);
        this.osc.start();
        this.init = true;
      } catch (e) {}
    }
    update(speedKmh, isAirborne) {
      if (!this.init || this.muted) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      this.osc.frequency.setTargetAtTime(50 + speedKmh * 1.4 + (isAirborne ? 60 : 0), this.ctx.currentTime, 0.05);
    }
    toggleMute() {
      this.muted = !this.muted;
      if (this.gain) this.gain.gain.value = this.muted ? 0 : 0.05;
      return this.muted;
    }
  }
  const sound = new DesertAudio();

  const keys = { up: false, down: false, left: false, right: false, space: false, shift: false };
  window.addEventListener('keydown', (e) => {
    sound.start();
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.up = true;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.down = true;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = true;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = true;
    if (e.code === 'Space') { keys.space = true; e.preventDefault(); }
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.shift = true;
    if (e.code === 'KeyP') isPaused = !isPaused;
    if (e.code === 'KeyR') reset();
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

  // Trophy Truck State
  const truck = {
    x: 400, y: 400, angle: 0, speed: 0, vx: 0, vy: 0,
    pitch: 0, roll: 0, altitude: 0, vAlt: 0,
    isAirborne: false, airTimer: 0
  };

  const waypoints = [
    { x: 900, y: 500 }, { x: 1600, y: 700 }, { x: 2200, y: 1300 },
    { x: 1700, y: 1900 }, { x: 800, y: 2000 }, { x: 400, y: 1200 }
  ];
  let curWp = 0;

  let sandParticles = [];
  let isPaused = false;

  function reset() {
    truck.x = 400; truck.y = 400; truck.angle = 0; truck.speed = 0;
    truck.vx = 0; truck.vy = 0; truck.altitude = 0; truck.vAlt = 0;
    truck.airTimer = 0; curWp = 0; sandParticles = [];
  }

  function update(dt) {
    if (isPaused) return;

    // Throttle & Weight Transfer
    const maxSpd = keys.shift ? 18 : 13.5;
    if (keys.up) {
      truck.speed = Math.min(maxSpd, truck.speed + 0.14);
      truck.pitch = Math.max(-0.25, truck.pitch - 0.4 * dt); // Nose up under acceleration
    } else if (keys.down) {
      truck.speed = Math.max(-4, truck.speed - 0.26);
      truck.pitch = Math.min(0.25, truck.pitch + 0.5 * dt); // Nose down under braking
    } else {
      truck.speed *= 0.98;
      truck.pitch *= 0.9;
    }

    // Steering & Roll
    const steer = 0.038 * (truck.speed / 8);
    if (keys.left) {
      truck.angle -= steer;
      truck.roll = Math.max(-0.2, truck.roll - 0.5 * dt);
    } else if (keys.right) {
      truck.angle += steer;
      truck.roll = Math.min(0.2, truck.roll + 0.5 * dt);
    } else {
      truck.roll *= 0.9;
    }

    // Sand Dune Crest Elevation Jump Simulation
    const duneElevation = Math.sin(truck.x * 0.008) * Math.cos(truck.y * 0.008) * 40;
    if (truck.speed > 8 && duneElevation > 20 && !truck.isAirborne) {
      truck.isAirborne = true;
      truck.vAlt = 8;
    }

    if (truck.isAirborne) {
      truck.altitude += truck.vAlt;
      truck.vAlt -= 24 * dt;
      truck.airTimer += dt;
      if (truck.altitude <= 0) {
        truck.altitude = 0;
        truck.isAirborne = false;
      }
    } else {
      truck.airTimer = 0;
    }

    // Velocity update
    const targetVx = Math.cos(truck.angle) * truck.speed;
    const targetVy = Math.sin(truck.angle) * truck.speed;
    truck.vx = truck.vx * 0.95 + targetVx * 0.05;
    truck.vy = truck.vy * 0.95 + targetVy * 0.05;

    truck.x += truck.vx;
    truck.y += truck.vy;

    const movingSpeed = Math.hypot(truck.vx, truck.vy);
    const speedKmh = Math.round(movingSpeed * 12);
    sound.update(speedKmh, truck.isAirborne);

    // Sand Rooster particles
    if (movingSpeed > 2 && !truck.isAirborne) {
      sandParticles.push({
        x: truck.x - Math.cos(truck.angle) * 24 + (Math.random() - 0.5) * 20,
        y: truck.y - Math.sin(truck.angle) * 24 + (Math.random() - 0.5) * 20,
        vx: -truck.vx * 0.3 + (Math.random() - 0.5) * 4,
        vy: -truck.vy * 0.3 + (Math.random() - 0.5) * 4,
        size: Math.random() * 6 + 4,
        life: 0.4, maxLife: 0.4,
        color: '#d97706'
      });
    }

    for (let i = sandParticles.length - 1; i >= 0; i--) {
      const p = sandParticles[i];
      p.x += p.vx; p.y += p.vy; p.life -= dt;
      if (p.life <= 0) sandParticles.splice(i, 1);
    }

    // Waypoint check
    const wp = waypoints[curWp];
    const distWp = Math.hypot(wp.x - truck.x, wp.y - truck.y);
    if (distWp < 150) {
      curWp = (curWp + 1) % waypoints.length;
    }

    // HUD
    elSpeed.innerHTML = `${speedKmh} <span style="font-size:0.85rem;color:#f59e0b;">KM/H</span>`;
    elAir.textContent = truck.isAirborne ? `${truck.airTimer.toFixed(1)} s 🚀` : '0.0 s';
    elAir.style.color = truck.isAirborne ? '#00ff88' : '#94a3b8';
    elPitch.textContent = `PITCH: ${(truck.pitch * 30).toFixed(1)}° • ROLL: ${(truck.roll * 30).toFixed(1)}°`;
    elWaypoint.textContent = `WP ${curWp + 1}/${waypoints.length}`;
    elDist.textContent = `${Math.round(distWp)} METERS`;
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2 - truck.x, canvas.height / 2 - truck.y);

    // Desert terrain background
    ctx.fillStyle = '#b45309';
    ctx.fillRect(-200, -200, 3200, 3200);

    // Sand dune ridges (contour gradient bands)
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 14;
    for (let d = 0; d < 3000; d += 280) {
      ctx.beginPath();
      ctx.moveTo(-200, d);
      ctx.bezierCurveTo(800, d + 100, 1800, d - 100, 3000, d + 80);
      ctx.stroke();
    }

    // Waypoint markers
    waypoints.forEach((wp, i) => {
      const isTarget = i === curWp;
      ctx.strokeStyle = isTarget ? '#00ff88' : '#f59e0b';
      ctx.lineWidth = isTarget ? 6 : 3;
      ctx.beginPath();
      ctx.arc(wp.x, wp.y, isTarget ? 80 : 50, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = isTarget ? '#00ff88' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(wp.x, wp.y, 14, 0, Math.PI * 2);
      ctx.fill();
    });

    // Sand Particles
    sandParticles.forEach((p) => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Draw Trophy Truck
    ctx.save();
    ctx.translate(truck.x, truck.y);
    ctx.rotate(truck.angle);

    // Scale up slightly during jump altitude
    const scale = 1 + (truck.altitude / 80);
    ctx.scale(scale, scale);

    // Truck Shadow (offsets when jumping)
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(-32 + truck.altitude * 0.5, -18 + truck.altitude * 0.5, 64, 36);

    // 4 Oversized Baja Offroad Tires
    ctx.fillStyle = '#171717';
    ctx.fillRect(14, -24, 16, 10);
    ctx.fillRect(14, 14, 16, 10);
    ctx.fillRect(-26, -24, 18, 10);
    ctx.fillRect(-26, 14, 18, 10);

    // Tubular Steel Roll Cage Chassis
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.roundRect(-30, -18, 60, 36, 6);
    ctx.fill();
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 3;
    ctx.stroke();

    // KC Light Bar on Roof
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-2, -14, 4, 28);

    // Dual Spare Tires in Bed
    ctx.fillStyle = '#262626';
    ctx.beginPath();
    ctx.arc(-18, -6, 7, 0, Math.PI * 2);
    ctx.arc(-18, 6, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
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
