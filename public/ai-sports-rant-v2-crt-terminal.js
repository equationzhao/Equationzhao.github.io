(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const overlay = document.querySelector('.crt-overlay');
  const bootLog = document.getElementById('boot-log');
  const heroMain = document.getElementById('hero-main');
  const chapters = document.querySelectorAll('.chapter');

  const BOOT_LINES = [
    { text: 'ATHLETE_MONITOR v0.9.2 — cold start', delay: 0 },
    { text: '[ OK ] garmin_drv ............... loaded', delay: 120 },
    { text: '[ OK ] strava_api ............... connected', delay: 100 },
    { text: '[ OK ] whoop_hrv ................ timeout', delay: 90 },
    { text: '[WARN] ai_coach ................. LOW SIGNAL', delay: 140, warn: true },
    { text: '[ OK ] session_log .............. ready', delay: 80 },
    { text: '> mounting /dev/athlete ........ OK', delay: 100 },
  ];

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  function typeInto(el, text, speed) {
    return new Promise((resolve) => {
      if (!el) return resolve();
      let i = 0;
      const tick = () => {
        if (i <= text.length) {
          el.textContent = text.slice(0, i);
          i += 1;
          setTimeout(tick, speed);
        } else {
          resolve();
        }
      };
      tick();
    });
  }

  function flashOverlay() {
    if (!overlay || reduced) return;
    overlay.classList.add('flash');
    setTimeout(() => overlay.classList.remove('flash'), 180);
  }

  function glitchChapter(ch) {
    if (reduced) {
      ch.classList.add('visible');
      return;
    }
    ch.classList.add('glitch-in');
    flashOverlay();
    setTimeout(() => {
      ch.classList.add('visible');
      ch.classList.remove('glitch-in');
    }, 420);
  }

  async function animateStats() {
    const hrv = document.querySelector('[data-stat="hrv"]');
    const ftp = document.querySelector('[data-stat="ftp"]');
    const status = document.querySelector('[data-stat="status"]');
    if (!hrv || !ftp || !status) return;

    const flicker = async (el, values, final) => {
      for (let n = 0; n < 6; n += 1) {
        el.textContent = values[Math.floor(Math.random() * values.length)];
        await sleep(70 + Math.random() * 60);
      }
      el.textContent = final;
    };

    await flicker(hrv, ['42', '38', 'ERR', '51', '--'], '--');
    await sleep(80);
    await flicker(ftp, ['268', '241', '???', '255', '--'], '--');
    status.textContent = 'CRITICAL';
    status.classList.add('warn');
  }

  async function runBoot() {
    if (!bootLog || !heroMain) return;

    if (reduced) {
      bootLog.textContent = BOOT_LINES.map((l) => l.text).join('\n');
      heroMain.hidden = false;
      document.querySelectorAll('.tw-text').forEach((el) => {
        const line = el.closest('.tw-line');
        if (line) line.classList.add('tw-done');
      });
      return;
    }

    bootLog.textContent = '';
    for (const line of BOOT_LINES) {
      await sleep(line.delay);
      const row = document.createElement('div');
      row.className = 'boot-line' + (line.warn ? ' boot-warn' : '');
      bootLog.appendChild(row);
      await typeInto(row, line.text, 14);
    }

    await sleep(300);
    bootLog.classList.add('boot-done');
    flashOverlay();
    animateStats();

    await sleep(400);
    heroMain.hidden = false;
    heroMain.classList.add('hero-main-in');

    const lines = heroMain.querySelectorAll('.tw-line');
    for (const line of lines) {
      const textEl = line.querySelector('.tw-text');
      const cursor = line.querySelector('.tw-cursor');
      const full = textEl?.textContent || '';
      if (textEl) textEl.textContent = '';
      if (cursor) cursor.style.visibility = 'visible';
      const speed = line.classList.contains('tw-title') ? 32 : 18;
      await typeInto(textEl, full, speed);
      line.classList.add('tw-done');
      if (cursor) cursor.style.visibility = 'hidden';
      await sleep(line.classList.contains('tw-title') ? 280 : 160);
    }
  }

  async function typeTerminal(term) {
    if (term.dataset.typed === '1') return;
    term.dataset.typed = '1';
    const lines = term.querySelectorAll('.term-line');
    if (reduced) {
      lines.forEach((l) => l.classList.add('term-done'));
      return;
    }
    for (const line of lines) {
      const textEl = line.querySelector('.term-text');
      const full = textEl?.textContent || '';
      if (textEl) textEl.textContent = '';
      line.classList.add('term-active');
      await typeInto(textEl, full, 16);
      line.classList.add('term-done');
      line.classList.remove('term-active');
      await sleep(120);
    }
  }

  const chapterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || entry.target.dataset.revealed) return;
        entry.target.dataset.revealed = '1';
        glitchChapter(entry.target);
        entry.target.querySelectorAll('.ai-terminal').forEach((term) => {
          typeTerminal(term);
        });
      });
    },
    { threshold: 0.18, rootMargin: '0px 0px -6% 0px' }
  );

  chapters.forEach((ch, i) => {
    chapterObserver.observe(ch);
    ch.style.transitionDelay = reduced ? '0s' : Math.min(i * 0.03, 0.2) + 's';
  });

  const termObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) typeTerminal(entry.target);
      });
    },
    { threshold: 0.35 }
  );
  document.querySelectorAll('.ai-terminal').forEach((t) => termObserver.observe(t));

  document.querySelectorAll('.rant-shout').forEach((el) => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || reduced) return;
          entry.target.classList.add('shout-glitch');
          setTimeout(() => entry.target.classList.remove('shout-glitch'), 500);
        });
      },
      { threshold: 0.6 }
    );
    obs.observe(el);
  });

  runBoot();

  if (reduced) {
    chapters.forEach((ch) => ch.classList.add('visible'));
    document.querySelectorAll('.ai-terminal').forEach((t) => typeTerminal(t));
  }
})();
