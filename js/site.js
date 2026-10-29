/* Dr Abby Clinic — behaviour reproduced from the reference design (values taken from its code):
   Lenis smooth scroll (duration 1.5), appear effects (tween .6s cubic-bezier(.44,0,.56,1) / spring .3s bounce .2),
   scroll parallax (hero speed 50, band speed 95, image parallax 50%), letter-by-letter hero word, slideshows,
   ellipse review slider, rotating "follow us" gallery, draggable ticker, hover-preview list, phone menu. */
(function () {
  'use strict';
  var doc = document.documentElement;
  var SITE = window.SITE || {};
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EASE = 'cubic-bezier(.44,0,.56,1)';
  var SPRING = 'linear(0, 0.0574, 0.1873, 0.3435, 0.4978, 0.635, 0.7484, 0.8369, 0.9025, 0.9487, 0.9795, 0.9985, 1.0091, 1.0139, 1.0152, 1.0142, 1.0123, 1.0099, 1.0076, 1.0055, 1.0038, 1.0024, 1.0015, 1.0008, 1)';
  var NAVSPRING = 'linear(0, 0.0308, 0.0933, 0.1641, 0.2342, 0.3003, 0.3614, 0.4175, 0.4688, 0.5157, 0.5584, 0.5974, 0.6329, 0.6653, 0.6948, 0.7218, 0.7463, 0.7687, 0.7891, 0.8077, 0.8247, 0.8402, 0.8543, 0.8671, 0.8788, 0.8895, 0.8993, 0.9082, 0.9163, 0.9237, 0.9304, 0.9365, 0.9421, 0.9472, 0.9519, 0.9561, 0.96, 0.9635, 0.9668, 0.9697, 0.9724, 0.9748, 0.977, 0.9791, 0.9809, 0.9826, 0.9841, 0.9855, 0.9868, 0.988, 0.989, 0.99, 0.9909, 0.9917, 0.9924, 0.9931, 0.9937, 0.9943, 0.9948, 0.9952, 0.9956, 0.996, 0.9964, 0.9967, 1)';
  var supportsLinear = CSS.supports && CSS.supports('transition-timing-function', 'linear(0, 1)');
  if (!supportsLinear) { SPRING = 'cubic-bezier(.3,1.25,.55,1)'; NAVSPRING = 'cubic-bezier(.2,.9,.3,1)'; }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ------------------------------------------------ WhatsApp links (number + the clinic's pre-filled text) */
  function waHref(extra) {
    var msg = (SITE.waMessage || "Hi, Dr Abby! I'm interested with your services - {url}").replace('{url}', location.href.split('#')[0]);
    if (extra) msg += '\n\n' + extra;
    return 'https://wa.me/' + (SITE.wa || '60146696772') + '?text=' + encodeURIComponent(msg);
  }
  $$('a[data-wa]').forEach(function (a) {
    a.href = waHref(); a.target = '_blank'; a.rel = 'noopener';
    a.addEventListener('click', function () { track('wa'); });
  });
  $$('a[href*="booking/"]').forEach(function (a) { a.addEventListener('click', function () { track('book'); }); });

  /* ------------------------------------------------ tracking: only when switched on in the build */
  function track(kind) {
    if (!SITE.tracking || typeof window.gtag !== 'function') return;
    if (kind === 'wa' && SITE.adsWa) window.gtag('event', 'conversion', { send_to: SITE.adsWa });
    window.gtag('event', kind === 'wa' ? 'click to chat' : 'book a consultation');
  }

  /* ------------------------------------------------ smooth scroll (Framer "Smooth Scroll", intensity 15 -> Lenis duration 1.5) */
  var lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new window.Lenis({ duration: 1.5 });
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href'); if (id.length < 2) return;
        var el = document.getElementById(id.slice(1)); if (!el) return;
        e.preventDefault(); lenis.scrollTo(el, { offset: -30 });
      });
    });
  }

  /* ------------------------------------------------ nav entrance (spring y:-120 -> 0, damping 60 / stiffness 300) */
  var nav = document.querySelector('.nav');
  if (nav && !reduce) {
    nav.style.transform = 'translateY(-120px)'; nav.style.opacity = '0';
    requestAnimationFrame(function () {
      nav.style.transition = 'transform 1.07s ' + NAVSPRING + ', opacity .4s ' + EASE;
      nav.style.transform = ''; nav.style.opacity = '';
    });
  }

  /* ------------------------------------------------ phone/tablet menu */
  var burger = document.querySelector('.nav__burger');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = !nav.classList.contains('open');
      nav.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      doc.classList.toggle('nav-open', open);
      if (lenis) { open ? lenis.stop() : lenis.start(); }
    });
    $$('.drawer__tog').forEach(function (b) {
      b.addEventListener('click', function () {
        var sub = document.getElementById(b.getAttribute('aria-controls'));
        var open = b.getAttribute('aria-expanded') !== 'true';
        b.setAttribute('aria-expanded', open ? 'true' : 'false');
        sub.classList.toggle('open', open);
      });
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('open')) burger.click(); });
  }

  /* ------------------------------------------------ appear effects */
  function revealInit() {
    var els = $$('[data-rv]');
    if (reduce || !('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var e = en.target; io.unobserve(e);
        var d = parseFloat(e.getAttribute('data-d') || '0');
        var spring = e.getAttribute('data-sp') !== null;
        var dur = spring ? .3 : parseFloat(e.getAttribute('data-t') || '.6');
        var fn = spring ? SPRING : EASE;
        e.style.transition = 'opacity ' + dur + 's ' + fn + ' ' + d + 's, transform ' + dur + 's ' + fn + ' ' + d + 's';
        e.classList.add('in');
      });
    }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }
  doc.classList.add('js');
  revealInit();

  /* ------------------------------------------------ home hero: image scale 1.15 -> 1 (1.5s), sub-text, letter-by-letter word */
  var hhero = document.querySelector('.hhero');
  if (hhero && !reduce) {
    var bg = hhero.querySelector('.hhero__bg');
    bg.style.transform = 'scale(1.15)';
    var sub = hhero.querySelector('.hhero__sub');
    sub.style.opacity = '0'; sub.style.transform = 'translateY(50px)';
    var chars = $$('.hhero__word span', hhero);
    chars.forEach(function (c) { c.style.opacity = '0'; c.style.transform = 'translateY(120px)'; });
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      bg.style.transition = 'transform 1.5s cubic-bezier(.25,1,.5,1)'; bg.style.transform = 'scale(1)';
      sub.style.transition = 'opacity .4s ' + EASE + ' .6s, transform .4s ' + EASE + ' .6s'; sub.style.opacity = ''; sub.style.transform = '';
      chars.forEach(function (c, i) {
        c.style.transition = 'opacity .6s ' + EASE + ' ' + (.075 * (i + 1)).toFixed(3) + 's, transform .6s ' + EASE + ' ' + (.075 * (i + 1)).toFixed(3) + 's';
        c.style.opacity = ''; c.style.transform = '';
      });
    }); });
  }

  /* ------------------------------------------------ fit the big words to their box (re-measured after web fonts load) */
  function fitWords() {
    $$('[data-fit]').forEach(function (el) {
      el.style.fontSize = '';
      if (innerWidth < 810) return; /* the design keeps the word at its preset size on phones */
      var fs = parseFloat(getComputedStyle(el).fontSize);
      var w = el.clientWidth, sum = 0;
      $$('span', el).forEach(function (s) { sum += s.getBoundingClientRect().width; });
      if (sum > 0) el.style.fontSize = (fs * w / sum * 0.995).toFixed(2) + 'px';
    });
  }
  fitWords();

  /* long words in the big headings: add hyphen break points only where a word is wider than its heading
     (Safari never hyphenates capitalised words, and hyphenating everywhere breaks words that would fit on the next line) */
  var V = /[aeiouy]/i, ONSET = /^(bl|br|cl|cr|dr|fl|fr|gl|gr|pl|pr|sc|sk|sl|sm|sn|sp|st|sw|tr|th|ch|sh|ph|wh|qu|wr)$/i;
  function hyWord(w) {
    var cuts = [], i;
    for (i = 1; i < w.length - 1; i++) {
      var a = V.test(w[i - 1]), b = V.test(w[i]), c = V.test(w[i + 1]), d = i + 2 < w.length && V.test(w[i + 2]);
      if (a && !b && c) cuts.push(i);
      if (a && !b && !c && d) cuts.push(ONSET.test(w.substr(i, 2)) ? i : i + 1);
    }
    cuts = cuts.filter(function (k, n) { return k >= 3 && w.length - k >= 3 && cuts.indexOf(k) === n; }).sort(function (x, y) { return x - y; });
    var out = '', last = 0;
    cuts.forEach(function (k) { out += w.slice(last, k) + '\u00ad'; last = k; });
    return out + w.slice(last);
  }
  var cv = document.createElement('canvas').getContext('2d');
  var hyEls = $$('.t-page, .t-h2, .t-card, .t-giant');
  function hyphenFit() {
    hyEls.forEach(function (el) {
      if (el.__orig === undefined) el.__orig = el.innerHTML; else el.innerHTML = el.__orig;
      var cs = getComputedStyle(el), w = el.clientWidth;
      if (!w) return;
      cv.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
      var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), n, nodes = [];
      while ((n = walker.nextNode())) nodes.push(n);
      nodes.forEach(function (tn) {
        tn.nodeValue = tn.nodeValue.replace(/[A-Za-z\u00C0-\u024F]{7,}/g, function (word) {
          var shown = cs.textTransform === 'uppercase' ? word.toUpperCase() : word;
          return cv.measureText(shown).width > w ? hyWord(word) : word;
        });
      });
    });
  }
  function relayoutType() { hyphenFit(); fitWords(); }
  relayoutType();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayoutType);
  var rT; window.addEventListener('resize', function () { clearTimeout(rT); rT = setTimeout(relayoutType, 120); });

  /* ------------------------------------------------ scroll-linked effects: one read pass, then one write pass */
  var pxs = $$('.px:not(.px--plain):not(.px--contain) > .px__i');
  var speedEls = $$('[data-speed]');
  var vh = innerHeight;
  function onScroll() {
    var sy = window.scrollY || window.pageYOffset;
    var reads = pxs.map(function (i) { var b = i.parentNode.getBoundingClientRect(); return [b.top, b.height]; });
    pxs.forEach(function (i, k) {
      var top = reads[k][0], h = reads[k][1];
      if (top > vh + 200 || top + h < -200) return;
      var p = clamp((vh - top) / (vh + h), 0, 1);
      i.style.transform = 'translate3d(0,' + ((p - .5) * .5 * h).toFixed(2) + 'px,0)';
    });
    speedEls.forEach(function (e, k) {
      var s = parseFloat(e.getAttribute('data-speed'));
      var base = 0;
      if (e.hasAttribute('data-rel') && innerWidth < 1200) { e.style.transform = ''; return; } /* the design turns this off on tablet/phone */
      if (e.hasAttribute('data-rel')) { /* same 5% drift, measured from when the band enters the screen */
        var sec = e.closest('section'); base = Math.max(0, sec.offsetTop - vh);
      }
      e.style.transform = 'translate3d(0,' + (Math.max(0, sy - base) * (1 - s / 100)).toFixed(2) + 'px,0)';
    });
  }
  var ticking = false;
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; onScroll(); }); } }
  if (!reduce) {
    window.addEventListener('scroll', req, { passive: true });
    window.addEventListener('resize', function () { vh = innerHeight; req(); });
    if (lenis) lenis.on('scroll', req);
    onScroll();
  }

  /* ------------------------------------------------ slideshows (arrows + swipe; step = one card + 13px gap) */
  $$('.sshow').forEach(function (s) {
    var track = s.querySelector('.sshow__track'); var vp = s.querySelector('.sshow__vp');
    var prev = s.querySelector('[data-prev]'); var next = s.querySelector('[data-next]');
    var i = 0;
    function step() { var c = track.children[0]; return c ? c.getBoundingClientRect().width + 13 : 300; }
    function maxI() { var total = track.scrollWidth, w = vp.clientWidth; return Math.max(0, Math.ceil((total - w) / step())); }
    function go(n) {
      var m = maxI(); i = clamp(n, 0, m);
      var x = Math.min(i * step(), Math.max(0, track.scrollWidth - vp.clientWidth));
      track.style.transform = 'translate3d(' + (-x) + 'px,0,0)';
      if (prev) prev.disabled = i <= 0; if (next) next.disabled = i >= m;
    }
    if (prev) prev.addEventListener('click', function () { go(i - 1); });
    if (next) next.addEventListener('click', function () { go(i + 1); });
    var sx = null, sy0 = null;
    vp.addEventListener('pointerdown', function (e) { sx = e.clientX; sy0 = e.clientY; });
    vp.addEventListener('pointerup', function (e) {
      if (sx === null) return; var dx = e.clientX - sx, dy = e.clientY - sy0; sx = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(i + (dx < 0 ? 1 : -1));
    });
    window.addEventListener('resize', function () { go(i); });
    go(0);
  });

  /* ------------------------------------------------ ticker (draggable marquee, slows on hover) */
  $$('.ticker').forEach(function (t) {
    var tr = t.querySelector('.ticker__track'); if (!tr) return;
    tr.innerHTML += tr.innerHTML; // seamless loop
    $$('a,img', tr).forEach(function (n, k) { if (k >= tr.children.length / 2) n.setAttribute('tabindex', '-1'); });
    var x = 0, speed = parseFloat(t.getAttribute('data-tick') || '40'), hover = false, drag = null, last = performance.now();
    t.addEventListener('mouseenter', function () { hover = true; });
    t.addEventListener('mouseleave', function () { hover = false; });
    t.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, start: x }; t.classList.add('drag'); t.setPointerCapture(e.pointerId); });
    t.addEventListener('pointermove', function (e) { if (drag) x = drag.start + (e.clientX - drag.x); });
    function end() { drag = null; t.classList.remove('drag'); }
    t.addEventListener('pointerup', end); t.addEventListener('pointercancel', end);
    function loop(now) {
      var dt = Math.min(64, now - last); last = now;
      var half = tr.scrollWidth / 2;
      if (!drag && !reduce) x -= speed * (hover ? .3 : 1) * dt / 1000;
      if (half > 0) { while (x <= -half) x += half; while (x > 0) x -= half; }
      tr.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  });

  /* ------------------------------------------------ hover list with preview images */
  $$('.tlist').forEach(function (l) {
    var links = $$('[data-pv]', l), pvs = $$('.tlist__pv .px', l), mpv = $$('.tlist__mpv .px', l);
    function on(k) {
      links.forEach(function (a, j) { a.classList.toggle('on', j === k); });
      pvs.forEach(function (p, j) { p.classList.toggle('on', j === k); });
      mpv.forEach(function (p, j) { p.style.opacity = j === k ? 1 : 0; });
    }
    links.forEach(function (a, k) { a.addEventListener('mouseenter', function () { on(k); }); a.addEventListener('focus', function () { on(k); }); });
    on(0);
  });

  /* ------------------------------------------------ ellipse review slider (5 visible slots on an arc) */
  $$('.rv').forEach(function (rv) {
    var cards = $$('.rv__card', rv), quotes = $$('.rv__q>div', rv);
    var prev = rv.querySelector('[data-prev]'), next = rv.querySelector('[data-next]');
    var n = cards.length, i = 0;
    var SL = { '-2': [-1440, 10, .53, -5], '-1': [-713, 146, .732, -6], '0': [0, 196, 1, 0], '1': [713, 146, .732, 6], '2': [1440, 41, .53, 5] };
    var SLP = { '-2': [-520, 40, .52, -5], '-1': [-195, 88, .8, -6], '0': [0, 117, 1, 0], '1': [195, 88, .8, 6], '2': [520, 40, .52, 5] };
    function place() {
      var phone = innerWidth < 810, tab = innerWidth < 1200, S = phone ? SLP : SL;
      var scaleX = phone ? 1 : (tab ? innerWidth / 1440 : 1);
      cards.forEach(function (c, k) {
        var off = k - i; var key = String(clamp(off, -2, 2)); var s = S[key];
        var far = Math.abs(off) > 2;
        var x = s[0] * scaleX + (far ? Math.sign(off) * 400 : 0);
        c.style.transform = 'translate(' + x + 'px,' + s[1] + 'px) scale(' + s[2] + ') rotate(' + s[3] + 'deg)';
        c.style.opacity = far ? 0 : 1;
        c.style.zIndex = 10 - Math.abs(off);
      });
      quotes.forEach(function (q, k) { q.classList.toggle('on', k === i); q.setAttribute('aria-hidden', k === i ? 'false' : 'true'); });
      if (prev) prev.disabled = i === 0; if (next) next.disabled = i === n - 1;
    }
    if (prev) prev.addEventListener('click', function () { if (i > 0) { i--; place(); } });
    if (next) next.addEventListener('click', function () { if (i < n - 1) { i++; place(); } });
    window.addEventListener('resize', place);
    place();
  });

  /* ------------------------------------------------ "follow us" rotating gallery (advances one slot every 2.4s) */
  $$('.fg').forEach(function (g) {
    var items = $$('.fg__i', g); var n = items.length; if (!n) return;
    var c = 0;
    function layout(animate) {
      var phone = innerWidth < 810, tab = innerWidth < 1200;
      var SM = phone ? [190, 227] : (tab ? [160, 192] : [187, 224]);
      var BG = phone ? [250, 299] : (tab ? [330, 395] : [390, 467]);
      var step = SM[0] + 14, gapBig = (BG[0] - SM[0]) / 2;
      var H = g.clientHeight;
      items.forEach(function (it, k) {
        var off = ((k - c) % n + n) % n; if (off > n / 2) off -= n;
        var big = off === 0;
        var w = big ? BG[0] : SM[0], h = big ? BG[1] : SM[1];
        var x = off * step + (off > 0 ? gapBig : off < 0 ? -gapBig : 0);
        var top = big ? (H - BG[1]) / 2 : ((H - BG[1]) / 2 + (Math.abs(off) % 2 ? 85 : 155) * (BG[1] / 467));
        if (phone && !big) top = (H - SM[1]) / 2;
        it.style.transition = animate && Math.abs(off) < n / 2 - 1 ? '' : 'none';
        it.style.width = w + 'px'; it.style.height = h + 'px'; it.style.marginLeft = (-w / 2) + 'px';
        it.style.top = top + 'px'; it.style.transform = 'translateX(' + x + 'px)';
      });
    }
    layout(false);
    if (!reduce) setInterval(function () { if (document.hidden) return; c = (c + 1) % n; layout(true); }, 2400);
    window.addEventListener('resize', function () { layout(false); });
  });

  /* ------------------------------------------------ FAQ accordion */
  $$('.faq__q').forEach(function (b) {
    b.addEventListener('click', function () {
      var item = b.closest('.faq__item'), open = !item.classList.contains('open');
      item.classList.toggle('open', open);
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (lenis && lenis.resize) setTimeout(function () { lenis.resize(); }, 450);
    });
  });

  /* ------------------------------------------------ filters (blog categories, device/injectable concerns) */
  $$('.filters').forEach(function (f) {
    var grid = document.getElementById(f.getAttribute('data-for'));
    var btns = $$('button', f);
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var v = b.getAttribute('data-v');
        btns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        $$('[data-tags]', grid).forEach(function (card) {
          card.hidden = !(v === '*' || (' ' + card.getAttribute('data-tags') + ' ').indexOf(' ' + v + ' ') >= 0);
        });
        if (lenis) lenis.resize && lenis.resize();
      });
    });
    var q = new URLSearchParams(location.search).get('c');
    if (q) { var b = btns.filter(function (x) { return x.getAttribute('data-v') === q; })[0]; if (b) b.click(); }
  });

  /* ------------------------------------------------ forms: no server on the static site -> open WhatsApp with the details */
  $$('form[data-wa-form]').forEach(function (f) {
    var tf = f.querySelector('[name="treatment"]');
    if (tf) {
      var q = new URLSearchParams(location.search).get('treatment');
      if (q) tf.value = q;
      else if (document.referrer && document.referrer.indexOf(location.origin) === 0) {
        var from = document.referrer.replace(location.origin, '').split(/[?#]/)[0];
        var map = SITE.pageNames || {}, best = '';
        Object.keys(map).forEach(function (k) { if (k.length > best.length && from.slice(-k.length) === k) best = k; });
        if (best && best !== '/') tf.value = map[best];
      }
    }
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!f.reportValidity()) return;
      var lines = [];
      $$('[data-label]', f).forEach(function (el) {
        var v = el.type === 'radio' ? (el.checked ? el.value : null) : el.value;
        if (el.tagName === 'SELECT' && !el.required && !v) v = null;
        if (el.type === 'checkbox') return;
        if (v) lines.push(el.getAttribute('data-label') + ': ' + v);
      });
      track('book');
      window.open(waHref(lines.join('\n')), '_blank', 'noopener');
      var thanks = f.getAttribute('data-thanks'); if (thanks) location.href = thanks;
    });
  });
})();
