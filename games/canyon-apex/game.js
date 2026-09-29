(function () {
  'use strict';
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  const elSpeed = document.getElementById('hud-speed');
  const elSurface = document.getElementById('hud-surface');
  const elSusp = document.getElementById('hud-susp');
  const elTime = document.getElementById('hud-time');

  // Audio Synth
  class RallyAudio {
    constructor() {
      this.ctx = null;
      this.osc = null;
      this.gain = null;
      this.init = false;
      this.muted = false;
    }
    start() {
      if (this.init) return;
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
        this.osc = this.ctx.createOscillator();
        this.gain = this.ctx.createGain();
        this.osc.type = 'triangle';
        this.osc.frequency.value = 55;
        this.gain.gain.value = 0.05;
        this.osc.connect(this.gain);
        this.gain.connect(this.ctx.destination);
        this.osc.start();
        this.init = true;
      } catch (e) {}
    }
    update(speedKmh) {
      if (!this.init || this.muted) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      this.osc.frequency.setTargetAtTime(55 + speedKmh * 1.6, this.ctx.currentTime, 0.05);
    }
    toggleMute() {
      this.muted = !this.muted;
      if (this.gain) this.gain.gain.value = this.muted ? 0 : 0.05;
      return this.muted;
    }
  }
  const sound = new RallyAudio();

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
    x: 450, y: 350, angle: 0, speed: 0, vx: 0, vy: 0,
    maxSpeed: 15.5, accel: 0.15, brake: 0.25,
    grip: 0.965, suspBounce: 0, suspVel: 0
  };

  let stageTime = 0;
  let isPaused = false;
  let mudParticles = [];

  const trackPoints = [
    { x: 450, y: 350 }, { x: 1300, y: 300 }, { x: 1850, y: 550 },
    { x: 1950, y: 1100 }, { x: 1500, y: 1550 }, { x: 800, y: 1450 },
    { x: 350, y: 1100 }, { x: 300, y: 650 }
  ];

  function reset() {
    car.x = 450; car.y = 350; car.angle = 0; car.speed = 0; car.vx = 0; car.vy = 0;
    stageTime = 0; mudParticles = [];
  }

  function update(dt) {
    if (isPaused) return;
    stageTime += dt;

    if (keys.up) car.speed = Math.min(car.maxSpeed, car.speed + car.accel);
    else if (keys.down) car.speed = Math.max(-4, car.speed - car.brake);
    else car.speed *= 0.98;

    const steerRate = 0.04 * (car.speed / 10);
    if (keys.left) car.angle -= steerRate;
    if (keys.right) car.angle += steerRate;

    // AWD Loose Surface Slip
    const targetVx = Math.cos(car.angle) * car.speed;
    const targetVy = Math.sin(car.angle) * car.speed;
    const currentGrip = keys.space ? 0.94 : car.grip;

    car.vx = car.vx * currentGrip + targetVx * (1 - currentGrip);
    car.vy = car.vy * currentGrip + targetVy * (1 - currentGrip);

    car.x += car.vx;
    car.y += car.vy;

    // Suspension bounce simulation over bumps
    const bumpNoise = Math.sin(car.x * 0.05) * Math.cos(car.y * 0.05);
    car.suspVel += (bumpNoise * 4 - car.suspBounce) * 0.2;
    car.suspVel *= 0.82;
    car.suspBounce += car.suspVel;

    const movingSpeed = Math.hypot(car.vx, car.vy);
    const speedKmh = Math.round(movingSpeed * 13);
    sound.update(speedKmh);

    // Mud roost particles
    if (movingSpeed > 3) {
      for (let i = 0; i < 2; i++) {
        mudParticles.push({
          x: car.x - Math.cos(car.angle) * 20 + (Math.random() - 0.5) * 16,
          y: car.y - Math.sin(car.angle) * 20 + (Math.random() - 0.5) * 16,
          vx: -car.vx * 0.4 + (Math.random() - 0.5) * 3,
          vy: -car.vy * 0.4 + (Math.random() - 0.5) * 3,
          size: Math.random() * 5 + 3,
          life: 0.35, maxLife: 0.35,
          color: Math.random() > 0.5 ? '#78350f' : '#92400e'
        });
      }
    }

    for (let i = mudParticles.length - 1; i >= 0; i--) {
      const p = mudParticles[i];
      p.x += p.vx; p.y += p.vy; p.life -= dt;
      if (p.life <= 0) mudParticles.splice(i, 1);
    }

    // Update HUD
    elSpeed.innerHTML = `${speedKmh} <span style="font-size:0.85rem;color:#f59e0b;">KM/H</span>`;
    const suspTravel = Math.round(300 + car.suspBounce * 8);
    elSusp.textContent = `${suspTravel} mm`;
    const mins = Math.floor(stageTime / 60);
    const secs = (stageTime % 60).toFixed(1).padStart(4, '0');
    elTime.textContent = `${mins}:${secs}`;
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2 - car.x, canvas.height / 2 - car.y);

    // Canyon terrain background
    ctx.fillStyle = '#27170c';
    ctx.fillRect(-200, -200, 2800, 2200);

    // Track path (Dirt & Mud)
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 260;
    ctx.beginPath();
    trackPoints.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
    ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 220;
    ctx.stroke();

    // Ruts
    ctx.strokeStyle = 'rgba(69, 26, 3, 0.6)';
    ctx.lineWidth = 14;
    ctx.stroke();

    // Mud Particles
    mudParticles.forEach((p) => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Rally Car
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle);

    // Suspension shadow displacement
    const suspScale = 1 + car.suspBounce * 0.05;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(-28, -15, 56, 30);

    // Chassis (WRC Orange Hatchback)
    ctx.scale(suspScale, suspScale);
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.roundRect(-26, -14, 52, 28, 4);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Roof & Spoiler
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-10, -10, 22, 20);
    ctx.fillRect(-26, -14, 4, 28); // Rally wing

    // Mud splatters on rear
    ctx.fillStyle = '#451a03';
    ctx.fillRect(-24, -12, 6, 8);
    ctx.fillRect(-24, 4, 6, 8);

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
