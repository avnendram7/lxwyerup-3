/* ══════════════════════════════════════════════════════════
   LXWYER UP — WELCOME.JS (Minimal Celebration)
══════════════════════════════════════════════════════════ */

const _stored = JSON.parse(sessionStorage.getItem('lxwyerMember') || '{}');
const memberName   = _stored.name         || 'Advocate';
const memberNumber = _stored.memberNumber || '001';
const memberEmail  = _stored.email        || '';
const referralCode = _stored.referralCode || 'ADV-XXXX';
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3005/api' : '/api';

document.getElementById('welcomeNameEl').textContent = `Welcome, Adv. ${memberName}.`;
document.getElementById('memberNumberDisplay').textContent = `#${String(memberNumber).padStart(3, '0')}`;

if (memberEmail) {
  const emailNoteEl = document.getElementById('emailNoteEl');
  if (emailNoteEl) {
    emailNoteEl.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,12 2,6"/></svg>
      <span>Confirmation sent to <strong>${memberEmail}</strong></span>
    `;
  }
}

const seqElements = document.querySelectorAll('.reveal-seq');
function revealSequentially() {
  seqElements.forEach((el) => {
    const delay = parseInt(el.dataset.seq) * 150 + 200;
    setTimeout(() => {
      el.classList.add('visible');
    }, delay);
  });
}

window.addEventListener('load', () => {
  revealSequentially();
  setTimeout(launchMinimalCelebration, 500);
  initReferralSystem();
});

async function initReferralSystem() {
  const shareUrl = `https://lxwyerup.com/?ref=${referralCode}`;
  const refLinkInput = document.getElementById('refLinkInput');
  if (refLinkInput) refLinkInput.value = shareUrl;

  const copyBtn = document.getElementById('copyRefBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(shareUrl);
      copyBtn.textContent = 'Copied!';
      setTimeout(() => copyBtn.textContent = 'Copy', 2000);
    });
  }

  // Fetch live stats
  try {
    const res = await fetch(`${API_BASE}/referral/${referralCode}`);
    const data = await res.json();
    if (data.success) {
      updateReferralProgress(data.referralCount);
    }
  } catch (e) {
    console.warn('Could not fetch referral stats');
  }
}

function updateReferralProgress(count) {
  document.getElementById('refCount').textContent = count;
  
  // Calculate progress to next tier (tiers: 3, 5, 10)
  let max = 10;
  let pct = Math.min(100, (count / max) * 100);
  document.getElementById('refProgress').style.width = pct + '%';
  
  const tiers = document.querySelectorAll('.reward-tier');
  tiers.forEach(tier => {
    if (count >= parseInt(tier.dataset.tier)) {
      tier.classList.add('unlocked');
    }
  });
}

/* ══════════════════════════════════════════════════════════
   PREMIUM CELEBRATION ENGINE — LXWYER UP
   Phase 1: Burst ring (instant) + shockwave
   Phase 2: Confetti fountain (0–4s)
   Phase 3: Ambient drifting embers (4–10s)
   Phase 4: Fade out + stop
   Zero dependencies.
══════════════════════════════════════════════════════════ */

const canvas = document.getElementById('celebrationCanvas');
const ctx    = canvas.getContext('2d');

const GOLD   = '#d4af37';
const SILVER = '#e8e8e8';
const COPPER = '#c87533';

const PALETTE = [GOLD, SILVER, COPPER, '#f0d060', '#fff8dc', '#b8860b'];

let particles  = [];
let animFrame  = null;
let running    = false;
let startTime  = 0;
const DURATION = 10000; // 10s total celebration

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

/* ── Particle classes ──────────────────────────────────── */

// A generic physics particle
class Particle {
  constructor({ x, y, vx, vy, size, color, gravity = 0, drag = 0.99, shape = 'circle', spin = 0, life = 1, decay }) {
    this.x      = x;
    this.y      = y;
    this.vx     = vx;
    this.vy     = vy;
    this.size   = size;
    this.color  = color;
    this.gravity= gravity;
    this.drag   = drag;
    this.shape  = shape;  // 'circle' | 'rect' | 'star' | 'line'
    this.spin   = spin;
    this.angle  = Math.random() * Math.PI * 2;
    this.life   = life;   // 0→1 opacity multiplier
    this.decay  = decay || (0.008 + Math.random() * 0.006);
    this.alive  = true;
    this.w      = size * (0.4 + Math.random() * 0.6); // for rects
    this.h      = size * 2;
  }

  update() {
    this.vx  *= this.drag;
    this.vy  *= this.drag;
    this.vy  += this.gravity;
    this.x   += this.vx;
    this.y   += this.vy;
    this.angle += this.spin;
    this.life  -= this.decay;
    if (this.life <= 0 || this.y > canvas.height + 40) this.alive = false;
  }

