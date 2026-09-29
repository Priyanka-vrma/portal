(function () {
  'use strict';
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  const elSpeed = document.getElementById('hud-speed');
  const elDrag = document.getElementById('hud-drag');
  const elScore = document.getElementById('hud-score');
  const elDist = document.getElementById('hud-dist');

  class AutobahnAudio {
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
        this.osc.frequency.value = 80;
        this.gain.gain.value = 0.04;
        this.osc.connect(this.gain);
        this.gain.connect(this.ctx.destination);
        this.osc.start();
        this.init = true;
      } catch (e) {}
    }
    update(speedKmh, drafting) {
      if (!this.init || this.muted) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      this.osc.frequency.setTargetAtTime(80 + speedKmh * 1.5 + (drafting ? 50 : 0), this.ctx.currentTime, 0.05);
    }
    toggleMute() {
      this.muted = !this.muted;
      if (this.gain) this.gain.gain.value = this.muted ? 0 : 0.04;
      return this.muted;
    }
  }
  const sound = new AutobahnAudio();

  const keys = { up: false, down: false, left: false, right: false, shift: false };
  window.addEventListener('keydown', (e) => {
    sound.start();
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.up = true;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.down = true;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = true;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = true;
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

  const highway = {
    roadX: 0, roadWidth: 460, lanes: 4, scrollY: 0
  };

  const player = {
    x: 0, y: 0, speed: 120, maxSpeed: 330,
    width: 38, height: 72, vx: 0, drafting: false
  };

  let traffic = [];
  let score = 0;
  let distanceKm = 0;
  let isPaused = false;

  function reset() {
    player.x = canvas.width / 2;
    player.y = canvas.height - 140;
    player.speed = 120;
    player.vx = 0;
    traffic = [];
    score = 0;
    distanceKm = 0;
    spawnTraffic();
  }

  function spawnTraffic() {
    const laneWidth = highway.roadWidth / highway.lanes;
    const startX = (canvas.width - highway.roadWidth) / 2;
    for (let i = 0; i < 6; i++) {
      const lane = Math.floor(Math.random() * highway.lanes);
      traffic.push({
        x: startX + lane * laneWidth + laneWidth / 2,
        y: -100 - i * 220,
        speed: 80 + Math.random() * 80,
        width: 36, height: 68,
        color: ['#dc2626', '#2563eb', '#16a34a', '#d97706', '#64748b'][Math.floor(Math.random() * 5)]
      });
    }
  }

  function update(dt) {
    if (isPaused) return;

    highway.roadX = (canvas.width - highway.roadWidth) / 2;
    if (player.y === 0) {
      player.x = canvas.width / 2;
      player.y = canvas.height - 140;
      spawnTraffic();
    }

    // Acceleration & Drag
    let topSpeed = keys.shift ? 360 : player.maxSpeed;
    let accel = keys.shift ? 85 : 55;

    // Check drafting behind vehicle ahead
    player.drafting = false;
    traffic.forEach((car) => {
      const dx = Math.abs(car.x - player.x);
      const dy = player.y - car.y;
      if (dx < 30 && dy > 0 && dy < 160) {
        player.drafting = true;
      }
    });

    if (player.drafting) {
      topSpeed += 30;
      accel += 40;
    }

    if (keys.up) player.speed = Math.min(topSpeed, player.speed + accel * dt);
    else if (keys.down) player.speed = Math.max(60, player.speed - 120 * dt);
    else player.speed = Math.max(90, player.speed - 30 * dt);

    // Lateral steering
    if (keys.left) player.vx = -240;
    else if (keys.right) player.vx = 240;
    else player.vx *= 0.8;

    player.x += player.vx * dt;
    player.x = Math.max(highway.roadX + 24, Math.min(highway.roadX + highway.roadWidth - 24, player.x));

    // Scroll road
    highway.scrollY = (highway.scrollY + player.speed * 2.8 * dt) % 80;
    distanceKm += (player.speed * dt) / 3600;

    // Update traffic
    const laneWidth = highway.roadWidth / highway.lanes;
    traffic.forEach((car) => {
      // Relative movement: traffic moves down relative to player speed difference
      const relSpeed = (player.speed - car.speed) * 2.8;
      car.y += relSpeed * dt;

      // Near miss detection
      const dx = Math.abs(car.x - player.x);
      const dy = Math.abs(car.y - player.y);
      if (dx < 42 && dy < 65) {
        // Crash / Slowdown penalty
        player.speed = Math.max(70, player.speed * 0.7);
      } else if (dx < 52 && dy < 75 && !car.nearMissScored) {
        car.nearMissScored = true;
        score += Math.round(player.speed * 1.5);
      }

      // Recycle car when off-screen
      if (car.y > canvas.height + 100) {
        car.y = -150 - Math.random() * 200;
        const lane = Math.floor(Math.random() * highway.lanes);
        car.x = highway.roadX + lane * laneWidth + laneWidth / 2;
        car.speed = 80 + Math.random() * 90;
        car.nearMissScored = false;
      }
    });

    sound.update(Math.round(player.speed), player.drafting);

    // Update HUD
    elSpeed.innerHTML = `${Math.round(player.speed)} <span style="font-size:0.85rem;color:#38bdf8;">KM/H</span>`;
    elDrag.textContent = player.drafting ? 'Cd: 0.19 • DRAFTING: ACTIVE 🔥' : 'Cd: 0.28 • DRAFTING: OFF';
    elScore.textContent = String(score);
    elDist.textContent = `${distanceKm.toFixed(2)} KM`;
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background grass / road shoulders
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Asphalt
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(highway.roadX, 0, highway.roadWidth, canvas.height);

    // Road barriers
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(highway.roadX - 6, 0, 6, canvas.height);
    ctx.fillRect(highway.roadX + highway.roadWidth, 0, 6, canvas.height);

    // Dashed lane lines
    const laneWidth = highway.roadWidth / highway.lanes;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 3;
    ctx.setLineDash([30, 25]);
    ctx.lineDashOffset = -highway.scrollY;

    for (let l = 1; l < highway.lanes; l++) {
      ctx.beginPath();
      ctx.moveTo(highway.roadX + l * laneWidth, 0);
      ctx.lineTo(highway.roadX + l * laneWidth, canvas.height);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Draw Traffic
    traffic.forEach((car) => {
      ctx.fillStyle = car.color;
      ctx.beginPath();
      ctx.roundRect(car.x - car.width / 2, car.y - car.height / 2, car.width, car.height, 6);
      ctx.fill();

      // Taillights
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(car.x - car.width / 2 + 3, car.y + car.height / 2 - 4, 8, 4);
      ctx.fillRect(car.x + car.width / 2 - 11, car.y + car.height / 2 - 4, 8, 4);
    });

    // Draw Player Hypercar
    ctx.save();
    ctx.translate(player.x, player.y);

    // Headlight beams projected forward
    const beamGrad = ctx.createLinearGradient(0, 0, 0, -220);
    beamGrad.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
    beamGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(-16, -player.height / 2);
    ctx.lineTo(-45, -player.height / 2 - 200);
    ctx.lineTo(45, -player.height / 2 - 200);
    ctx.lineTo(16, -player.height / 2);
    ctx.fill();

    // Chassis
    ctx.fillStyle = player.drafting ? '#38bdf8' : '#0284c7';
    ctx.beginPath();
    ctx.roundRect(-player.width / 2, -player.height / 2, player.width, player.height, 8);
    ctx.fill();
    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Cockpit
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.roundRect(-12, -18, 24, 34, 4);
    ctx.fill();

    // Taillights
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(-player.width / 2 + 4, player.height / 2 - 4, 8, 4);
    ctx.fillRect(player.width / 2 - 12, player.height / 2 - 4, 8, 4);

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
    player.x = canvas.width / 2;
    player.y = canvas.height - 140;
  }
  window.addEventListener('resize', resize);
  resize();
})();
