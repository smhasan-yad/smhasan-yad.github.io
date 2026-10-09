/* Motion layer for the site (index.html). Runs after the page's own script.
   Everything here is decoration: with reduced motion (or no IntersectionObserver)
   the page renders fully and statically. */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var motion = !reduce && 'IntersectionObserver' in window;
  if (motion) root.classList.add('motion');
  var bootDelay = root.classList.contains('boot-on') ? 1150 : 120;

  /* ---------- nav height, for sticky section bars and the side pane ---------- */
  var nav = document.querySelector('.nav');
  function navH() {
    root.style.setProperty('--nav-h', nav.offsetHeight + 'px');
    // body content width (no scrollbar, no side-pane padding): section bars stretch to exactly this
    var b = document.body, cs = getComputedStyle(b);
    root.style.setProperty('--cw', Math.floor(b.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)) + 'px');
  }
  navH();
  addEventListener('resize', navH);
  // also on any layout size change (rotation, URL bar, zoom), so a stale width can never stick
  if ('ResizeObserver' in window) new ResizeObserver(navH).observe(document.documentElement);

  /* ---------- Scout (scout.js) follows the section in view ---------- */
  function setMood(i) { if (window.Scout) window.Scout.section(i); }

  /* ---------- text effects ---------- */
  // headings: each word rises out of a mask; the accent word is one unit
  function splitWords(el) {
    var i = 0;
    function wrap(node) {
      var o = document.createElement('span'), w = document.createElement('span');
      o.className = 'w'; w.style.setProperty('--wi', i++);
      w.appendChild(node); o.appendChild(w); return o;
    }
    (function walk(n) {
      [].slice.call(n.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (p) {
            if (!p) return;
            frag.appendChild(/^\s+$/.test(p) ? document.createTextNode(p) : wrap(document.createTextNode(p)));
          });
          c.parentNode.replaceChild(frag, c);
        } else if (c.nodeType === 1) {
          if (c.matches('em.ac')) { var ph = document.createComment(''); c.parentNode.replaceChild(ph, c); ph.parentNode.replaceChild(wrap(c), ph); }
          else walk(c);
        }
      });
    })(el);
    el.classList.add('rvw');
  }
  // mono labels: characters resolve left to right out of noise
  var NOISE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%+';
  function scramble(el) {
    if (!motion) return;
    var tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), nodes = [];
    while (tw.nextNode()) if (tw.currentNode.textContent.trim()) nodes.push(tw.currentNode);
    nodes.forEach(function (n) {
      var final = n.textContent, t0 = performance.now(), dur = 380 + final.length * 14;
      (function step(t) {
        var p = Math.min(1, (t - t0) / dur), k = Math.floor(p * final.length), out = final.slice(0, k);
        for (var i = k; i < final.length; i++) out += /[\s·\/–,&]/.test(final[i]) ? final[i] : NOISE[(Math.random() * NOISE.length) | 0];
        n.textContent = p < 1 ? out : final;
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    });
  }

  /* ---------- reveals ---------- */
  document.querySelectorAll('.shead h2, .contact h2, .t-intro h1').forEach(splitWords);
  if (motion) {
    var groups = ['.about > *', '.pillars > *', '.toolkit > *', '.work > *', '.xp > li', '.refs > li', '.side-stack > *', '.creds > *',
      '.shead p.side', '.contact > div, .contact > .actions', 'footer.fine'];
    groups.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el, i) {
        if (el.classList.contains('pillars')) return; // its children reveal on their own
        el.classList.add('rv'); el.style.setProperty('--d', ((i % 4) * 80) + 'ms');
      });
    });
    document.querySelectorAll('section.block > .kicker').forEach(function (k) { k.classList.add('rv', 'rvk'); });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        en.target.classList.add('in');
        if (en.target.classList.contains('rvk')) scramble(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    document.querySelectorAll('.rv, .rvw:not(h1)').forEach(function (el) { io.observe(el); });
    // hero: name rises, labels resolve, then a scan line passes over the intro
    setTimeout(function () {
      var h1 = document.querySelector('.t-intro h1'); if (h1) h1.classList.add('in');
      document.querySelectorAll('.bento .tag').forEach(scramble);
      var intro = document.querySelector('.t-intro');
      if (intro) { var sw = document.createElement('span'); sw.className = 'sweep'; sw.setAttribute('aria-hidden', 'true'); intro.appendChild(sw); }
    }, bootDelay);
  } else {
    document.querySelectorAll('.rvw').forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- side pane: ruler, odometer, travelling section titles (wide screens) ---------- */
  var SECTIONS = [['main', 'Overview'], ['about', 'About'], ['work', 'Work'], ['experience', 'Experience'],
    ['publications', 'Publications'], ['credentials', 'Credentials'], ['contact', 'Contact']]
    .map(function (p) { return { el: document.getElementById(p[0]), label: p[1] }; })
    .filter(function (s) { return s.el; });

  var pane = document.createElement('div');
  pane.className = 'pane'; pane.setAttribute('aria-hidden', 'true');
  var ticks = '';
  for (var t = 0; t <= 100; t += 10) ticks += '<span class="rl" style="top:' + t + '%">' + t + '</span>';
  var col = '<span class="dg"><span>0<br>1<br>2<br>3<br>4<br>5<br>6<br>7<br>8<br>9</span></span>';
  pane.innerHTML =
    '<div class="ruler">' + ticks + '<i class="gh"><b></b></i><i class="mk"></i><span class="odo">' + col + col + col + '<em>%</em></span></div>' +
    '<div class="glass glass-t"></div><div class="glass glass-b"></div>' +
    '<div class="titles">' + SECTIONS.map(function (s) { return '<span class="ttl">' + s.label + '</span>'; }).join('') + '</div>';
  document.body.appendChild(pane);
  var ruler = pane.querySelector('.ruler'), mk = pane.querySelector('.mk'), odo = pane.querySelector('.odo'),
      gh = pane.querySelector('.gh'), digits = [].slice.call(pane.querySelectorAll('.dg > span')),
      ttls = [].slice.call(pane.querySelectorAll('.ttl'));
  var lastPct = -1, cur = -1;

  function maxScroll() { return Math.max(1, document.documentElement.scrollHeight - innerHeight); }
  function paneOn() { return getComputedStyle(pane).display !== 'none'; }

  var RX = 76, BASE = 30; // title anchor from the right edge; base font size
  var NEXT = 2; // upcoming titles shown in the bottom stack
  function slot(i, c) {
    var top = nav.offsetHeight + 64; // clear of the sticky section bar
    if (i === c) return { x: -RX, y: top, s: 1, r: 0, o: c === 0 ? 0 : 1 };
    if (i < c) return { x: -RX, y: top - 28, s: 1, r: 0, o: 0 };
    // upcoming: the next NEXT titles stack bottom-right, nearest on top; the rest wait below, hidden.
    // In the hero the stack stays hidden so it never sits on the bento.
    var k = i - c - 1, shown = c > 0 && k < NEXT;
    return { x: -RX, y: innerHeight - 40 - (Math.min(k, NEXT) < NEXT ? (NEXT - 1 - k) : -1) * 17, s: 13 / BASE, r: 0, o: shown ? 0.6 : 0 };
  }
  function tf(p) { return 'translate(' + p.x + 'px,' + p.y + 'px) rotate(' + p.r + 'deg) scale(' + p.s + ')'; }

  function layoutTitles(c, prev) {
    ttls.forEach(function (el, i) {
      var to = slot(i, c);
      var promoted = motion && prev >= 0 && i === c && c === prev + 1 && c > 0;
      if (promoted && el.animate) {
        // travel up the ruler edge, turning vertical on the way, then settle on top
        var from = slot(i, prev);
        var mid = { x: -24, y: innerHeight * 0.52, s: 0.62, r: -90, o: 1 };
        el.style.transition = 'none';
        el.animate([
          { transform: tf(from), opacity: from.o },
          { transform: tf(mid), opacity: 1, offset: 0.45 },
          { transform: tf(to), opacity: 1 }
        ], { duration: 950, easing: 'cubic-bezier(.65,0,.35,1)' });
        el.style.transform = tf(to); el.style.opacity = to.o;
        requestAnimationFrame(function () { el.style.transition = ''; });
      } else {
        el.style.transform = tf(to); el.style.opacity = to.o;
      }
      el.classList.toggle('on', i === c);
    });
    pane.classList.toggle('has-title', c > 0);
    pane.classList.toggle('has-next', c > 0 && c < ttls.length - 1);
  }

  function setOdo(pct) {
    var s = ('00' + pct).slice(-3);
    digits.forEach(function (d, i) { d.style.transform = 'translateY(' + (-Number(s[i])) + 'em)'; });
    digits[0].parentNode.style.opacity = pct === 100 ? 1 : 0; // hundreds column only at 100
  }

  function frame() {
    ticking = false;
    var f = Math.min(1, Math.max(0, scrollY / maxScroll()));
    root.style.setProperty('--sp', f.toFixed(4));
    var c = 0;
    SECTIONS.forEach(function (s, i) { if (i && s.el.getBoundingClientRect().top < innerHeight * 0.4) c = i; });
    if (c !== cur) { setMood(c); var prev = cur; cur = c; if (paneOn()) layoutTitles(c, prev); }
    if (!paneOn()) return;
    var H = ruler.clientHeight, y = f * (H - 3);
    mk.style.transform = 'translateY(' + y + 'px)';
    odo.style.transform = 'translateY(' + Math.min(H - 18, y + 8) + 'px)'; // below the marker: Scout rides on top of it
    var pct = Math.round(f * 100);
    if (pct !== lastPct) { lastPct = pct; setOdo(pct); }
  }
  var ticking = false;
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', function () { cur = -1; onScroll(); });
  frame();

  // the ruler is a scrubber: hover shows where a click lands, click or drag to jump
  function fracAt(e) { var r = ruler.getBoundingClientRect(); return Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)); }
  function jump(e, smooth) { window.scrollTo({ top: fracAt(e) * maxScroll(), behavior: smooth && !reduce ? 'smooth' : 'instant' }); }
  var dragging = false;
  ruler.addEventListener('pointermove', function (e) {
    var f = fracAt(e);
    gh.style.transform = 'translateY(' + (f * ruler.clientHeight) + 'px)';
    gh.firstChild.textContent = Math.round(f * 100) + '%';
    if (dragging) jump(e, false);
  });
  ruler.addEventListener('pointerdown', function (e) { dragging = true; ruler.setPointerCapture(e.pointerId); jump(e, true); });
  ruler.addEventListener('pointerup', function () { dragging = false; });
  ruler.addEventListener('pointercancel', function () { dragging = false; });
})();
