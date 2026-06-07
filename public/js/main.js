document.addEventListener('DOMContentLoaded', () => {
  initNavToggle();
  initHeroSlider();
  initCountdown();
  initScheduleTabs();
  initGalleryLightbox();
});

function initNavToggle() {
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    links.classList.toggle('open');
  });

  links.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => links.classList.remove('open'));
  });
}

function initHeroSlider() {
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.hero-dot');
  if (!slides.length) return;

  let current = 0;
  let interval;

  function showSlide(index) {
    slides.forEach((s) => s.classList.remove('active'));
    dots.forEach((d) => d.classList.remove('active'));
    slides[index].classList.add('active');
    if (dots[index]) dots[index].classList.add('active');
    current = index;
  }

  function nextSlide() {
    showSlide((current + 1) % slides.length);
  }

  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      showSlide(Number(dot.dataset.slide));
      resetInterval();
    });
  });

  function resetInterval() {
    clearInterval(interval);
    interval = setInterval(nextSlide, 5000);
  }

  resetInterval();
}

function initCountdown() {
  const el = document.getElementById('countdown');
  if (!el) return;

  const dateStr = el.dataset.date;
  const timeStr = el.dataset.time || '00:00';
  if (!dateStr) return;

  const target = new Date(`${dateStr}T${timeStr}:00`);
  const daysEl = document.getElementById('cd-days');
  const hoursEl = document.getElementById('cd-hours');
  const minutesEl = document.getElementById('cd-minutes');
  const secondsEl = document.getElementById('cd-seconds');
  const timerEl = el.querySelector('.countdown-timer');
  const endedEl = document.getElementById('countdown-ended');

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function tick() {
    const diff = target - Date.now();

    if (diff <= 0) {
      if (timerEl) timerEl.hidden = true;
      if (endedEl) endedEl.hidden = false;
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    if (daysEl) daysEl.textContent = pad(days);
    if (hoursEl) hoursEl.textContent = pad(hours);
    if (minutesEl) minutesEl.textContent = pad(minutes);
    if (secondsEl) secondsEl.textContent = pad(seconds);
  }

  tick();
  setInterval(tick, 1000);
}

function initScheduleTabs() {
  const tabs = document.querySelectorAll('.schedule-tab');
  const panels = document.querySelectorAll('.schedule-panel');
  if (!tabs.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const day = tab.dataset.day;
      tabs.forEach((t) => t.classList.remove('active'));
      panels.forEach((p) => p.classList.remove('active'));
      tab.classList.add('active');
      const panel = document.querySelector(`.schedule-panel[data-day="${day}"]`);
      if (panel) panel.classList.add('active');
    });
  });
}

function initGalleryLightbox() {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const closeBtn = document.getElementById('lightboxClose');
  const items = document.querySelectorAll('.gallery-item');
  if (!lightbox || !items.length) return;

  items.forEach((item) => {
    item.addEventListener('click', () => {
      lightboxImg.src = item.dataset.src;
      lightboxImg.alt = item.dataset.caption || 'Gallery image';
      lightboxCaption.textContent = item.dataset.caption || '';
      lightbox.hidden = false;
    });
  });

  function closeLightbox() {
    lightbox.hidden = true;
    lightboxImg.src = '';
  }

  closeBtn.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !lightbox.hidden) closeLightbox();
  });
}
