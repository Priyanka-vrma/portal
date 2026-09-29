(function () {
  'use strict';
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  const elSpeed = document.getElementById('hud-speed');
  const elDrs = document.getElementById('hud-drs');
  const elWear = document.getElementById('hud-wear');
  const elTireBar = document.getElementById('hud-tire-bar');
  const elTemp = document.getElementById('hud-temp');
  const elLap = document.getElementById('hud-lap');

  class F1Audio {
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
        this.osc.frequency.value = 140;
        this.gain.gain.value = 0.04;
        this.osc.connect(this.gain);
        this.gain.connect(this.ctx.destination);
        this.osc.start();
        this.init = true;
      } catch (e) {}
    }
    update(speedKmh) {
      if (!this.init || this.muted) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      this.osc.frequency.setTargetAtTime(140 + speedKmh * 2.2, this.ctx.currentTime, 0.05);
    }
    toggleMute() {
      this.muted = !this.muted;
      if (this.gain) this.gain.gain.value = this.muted ? 0 : 0.04;
      return this.muted;
    }
  }
  const sound = new F1Audio();

  const keys = { up: false, down: false, left: false, right: false, space: false };
  window.addEventListener('keydown', (e) => {
    sound.start();
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.up = true;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.down = true;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = true;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = true;
    if (e.code === 'Space') { keys.space = true; e.preventDefault(); }
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

  const car = {
    x: 400, y: 350, angle: 0, speed: 0, vx: 0, vy: 0,
    maxSpeed: 19.0, accel: 0.22, brake: 0.38,
    tireWear: 100, tireTemp: 90
  };

  const circuitPoints = [
    { x: 400, y: 350 }, { x: 1200, y: 350 }, { x: 1750, y: 550 },
    { x: 1950, y: 1100 }, { x: 1550, y: 1500 }, { x: 1100, y: 1250 },
    { x: 750, y: 1550 }, { x: 350, y: 1200 }, { x: 300, y: 700 }
  ];

  let lapTime = 0;
  let isPaused = false;

  function reset() {
    car.x = 400; car.y = 350; car.angle = 0; car.speed = 0; car.vx = 0; car.vy = 0;
    car.tireWear = 100; car.tireTemp = 90; lapTime = 0;
  }

  function update(dt) {
    if (isPaused) return;
    lapTime += dt;

    const isDrs = keys.space;
    const topSpeed = isDrs ? car.maxSpeed * 1.15 : car.maxSpeed;

    // Tire grip factor (100% down to 70% as tires wear)
    const gripFactor = 0.7 + (car.tireWear / 100) * 0.3;

    if (keys.up) car.speed = Math.min(topSpeed, car.speed + car.accel * gripFactor);
    else if (keys.down) car.speed = Math.max(-5, car.speed - car.brake * gripFactor);
    else car.speed *= 0.985;

    // High downforce steering
    const steerRate = 0.05 * (car.speed / 12) * gripFactor;
    if (keys.left) car.angle -= steerRate;
    if (keys.right) car.angle += steerRate;

    // High grip vector tracking
    const targetVx = Math.cos(car.angle) * car.speed;
    const targetVy = Math.sin(car.angle) * car.speed;
    const grip = 0.98 * gripFactor;

    car.vx = car.vx * (1 - grip) + targetVx * grip;
    car.vy = car.vy * (1 - grip) + targetVy * grip;

    car.x += car.vx;
    car.y += car.vy;

    const movingSpeed = Math.hypot(car.vx, car.vy);
    const speedKmh = Math.round(movingSpeed * 15);
    sound.update(speedKmh);

    // Tire degradation & thermal model
    if (movingSpeed > 5) {
      car.tireWear = Math.max(20, car.tireWear - 0.25 * dt);
      const targetTemp = 85 + (speedKmh / 280) * 25 + (keys.space ? 10 : 0);
      car.tireTemp += (targetTemp - car.tireTemp) * 0.1 * dt;
    }

    // HUD
    elSpeed.innerHTML = `${speedKmh} <span style="font-size:0.85rem;color:#ef4444;">KM/H</span>`;
    elDrs.textContent = isDrs ? 'DRS: ACTIVE [OPEN WING] 🔥' : 'DRS: AVAILABLE [SPACE]';
    elWear.textContent = `${Math.round(car.tireWear)}%`;
    elTireBar.style.width = `${Math.round(car.tireWear)}%`;
    elTireBar.style.background = car.tireWear > 50 ? '#22c55e' : (car.tireWear > 30 ? '#f59e0b' : '#ef4444');
    elTemp.textContent = `TEMP: ${Math.round(car.tireTemp)}°C (OPTIMAL)`;

    const mins = Math.floor(lapTime / 60);
    const secs = (lapTime % 60).toFixed(1).padStart(4, '0');
    elLap.textContent = `${mins}:${secs}`;
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2 - car.x, canvas.height / 2 - car.y);

    // Grass
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(-200, -200, 2600, 2200);

    // Curbs & Track
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Red/White Curbs
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 210;
    ctx.beginPath();
    circuitPoints.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
    ctx.closePath();
    ctx.stroke();

    // Asphalt Track
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 180;
    ctx.stroke();

    // Racing Line (Green/Purple hint)
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.35)';
    ctx.lineWidth = 14;
    ctx.stroke();

    // Draw Open-Wheel Formula Car
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle);

    // Front Wing
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(24, -18, 6, 36);

    // Rear Wing
    ctx.fillStyle = keys.space ? '#22c55e' : '#dc2626';
    ctx.fillRect(-28, -16, 5, 32);

    // Monocoque Chassis
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(26, 0);
    ctx.lineTo(-24, -8);
    ctx.lineTo(-24, 8);
    ctx.closePath();
    ctx.fill();

    // 4 Open-wheel Tires
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(10, -18, 12, 6); // Front Left
    ctx.fillRect(10, 12, 12, 6);  // Front Right
    ctx.fillRect(-22, -19, 14, 7); // Rear Left
    ctx.fillRect(-22, 12, 14, 7);  // Rear Right

    // Cockpit & Driver Helmet
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(-2, 0, 4, 0, Math.PI * 2);
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
