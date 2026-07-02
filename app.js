/* ══════════════════════════════════════════════════════════
   LXWYER UP — FRONTEND JS
   Form handling + Flux loading overlay + Confetti cracker
══════════════════════════════════════════════════════════ */

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3005/api' : '/api';

/* ─── Detect referral code from URL ───────────────────── */
const urlParams = new URLSearchParams(window.location.search);
const _referredBy = urlParams.get('ref') || null;
if (_referredBy) {
  sessionStorage.setItem('lxwyerRef', _referredBy);
}
const referredByCode = _referredBy || sessionStorage.getItem('lxwyerRef') || null;

/* ─────────────────────────────────────────────────────────
   FLUX LOADER — phases & sub-messages
───────────────────────────────────────────────────────── */

const FLUX_PHASES = [
  {
    at: 0,
    label: 'Verifying your details…',
    sub: 'Every great legal career starts with one step.'
  },
  {
    at: 18,
    label: 'Securing your spot…',
    sub: 'Only 500 founding members. You made the right call.'
  },
  {
    at: 38,
    label: 'Registering your profile…',
    sub: 'India\'s best lawyers are already on their way in.'
  },
  {
    at: 58,
    label: 'Preparing your membership…',
    sub: 'Your practice is about to get a whole lot smarter.'
  },
  {
    at: 78,
    label: 'Sending your confirmation…',
    sub: 'Check your inbox — a welcome email is on its way.'
  },
  {
    at: 95,
    label: 'Almost there…',
    sub: 'The future of Indian law is being built right now.'
  },
];

/* ─── Overlay DOM refs ─────────────────────────────────── */
const overlay     = document.getElementById('fluxOverlay');
const fluxContent = document.getElementById('fluxContent');
const fluxLabel   = document.getElementById('fluxLabel');
const fluxLabelWrap = document.getElementById('fluxLabelWrap');
const fluxBarFill = document.getElementById('fluxBarFill');
const fluxBarTrack = overlay ? overlay.querySelector('.flux-bar-track') : null;
const fluxPct     = document.getElementById('fluxPct');
const fluxSubmsg  = document.getElementById('fluxSubmsg');
const fluxSuccess = document.getElementById('fluxSuccess');
const fluxCanvas  = document.getElementById('fluxCanvas');

/* ─── Label transition helper ──────────────────────────── */
let currentPhaseIndex = -1;

function setFluxPhase(index) {
  if (index === currentPhaseIndex) return;
  currentPhaseIndex = index;

  const phase = FLUX_PHASES[index];

  // Animate out current label
  fluxLabel.classList.add('flux-label-out');

  setTimeout(() => {
    fluxLabel.textContent = phase.label;
    fluxLabel.classList.remove('flux-label-out');
    // Force reflow to restart animation
    void fluxLabel.offsetWidth;
    fluxLabel.style.animation = 'none';
    void fluxLabel.offsetWidth;
    fluxLabel.style.animation = '';
  }, 320);

  // Update sub-message with fade
  fluxSubmsg.style.opacity = '0';
  setTimeout(() => {
    fluxSubmsg.textContent = phase.sub;
    fluxSubmsg.style.opacity = '1';
  }, 350);
}

/* ─── Progress runner ──────────────────────────────────── */
let fluxAnimFrame;
let fluxTargetPct = 90;
let fluxCurrentPct = 0;

function tickFlux() {
  // Smoothly approach target pct
  fluxCurrentPct += (fluxTargetPct - fluxCurrentPct) * 0.025;
  if (fluxCurrentPct > 99.8) fluxCurrentPct = 100;
  
  fluxBarFill.style.width = fluxCurrentPct + '%';
  if (fluxBarTrack) fluxBarTrack.setAttribute('aria-valuenow', Math.round(fluxCurrentPct));
  fluxPct.textContent = Math.round(fluxCurrentPct) + '%';
  
  let activePhaseIdx = 0;
  for (let i = 0; i < FLUX_PHASES.length; i++) {
    if (fluxCurrentPct >= FLUX_PHASES[i].at) activePhaseIdx = i;
  }
  setFluxPhase(activePhaseIdx);
  
  if (fluxCurrentPct < 100) {
    fluxAnimFrame = requestAnimationFrame(tickFlux);
  }
}

