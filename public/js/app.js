let currentUser = null;
let currentPage = "landing";
let audioInited = false;

function ensureAudio() {
  if (!audioInited) {
    audio.init();
    audio.resume();
    audioInited = true;
  }
}

document.addEventListener("click", () => { ensureAudio(); }, { once: true });
document.addEventListener("touchstart", () => { ensureAudio(); }, { once: true });

const ITEM_ICONS = {
  shield: "\u{1F6E1}\uFE0F", sword: "\u2694\uFE0F", boots: "\u{1F462}", scroll: "\u{1F4DC}",
  ring: "\u{1F48D}", bow: "\u{1F3F9}", feather: "\u{1FAB6}", armor: "\u{1F6E1}\uFE0F",
  cloak: "\u{1F9E5}", staff: "\u{1FA84}", blade: "\u{1F5E1}\uFE0F", scale: "\u{1F409}",
  amulet: "\u{1F52E}", crown: "\u{1F451}", axe: "\u{1FA93}", chain: "\u26D3\uFE0F",
  katana: "\u{1F52A}", gem: "\u{1F48E}", excalibur: "\u2694\uFE0F", stone: "\u{1FAA8}",
};

const RARITY_COLORS = {
  Common: "#9ca3af", Rare: "#3b82f6", Epic: "#a855f7", Legendary: "#ffc312",
};

const BOX_ICONS = { "Common Box": "\u{1F4E6}", "Epic Box": "\u{1F381}", "Legendary Box": "\u{1F451}" };
const BOX_CLASSES = { "Common Box": "common", "Epic Box": "epic", "Legendary Box": "legendary" };

function navigate(page) {
  if (currentPage !== page) audio.whoosh();
  currentPage = page;
  render();
}

function showToast(msg, type = "info") {
  if (type === "success") audio.success();
  else if (type === "error") audio.error();
  else audio.pop();
  const el = document.getElementById("toast");
  el.className = `toast ${type}`;
  el.textContent = msg;
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 3500);
}

function openModal(html) {
  document.getElementById("modalContent").innerHTML = html;
  document.getElementById("modal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modal").classList.add("hidden");
}

async function logout() {
  api.token = null;
  currentUser = null;
  currentPage = "landing";
  render();
}

function formatCredits(n) { return n.toLocaleString(); }
function formatMoney(n) { return `$${(n / 100).toFixed(2)}`; }

function toggleAudio() {
  ensureAudio();
  const muted = audio.toggleMute();
  document.getElementById("audioToggle").textContent = muted ? "🔇" : "🔊";
}

