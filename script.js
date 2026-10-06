// Top nav — clicking a link keeps it highlighted (yellow) until another is clicked
document.addEventListener('DOMContentLoaded', function () {
  const navLinks = document.querySelectorAll('.nav-links a');

  navLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      navLinks.forEach(function (l) { l.classList.remove('active'); });
      link.classList.add('active');
    });
  });
});

// Testimonials — one card slides up at a time, auto-advances, arrows + dots to steer
document.addEventListener('DOMContentLoaded', function () {
  const deck = document.querySelector('.testimonial-deck');
  if (!deck) return;

  const stack = deck.querySelector('.testimonial-stack');
  const cards = [...deck.querySelectorAll('.testimonial-card')];
  const dots = [...deck.querySelectorAll('.t-dot')];
  const currentEl = deck.querySelector('.t-current');
  const prevBtn = deck.querySelector('.t-arrow.prev');
  const nextBtn = deck.querySelector('.t-arrow.next');
  const total = cards.length;
  let index = 0;
  let timer = null;

  function render() {
    cards.forEach(function (card, i) {
      card.classList.toggle('active', i === index);
    });
    dots.forEach(function (dot, i) { dot.classList.toggle('active', i === index); });
    if (currentEl) currentEl.textContent = index + 1;
    // measure synchronously right after the class swap — no rAF, no delay
    stack.style.height = cards[index].scrollHeight + 'px';
  }

  function goTo(i) {
    index = ((i % total) + total) % total;
    render();
  }

  function next() { goTo(index + 1); }
  function prev() { goTo(index - 1); }

  function start() {
    stop();
    timer = setInterval(next, 3800);
  }
  function stop() {
    if (timer) clearInterval(timer);
  }

  dots.forEach(function (dot, i) {
    dot.addEventListener('click', function () {
      goTo(i);
      start();
    });
  });

  if (nextBtn) nextBtn.addEventListener('click', function () { next(); start(); });
  if (prevBtn) prevBtn.addEventListener('click', function () { prev(); start(); });

  // pause the rotation while someone's actually reading a card
  deck.addEventListener('mouseenter', stop);
  deck.addEventListener('mouseleave', start);

  render();
  start();
  window.addEventListener('resize', function () {
    stack.style.height = cards[index].scrollHeight + 'px';
  });
});

// Campaign journey — horizontal accordion, click a card to expand it in place
document.addEventListener('DOMContentLoaded', function () {
  const journey = document.querySelector('.journey');
  if (!journey) return;

  const stages = journey.querySelectorAll('.stage');

  function openStage(stage) {
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    stages.forEach(function (s) { s.classList.remove('open'); });
    stage.classList.add('open');

    // fixed-height row means this shouldn't move the page at all — belt and braces
    window.scrollTo(scrollX, scrollY);
    requestAnimationFrame(function () {
      window.scrollTo(scrollX, scrollY);
    });
  }

  stages.forEach(function (stage) {
    // hover driven from JS (not CSS :hover) so it can't get stuck flickering
    // as the card's own width changes underneath the cursor
    stage.addEventListener('mouseenter', function () {
      openStage(stage);
    });
    stage.addEventListener('mouseleave', function () {
      stage.classList.remove('open');
    });

    // click is the touch-device fallback (no hover on touch) — every card
    // always closes on mouseleave, so nothing ever gets stuck open
    stage.addEventListener('click', function () {
      openStage(stage);
    });
  });
});

// Work Experience stacked cards — hovering the deck opens every card one by
// one, slowly. Once open, it stays open until you click outside the deck —
// no scroll-locking, the page scrolls completely normally throughout.
document.addEventListener('DOMContentLoaded', function () {
  const stack = document.querySelector('.jobs-stack');
  if (!stack) return;

  const jobs = [...stack.querySelectorAll('.job')];
  let isOpen = false;
  let openTimers = [];

  function pauseVideo(job) {
    const video = job.querySelector('.job-media video');
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
  }
  function playVideo(job) {
    const video = job.querySelector('.job-media video');
    if (video) video.play().catch(function () {});
  }

  function clearOpenTimers() {
    openTimers.forEach(function (t) { clearTimeout(t); });
    openTimers = [];
  }

  function openAll() {
    if (isOpen) return;
    isOpen = true;
    stack.classList.add('all-open');
    clearOpenTimers();
    jobs.forEach(function (job, i) {
      const t = setTimeout(function () {
        job.classList.add('open');
        playVideo(job);
      }, i * 260);
      openTimers.push(t);
    });
  }

  function closeAll() {
    if (!isOpen) return;
    isOpen = false;
    clearOpenTimers();
    stack.classList.remove('all-open');
    jobs.forEach(function (job) {
      job.classList.remove('open');
      pauseVideo(job);
    });
  }

  stack.addEventListener('mouseenter', openAll);

  // only closes when you click somewhere outside the whole deck
  document.addEventListener('click', function (e) {
    if (isOpen && !stack.contains(e.target)) {
      closeAll();
    }
  });
});