/* ─── Background floating particles ───────────────────── */
function spawnOverlayParticles() {
  const container = document.getElementById('fluxParticles');
  if (!container) return;

  const colors = [
    'rgba(59,130,246,0.5)',
    'rgba(201,162,39,0.4)',
    'rgba(96,165,250,0.4)',
    'rgba(248,250,252,0.2)',
    'rgba(16,185,129,0.3)',
  ];

  for (let i = 0; i < 28; i++) {
    const dot = document.createElement('div');
    dot.className = 'flux-particle';
    const size = 3 + Math.random() * 8;
    const left = Math.random() * 100;
    const bottom = Math.random() * 40; // start from lower portion
    const dur = 5 + Math.random() * 10;
    const delay = -Math.random() * 12;
    dot.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${left}%;
      bottom: ${bottom}%;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      animation-duration: ${dur}s;
      animation-delay: ${delay}s;
      filter: blur(${Math.random() > 0.5 ? 1 : 0}px);
    `;
    container.appendChild(dot);
  }
}

/* ─── Elegant Golden Sparks (Minimal Celebration) ────────── */
let sparks = [];
let cfxFrame;
let cfxCtx;
let celebrationActive = true;

class Spark {
  constructor() {
    this.x = Math.random() * fluxCanvas.width;
    this.y = fluxCanvas.height + 10;
    this.size = Math.random() * 2 + 0.5;
    this.speedY = -(Math.random() * 2 + 1);
    this.speedX = (Math.random() - 0.5) * 0.5;
    this.opacity = 0;
    this.targetOpacity = Math.random() * 0.8 + 0.2;
    this.wobble = Math.random() * Math.PI * 2;
    this.life = 0;
  }
  update() {
    this.wobble += 0.02;
    this.x += this.speedX + Math.sin(this.wobble) * 0.5;
    this.y += this.speedY;
    if (this.opacity < this.targetOpacity && this.life < 100) this.opacity += 0.01;
    this.life++;
    if (this.life > 300) this.opacity -= 0.01;
  }
  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.opacity);
    ctx.fillStyle = '#d4af37';
    ctx.shadowColor = '#d4af37';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function cfxAnimate() {
  cfxCtx.clearRect(0, 0, fluxCanvas.width, fluxCanvas.height);
  sparks.forEach(s => { s.update(); s.draw(cfxCtx); });
  sparks = sparks.filter(s => s.opacity > 0 || s.life < 100);
  
  if (sparks.length > 0 || celebrationActive) {
    cfxFrame = requestAnimationFrame(cfxAnimate);
  } else {
    cfxCtx.clearRect(0, 0, fluxCanvas.width, fluxCanvas.height);
  }
}

function launchMinimalCelebration() {
  fluxCanvas.width  = overlay.offsetWidth;
  fluxCanvas.height = overlay.offsetHeight;
  cfxCtx = fluxCanvas.getContext('2d');
  celebrationActive = true;
  sparks = [];

  for(let i=0; i<80; i++) {
    setTimeout(() => {
      if(celebrationActive) sparks.push(new Spark());
    }, Math.random() * 3000);
  }
  
  setTimeout(() => { celebrationActive = false; }, 6000);
  cfxAnimate();
}

/* ─── Main: show overlay and run sequence ──────────────── */
function startFluxLoader() {
  overlay.classList.add('flux-active');
  overlay.setAttribute('aria-hidden', 'false');
  spawnOverlayParticles();
  
  fluxBarFill.style.width = '0%';
  fluxPct.textContent = '0%';
  currentPhaseIndex = -1;
  fluxLabel.textContent = FLUX_PHASES[0].label;
  fluxSubmsg.textContent = FLUX_PHASES[0].sub;
  
  fluxCurrentPct = 0;
  fluxTargetPct = 90; // slowly approach 90% while fetching
  cancelAnimationFrame(fluxAnimFrame);
  tickFlux();

  return {
    complete: (memberData, redirectFn) => {
      fluxTargetPct = 100;
      // Wait for it to hit 100 visually
      const checkDone = setInterval(() => {
        if (fluxCurrentPct >= 99.8) {
          clearInterval(checkDone);
          fluxContent.classList.add('flux-hide');
          setTimeout(() => {
            launchMinimalCelebration();
            setTimeout(() => { fluxSuccess.classList.add('flux-show'); }, 320);
            setTimeout(() => {
              if (memberData) sessionStorage.setItem('lxwyerMember', JSON.stringify(memberData));
              redirectFn();
            }, 3600);
          }, 200);
        }
      }, 100);
    },
    fail: () => {
      overlay.classList.remove('flux-active');
      overlay.setAttribute('aria-hidden', 'true');
      cancelAnimationFrame(fluxAnimFrame);
    }
  };
}

/* ══════════════════════════════════════════════════════════
   PAGE INIT
══════════════════════════════════════════════════════════ */

/* ── Safe init: handles both sync and async script load ──── */
function _initPage() {

  // Handle animation delays manually for elements with data-delay
  document.querySelectorAll('[data-delay]').forEach(el => {
    const delay = el.getAttribute('data-delay');
    el.style.animationDelay = `${delay}ms`;
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ── State / City dropdown ─────────────────────────── */
  const stateCityMap = {
    "Andhra Pradesh": ["Visakhapatnam","Vijayawada","Guntur","Nellore"],
    "Assam": ["Guwahati","Silchar","Dibrugarh","Jorhat"],
    "Bihar": ["Patna","Gaya","Bhagalpur","Muzaffarpur"],
    "Chhattisgarh": ["Raipur","Bhilai","Bilaspur","Korba"],
    "Delhi": ["New Delhi","North Delhi","South Delhi","West Delhi","East Delhi"],
    "Gujarat": ["Ahmedabad","Surat","Vadodara","Rajkot"],
    "Haryana": ["Faridabad","Gurugram","Panipat","Ambala"],
    "Jharkhand": ["Ranchi","Jamshedpur","Dhanbad","Bokaro"],
    "Karnataka": ["Bengaluru","Mysuru","Mangaluru","Hubballi"],
    "Kerala": ["Thiruvananthapuram","Kochi","Kozhikode","Thrissur"],
    "Madhya Pradesh": ["Indore","Bhopal","Jabalpur","Gwalior"],
    "Maharashtra": ["Mumbai","Pune","Nagpur","Nashik"],
    "Odisha": ["Bhubaneswar","Cuttack","Rourkela","Berhampur"],
    "Punjab": ["Ludhiana","Amritsar","Jalandhar","Patiala"],
    "Rajasthan": ["Jaipur","Jodhpur","Udaipur","Kota"],
    "Tamil Nadu": ["Chennai","Coimbatore","Madurai","Tiruchirappalli"],
    "Telangana": ["Hyderabad","Warangal","Nizamabad","Karimnagar"],
    "Uttar Pradesh": ["Lucknow","Kanpur","Agra","Varanasi","Noida"],
    "West Bengal": ["Kolkata","Howrah","Asansol","Siliguri"],
    "Other": ["Other"]
  };

  const stateSelect = document.getElementById('state');
  const citySelect  = document.getElementById('city');

  if (stateSelect && citySelect) {
    stateSelect.addEventListener('change', function () {
      const selectedState = this.value;
      citySelect.innerHTML = '<option value="" disabled selected>Select City</option>';
      if (selectedState && stateCityMap[selectedState]) {
        stateCityMap[selectedState].forEach(city => {
          const opt = document.createElement('option');
          opt.value = city;
          opt.textContent = city;
          citySelect.appendChild(opt);
        });
        citySelect.disabled = false;
      } else {
        citySelect.disabled = true;
      }
    });
  }

  /* ── Form submission ───────────────────────────────── */
  const form      = document.getElementById('signupForm');
  const submitBtn = document.getElementById('submitBtn');
  const btnText   = submitBtn ? submitBtn.querySelector('.btn-submit-text')    : null;
  const btnLoad   = submitBtn ? submitBtn.querySelector('.btn-submit-loading') : null;

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Clear previous errors
      document.querySelectorAll('.form-error').forEach(el => el.textContent = '');

      // Collect values
      const fullName    = document.getElementById('fullName').value.trim();
      const email       = document.getElementById('email').value.trim();
      const state       = document.getElementById('state').value;
      const city        = document.getElementById('city').value.trim();
      const pincode     = document.getElementById('pincode').value.trim();
      const practiceArea = document.getElementById('practiceArea').value;
      const caseVolume  = document.getElementById('caseVolume').value;
      const painPoint   = document.getElementById('painPoint').value.trim();

      // Validate
      let isValid = true;
      if (!fullName)      { document.getElementById('nameError').textContent  = 'Required'; isValid = false; }
      if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        document.getElementById('emailError').textContent = 'Valid email required'; isValid = false;
      }
      if (!state)         { document.getElementById('stateError').textContent = 'Required'; isValid = false; }
      if (!city)          { document.getElementById('cityError').textContent   = 'Required'; isValid = false; }
      if (!practiceArea)  { document.getElementById('practiceError').textContent = 'Required'; isValid = false; }
      if (!caseVolume)    { document.getElementById('caseVolumeError').textContent = 'Required'; isValid = false; }
      if (!isValid) return;

      // Button loading state
      if (submitBtn) submitBtn.disabled = true;
      if (btnText) btnText.style.display = 'none';
      if (btnLoad) btnLoad.style.display = 'inline-block';

      const loader = startFluxLoader();

      try {
        const res  = await fetch(`${API_BASE}/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: fullName, email, state, city, pincode, practiceArea, caseVolume, painPoint, referredBy: referredByCode })
        });
        const data = await res.json();

        if (res.ok && data.success) {
          loader.complete({ name: fullName, memberNumber: data.memberNumber, referralCode: data.referralCode }, () => {
            window.location.href = 'welcome.html';
          });
        } else {
          loader.fail();
          if (data.message && data.message.toLowerCase().includes('email')) {
            document.getElementById('emailError').textContent = data.message;
          } else {
            alert(data.message || 'Something went wrong. Please try again.');
          }
          if (submitBtn) submitBtn.disabled = false;
          if (btnText) btnText.style.display = 'inline-block';
          if (btnLoad) btnLoad.style.display = 'none';
        }
      } catch (err) {
        console.error('Signup error:', err);
        loader.fail();
        if (submitBtn) submitBtn.disabled = false;
        if (btnText) btnText.style.display = 'inline-block';
        if (btnLoad) btnLoad.style.display = 'none';
        alert('Network error. Please try again.');
      }
    });
  }

  /* ── Live counter + Social Proof ──────────────────── */
  async function loadSocialProof() {
    try {
      const res = await fetch(`${API_BASE}/social-proof`);
      const data = await res.json();
      
      // Update live counter
      const spotsText = document.getElementById('spotsText');
      if (spotsText) {
        const remaining = data.remaining;
        if (remaining <= 50) {
          spotsText.textContent = `🔴 Only ${remaining} of 500 spots left!`;
          spotsText.style.color = '#ef4444';
        } else {
          spotsText.textContent = `${remaining} of 500 spots remaining`;
        }
      }
      
      // Social proof ticker
      const ticker = document.getElementById('socialProofTicker');
      if (ticker && data.recent && data.recent.length > 0) {
        ticker.innerHTML = data.recent.map(s => {
          const ago = timeAgo(new Date(s.time));
          return `<span class="ticker-item">${s.name} from ${s.city} joined</span>`;
        }).join('');
        startTickerAnimation(ticker);
      } else if (ticker) {
        ticker.innerHTML = '<span class="ticker-item">Be the first to join from your city</span>';
      }
    } catch (e) {
      const spotsText = document.getElementById('spotsText');
      if (spotsText) spotsText.textContent = '500 spots only';
    }
  }
  
  function timeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }
  
  function startTickerAnimation(ticker) {
    const items = ticker.querySelectorAll('.ticker-item');
    if (items.length <= 1) return;
    let current = 0;
    items.forEach((item, i) => { item.style.display = i === 0 ? 'inline' : 'none'; });
    setInterval(() => {
      items[current].style.opacity = '0';
      setTimeout(() => {
        items[current].style.display = 'none';
        current = (current + 1) % items.length;
        items[current].style.display = 'inline';
        items[current].style.opacity = '0';
        requestAnimationFrame(() => { items[current].style.opacity = '1'; });
      }, 300);
    }, 3500);
  }
  
  loadSocialProof();
}

// Run immediately if DOM is ready, otherwise wait
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _initPage);
} else {
  _initPage();
}