// 3D PARALLAX MOUSE TRACKING
function initCinematicParallax() {
  const hero = document.querySelector(".hero");
  const scene = document.querySelector(".hero-scene");
  const glow = document.querySelector(".hero-glow");
  if (!hero || !scene) return;

  hero.addEventListener("mousemove", (e) => {
    const rect = hero.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    scene.style.transform = `rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
    if (glow) {
      glow.style.transform = `translate(calc(-50% + ${x * 30}px), calc(-50% + ${y * 30}px))`;
    }
    // Move floating boxes with parallax depth
    document.querySelectorAll(".float-box").forEach((box, i) => {
      const depth = (i + 1) * 0.8;
      box.style.transform = `translate(${x * depth * 20}px, ${y * depth * 20}px)`;
    });
  });

  hero.addEventListener("mouseleave", () => {
    scene.style.transform = "rotateY(0deg) rotateX(0deg)";
    if (glow) glow.style.transform = "translate(-50%, -50%)";
    document.querySelectorAll(".float-box").forEach(box => {
      box.style.transform = "";
    });
  });
}

// ═══════════════════════════════════════
// PARTICLE SYSTEM
// ═══════════════════════════════════════
function initParticles() {
  const canvas = document.getElementById("particleCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let w, h, particles = [];
  const PARTICLE_COUNT = 60;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.4 + 0.1,
      color: Math.random() > 0.7 ? "#7c5cfc" : Math.random() > 0.5 ? "#a855f7" : "#ffc312",
    };
  }

  function init() {
    resize();
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(createParticle());
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;
      ctx.fill();
    });

    // Draw connections
    ctx.globalAlpha = 1;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(124, 92, 252, ${0.06 * (1 - dist / 150)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  init();
  draw();
}

// ═══════════════════════════════════════
// SCROLL ANIMATIONS (IntersectionObserver)
// ═══════════════════════════════════════
let scrollObserver = null;

function initScrollAnimations() {
  if (scrollObserver) scrollObserver.disconnect();
  scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.scrollDelay || 0;
        setTimeout(() => {
          entry.target.classList.add("in-view");
        }, parseInt(delay));
        scrollObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

  document.querySelectorAll("[data-scroll]").forEach(el => {
    el.classList.add("scroll-hidden");
    scrollObserver.observe(el);
  });
}

// ═══════════════════════════════════════
// LANDING PAGE
// ═══════════════════════════════════════
function renderLanding() {
  const landing = document.getElementById("landingPage");
  const main = document.getElementById("mainContent");
  const navbar = document.getElementById("navbar");
  navbar.classList.add("hidden");
  main.classList.add("hidden");
  landing.classList.remove("hidden");

  landing.innerHTML = `
    <nav class="landing-nav" id="landingNav">
      <div class="nav-brand">\u{1F381} MysteryBox</div>
      <div class="nav-actions">
        <button class="btn-login" onclick="showAuthModal('login')">Iniciar Sesi\u00f3n</button>
        <button class="btn-signup" onclick="showAuthModal('register')">Reg\u00edstrate Gratis</button>
      </div>
    </nav>

    <section class="hero">
      <div class="hero-bg-depth"></div>
      <div class="hero-glow"></div>
      <div class="floating-boxes">
        <div class="float-box">\u{1F4E6}</div>
        <div class="float-box">\u{1F381}</div>
        <div class="float-box">\u{1F451}</div>
        <div class="float-box">\u{1F381}</div>
        <div class="float-box">\u{1F4E6}</div>
        <div class="float-box">\u{1F451}</div>
        <div class="float-box">\u{1F4E6}</div>
        <div class="float-box">\u{1F381}</div>
      </div>
      <div class="cine-line"></div>
      <div class="cine-line"></div>
      <div class="cine-line"></div>
      <div class="hero-scene">
        <div class="hero-content">
          <div class="cine-badge">
            <span class="pulse-dot"></span>
            Plataforma en vivo \u2014 Miles de jugadores activos
          </div>
          <h1 class="hero-title">
            <span class="line1">Abre Cajas.</span>
            <span class="line2">Consigue Leyendas.</span>
          </h1>
          <p class="hero-subtitle">La experiencia gacha definitiva. Cada caja es una emoci\u00f3n, cada objeto una recompensa \u00fanica. \u00bfTienes lo que hace falta para conseguir el objeto legendario?</p>
          <div class="hero-actions">
            <button class="btn-hero btn-hero-primary" onclick="showAuthModal('register')">
              \u{1F3AE} Empezar a Jugar
            </button>
            <button class="btn-hero btn-hero-secondary" onclick="document.getElementById('featuredBoxes').scrollIntoView({behavior:'smooth'})">
              \u{1F440} Ver Cajas
            </button>
          </div>
          <div class="hero-stats-3d">
            <div class="stat-3d">
              <div class="stat-num" data-count="21">0</div>
              <div class="stat-text">Items \u00FAnicos</div>
            </div>
            <div class="stat-3d">
              <div class="stat-num" data-count="3">0</div>
              <div class="stat-text">Cajas Disponibles</div>
            </div>
            <div class="stat-3d">
              <div class="stat-num" data-count="4">0</div>
              <div class="stat-text">Niveles de Rareza</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="ticker-section">
      <div class="ticker-wrap">
        <div class="ticker-item" data-scroll="fade-up" data-scroll-delay="0">
          <div class="ticker-value" style="color:var(--green)">Activo</div>
          <div class="ticker-label">Servidor</div>
        </div>
        <div class="ticker-item" data-scroll="fade-up" data-scroll-delay="100">
          <div class="ticker-value" style="color:var(--accent)">256-bit</div>
          <div class="ticker-label">Encriptaci\u00F3n</div>
        </div>
        <div class="ticker-item" data-scroll="fade-up" data-scroll-delay="200">
          <div class="ticker-value" style="color:var(--gold)">100%</div>
          <div class="ticker-label">Probabilidades Justas</div>
        </div>
        <div class="ticker-item" data-scroll="fade-up" data-scroll-delay="300">
          <div class="ticker-value" style="color:var(--purple)">24/7</div>
          <div class="ticker-label">Disponible</div>
        </div>
      </div>
    </div>

    <section class="section" id="featuredBoxes">
      <div class="section-header">
        <div class="section-label" data-scroll="fade-up" data-scroll-delay="0">\u{1F4E6} Cajas Disponibles</div>
        <h2 class="section-title" data-scroll="fade-up" data-scroll-delay="100">Elige tu Destino</h2>
        <p class="section-desc" data-scroll="fade-up" data-scroll-delay="200">Cada caja tiene diferentes probabilidades y recompensas. \u00bfTe atreves a ir por la legendaria?</p>
      </div>
      <div class="boxes-showcase" id="boxesShowcase">
        <div class="showcase-card common" data-scroll="fade-up" data-scroll-delay="100">
          <div class="showcase-icon">\u{1F4E6}</div>
          <div class="showcase-name">Common Box</div>
          <div class="showcase-desc">La caja cl\u00E1sica para empezar. Ideal para coleccionar objetos b\u00E1sicos.</div>
          <div class="showcase-price">\u{1F48E} 10 cr\u00E9ditos</div>
          <div class="showcase-tiers">
            <span class="showcase-tier" style="background:rgba(156,163,175,0.12);color:#9ca3af">60% Com\u00FAn</span>
            <span class="showcase-tier" style="background:rgba(59,130,246,0.12);color:#3b82f6">30% Raro</span>
            <span class="showcase-tier" style="background:rgba(168,85,247,0.12);color:#a855f7">9% \u00C9pico</span>
            <span class="showcase-tier" style="background:rgba(255,195,18,0.12);color:#ffc312">1% Legendario</span>
          </div>
        </div>
        <div class="showcase-card epic" data-scroll="fade-up" data-scroll-delay="250">
          <div class="showcase-icon">\u{1F381}</div>
          <div class="showcase-name">Epic Box</div>
          <div class="showcase-desc">Mayor probabilidad de objetos \u00E9picos y legendarios. Para valientes.</div>
          <div class="showcase-price">\u{1F48E} 50 cr\u00E9ditos</div>
          <div class="showcase-tiers">
            <span class="showcase-tier" style="background:rgba(156,163,175,0.12);color:#9ca3af">50% Com\u00FAn</span>
            <span class="showcase-tier" style="background:rgba(59,130,246,0.12);color:#3b82f6">35% Raro</span>
            <span class="showcase-tier" style="background:rgba(168,85,247,0.12);color:#a855f7">13% \u00C9pico</span>
            <span class="showcase-tier" style="background:rgba(255,195,18,0.12);color:#ffc312">2% Legendario</span>
          </div>
        </div>
        <div class="showcase-card legendary" data-scroll="fade-up" data-scroll-delay="400">
          <div class="showcase-icon">\u{1F451}</div>
          <div class="showcase-name">Legendary Box</div>
          <div class="showcase-desc">La caja suprema. Solo lo mejor. \u00BFConseguir\u00E1s Excalibur?</div>
          <div class="showcase-price">\u{1F48E} 150 cr\u00E9ditos</div>
          <div class="showcase-tiers">
            <span class="showcase-tier" style="background:rgba(59,130,246,0.12);color:#3b82f6">55% Raro</span>
            <span class="showcase-tier" style="background:rgba(168,85,247,0.12);color:#a855f7">35% \u00C9pico</span>
            <span class="showcase-tier" style="background:rgba(255,195,18,0.12);color:#ffc312">10% Legendario</span>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <div class="section-label" data-scroll="fade-up" data-scroll-delay="0">\u2728 C\u00F3mo Funciona</div>
        <h2 class="section-title" data-scroll="fade-up" data-scroll-delay="100">3 Pasos para la Gloria</h2>
      </div>
      <div class="steps-grid">
        <div class="step-card" data-scroll="fade-left" data-scroll-delay="0">
          <div class="step-num">1</div>
          <div class="step-title">Crea tu Cuenta</div>
          <div class="step-desc">Reg\u00EDstrate gratis en segundos. Sin tarjeta de cr\u00E9dito, sin compromiso.</div>
        </div>
        <div class="step-card" data-scroll="scale-in" data-scroll-delay="150">
          <div class="step-num">2</div>
          <div class="step-title">Elige tu Caja</div>
          <div class="step-desc">Elige entre Caja Com\u00FAn, \u00C9pica o Legendaria. Cada una con diferentes probabilidades.</div>
        </div>
        <div class="step-card" data-scroll="fade-right" data-scroll-delay="300">
          <div class="step-num">3</div>
          <div class="step-title">Abre y Gana</div>
          <div class="step-desc">Mira la animaci\u00F3n, descubre tu premio y a\u00F1\u00E1delo a tu colecci\u00F3n.</div>
        </div>
      </div>
    </section>

    <section class="cta-section">
      <h2 data-scroll="fade-up" data-scroll-delay="0">\u00BFListo para el <span class="gradient-text">Reto</span>?</h2>
      <p data-scroll="fade-up" data-scroll-delay="150">Reg\u00EDstrate ahora y recibe cr\u00E9ditos de bienvenida para tu primera apertura.</p>
      <button class="btn-hero btn-hero-primary" data-scroll="scale-in" data-scroll-delay="300" onclick="showAuthModal('register')">
        \u{1F3AE} Crear Cuenta Gratis
      </button>
    </section>

    <footer class="landing-footer" data-scroll="fade-up" data-scroll-delay="0">
      <p>\u00A9 2026 \u{1F1F5}\u{1F1F8} EBYZOM \u2014 Todos los derechos reservados. Creado por EBYZOM.</p>
    </footer>
  `;

  // Animate stats counter
  animateCounters();
  // Landing nav scroll effect
  initLandingNav();
  // 3D parallax mouse tracking
  setTimeout(() => initCinematicParallax(), 100);
  // Scroll animations
  setTimeout(() => initScrollAnimations(), 50);
}

function animateCounters() {
  const nums = document.querySelectorAll("[data-count]");
  nums.forEach(el => {
    const target = parseInt(el.dataset.count);
    let current = 0;
    const step = Math.max(1, Math.floor(target / 40));
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { current = target; clearInterval(timer); }
      el.textContent = current;
    }, 30);
  });
}

function initLandingNav() {
  const nav = document.getElementById("landingNav");
  if (!nav) return;
  const heroScene = document.querySelector(".hero-scene");
  const heroGlow = document.querySelector(".hero-glow");

  const onScroll = () => {
    const sy = window.scrollY;
    if (sy > 40) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");

    // Hero parallax on scroll: content moves up, glow fades
    if (heroScene && sy < window.innerHeight) {
      const ratio = sy / window.innerHeight;
      heroScene.style.transform = `translateY(${-ratio * 80}px) scale(${1 - ratio * 0.08})`;
      heroScene.style.opacity = 1 - ratio * 1.2;
    }
    if (heroGlow && sy < window.innerHeight) {
      const ratio = sy / window.innerHeight;
      heroGlow.style.opacity = 0.5 - ratio * 0.5;
    }
  };
  window.addEventListener("scroll", onScroll);
}

function showAuthModal(mode) {
  const isLogin = mode === "login";
  openModal(`
    <button class="modal-close" onclick="closeModal()">&times;</button>
    <div class="auth-modal-body">
      <div class="auth-logo">
        <h2>\u{1F381} MysteryBox</h2>
        <p>${isLogin ? "Bienvenido de vuelta" : "Crea tu cuenta y empieza a ganar"}</p>
      </div>
      <form onsubmit="handleAuth(event, '${mode}')">
        ${!isLogin ? `
          <div class="form-group">
            <label>Usuario</label>
            <input type="text" class="form-input" id="authUsername" required placeholder="Tu nombre de jugador">
          </div>
        ` : ""}
        <div class="form-group">
          <label>Email</label>
          <input type="email" class="form-input" id="authEmail" required placeholder="tu@email.com">
        </div>
        <div class="form-group">
          <label>Contrase\u00F1a</label>
          <input type="password" class="form-input" id="authPassword" required ${!isLogin ? 'minlength="6"' : ''} placeholder="${isLogin ? '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022' : 'M\u00EDnimo 6 caracteres'}">
        </div>
        <button type="submit" class="btn btn-primary btn-block btn-lg" id="authBtn">
          ${isLogin ? "Iniciar Sesi\u00F3n" : "Crear Cuenta"}
        </button>
      </form>
      <div class="auth-footer">
        ${isLogin
          ? '\u00BFNo tienes cuenta? <a onclick="showAuthModal(\'register\')">Reg\u00EDstrate aqu\u00ED</a>'
          : '\u00BFYa tienes cuenta? <a onclick="showAuthModal(\'login\')">Inicia sesi\u00F3n</a>'
        }
      </div>
    </div>
  `);
}

async function handleAuth(e, mode) {
  e.preventDefault();
  try {
    let data;
    if (mode === "login") {
      data = await api.auth.login({
        email: document.getElementById("authEmail").value,
        password: document.getElementById("authPassword").value,
      });
    } else {
      data = await api.auth.register({
        username: document.getElementById("authUsername").value,
        email: document.getElementById("authEmail").value,
        password: document.getElementById("authPassword").value,
      });
    }
    api.token = data.token;
    currentUser = data.user;
    closeModal();
    currentPage = "boxes";
    audio.startMusic();
    render();
    showToast(`\u00A1Bienvenido${mode === "login" ? " de vuelta" : ""}, ${currentUser.username}!`, "success");
  } catch (err) { showToast(err.message, "error"); }
}

// ═══════════════════════════════════════
// APP PAGES (authenticated)
// ═══════════════════════════════════════

function renderBoxesPage() {
  return `
    <div class="container">
      <div class="page-header">
        <h1>Abre tus Cajas</h1>
        <p>Elige una caja y descubre qu\u00E9 objetos te esperan</p>
      </div>
      <div class="boxes-grid" id="boxesGrid">
        <div class="spinner"></div>
      </div>
    </div>
  `;
}

async function loadBoxes() {
  try {
    const { boxes } = await api.boxes.list();
    const grid = document.getElementById("boxesGrid");
    grid.innerHTML = boxes.map(b => `
      <div class="box-card" onclick="openBoxModal(${b.id})">
        <div class="box-icon">${BOX_ICONS[b.name] || "\u{1F381}"}</div>
        <h3>${b.name}</h3>
        <p>${b.description}</p>
        <div class="box-cost">\u{1F48E} ${b.cost} cr\u00E9ditos</div>
      </div>
    `).join("");
  } catch (err) { showToast(err.message, "error"); }
}

async function openBoxModal(id) {
  try {
    const { box, tiers, items } = await api.boxes.detail(id);
    let itemsHtml = tiers.map(t => {
      const tierItems = items.filter(i => i.rarity_tier_id === t.id);
      return `
        <div style="margin-bottom:16px">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <span style="color:${t.color};font-weight:600;font-size:0.85rem">${t.name}</span>
            <span style="color:var(--text-secondary);font-size:0.8rem">${(t.probability * 100).toFixed(1)}%</span>
          </div>
          <div class="prob-track">
            <div class="prob-fill" style="width:${t.probability * 100}%;background:${t.color}"></div>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">
            ${tierItems.map(i => `<span class="tag" style="background:${t.color}22;color:${t.color}">${ITEM_ICONS[i.image] || "\u{1F381}"} ${i.name}</span>`).join("")}
          </div>
        </div>
      `;
    }).join("");

    openModal(`
      <button class="modal-close" onclick="closeModal()">&times;</button>
      <div style="text-align:center;margin-bottom:24px">
        <div style="font-size:3rem;margin-bottom:8px">${BOX_ICONS[box.name] || "\u{1F381}"}</div>
        <div class="modal-title">${box.name}</div>
        <p style="color:var(--text-secondary);font-size:0.9rem">${box.description}</p>
      </div>
      <div style="margin-bottom:20px">${itemsHtml}</div>
      <div style="text-align:center">
        <div style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:12px">Costo: \u{1F48E} ${box.cost} cr\u00E9ditos</div>
        <button class="btn btn-primary btn-lg" onclick="doOpenBox(${box.id}, ${box.cost})">
          \u{1F3B2} Abrir Caja
        </button>
      </div>
    `);
  } catch (err) { showToast(err.message, "error"); }
}

async function doOpenBox(boxId, cost) {
  if (currentUser.credits < cost) {
    showToast("Cr\u00E9ditos insuficientes. \u00A1Recarga tu billetera!", "error");
    return;
  }
  closeModal();
  showBoxAnimation(boxId);
}

function showBoxAnimation(boxId) {
  const overlay = document.createElement("div");
  overlay.className = "box-open-overlay";
  overlay.id = "boxOverlay";
  overlay.innerHTML = `
    <div class="box-opening-container">
      <div id="animBox" style="font-size:6rem" class="box-shake">\u{1F381}</div>
      <p style="color:var(--text-secondary);margin-top:20px;font-size:1.1rem">Abriendo caja...</p>
    </div>
  `;
  document.body.appendChild(overlay);
  audio.boxShake();

  setTimeout(async () => {
    audio.boxBurst();
    try {
      const result = await api.boxes.open(boxId);
      currentUser.credits = result.newBalance;
      document.getElementById("navCredits").textContent = formatCredits(result.newBalance);
      showItemReveal(result.item);
    } catch (err) {
      document.getElementById("boxOverlay")?.remove();
      showToast(err.message, "error");
    }
  }, 1200);
}

function showItemReveal(item) {
  const overlay = document.getElementById("boxOverlay");
  const isLegendary = item.rarity === "Legendary";
  const isEpic = item.rarity === "Epic";
  const glowClass = isLegendary || isEpic ? "item-glow" : "";
  audio.reveal(item.rarity);

  overlay.innerHTML = `
    <div class="box-opening-container" style="position:relative">
      ${isLegendary ? generateSparkles() : ""}
      <div style="font-size:1.2rem;color:${item.color};font-weight:700;margin-bottom:16px;text-transform:uppercase;letter-spacing:3px">
        ${item.rarity}
      </div>
      <div class="item-reveal ${glowClass}" style="
        width:160px;height:160px;margin:0 auto 24px;
        background:${item.color}15;border:3px solid ${item.color};
        border-radius:50%;display:flex;align-items:center;justify-content:center;
        font-size:4.5rem;color:${item.color};
        ${isLegendary ? `box-shadow:0 0 30px ${item.color}44,0 0 60px ${item.color}22` : ""}
      ">
        ${ITEM_ICONS[item.image] || "\u{1F381}"}
      </div>
      <div class="item-reveal" style="animation-delay:0.2s;opacity:0">
        <h2 style="font-size:1.6rem;font-weight:800;margin-bottom:8px">${item.name}</h2>
        <p style="color:var(--text-secondary);margin-bottom:24px">${item.description}</p>
        <button class="btn btn-primary btn-lg" onclick="document.getElementById('boxOverlay').remove()">
          \u00A1Genial!
        </button>
      </div>
    </div>
  `;
}

function generateSparkles() {
  let html = '<div class="legendary-sparkles">';
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const delay = Math.random() * 2;
    const size = 2 + Math.random() * 4;
    html += `<div class="sparkle" style="left:${x}%;top:${y}%;animation-delay:${delay}s;width:${size}px;height:${size}px"></div>`;
  }
  return html + "</div>";
}

// ─── INVENTORY ───
function renderInventoryPage() {
  return `
    <div class="container">
      <div class="page-header">
        <h1>Mi Inventario</h1>
        <p>Todos los objetos que has obtenido</p>
      </div>
      <div id="inventoryStats" style="margin-bottom:32px"></div>
      <div id="inventoryContent"><div class="spinner"></div></div>
    </div>
  `;
}

async function loadInventory() {
  try {
    const [invRes, statsRes] = await Promise.all([api.inventory.list(), api.inventory.stats()]);
    const statsEl = document.getElementById("inventoryStats");
    if (statsRes.total > 0) {
      statsEl.innerHTML = `
        <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;margin-bottom:24px">
          <div class="stat-card" style="text-align:center;min-width:120px">
            <div class="stat-value" style="font-size:1.5rem">${statsRes.total}</div>
            <div class="stat-label">Total Items</div>
          </div>
          ${statsRes.byRarity.map(r => `
            <div class="stat-card" style="text-align:center;min-width:120px;border-color:${r.color}33">
              <div class="stat-value" style="font-size:1.5rem;color:${r.color}">${r.count}</div>
              <div class="stat-label" style="color:${r.color}">${r.rarity}</div>
            </div>
          `).join("")}
        </div>
      `;
    }
    const content = document.getElementById("inventoryContent");
    if (invRes.inventory.length === 0) {
      content.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">\u{1F4E6}</div>
          <h3>Inventario vac\u00EDo</h3>
          <p style="margin-top:8px">\u00A1Abre cajas para conseguir objetos!</p>
          <button class="btn btn-primary" style="margin-top:16px" onclick="navigate('boxes')">Ir a Cajas</button>
        </div>
      `;
      return;
    }
    content.innerHTML = `
      <div class="inventory-grid">
        ${invRes.inventory.map(i => `
          <div class="inv-item">
            <div class="item-icon" style="background:${i.color}15;border:2px solid ${i.color}33">
              ${ITEM_ICONS[i.image] || "\u{1F381}"}
            </div>
            <div class="item-name">${i.name}</div>
            <div class="item-rarity" style="color:${i.color}">${i.rarity}</div>
          </div>
        `).join("")}
      </div>
    `;
  } catch (err) { showToast(err.message, "error"); }
}

