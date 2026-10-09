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

// Videos inside the case study and the job cards — play only while on screen
document.addEventListener('DOMContentLoaded', function () {
  const videos = document.querySelectorAll('.st-frame-video video, .job-media video');
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) entry.target.play().catch(function () {});
      else entry.target.pause();
    });
  }, { threshold: 0.25 });
  videos.forEach(function (v) { io.observe(v); });
});

// Character videos (g, g0, g1, g2) — restart from the first frame each time you
// scroll down into it, loop while on screen, pause once out of view
document.addEventListener('DOMContentLoaded', function () {
  const boxes = document.querySelectorAll('.char-video');
  if (!boxes.length || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      const video = entry.target.querySelector('video');
      if (entry.isIntersecting) {
        if (entry.boundingClientRect.top > 0) video.currentTime = 0;   // reader is scrolling down
        video.play().catch(function () {});
      } else {
        video.pause();
      }
    });
  }, { threshold: 0.35 });
  boxes.forEach(function (box) { io.observe(box); });
});

// Work timeline dragon — each experience has its own short rail that starts at its pin
// and stops at its end. The dragon rides the rail of the experience you're reading,
// pauses at the end of every sub-section, and counts down how many are left.
document.addEventListener('DOMContentLoaded', function () {
  const timeline = document.querySelector('.timeline');
  if (!timeline) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = [...timeline.querySelectorAll('.tl-item')];

  const rails = items.map(function (item) {
    const el = document.createElement('div');
    el.className = 'tl-rail';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML =
      '<div class="tl-progress"></div>' +
      '<div class="tl-dragon"><span class="dragon-bg"></span><div class="dragon-frame">' +
      '<video src="dragon.mp4" muted loop playsinline preload="none"></video></div>' +
      '<span class="tl-count"></span></div>';
    item.appendChild(el);
    return {
      item: item, el: el,
      subs: [...item.querySelectorAll('.tl-sub')],
      progress: el.querySelector('.tl-progress'),
      dragon: el.querySelector('.tl-dragon'),
      video: el.querySelector('.tl-dragon video'),
      count: el.querySelector('.tl-count'),
      stations: [], dots: [], height: 0, current: 0, target: 0,
      last: items.indexOf(item) === items.length - 1
    };
  });

  let active = -1;
  // the dragon waits a little below each pin, so the start of a rail never feels crowded
  function startGap() { return window.innerWidth <= 640 ? 72 : 124; }

  function measure() {
    rails.forEach(function (r) {
      const top = r.el.getBoundingClientRect().top;
      r.height = r.el.offsetHeight;
      // a station at the end of each sub-section; the last one is the end of the rail
      r.stations = r.subs.map(function (sub) {
        return Math.min(r.height, sub.getBoundingClientRect().bottom - top);
      });
      if (r.stations.length) r.stations[r.stations.length - 1] = r.height;
      r.start = Math.min(startGap(), (r.stations[0] || 0) * 0.5);
      if (r.current < r.start) r.current = r.start;
      if (r.dots.length !== r.stations.length) {
        r.dots.forEach(function (d) { d.remove(); });
        r.dots = r.stations.map(function () {
          const d = document.createElement('span');
          d.className = 'tl-station';
          r.el.insertBefore(d, r.dragon);
          return d;
        });
      }
      r.stations.forEach(function (y, i) { r.dots[i].style.top = y + 'px'; });
    });
    update();
  }

  // scroll position along a rail -> dragon position, holding still for a beat at each station
  function mapToTrack(raw, stations, start) {
    let prev = start, prevDwell = 0;
    raw = Math.max(raw, start);
    for (let i = 0; i < stations.length; i++) {
      const s = stations[i];
      const dwell = Math.min(140, (s - prev) * 0.22);
      if (raw <= s - dwell) {
        const from = prev + prevDwell, to = s - dwell;
        if (raw <= from) return prev;
        return prev + (raw - from) / (to - from) * (s - prev);
      }
      if (raw <= s + dwell) return s;
      prev = s; prevDwell = dwell;
    }
    return stations.length ? stations[stations.length - 1] : 0;
  }

  let ticking = false;
  function update() {
    const marker = window.innerHeight * 0.55;
    let nextActive = 0;
    rails.forEach(function (r, i) {
      const raw = marker - r.el.getBoundingClientRect().top;
      r.target = mapToTrack(Math.max(0, Math.min(raw, r.height + 400)), r.stations, r.start);
      r.reached = raw >= r.start;
      if (raw >= 0) nextActive = i;      // the last rail whose start has been reached
    });
    if (nextActive !== active) {
      rails.forEach(function (r, i) {
        r.el.classList.toggle('is-active', i === nextActive);
        // only the dragon on screen plays; the others stay paused
        if (i === nextActive) r.video.play().catch(function () {});
        else r.video.pause();
      });
      active = nextActive;
    }
    if (reduced) { rails.forEach(function (r) { r.current = r.target; render(r); }); return; }
    if (!ticking) { ticking = true; requestAnimationFrame(step); }
  }

  function step() {
    let moving = false;
    rails.forEach(function (r) {
      // gentle easing: the dragon glides rather than snapping to the scroll
      r.current += (r.target - r.current) * 0.085;
      if (Math.abs(r.target - r.current) < 0.3) r.current = r.target; else moving = true;
      render(r);
    });
    if (moving) requestAnimationFrame(step); else ticking = false;
  }

  function render(r) {
    r.dragon.style.transform = 'translateY(' + r.current.toFixed(1) + 'px)';
    // the ridden part of the line only darkens once the dragon has actually set off
    r.progress.style.height = (r.reached ? r.current : 0).toFixed(1) + 'px';
    let passed = 0;
    r.stations.forEach(function (s, i) {
      const done = r.current >= s - 1;
      r.dots[i].classList.toggle('is-passed', done);
      r.dots[i].classList.toggle('is-here', Math.abs(r.current - s) < 1);
      if (done) passed++;
    });
    const left = r.stations.length - passed;
    r.count.textContent = left > 0 ? left + ' to go' : (r.last ? 'The end' : 'Next stop ↓');
    r.count.classList.toggle('is-done', left === 0);
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(timeline);
  measure();
});

// Reveal on scroll — subtle fade-up as blocks enter the viewport
document.addEventListener('DOMContentLoaded', function () {
  const targets = document.querySelectorAll(
    '.section-head, .st-block, .st-frame, .job-sec, .job-top, .about-grid, .linkedin-grid, .skill-card, .job, .case, .phase, .takeaway, .feature, .testimonial, .contact-panel, .hero-feats'
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
