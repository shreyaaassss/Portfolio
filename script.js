/* ═══════════════════════════════════════════════════
   PORTFOLIO — script.js  (v2 — dynamic & interactive)
   ═══════════════════════════════════════════════════ */
(function () {
  "use strict";

  /* ── helpers ── */
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  if (isTouch) document.body.classList.add("is-touch");

  /* ── DOM ── */
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  const loader     = $("#siteLoader");
  const counter    = $("#loaderCounter");
  const cursor     = $("#youCur");
  const cursorTag  = $("#youTag");
  const grainCanvas= $("#grainCanvas");
  const clock      = $("#headerClock");
  const burger     = $("#burger");
  const mobMenu    = $("#mobMenu");

  const heroEye    = $("#heroEye");
  const dragName1  = $("#dragName1");
  const dragName2  = $("#dragName2");
  const heroSub    = $("#heroSub");
  const heroGrid   = $("#heroGrid");
  const aselHero   = $("#aselHero");
  const youSel     = $("#youSel");
  const toastHero  = $("#toastHero");
  const toastX     = $("#toastX");
  const toastY     = $("#toastY");
  const acHero     = $("#acHero");
  const figComment = $("#figmaComment");
  const heroArtboard = $("#heroArtboard");

  const introSection = $("#introSection");
  const introAsel    = $("#introAsel");
  const introAc      = $("#introAc");
  const introTexts   = [$("#introText0"), $("#introText1"), $("#introText2")];
  const introPanels  = [$("#introPanel0"), $("#introPanel1"), $("#introPanel2")];
  const fwProgress   = $("#fwProgress");

  /* ═══════ 1. LOADER ═══════ */
  let loadVal = 0;
  const loadTick = setInterval(() => {
    loadVal += Math.random() * 6 + 3;
    if (loadVal >= 100) {
      loadVal = 100;
      clearInterval(loadTick);
      counter.textContent = "100";
      setTimeout(() => { loader.classList.add("done"); runEntrance(); }, 350);
      return;
    }
    counter.textContent = Math.floor(loadVal);
  }, 50);

  /* ═══════ 2. CLOCK ═══════ */
  function tickClock() {
    const n = new Date();
    clock.textContent = `Local — ${n.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false})}`;
  }
  tickClock(); setInterval(tickClock, 1000);

  /* ═══════ 3. CUSTOM CURSOR (spring-based) ═══════ */
  let mx = 0, my = 0, cx = 0, cy = 0;
  if (!isTouch) {
    document.addEventListener("mousemove", e => { mx = e.clientX; my = e.clientY; });
    cursor.classList.add("on");
    (function cLoop() {
      cx = lerp(cx, mx, 0.12);
      cy = lerp(cy, my, 0.12);
      cursor.style.transform = `translate3d(${cx}px,${cy}px,0)`;
      requestAnimationFrame(cLoop);
    })();
    $$("a, button, .fw-card").forEach(el => {
      el.addEventListener("mouseenter", () => { cursorTag.textContent = el.closest(".fw-card") ? "View" : "Click"; });
      el.addEventListener("mouseleave", () => { cursorTag.textContent = ""; });
    });
  }

  /* ═══════ 4. GRAIN (optimized — tiny canvas, scaled up) ═══════ */
  (function () {
    const ctx = grainCanvas.getContext("2d");
    // Render at tiny resolution and let CSS scale it up — massive perf win
    grainCanvas.width = 256;
    grainCanvas.height = 256;
    const img = ctx.createImageData(256, 256);
    const d = img.data;
    let frameCount = 0;
    function draw() {
      frameCount++;
      if (frameCount % 4 === 0) { // only redraw every 4th frame
        for (let i = 0; i < d.length; i += 4) {
          const v = (Math.random() * 255) | 0;
          d[i] = d[i+1] = d[i+2] = v;
          d[i+3] = 20;
        }
        ctx.putImageData(img, 0, 0);
      }
      requestAnimationFrame(draw);
    }
    draw();
  })();

  /* ═══════ 4b. ETHEREAL SHADOW ANIMATION (throttled) ═══════ */
  (function () {
    const hueEl = document.getElementById("etherealHueRotate");
    if (!hueEl) return;
    let hue = 0;
    let frameCount = 0;
    function animateEthereal() {
      frameCount++;
      if (frameCount % 3 === 0) { // update every 3rd frame to reduce SVG recalc
        hue = (hue + 6) % 360;
        hueEl.setAttribute("values", String(hue));
      }
      requestAnimationFrame(animateEthereal);
    }
    animateEthereal();
  })();

  /* ═══════ 5. BURGER ═══════ */
  burger.addEventListener("click", () => {
    burger.classList.toggle("is-open");
    mobMenu.classList.toggle("on");
    burger.querySelector(".hdr__burger-text").textContent = mobMenu.classList.contains("on") ? "Close" : "Menu";
  });
  $$(".mob-link").forEach(l => l.addEventListener("click", () => {
    burger.classList.remove("is-open"); mobMenu.classList.remove("on");
    burger.querySelector(".hdr__burger-text").textContent = "Menu";
  }));

  /* ═══════ 6. HERO DOT GRID ═══════ */
  (function () {
    const ctx = heroGrid.getContext("2d");
    const resize = () => { heroGrid.width = heroGrid.parentElement.offsetWidth; heroGrid.height = heroGrid.parentElement.offsetHeight; draw(); };
    function draw() {
      const w = heroGrid.width, h = heroGrid.height, gap = 40;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(255,255,255,0.035)";
      for (let x = gap; x < w; x += gap)
        for (let y = gap; y < h; y += gap)
          { ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2); ctx.fill(); }
    }
    resize(); window.addEventListener("resize", resize);
  })();

  /* ═══════ 7. DRAG-TO-MOVE (hero text) ═══════ */
  let dragOffsetX = 0, dragOffsetY = 0;       // accumulated offset
  let dragTargetX = 0, dragTargetY = 0;        // spring target
  let dragCurrentX = 0, dragCurrentY = 0;      // rendered position
  let isDragging = false;
  let dragStartMX = 0, dragStartMY = 0;
  let dragStartOX = 0, dragStartOY = 0;
  const heroWrap = $(".hero-ic-wrap");

  function onDragStart(e) {
    e.preventDefault();
    isDragging = true;
    const pt = e.touches ? e.touches[0] : e;
    dragStartMX = pt.clientX;
    dragStartMY = pt.clientY;
    dragStartOX = dragOffsetX;
    dragStartOY = dragOffsetY;
    youSel.classList.add("is-dragging");
    youSel.style.opacity = "1";
    heroWrap.classList.add("is-dragging");
    heroWrap.style.cursor = "grabbing";
    toastHero.classList.add("on");
  }
  function onDragMove(e) {
    if (!isDragging) return;
    const pt = e.touches ? e.touches[0] : e;
    dragTargetX = dragStartOX + (pt.clientX - dragStartMX);
    dragTargetY = dragStartOY + (pt.clientY - dragStartMY);
    toastX.textContent = Math.round(dragTargetX);
    toastY.textContent = Math.round(dragTargetY);
  }
  function onDragEnd() {
    if (!isDragging) return;
    isDragging = false;
    dragOffsetX = dragTargetX;
    dragOffsetY = dragTargetY;
    youSel.classList.remove("is-dragging");
    heroWrap.classList.remove("is-dragging");
    heroWrap.style.cursor = "grab";
    setTimeout(() => { if (!isDragging) toastHero.classList.remove("on"); }, 1200);
  }

  if (heroWrap) {
    heroWrap.addEventListener("mousedown", onDragStart);
    heroWrap.addEventListener("touchstart", onDragStart, { passive: false });
    document.addEventListener("mousemove", onDragMove);
    document.addEventListener("touchmove", onDragMove, { passive: true });
    document.addEventListener("mouseup", onDragEnd);
    document.addEventListener("touchend", onDragEnd);
    heroWrap.style.cursor = "grab";
  }

  // spring animation for drag
  (function dragSpring() {
    dragCurrentX = lerp(dragCurrentX, dragTargetX, 0.1);
    dragCurrentY = lerp(dragCurrentY, dragTargetY, 0.1);
    if (heroWrap) {
      heroWrap.style.transform = `translate(${dragCurrentX}px, ${dragCurrentY}px)`;
    }
    // update selection box + toast position
    if (aselHero && dragName1 && heroArtboard) {
      const r = dragName1.getBoundingClientRect();
      const p = heroArtboard.getBoundingClientRect();
      aselHero.style.left = (r.left - p.left - 12) + "px";
      aselHero.style.top  = (r.top  - p.top  - 12) + "px";
      aselHero.style.width  = (r.width + 24) + "px";
      aselHero.style.height = (r.height + 24) + "px";
    }
    if (youSel && dragName1 && dragName2 && heroArtboard) {
      const r1 = dragName1.getBoundingClientRect();
      const r2 = dragName2.getBoundingClientRect();
      const p  = heroArtboard.getBoundingClientRect();
      const top = Math.min(r1.top, r2.top) - p.top - 30;
      const left = Math.min(r1.left, r2.left) - p.left - 15;
      const right = Math.max(r1.right, r2.right) - p.left + 15;
      const bottom = Math.max(r1.bottom, r2.bottom) - p.top + 30;
      youSel.style.left   = left + "px";
      youSel.style.top    = top + "px";
      youSel.style.width  = (right - left) + "px";
      youSel.style.height = (bottom - top) + "px";
    }
    if (toastHero && youSel) {
      const r = youSel.getBoundingClientRect();
      const p = heroArtboard.getBoundingClientRect();
      toastHero.style.left = (r.left - p.left + r.width / 2 - 60) + "px";
      toastHero.style.top  = (r.bottom - p.top + 12) + "px";
    }
    requestAnimationFrame(dragSpring);
  })();

  /* ═══════ 8. SCROLL-DRIVEN 3D RECESSION + MOUSE TILT (hero) ═══════ */
  let tiltX = 0, tiltY = 0, tiltCX = 0, tiltCY = 0;
  let scrollRecession = 0; // 0 = no recession, 1 = fully receded

  if (!isTouch) {
    document.addEventListener("mousemove", e => {
      tiltX = (e.clientX / window.innerWidth  - 0.5) * 2;
      tiltY = (e.clientY / window.innerHeight - 0.5) * 2;
    });
  }

  const heroSection = $("#heroSection");

  (function heroLoop() {
    // --- Scroll recession ---
    if (heroSection) {
      const rect = heroSection.getBoundingClientRect();
      const travel = heroSection.offsetHeight - window.innerHeight;
      const raw = clamp(-rect.top / travel, 0, 1);
      scrollRecession = lerp(scrollRecession, raw, 0.12);
    }

    // --- Mouse tilt (smooth) ---
    tiltCX = lerp(tiltCX, tiltX, 0.06);
    tiltCY = lerp(tiltCY, tiltY, 0.06);

    if (heroArtboard) {
      const p = scrollRecession;

      // Scale: 1 → 0.85
      const scale = 1 - p * 0.15;
      // RotateX: 0 → 8deg (tilts away)
      const rotX = p * 8;
      // TranslateY: 0 → -40px (lifts up slightly)
      const transY = p * -40;
      // TranslateZ: 0 → -200px (pushes back)
      const transZ = p * -200;
      // Border radius: 0 → 20px
      const radius = p * 20;
      // Mouse tilt (only when not fully receded)
      const mouseFactor = 1 - p;
      const mTiltX = tiltCX * 2.5 * mouseFactor;
      const mTiltY = -tiltCY * 2.5 * mouseFactor;

      heroArtboard.style.transform =
        `perspective(1500px) rotateX(${rotX + mTiltY}deg) rotateY(${mTiltX}deg) scale(${scale}) translateY(${transY}px) translateZ(${transZ}px)`;
      heroArtboard.style.borderRadius = radius + "px";
      heroArtboard.style.boxShadow = p > 0.01
        ? `0 ${20 + p * 40}px ${60 + p * 80}px rgba(0,0,0,${0.3 + p * 0.4}), 0 0 0 1px rgba(255,255,255,${0.03 * p})`
        : "none";
      heroArtboard.style.overflow = "hidden";

      // Fade out hero elements as we scroll
      const heroOpacity = 1 - p * 1.5; // fades out before fully receded
      if (heroEye) heroEye.style.opacity = clamp(heroOpacity, 0, 1);
      if (heroSub) heroSub.style.opacity = clamp(heroOpacity, 0, 1);
      if (aselHero) aselHero.style.opacity = clamp(heroOpacity, 0, 1) > 0.3 ? "1" : "0";
      if (youSel) youSel.style.opacity = clamp(heroOpacity, 0, 1) > 0.3 ? "1" : "0";
      if (acHero && p > 0.5) acHero.style.opacity = clamp(1 - (p - 0.5) * 4, 0, 1);
      if (figComment && p > 0.5) figComment.style.opacity = clamp(1 - (p - 0.5) * 4, 0, 1);
    }

    requestAnimationFrame(heroLoop);
  })();

  /* ═══════ 9. HERO ENTRANCE ═══════ */
  function runEntrance() {
    heroGrid.style.transition = "opacity 1.2s ease";
    heroGrid.style.opacity = "0.6";

    // Slide up name lines with stagger
    setTimeout(() => {
      dragName1.style.transition = "transform 1.1s cubic-bezier(0.16, 1, 0.3, 1)";
      dragName1.style.transform = "translateY(0)";
    }, 150);
    setTimeout(() => {
      dragName2.style.transition = "transform 1.1s cubic-bezier(0.16, 1, 0.3, 1)";
      dragName2.style.transform = "translateY(0)";
    }, 350);

    // Eyebrow
    setTimeout(() => { heroEye.style.transition = "opacity 0.8s"; heroEye.style.opacity = "1"; }, 700);

    // Subtitle with typewriter
    setTimeout(() => { heroSub.style.transition = "opacity 0.8s"; heroSub.style.opacity = "1"; }, 1100);

    // Selection boxes
    setTimeout(() => { aselHero.style.opacity = "1"; }, 1300);
    setTimeout(() => { youSel.style.opacity = "1"; }, 1400);

    // Andy cursor floats in
    setTimeout(() => {
      animateAcHero();
    }, 1800);

    // Comment bubble
    setTimeout(() => { figComment.classList.add("on"); }, 2400);

    // Toast briefly
    setTimeout(() => { toastHero.classList.add("on"); }, 1500);
    setTimeout(() => { toastHero.classList.remove("on"); }, 3500);

    // Init other systems
    initRevealObserver();
    initIntroScroll();
    initFeaturedWork();
  }

  /* ── Animate the "Andy Reff" cursor to float around ── */
  let acPhase = 0;
  function animateAcHero() {
    acHero.classList.add("on");
    (function acLoop() {
      acPhase += 0.008;
      const bx = 65 + Math.sin(acPhase) * 8;
      const by = 70 + Math.cos(acPhase * 0.7) * 6;
      acHero.style.left = bx + "%";
      acHero.style.top  = by + "%";
      figComment.style.left = `calc(${bx}% + 14px)`;
      figComment.style.top  = `calc(${by}% + 30px)`;
      requestAnimationFrame(acLoop);
    })();
  }

  /* ═══════ 10. REVEAL OBSERVER ═══════ */
  function initRevealObserver() {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("vis"); obs.unobserve(e.target); } });
    }, { threshold: 0.15 });
    $$(".reveal").forEach(el => obs.observe(el));
  }

  /* ═══════ 11. INTRO PANELS — typewriter + scroll ═══════ */
  const introStatements = [
    'I don\'t just write code — I architect <em>cloud-native systems</em> that scale across containers, clusters, and continents.',
    'Every deployment is <em>automated</em>. Every service is containerized. Every pipeline is battle-tested.',
    'I bridge the gap between <em>backend engineering</em> and cloud infrastructure — from Docker to production.',
  ];
  let introTyped = [false, false, false];
  let currentIntroIdx = -1;

  function typewriterHTML(el, html, speed) {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    const full = tmp.textContent;
    let ci = 0;
    const cur = '<span class="intro-cursor"></span>';
    function tick() {
      if (ci <= full.length) {
        let built = "", si = 0, oi = 0;
        for (let i = 0; i < html.length && oi <= ci; i++) {
          if (html[i] === "<") { const te = html.indexOf(">", i); built += html.substring(i, te + 1); i = te; continue; }
          if (oi < ci) { built += html[i]; oi++; } else break;
        }
        el.innerHTML = built + cur;
        ci++;
        setTimeout(tick, speed);
      } else {
        el.innerHTML = html + cur;
      }
    }
    tick();
  }

  function initIntroScroll() {
    if (!introSection) return;
    function onScroll() {
      const r = introSection.getBoundingClientRect();
      const h = introSection.offsetHeight;
      const prog = clamp(-r.top / (h - window.innerHeight), 0, 1);

      if (r.top > window.innerHeight || r.bottom < 0) {
        introAsel.style.opacity = "0"; introAc.style.opacity = "0"; return;
      }

      let idx = Math.min(Math.floor(prog * 3), 2);
      introPanels.forEach((p, i) => { p.style.opacity = i === idx ? "1" : "0"; p.style.transition = "opacity 0.5s"; });

      if (!introTyped[idx] && currentIntroIdx !== idx) {
        currentIntroIdx = idx;
        introTyped[idx] = true;
        typewriterHTML(introTexts[idx], introStatements[idx], 20);
      }

      const tEl = introTexts[idx];
      if (tEl && tEl.textContent.length > 2) {
        const tr = tEl.getBoundingClientRect();
        introAsel.style.left = (tr.left - 12) + "px";
        introAsel.style.top  = (tr.top  - 12) + "px";
        introAsel.style.width  = (tr.width + 24) + "px";
        introAsel.style.height = (tr.height + 24) + "px";
        introAsel.style.opacity = "1";
        introAc.style.left = (tr.right + 24) + "px";
        introAc.style.top  = (tr.top + tr.height / 2) + "px";
        introAc.style.opacity = "1";
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ═══════ 12. FEATURED WORK — stacking cards + parallax ═══════ */
  function initFeaturedWork() {
    const wrappers = $$(".fw-card-wrapper");
    const deck = $("#fwDeck");
    if (!deck || !wrappers.length) return;
    const total = wrappers.length;

    // Scroll-driven parallax on cinema images
    let scrollY = window.scrollY;
    window.addEventListener("scroll", () => { scrollY = window.scrollY; }, { passive: true });

    // Mouse-driven parallax on cinema images
    let imgMX = 0, imgMY = 0, imgCX = 0, imgCY = 0;
    if (!isTouch) {
      document.addEventListener("mousemove", e => {
        imgMX = (e.clientX / window.innerWidth  - 0.5);
        imgMY = (e.clientY / window.innerHeight - 0.5);
      });
    }

    (function fwLoop() {
      const deckRect = deck.getBoundingClientRect();
      const deckTop = -deckRect.top;
      const cardH = window.innerHeight;

      wrappers.forEach((w, i) => {
        const card = w.querySelector(".fw-card");
        const offset = deckTop - i * cardH;
        const prog = clamp(offset / cardH, 0, 1);

        if (prog > 0 && prog < 1) {
          const s = 1 - prog * 0.06;
          card.style.transform = `scale(${s}) translateY(${-prog * 30}px)`;
          card.style.opacity = 1 - prog * 0.4;
        } else if (prog >= 1) {
          card.style.transform = "scale(0.94) translateY(-30px)";
          card.style.opacity = "0.5";
        } else {
          card.style.transform = "scale(1) translateY(0)";
          card.style.opacity = "1";
        }
      });

      // Cinema image parallax (mouse-driven, smooth)
      imgCX = lerp(imgCX, imgMX, 0.05);
      imgCY = lerp(imgCY, imgMY, 0.05);
      $$(".fw-cinema-img").forEach(img => {
        img.style.transform = `translate(${imgCX * -10}px, ${imgCY * -8}px)`;
      });

      // Progress pips
      const total_prog = clamp(deckTop / (deck.offsetHeight - window.innerHeight), 0, 1);
      const activeIdx = Math.min(Math.floor(total_prog * total), total - 1);
      $$(".fw-pip").forEach((p, i) => {
        p.classList.toggle("fw-pip--active", i === activeIdx);
      });

      // Show/hide progress
      if (deckRect.top < window.innerHeight && deckRect.bottom > 0) {
        fwProgress.classList.add("fw-progress--visible");
      } else {
        fwProgress.classList.remove("fw-progress--visible");
      }

      requestAnimationFrame(fwLoop);
    })();
  }

  /* ═══════ 13. SMOOTH SCROLL ═══════ */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener("click", e => {
      e.preventDefault();
      const t = document.querySelector(a.getAttribute("href"));
      if (t) t.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

})();