// ─── WALLET ───
function renderWalletPage() {
  return `
    <div class="container">
      <div class="page-header">
        <h1>Mi Billetera</h1>
        <p>Gestiona tus cr\u00E9ditos</p>
      </div>
      <div class="wallet-balance">
        <div class="wallet-label">Cr\u00E9ditos Disponibles</div>
        <div class="wallet-amount" id="walletCredits">\u{1F48E} ${currentUser ? formatCredits(currentUser.credits) : 0}</div>
      </div>
      <div class="page-header">
        <h2 style="font-size:1.3rem;margin-bottom:16px">Comprar Cr\u00E9ditos</h2>
      </div>
      <div class="plans-grid" id="plansGrid"><div class="spinner"></div></div>
      <div class="admin-section" id="txSection">
        <h2>\u{1F4DC} Historial de Transacciones</h2>
        <div id="txList"><div class="spinner"></div></div>
      </div>
    </div>
  `;
}

async function loadWallet() {
  try {
    const [plansRes, txRes] = await Promise.all([api.payments.plans(), api.wallet.transactions()]);
    const grid = document.getElementById("plansGrid");
    grid.innerHTML = plansRes.plans.map(p => `
      <div class="plan-card ${p.badge ? 'featured' : ''}">
        ${p.badge ? `<div class="plan-badge">${p.badge}</div>` : ""}
        <div class="plan-label">${p.label}</div>
        <div class="plan-credits">\u{1F48E} ${p.credits.toLocaleString()}</div>
        <div class="plan-price">$${p.price} <span>USD</span></div>
        <button class="btn ${p.badge ? 'btn-gold' : 'btn-primary'} btn-block" onclick="buyPlan('${p.id}')">
          Comprar Ahora
        </button>
      </div>
    `).join("");

    const txList = document.getElementById("txList");
    if (txRes.transactions.length === 0) {
      txList.innerHTML = '<p style="color:var(--text-secondary);text-align:center;padding:20px">No hay transacciones a\u00FAn</p>';
    } else {
      txList.innerHTML = `
        <div style="overflow-x:auto">
          <table class="admin-table">
            <thead><tr><th>Tipo</th><th>Descripci\u00F3n</th><th>Monto</th><th>Estado</th><th>Fecha</th></tr></thead>
            <tbody>
              ${txRes.transactions.map(t => `
                <tr>
                  <td>${t.type === 'deposit' ? '\u{1F4B3} Dep\u00F3sito' : '\u{1F381} Apertura'}</td>
                  <td>${t.description}</td>
                  <td style="color:${t.amount > 0 ? 'var(--green)' : 'var(--red)'}">
                    ${t.amount > 0 ? '+' : ''}${t.type === 'deposit' ? formatMoney(t.amount) : t.amount + ' cr.'}
                  </td>
                  <td><span class="tag tag-${t.status}">${t.status}</span></td>
                  <td style="color:var(--text-secondary);font-size:0.8rem">${new Date(t.created_at).toLocaleDateString()}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `;
    }
  } catch (err) { showToast(err.message, "error"); }
}

async function buyPlan(planId) {
  try {
    const result = await api.payments.checkoutStripe(planId);
    openModal(`
      <button class="modal-close" onclick="closeModal()">&times;</button>
      <div style="text-align:center">
        <div style="font-size:3rem;margin-bottom:16px">\u{1F4B3}</div>
        <div class="modal-title">Pasarela de Pago</div>
        <p style="color:var(--text-secondary);margin-bottom:8px">Plan: <strong>${result.plan.label}</strong></p>
        <p style="color:var(--text-secondary);margin-bottom:8px">Precio: <strong>$${result.plan.price}</strong></p>
        <p style="color:var(--text-secondary);margin-bottom:24px">Cr\u00E9ditos: <strong>\u{1F48E} ${result.plan.credits}</strong></p>
        <p style="color:var(--text-secondary);font-size:0.8rem;margin-bottom:20px;background:var(--bg-input);padding:12px;border-radius:8px;text-align:left">
          ${result.message}
        </p>
        <button class="btn btn-primary btn-block" onclick="closeModal()">Entendido</button>
      </div>
    `);
  } catch (err) { showToast(err.message, "error"); }
}

// ─── ADMIN ───
function renderAdminPage() {
  return `
    <div class="container">
      <div class="page-header">
        <h1>Panel de Administraci\u00F3n</h1>
        <p>Gestiona la plataforma</p>
      </div>
      <div class="admin-grid" id="adminStats"><div class="spinner"></div></div>
      <div class="tabs">
        <button class="tab active" onclick="switchAdminTab('stats',this)">Estad\u00EDsticas</button>
        <button class="tab" onclick="switchAdminTab('users',this)">Usuarios</button>
        <button class="tab" onclick="switchAdminTab('probabilities',this)">Probabilidades</button>
        <button class="tab" onclick="switchAdminTab('boxes',this)">Cajas</button>
      </div>
      <div id="adminTabContent"><div class="spinner"></div></div>
    </div>
  `;
}

function switchAdminTab(tab, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  loadAdminTab(tab);
}

async function loadAdminTab(tab) {
  const content = document.getElementById("adminTabContent");
  content.innerHTML = '<div class="spinner"></div>';
  try {
    if (tab === "stats") {
      const s = await api.admin.stats();
      content.innerHTML = `
        <div class="admin-section">
          <h2>\u{1F4B0} Dep\u00F3sitos Recientes</h2>
          ${s.recentDeposits.length === 0 ? '<p style="color:var(--text-secondary)">No hay dep\u00F3sitos a\u00FAn</p>' : `
            <table class="admin-table">
              <thead><tr><th>Usuario</th><th>Monto</th><th>Estado</th><th>Fecha</th></tr></thead>
              <tbody>
                ${s.recentDeposits.map(d => `
                  <tr>
                    <td>${d.username}</td>
                    <td style="color:var(--green)">${formatMoney(d.amount)}</td>
                    <td><span class="tag tag-${d.status}">${d.status}</span></td>
                    <td style="color:var(--text-secondary);font-size:0.8rem">${new Date(d.created_at).toLocaleDateString()}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          `}
        </div>
        <div class="admin-section">
          <h2>\u{1F4CA} Distribuci\u00F3n de Rareza</h2>
          <div style="display:flex;gap:16px;flex-wrap:wrap">
            ${s.rarityStats.map(r => `
              <div class="stat-card" style="text-align:center;min-width:100px;border-color:${r.color}33">
                <div class="stat-value" style="font-size:1.3rem;color:${r.color}">${r.count}</div>
                <div class="stat-label" style="color:${r.color}">${r.rarity}</div>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    } else if (tab === "users") {
      const { users } = await api.admin.users();
      content.innerHTML = `
        <div class="admin-section">
          <h2>\u{1F465} Usuarios (${users.length})</h2>
          <div style="overflow-x:auto">
            <table class="admin-table">
              <thead><tr><th>ID</th><th>Usuario</th><th>Email</th><th>Cr\u00E9ditos</th><th>Rol</th><th>Acciones</th></tr></thead>
              <tbody>
                ${users.map(u => `
                  <tr>
                    <td>${u.id}</td>
                    <td>${u.username}</td>
                    <td style="color:var(--text-secondary)">${u.email}</td>
                    <td><input type="number" value="${u.credits}" style="width:80px;background:var(--bg-input);border:1px solid var(--border);color:var(--text-primary);padding:4px 8px;border-radius:4px;font-size:0.85rem" id="credits_${u.id}"></td>
                    <td>
                      <select style="background:var(--bg-input);border:1px solid var(--border);color:var(--text-primary);padding:4px 8px;border-radius:4px;font-size:0.85rem" id="role_${u.id}">
                        <option value="user" ${u.role==='user'?'selected':''}>User</option>
                        <option value="admin" ${u.role==='admin'?'selected':''}>Admin</option>
                      </select>
                    </td>
                    <td><button class="btn btn-sm btn-primary" onclick="saveUser(${u.id})">Guardar</button></td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } else if (tab === "probabilities") {
      const { tiers } = await api.admin.probabilities();
      const grouped = {};
      tiers.forEach(t => { if (!grouped[t.box_name]) grouped[t.box_name] = []; grouped[t.box_name].push(t); });
      content.innerHTML = Object.entries(grouped).map(([boxName, boxTiers]) => `
        <div class="admin-section">
          <h2>\u{1F3B2} Probabilidades \u2014 ${boxName}</h2>
          ${boxTiers.map(t => `
            <div style="margin-bottom:16px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                <span style="color:${t.color};font-weight:600">${t.name}</span>
                <span style="color:var(--text-secondary);font-size:0.85rem" id="probVal_${t.id}">${(t.probability * 100).toFixed(1)}%</span>
              </div>
              <div style="display:flex;gap:8px;align-items:center">
                <input type="range" class="prob-slider" min="0" max="100" step="0.5" value="${t.probability * 100}"
                  oninput="document.getElementById('probVal_${t.id}').textContent=this.value+'%'" id="slider_${t.id}">
                <button class="btn btn-sm btn-primary" onclick="saveProbability(${t.id}, document.getElementById('slider_${t.id}').value)">Guardar</button>
              </div>
            </div>
          `).join("")}
        </div>
      `).join("");
    } else if (tab === "boxes") {
      const { boxes } = await api.admin.boxes();
      content.innerHTML = `
        <div class="admin-section">
          <h2>\u{1F4E6} Gestionar Cajas</h2>
          <table class="admin-table">
            <thead><tr><th>ID</th><th>Nombre</th><th>Costo</th><th>Activa</th><th>Acciones</th></tr></thead>
            <tbody>
              ${boxes.map(b => `
                <tr>
                  <td>${b.id}</td>
                  <td>${b.name}</td>
                  <td><input type="number" value="${b.cost}" style="width:80px;background:var(--bg-input);border:1px solid var(--border);color:var(--text-primary);padding:4px 8px;border-radius:4px;font-size:0.85rem" id="boxCost_${b.id}"></td>
                  <td>
                    <select style="background:var(--bg-input);border:1px solid var(--border);color:var(--text-primary);padding:4px 8px;border-radius:4px;font-size:0.85rem" id="boxActive_${b.id}">
                      <option value="1" ${b.active?'selected':''}>S\u00ED</option>
                      <option value="0" ${!b.active?'selected':''}>No</option>
                    </select>
                  </td>
                  <td><button class="btn btn-sm btn-primary" onclick="saveBox(${b.id})">Guardar</button></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `;
    }
  } catch (err) { showToast(err.message, "error"); }
}

async function saveUser(id) {
  try {
    const credits = parseInt(document.getElementById(`credits_${id}`).value);
    const role = document.getElementById(`role_${id}`).value;
    await api.admin.updateUser(id, { credits, role });
    showToast("Usuario actualizado", "success");
  } catch (err) { showToast(err.message, "error"); }
}

async function saveProbability(tierId, val) {
  try {
    await api.admin.updateProbability(tierId, parseFloat(val) / 100);
    showToast("Probabilidad actualizada", "success");
  } catch (err) { showToast(err.message, "error"); }
}

async function saveBox(id) {
  try {
    const cost = parseInt(document.getElementById(`boxCost_${id}`).value);
    const active = document.getElementById(`boxActive_${id}`).value === "1";
    await api.admin.updateBox(id, { cost, active });
    showToast("Caja actualizada", "success");
  } catch (err) { showToast(err.message, "error"); }
}

async function loadAdminStats() {
  try {
    const s = await api.admin.stats();
    document.getElementById("adminStats").innerHTML = `
      <div class="stat-card"><div class="stat-label">Usuarios</div><div class="stat-value">${s.totalUsers}</div></div>
      <div class="stat-card"><div class="stat-label">Ingresos</div><div class="stat-value" style="color:var(--green)">${formatMoney(s.totalRevenue)}</div></div>
      <div class="stat-card"><div class="stat-label">Cajas Abiertas</div><div class="stat-value">${s.totalOpens}</div></div>
      <div class="stat-card"><div class="stat-label">Cr\u00E9ditos Gastados</div><div class="stat-value" style="color:var(--gold)">${formatCredits(s.totalCreditsSpent)}</div></div>
    `;
  } catch (err) { /* silent */ }
}

// ═══════════════════════════════════════
// MAIN RENDER
// ═══════════════════════════════════════
function render() {
  const navbar = document.getElementById("navbar");
  const content = document.getElementById("pageContent");
  const landing = document.getElementById("landingPage");
  const main = document.getElementById("mainContent");

  if (currentPage === "landing") {
    navbar.classList.add("hidden");
    main.classList.add("hidden");
    renderLanding();
    return;
  }

  // Hide landing, show app
  landing.classList.add("hidden");
  main.classList.remove("hidden");
  navbar.classList.remove("hidden");

  document.getElementById("navUser").textContent = currentUser?.username || "";
  document.getElementById("navCredits").textContent = formatCredits(currentUser?.credits || 0);

  document.querySelectorAll(".nav-link").forEach(l => {
    l.classList.toggle("active", l.dataset.page === currentPage);
  });

  const adminLink = document.querySelector(".admin-only");
  if (currentUser?.role === "admin") adminLink.classList.remove("hidden");
  else adminLink.classList.add("hidden");

  switch (currentPage) {
    case "boxes":
      content.innerHTML = renderBoxesPage();
      loadBoxes();
      break;
    case "inventory":
      content.innerHTML = renderInventoryPage();
      loadInventory();
      break;
    case "wallet":
      content.innerHTML = renderWalletPage();
      loadWallet();
      break;
    case "admin":
      if (currentUser?.role !== "admin") { currentPage = "boxes"; render(); return; }
      content.innerHTML = renderAdminPage();
      loadAdminStats();
      loadAdminTab("stats");
      break;
  }
}

// ─── INIT ───
(async function init() {
  initParticles();
  if (api.token) {
    try {
      const { user } = await api.auth.me();
      currentUser = user;
      currentPage = "boxes";
    } catch { api.token = null; }
  }
  render();

  // Audio event delegation
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("button, .btn, .btn-hero, .btn-primary, .btn-secondary, .box-card, .showcase-card");
    if (btn) audio.click();
  });
  document.addEventListener("mouseenter", (e) => {
    if (e.target.closest("button, .btn, .btn-hero")) audio.hover();
  }, true);
})();
