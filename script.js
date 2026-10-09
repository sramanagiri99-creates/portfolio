// Nav — border on scroll, mobile menu, active link follows the section in view
document.addEventListener('DOMContentLoaded', function () {
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = [...document.querySelectorAll('.nav-links a')];

  function onScroll() { nav.classList.toggle('scrolled', window.scrollY > 8); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  function setMenu(open) {
    nav.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  }
  toggle.addEventListener('click', function (e) {
    e.stopPropagation();
    setMenu(!nav.classList.contains('menu-open'));
  });
  document.addEventListener('click', function (e) {
    if (!nav.contains(e.target)) setMenu(false);
  });
  navLinks.forEach(function (link) {
    link.addEventListener('click', function () { setMenu(false); });
  });

  const sections = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);

  const spy = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      const id = '#' + entry.target.id;
      navLinks.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === id); });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(function (s) { spy.observe(s); });
});

// Work experience — native <details> accordion; play the video only while open
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.job').forEach(function (job) {
    const video = job.querySelector('.job-media video');
    if (!video) return;
    function sync() {
      if (job.open) video.play().catch(function () {});
      else video.pause();
    }
    job.addEventListener('toggle', sync);
    sync();
  });
});

// Case-study video — play only while it's on screen
document.addEventListener('DOMContentLoaded', function () {
  const videos = document.querySelectorAll('.st-frame-video video');
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) entry.target.play().catch(function () {});
      else entry.target.pause();
    });
  }, { threshold: 0.25 });
  videos.forEach(function (v) { io.observe(v); });
});

// Character videos (skills peeker, "At a glance") — restart from the first frame
// each time you scroll down into them, loop while on screen, pause once out of view
document.addEventListener('DOMContentLoaded', function () {
  const boxes = document.querySelectorAll('.char-video');
  if (!boxes.length || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      const video = entry.target.querySelector('video');
      if (entry.isIntersecting) {
        // entering from below the fold = the reader is scrolling down
        if (entry.boundingClientRect.top > 0) video.currentTime = 0;
        video.play().catch(function () {});
      } else {
        video.pause();
      }
    });
  }, { threshold: 0.35 });
  boxes.forEach(function (box) { io.observe(box); });
});

// Work timeline train — rides the line as you scroll, pauses briefly at the end
// of each experience (a "station"), and shows how many stops are left
document.addEventListener('DOMContentLoaded', function () {
  const timeline = document.querySelector('.timeline');
  if (!timeline) return;
  const rail = timeline.querySelector('.tl-rail');
  const train = rail.querySelector('.tl-train');
  const progress = rail.querySelector('.tl-progress');
  const label = rail.querySelector('.tl-train-label');
  const items = [...timeline.querySelectorAll('.tl-item')];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let stations = [];      // y of each experience's end, relative to the rail
  let dots = [];
  let current = 0, target = 0, ticking = false;

  function measure() {
    const railTop = rail.offsetTop;
    stations = items.map(function (item) { return item.offsetTop + item.offsetHeight - railTop; });
    if (dots.length !== stations.length) {
      dots.forEach(function (d) { d.remove(); });
      dots = stations.map(function () {
        const d = document.createElement('span');
        d.className = 'tl-station';
        rail.insertBefore(d, train);
        return d;
      });
    }
    stations.forEach(function (y, i) { dots[i].style.top = y + 'px'; });
    update();
  }

  // raw scroll position → train position, holding still in a "dwell" zone around each station
  function mapToTrack(raw) {
    let prev = 0, prevDwell = 0;
    for (let i = 0; i < stations.length; i++) {
      const s = stations[i];
      const dwell = Math.min(110, (s - prev) * 0.18);
      if (raw <= s - dwell) {
        const from = prev + prevDwell, to = s - dwell;
        if (raw <= from) return prev;
        return prev + (raw - from) / (to - from) * (s - prev);
      }
      if (raw <= s + dwell) return s;
      prev = s; prevDwell = dwell;
    }
    return stations[stations.length - 1] || 0;
  }

  function update() {
    const raw = window.innerHeight * 0.55 - rail.getBoundingClientRect().top;
    target = mapToTrack(Math.max(0, raw));
    if (reduced) { current = target; render(); return; }
    if (!ticking) { ticking = true; requestAnimationFrame(step); }
  }

  function step() {
    current += (target - current) * 0.2;
    if (Math.abs(target - current) < 0.4) current = target;
    render();
    if (current !== target) requestAnimationFrame(step); else ticking = false;
  }

  function render() {
    train.style.transform = 'translateY(' + current.toFixed(1) + 'px)';
    progress.style.height = current.toFixed(1) + 'px';
    let passed = 0;
    stations.forEach(function (s, i) {
      const done = current >= s - 1;
      dots[i].classList.toggle('is-passed', done);
      if (done) passed++;
    });
    const left = stations.length - passed;
    label.textContent = left === 0 ? 'End of the line' : left === 1 ? 'Last stop' : left + ' to go';
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  timeline.querySelectorAll('details').forEach(function (d) { d.addEventListener('toggle', measure); });
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(timeline);
  measure();
});

// Reveal on scroll — subtle fade-up as blocks enter the viewport
document.addEventListener('DOMContentLoaded', function () {
  const targets = document.querySelectorAll(
    '.section-head, .st-block, .st-frame, .about-grid, .linkedin-grid, .skill-card, .job, .case, .phase, .takeaway, .feature, .testimonial, .contact-panel, .hero-feats'
  );
  if (!('IntersectionObserver' in window)) return;

  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

  targets.forEach(function (el) {
    el.classList.add('reveal');
    io.observe(el);
  });
});
