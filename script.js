// =========================
// NEXPULSE — INTERACTIONS
// =========================

// Cursor glow follow
const cursor = document.getElementById('cursorGlow');
if (cursor) {
  document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
  });
  document.addEventListener('mouseleave', () => cursor.style.opacity = '0');
  document.addEventListener('mouseenter', () => cursor.style.opacity = '1');
}

// Scroll reveal
const revealEls = document.querySelectorAll('.reveal-on-scroll');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
revealEls.forEach(el => revealObserver.observe(el));

// Number counters
const counters = document.querySelectorAll('[data-count]');
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseFloat(el.dataset.count);
      const isFloat = !Number.isInteger(target);
      const duration = 1800;
      const start = performance.now();

      const tick = (now) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        const val = target * eased;
        if (isFloat) el.textContent = val.toFixed(1);
        else if (target >= 1000) el.textContent = Math.floor(val).toLocaleString();
        else el.textContent = Math.floor(val);
        if (t < 1) requestAnimationFrame(tick);
        else el.textContent = isFloat ? target.toFixed(1) : (target >= 1000 ? target.toLocaleString() : target);
      };
      requestAnimationFrame(tick);
      counterObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });
counters.forEach(c => counterObserver.observe(c));

// Live heart rate simulation in hero
const hrLive = document.getElementById('hrLive');
if (hrLive) {
  let hr = 72;
  setInterval(() => {
    hr += Math.round((Math.random() - 0.5) * 4);
    hr = Math.max(64, Math.min(82, hr));
    hrLive.textContent = hr;
  }, 1500);
}

// Nav scroll effect
const nav = document.querySelector('.nav');
let lastScroll = 0;
window.addEventListener('scroll', () => {
  const cur = window.scrollY;
  if (nav) {
    if (cur > 50) {
      nav.style.background = 'rgba(255, 255, 255, 0.85)';
      nav.style.boxShadow = '0 12px 30px rgba(6, 21, 40, 0.08)';
    } else {
      nav.style.background = 'rgba(255, 255, 255, 0.7)';
      nav.style.boxShadow = '0 12px 40px rgba(6, 21, 40, 0.08)';
    }
  }
  lastScroll = cur;
});

// Smooth anchor scroll
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id.length > 1) {
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  });
});
