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

// "At a glance" character — restarts from the first frame each time you scroll
// down into it, keeps looping while it's on screen, pauses once it's out of view
document.addEventListener('DOMContentLoaded', function () {
  const video = document.querySelector('.st-glance-char video');
  if (!video || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        // entering from below the fold = the reader is scrolling down
        if (entry.boundingClientRect.top > 0) video.currentTime = 0;
        video.play().catch(function () {});
      } else {
        video.pause();
      }
    });
  }, { threshold: 0.35 });
  io.observe(video.parentElement);
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