  draw() {
    const alpha = Math.max(0, this.life);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle   = this.color;
    ctx.strokeStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur  = this.shape === 'circle' ? this.size * 3 : 0;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    if (this.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.shape === 'rect') {
      ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
    } else if (this.shape === 'star') {
      drawStar(ctx, 0, 0, 5, this.size, this.size * 0.45);
      ctx.fill();
    } else if (this.shape === 'line') {
      ctx.lineWidth = Math.max(0.5, this.size * 0.4);
      ctx.beginPath();
      ctx.moveTo(0, -this.size);
      ctx.lineTo(0, this.size);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawStar(ctx, cx, cy, spikes, outerR, innerR) {
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerR);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerR);
  ctx.closePath();
}

/* ── Shockwave ring ────────────────────────────────────── */
class ShockRing {
  constructor(x, y) {
    this.x    = x;
    this.y    = y;
    this.r    = 0;
    this.maxR = Math.min(canvas.width, canvas.height) * 0.6;
    this.life = 1;
    this.alive= true;
  }
  update() {
    this.r    += 18;
    this.life -= 0.03;
    if (this.life <= 0) this.alive = false;
  }
  draw() {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life * 0.6);
    ctx.strokeStyle = GOLD;
    ctx.shadowColor = GOLD;
    ctx.shadowBlur  = 20;
    ctx.lineWidth   = 3 * this.life;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

let rings = [];

/* ── Phase 1: Burst ────────────────────────────────────── */
function burstAt(cx, cy) {
  rings.push(new ShockRing(cx, cy));
  rings.push(new ShockRing(cx, cy)); // double ring

  // Central starburst — tight radial lines
  for (let i = 0; i < 32; i++) {
    const angle  = (i / 32) * Math.PI * 2;
    const speed  = 6 + Math.random() * 8;
    const color  = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    particles.push(new Particle({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 2.5 + Math.random() * 2,
      color,
      gravity: 0.05,
      drag: 0.96,
      shape: 'circle',
      decay: 0.012,
    }));
  }

  // Stars
  for (let i = 0; i < 12; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 6;
    particles.push(new Particle({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 5 + Math.random() * 6,
      color: GOLD,
      gravity: 0.1,
      drag: 0.95,
      shape: 'star',
      spin: (Math.random() - 0.5) * 0.15,
      decay: 0.008,
    }));
  }
}

/* ── Phase 2: Confetti fountain ────────────────────────── */
function spawnConfetti(cx) {
  const spread = canvas.width * 0.35;
  for (let i = 0; i < 6; i++) {
    const x     = cx + (Math.random() - 0.5) * spread * 2;
    const speed = 12 + Math.random() * 10;
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
    const shape = Math.random() < 0.5 ? 'rect' : (Math.random() < 0.5 ? 'circle' : 'line');
    const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];

    particles.push(new Particle({
      x, y: canvas.height * 0.75,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 4 + Math.random() * 6,
      color,
      gravity: 0.22,
      drag: 0.985,
      shape,
      spin: (Math.random() - 0.5) * 0.25,
      decay: 0.004,
    }));
  }
}

/* ── Phase 3: Ambient drifting embers ──────────────────── */
function spawnEmber() {
  const x = Math.random() * canvas.width;
  particles.push(new Particle({
    x, y: canvas.height + 5,
    vx: (Math.random() - 0.5) * 0.8,
    vy: -(0.5 + Math.random() * 1.2),
    size: 1 + Math.random() * 2,
    color: Math.random() < 0.7 ? GOLD : SILVER,
    gravity: 0,
    drag: 0.995,
    shape: 'circle',
    decay: 0.003,
    life: 0.7 + Math.random() * 0.3,
  }));
}

/* ── Main animation loop ───────────────────────────────── */
function animate(ts) {
  if (!startTime) startTime = ts;
  const elapsed = ts - startTime;
  const done    = elapsed > DURATION;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Update & draw rings
  rings = rings.filter(r => r.alive);
  rings.forEach(r => { r.update(); r.draw(); });

  // Update & draw particles
  particles = particles.filter(p => p.alive);
  particles.forEach(p => { p.update(); p.draw(); });

  if (!done) {
    animFrame = requestAnimationFrame(animate);
  } else {
    // Fade canvas naturally — particles will decay on their own
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    running = false;
  }
}

/* ── Orchestration ─────────────────────────────────────── */
function launchMinimalCelebration() {
  if (running) return;
  running   = true;
  startTime = 0;

  const cx = canvas.width  / 2;
  const cy = canvas.height * 0.42;

  // Phase 1 — instant burst at page centre
  burstAt(cx, cy);

  // Phase 1b — second burst slightly delayed and offset
  setTimeout(() => { burstAt(cx - 80, cy + 20); }, 180);
  setTimeout(() => { burstAt(cx + 80, cy + 20); }, 320);

  // Phase 2 — confetti fountain for 4 seconds
  let fountainInterval = setInterval(() => { spawnConfetti(cx); }, 80);
  setTimeout(() => clearInterval(fountainInterval), 4000);

  // Phase 3 — ambient embers for remaining 6 seconds
  setTimeout(() => {
    let emberInterval = setInterval(spawnEmber, 60);
    setTimeout(() => clearInterval(emberInterval), 6000);
  }, 4000);

  animFrame = requestAnimationFrame(animate);
}


window.shareWhatsApp = function() {
  const shareUrl = `https://lxwyerup.com/?ref=${referralCode}`;
  const text = `I just joined Lxwyer Up as a Founding Member #${memberNumber}! 🏛️\n\nThe AI-native litigation workspace for Indian lawyers is coming — and I'm one of the first 500 to join.\n\nUse my invite to jump the waitlist → ${shareUrl}`;
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
};

window.shareLinkedIn = function() {
  const shareUrl = `https://lxwyerup.com/?ref=${referralCode}`;
  const text = `Excited to share that I'm now a Founding Member of Lxwyer Up — India's first AI-native litigation workspace!\n\nPractice Law. Not Chaos.\n\n#LegalTech #IndiaLegal #LxwyerUp`;
  const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&summary=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
};
