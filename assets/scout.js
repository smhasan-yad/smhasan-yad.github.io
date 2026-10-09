/* Scout: the site's pixel mascot. A little monitor head (a reading-room screen) whose
   8 x 6 display is its face. Like the Clawd mod it is a pixel map turned into SVG paths,
   with props for what it is doing: a laptop, an X-ray lightbox, a magnifier, a clipboard,
   a coffee mug, a thought bubble, a heart, a nap.

   It lives in three places and jumps between them in an arc:
     home   the top-right of the hero intro
     rail   riding the yellow marker of the scroll ruler (wide screens), leaning with scroll speed
     dock   bottom-left corner, peeking (narrow screens, which have no ruler)
     talk   sitting beside "Let's talk."
   craft.js calls window.Scout.section(i) when the section in view changes.
   Scout is decoration (aria-hidden): it reacts to the page with faces and props, never text. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var root = document.documentElement;

  /* ---------- sprite ---------- */
  // O outline, B shell, M side knobs, S screen, Y antenna bulb and power light
  var HX = 12, HY = 2, VW = 28, VH = 16; // the head sits at the right of the viewBox; props go on its left
  var HEAD = [
    '                ',
    '       OO       ',
    '   OOOOOOOOOO   ',
    '  OBBBBBBBBBBO  ',
    ' OBBSSSSSSSSBBO ',
    ' OBBSSSSSSSSBBO ',
    'MOBBSSSSSSSSBBOM',
    'MOBBSSSSSSSSBBOM',
    ' OBBSSSSSSSSBBO ',
    ' OBBSSSSSSSSBBO ',
    ' OBBBBBBBBBBBBO ',
    ' OBBBBBBBBYYBBO ',
    '  OBBBBBBBBBBO  ',
    '   OOOOOOOOOO   '
  ];
  var BULB = ['       YY       '];
  // props, drawn left of the head. W white, K film, G grey, C lens, P pink
  var LAPTOP = ['..OOOOOOO.', '..OMMMMMO.', '..OMMYMMO.', '..OMMMMMO.', 'OOOOOOOOOO', 'OGGGGGGGGO', 'OOOOOOOOOO'];
  var LIGHTBOX = ['OOOOOOOOOO', 'OWWWWWWWWO', 'OWKKKKKKWO', 'OWKKWWKKWO', 'OWKKKWKKWO', 'OWKKKWKKWO', 'OWKKWWKKWO', 'OWWWWWWWWO', 'OOOOOOOOOO'];
  var LENS = ['.OOOO...', 'OCCWCO..', 'OCCCCO..', 'OCCCCO..', '.OOOOY..', '.....YY.', '......YY', '.......Y'];
  var CLIP = ['..OYO..', 'OOOOOOO', 'OWWWWWO', 'OWGGGWO', 'OWWWWWO', 'OWGGGWO', 'OWWWWWO', 'OWGGWWO', 'OOOOOOO'];
  var MUG = ['OOOOO..', 'OWWWOOO', 'OYYYO.O', 'OWWWOOO', 'OWWWO..', 'OOOOO..'];
  var CLOUD = ['.OOOOOOO.', 'OWWWWWWWO', 'OWWWWWWWO', 'OWWWWWWWO', '.OOOOOOO.'];
  var HEART = ['.P.P.', 'PPPPP', 'PPPPP', '.PPP.', '..P..'];
  var ZED = ['YYYY', '..Y.', '.Y..', 'YYYY'];

  function runs(rows, ox, oy, cls) {
    var by = {};
    rows.forEach(function (row, y) {
      for (var x = 0; x < row.length;) {
        var c = row[x], n = 1;
        while (x + n < row.length && row[x + n] === c) n++;
        if (c !== ' ' && c !== '.') by[c] = (by[c] || '') + 'M' + (x + ox) + ' ' + (y + oy) + 'h' + n + 'v1h-' + n + 'z';
        x += n;
      }
    });
    return Object.keys(by).map(function (c) { return '<path class="s' + c + (cls ? ' ' + cls : '') + '" d="' + by[c] + '"/>'; }).join('');
  }
  function px(x, y, cls) { return '<rect class="sY ' + cls + '" x="' + x + '" y="' + y + '" width="1" height="1"/>'; }
  var SVG =
    '<svg viewBox="0 0 ' + VW + ' ' + VH + '" xmlns="http://www.w3.org/2000/svg">' +
      '<g class="hd">' + runs(HEAD, HX, HY) + runs(BULB, HX, HY, 'bulb') + '<g class="scr"></g></g>' +
      '<g class="pr p-laptop">' + runs(LAPTOP, 1, 9) + px(2, 14, 'kA') + px(5, 14, 'kB') + px(8, 14, 'kA') + px(4, 14, 'kB') + '</g>' +
      '<g class="pr p-film">' + runs(LIGHTBOX, 1, 5) + '<rect class="sY scan-ln" x="3" y="7" width="6" height="1"/></g>' +
      '<g class="pr p-lens">' + runs(LENS, 2, 7) + '</g>' +
      '<g class="pr p-clip">' + runs(CLIP, 3, 6) + '</g>' +
      '<g class="pr p-mug">' + runs(MUG, 3, 10) + px(4, 8, 'stA') + px(5, 7, 'stA') + px(5, 8, 'stB') + px(4, 7, 'stB') + '</g>' +
      '<g class="pr p-think">' + runs(CLOUD, 1, 0) + '<rect class="sW" x="10" y="6" width="1" height="1"/>' +
        '<rect class="sY d1" x="3" y="2" width="1" height="1"/><rect class="sY d2" x="5" y="2" width="1" height="1"/><rect class="sY d3" x="7" y="2" width="1" height="1"/></g>' +
      '<g class="pr p-heart">' + runs(HEART, 5, 2) + '</g>' +
      '<g class="pr p-zzz">' + runs(ZED, 6, 1) + '</g>' +
    '</svg>';

  /* ---------- the face: 8 x 6 pixels. # yellow, w white highlight, p pink cheek ---------- */
  var DIG = {
    '0': ['###', '#.#', '#.#', '#.#', '###'], '1': ['.#.', '##.', '.#.', '.#.', '###'], '2': ['###', '..#', '###', '#..', '###'],
    '3': ['###', '..#', '###', '..#', '###'], '4': ['#.#', '#.#', '###', '..#', '..#'], '5': ['###', '#..', '###', '..#', '###'],
    '6': ['###', '#..', '###', '#.#', '###'], '7': ['###', '..#', '.#.', '.#.', '.#.'], '8': ['###', '#.#', '###', '#.#', '###'],
    '9': ['###', '#.#', '###', '..#', '###']
  };
  var RING = ['..####..', '.#....#.', '#..##..#', '#..##..#', '.#....#.', '..####..'];
  var ECG = ['................', '....#...........', '....#...........', '....#...........', '####.#.#########', '.....#..........'];
  function grid() { var g = []; for (var y = 0; y < 6; y++) g.push('........'.split('')); return g; }
  function face(name, s) {
    var g = grid(), dx = s.dx, dy = s.dy, t = s.t;
    function put(x, y, c) { if (x >= 0 && x < 8 && y >= 0 && y < 6) g[y][x] = c || '#'; }
    function eyes() { [1, 5].forEach(function (ex) { put(ex + dx, 1 + dy, 'w'); put(ex + 1 + dx, 1 + dy); put(ex + dx, 2 + dy); put(ex + 1 + dx, 2 + dy); }); }
    function cheeks() { put(0, 3, 'p'); put(7, 3, 'p'); }
    switch (name) {
      case 'neutral':
        eyes(); cheeks();
        if (s.talk && t % 2) { put(3, 4); put(4, 4); put(3, 5); put(4, 5); } else { put(3, 4); put(4, 4); }
        break;
      case 'happy': [[2, 1], [1, 2], [3, 2], [5, 1], [4, 2], [6, 2], [2, 4], [5, 4], [3, 5], [4, 5]].forEach(function (p) { put(p[0], p[1]); }); cheeks(); break;
      case 'blink': [1, 2, 5, 6].forEach(function (x) { put(x, 2); }); cheeks(); put(3, 4); put(4, 4); break;
      case 'surprise': eyes(); cheeks(); put(3, 4); put(4, 4); put(3, 5); put(4, 5); break;
      case 'sleep': [1, 2, 5, 6].forEach(function (x) { put(x, 3); }); cheeks(); break;
      case 'down': s = { dx: -1, dy: 1, t: t }; dx = -1; dy = 1; eyes(); cheeks(); put(3, 5); put(4, 5); break;
      case 'wee': [[1, 1], [2, 2], [1, 3], [6, 1], [5, 2], [6, 3], [2, 4], [3, 4], [4, 4], [5, 4], [3, 5], [4, 5]].forEach(function (p) { put(p[0], p[1]); }); break;
      case 'love': [[0, 1], [2, 1], [0, 2], [1, 2], [2, 2], [1, 3], [5, 1], [7, 1], [5, 2], [6, 2], [7, 2], [6, 3]].forEach(function (p) { put(p[0], p[1], 'p'); }); put(3, 5); put(4, 5); break;
      case 'think': eyes(); put(3, 4); put(4, 4); break;
      case 'scan':
        RING.forEach(function (row, y) { row.split('').forEach(function (c, x) { if (c === '#') put(x, y); }); });
        var ly = t % 6; for (var lx = 0; lx < 8; lx++) g[ly][lx] = g[ly][lx] === '#' ? '.' : 'w';
        break;
      case 'ecg': ECG.forEach(function (row, y) { for (var x = 0; x < 8; x++) if (row[(x + t) % row.length] === '#') put(x, y); }); break;
      case 'load': for (var b = 0; b < Math.min(8, t + 1); b++) put(b, 3); break;
      default:
        if (/^\d+$/.test(name)) {
          var w = name.length * 4 - 1, x0 = Math.floor((8 - w) / 2);
          name.split('').forEach(function (ch, i) { DIG[ch].forEach(function (row, y) { row.split('').forEach(function (c, x) { if (c === '#') put(x0 + i * 4 + x, y); }); }); });
        }
    }
    return g;
  }
  function facePaths(g) {
    return runs(g.map(function (r) { return r.join('').replace(/#/g, 'Y').replace(/w/g, 'W').replace(/p/g, 'P'); }), HX + 4, HY + 4);
  }

  /* ---------- the element ---------- */
  var el = document.createElement('div');
  el.className = 'sb';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = SVG;
  document.body.appendChild(el);
  var scr = el.querySelector('.scr');

  var st = { dx: 0, dy: 0, t: 0, talk: false };
  var faceName = 'neutral', baseFace = 'neutral', faceUntil = 0, lastKey = '';
  function render() {
    if (faceUntil && Date.now() > faceUntil) { faceUntil = 0; faceName = baseFace; }
    var anim = /^(scan|ecg|load)$/.test(faceName) || st.talk;
    var key = faceName + st.dx + st.dy + (anim ? st.t : '') + st.talk;
    if (key === lastKey) return;
    lastKey = key;
    scr.innerHTML = facePaths(face(faceName, st));
  }
  function show(name, ms) {
    faceName = name; st.t = 0;
    if (ms) { faceUntil = Date.now() + ms; setTimeout(render, ms + 30); } else { baseFace = name; faceUntil = 0; }
    render();
  }

  // props: one at a time; a temporary prop returns to the section's own prop
  var baseProp = '', propT = 0;
  function prop(name, ms) {
    el.className = el.className.replace(/\bhas-\w+/g, '').trim();
    if (name) el.classList.add('has-' + name);
    clearTimeout(propT);
    if (ms) propT = setTimeout(function () { prop(baseProp); }, ms);
  }
  function hop() { el.classList.remove('hop'); void el.offsetWidth; el.classList.add('hop'); }

  if (!reduce) {
    setInterval(function () { st.t++; render(); }, 160);
    (function blink() {
      setTimeout(function () { if (faceName === 'neutral' && !st.talk) show('blink', 140); blink(); }, 2400 + Math.random() * 3600);
    })();
  }
  render();

  /* ---------- reacting: Scout shows a face and a prop, no speech bubble ----------
     The text of each reaction is kept as its key (it also says what the reaction means). */
  var sayT = 0, saidAt = {};
  function say(text, o) {
    o = o || {};
    var key = o.key || text, now = Date.now();
    if (!o.force && saidAt[key] && now - saidAt[key] < (o.every || 9000)) return false;
    saidAt[key] = now;
    wake();
    root.classList.add('sb-talking'); // on phones Scout stands up from its peek while it reacts
    show(o.face || baseFace, o.face ? (o.ms || 3200) : 0);
    prop(o.prop !== undefined ? o.prop : baseProp, o.prop ? (o.ms || 3200) : 0); // a line without its own prop drops the last one
    if (o.hop) hop();
    clearTimeout(sayT);
    sayT = setTimeout(function () { root.classList.remove('sb-talking'); st.talk = false; render(); }, o.ms || 2600);
    return true;
  }
  function seen(k) { try { if (sessionStorage.getItem('scout-' + k)) return true; sessionStorage.setItem('scout-' + k, '1'); } catch (e) {} return false; }

  /* ---------- idle: a coffee, then a nap; any input wakes it ---------- */
  var lastInput = Date.now(), napping = false;
  function wake() {
    lastInput = Date.now();
    if (napping) { napping = false; el.classList.remove('nap'); prop(baseProp); show('surprise', 900); baseFace = 'neutral'; }
  }
  ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach(function (ev) {
    addEventListener(ev, function () { if (napping) say('Oh! Still here.', { face: 'surprise', ms: 1800, force: true }); wake(); }, { passive: true });
  });
  addEventListener('pointermove', function () { lastInput = Date.now(); if (napping) wake(); }, { passive: true });
  if (!reduce) setInterval(function () {
    var idle = Date.now() - lastInput;
    if (!napping && idle > 32000) { napping = true; el.classList.add('nap'); prop('zzz'); baseFace = 'sleep'; show('sleep'); }
    else if (!napping && idle > 14000 && !st.talk && faceName === 'neutral' && !/has-/.test(el.className)) { prop('mug', 5000); show('happy', 1600); }
  }, 2000);

  /* ---------- eyes follow the pointer ---------- */
  if (!reduce && fine) {
    var lx = 0, ly = 0, lraf = 0;
    addEventListener('pointermove', function (e) {
      lx = e.clientX; ly = e.clientY;
      if (lraf) return;
      lraf = requestAnimationFrame(function () {
        lraf = 0;
        if (napping) return;
        var r = el.getBoundingClientRect(), cx = r.left + r.width * (HX + 8) / VW, cy = r.top + r.height * 0.45;
        st.dx = Math.abs(lx - cx) < 50 ? 0 : lx > cx ? 1 : -1;
        st.dy = Math.abs(ly - cy) < 50 ? 0 : ly > cy ? 1 : -1;
        render();
      });
    }, { passive: true });
  }

  /* ---------- where Scout is: home, rail, dock or talk ---------- */
  var homeEl = document.querySelector('.scout-home'), talkEl = document.querySelector('.scout-talk');
  var mode = null, jump = null, pos = { x: -300, y: -300, s: 3 }, tilt = 0, lastScroll = scrollY, ruler = null;
  function phone() { return innerWidth <= 720; }
  function scaleFor(m) {
    if (m === 'talk') return phone() ? 2.5 : 4.5;
    if (m === 'home') return phone() ? 2.5 : 3.5;
    return 2.5;
  }
  function rulerRect() {
    ruler = ruler || document.querySelector('.ruler');
    var r = ruler && ruler.getBoundingClientRect();
    return r && r.width ? r : null;
  }
  function frac() { return Math.min(1, Math.max(0, scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight))); }
  function target(m) {
    var s = scaleFor(m), r;
    if (m === 'home' && homeEl) { r = homeEl.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.bottom }; }
    if (m === 'talk' && talkEl) { r = talkEl.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.bottom }; }
    if (m === 'rail' && (r = rulerRect())) {
      return { x: r.left + r.width / 2, y: Math.max(r.top + 14 * s + 6, r.top + frac() * (r.height - 3)) };
    }
    // dock: peek over the bottom edge when quiet, stand up to talk, duck right out while the page scrolls
    var quiet = !root.classList.contains('sb-talking') && !el.matches(':hover');
    var tucked = root.classList.contains('sb-tuck');
    return { x: 14 + 8 * s, y: innerHeight - 4 + (tucked ? 16 * s : quiet ? 5 * s : 0) };
  }
  function ease(p) { return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; }
  function go(m) {
    if (m === mode) return;
    var first = mode === null;
    mode = m;
    root.setAttribute('data-sb', m);
    if (first || reduce) { jump = null; return; }
    var to = target(m), d = Math.hypot(to.x - pos.x, to.y - pos.y);
    // The arc must stay on screen. Scout often leaves home just as its slot reaches the nav,
    // so there may be little room above: then it swoops down in a dip instead of arcing up.
    var headH = 14 * Math.max(pos.s, scaleFor(m)), top = (navEl ? navEl.getBoundingClientRect().bottom : 0) + 10;
    var mid = (pos.y + to.y) / 2, up = Math.min(200, 60 + d * 0.18, mid - headH - top);
    var h = up >= 40 ? up : -Math.min(150, 40 + d * 0.12, innerHeight - 10 - mid);
    jump = { x: pos.x, y: pos.y, s: pos.s, t0: lastT || performance.now(), dur: Math.min(1150, 520 + d * 0.5), h: h, top: top, dir: to.x > pos.x ? 1 : -1 };
    show('surprise', 500);
  }
  function land() {
    el.classList.remove('land'); void el.offsetWidth; el.classList.add('land');
    show(mode === 'talk' ? 'happy' : 'neutral', 900);
    if (mode === 'talk') { prop('heart', 2600); }
  }
  // Which spot Scout belongs in. The hero counts as "current" until About is well up the
  // screen, but Scout's home slot scrolls away long before that, so it leaves home as soon
  // as the slot starts to slide under the nav, and returns only once it is clearly back in view.
  var secIdx = -1, navEl = document.querySelector('.nav');
  function homeInView() {
    if (!homeEl) return false;
    var r = homeEl.getBoundingClientRect(), top = navEl ? navEl.getBoundingClientRect().bottom : 0;
    return mode === 'home' ? r.top > top + 4 : r.top > top + 16; // the slot sits 18-26px under the nav at the very top
  }
  function decide() {
    if (secIdx === last) return 'talk';
    if (secIdx <= 0 && homeInView()) return 'home';
    return rulerRect() ? 'rail' : 'dock';
  }
  var lastT = 0; // the jump clock is the animation-frame clock
  function step(t) {
    lastT = t;
    if (secIdx < 0) return;
    if (!jump) go(decide());
    if (!mode) return;
    var s = scaleFor(mode), tg = target(mode), rot = 0;
    if (jump) {
      var p = Math.min(1, (t - jump.t0) / jump.dur), e = ease(p);
      pos.x = jump.x + (tg.x - jump.x) * e;
      pos.y = jump.y + (tg.y - jump.y) * e - Math.sin(Math.PI * p) * jump.h;
      pos.s = jump.s + (s - jump.s) * e;
      // safety net: the whole head stays between the nav and the bottom of the screen mid-jump
      pos.y = Math.max(jump.top + 14 * pos.s, Math.min(innerHeight - 4, pos.y));
      rot = jump.dir * 360 * e; // one somersault on the way
      if (p >= 1) { jump = null; rot = 0; land(); }
    } else if (!reduce && (mode === 'rail' || mode === 'dock')) {
      pos.x += (tg.x - pos.x) * 0.3; pos.y += (tg.y - pos.y) * 0.22; pos.s = s; // a little spring when riding
    } else { pos.x = tg.x; pos.y = tg.y; pos.s = s; }
    // lean into the scroll while riding; a quick ride makes it squeal
    var v = scrollY - lastScroll; lastScroll = scrollY;
    var want = !reduce && mode === 'rail' && !jump ? Math.max(-16, Math.min(16, v * 0.7)) : 0;
    tilt += (want - tilt) * 0.18;
    if (!reduce && mode === 'rail' && Math.abs(v) > 38 && faceName !== 'wee') show('wee', 600);
    var w = VW * pos.s, ox = (HX + 8) * pos.s, oy = 16 * pos.s;
    el.style.width = w + 'px';
    el.style.transform = 'translate3d(' + (pos.x - ox).toFixed(1) + 'px,' + (pos.y - oy).toFixed(1) + 'px,0) rotate(' + (rot || tilt).toFixed(2) + 'deg)';
  }
  (function loop(t) { step(t); requestAnimationFrame(loop); })(performance.now());

  /* ---------- greeting ---------- */
  var HELLO = 'hello';
  var bootDelay = root.classList.contains('boot-on') ? 1300 : 500;
  setTimeout(function () {
    root.classList.add('sb-on');
    if (reduce) { if (!seen('hi')) say(HELLO, { ms: 5200 }); return; }
    show('load', 1300);
    setTimeout(function () { hop(); if (!seen('hi')) say(HELLO, { face: 'happy', ms: 5200 }); else show('happy', 1200); }, 1300);
  }, bootDelay);

  /* ---------- the page talks to Scout ---------- */
  function on(sel, ev, fn) { document.querySelectorAll(sel).forEach(function (n) { n.addEventListener(ev, function (e) { fn(n, e); }); }); }
  // click Scout: a little trick, a random prop and face with a hop
  var TRICKS = [['laptop', 'down'], ['film', 'scan'], ['lens', 'surprise'], ['clip', 'down'], ['mug', 'happy'], ['heart', 'love'], ['think', 'think']];
  var ti = Math.floor(Math.random() * TRICKS.length);
  el.addEventListener('click', function () {
    ti = (ti + 1) % TRICKS.length;
    say('trick', { face: TRICKS[ti][1], prop: TRICKS[ti][0], ms: 2200, hop: true, force: true });
  });

  on('.t-stat', 'pointerenter', function () { say('30% to 96% compliance, first audit to re-audit.', { face: '96', prop: 'lens', ms: 3200 }); });
  on('.t-pubs', 'pointerenter', function () { say('Five published. Two more submitted and presented.', { face: '5', prop: 'clip', ms: 3200 }); });
  on('.who img', 'pointerenter', function () { say('avatar', { face: 'happy', hop: true }); });
  on('.t-now', 'pointerenter', function () { say('Current study: haemorrhage on head CT.', { face: 'scan', prop: 'film', ms: 3000 }); });

  on('.presets button', 'click', function (b) {
    say(b.textContent.trim() + ' window: W ' + b.getAttribute('data-w') + ', L ' + b.getAttribute('data-l') + '.', { face: 'scan', prop: 'film', ms: 2600, force: true });
  });
  var SEG = {
    img: ['Plain image, no overlay.', 'neutral'], rad: ['Green outline: the reference read.', 'happy'],
    ai: ["Red mask: the model's answer.", 'scan'], both: ['Both together: where model and reader agree.', 'think'],
    sal: ['Saliency: where the model looked. Synthetic, of course.', 'scan']
  };
  on('.segs button', 'click', function (b) { var m = SEG[b.getAttribute('data-m')]; if (m) say(m[0], { face: m[1], prop: 'film', ms: 3000, force: true }); });
  on('#viewer', 'pointerdown', function () { say('Windowing. Drag up, down, left, right.', { face: 'scan', prop: 'film', ms: 2400, every: 15000 }); });

  var PROJ = {
    'w-ich': ['Head CT: looking for haemorrhage.', 'scan', 'film'],
    'w-mri': ['Synthetic MRI, or a GAN image? Sorting the search.', 'think', 'lens'],
    'w-ti': ['TI-RADS compliance, 30% to 96%.', '96', 'lens'],
    'w-ment': ['Matching residents with mentors.', 'love', 'heart'],
    'w-cem': ['Staging breast cancer with contrast mammography.', 'scan', 'film'],
    'w-back': ['Backing up the moment a drive plugs in.', 'down', 'laptop']
  };
  on('.work .proj', 'pointerenter', function (card) {
    for (var k in PROJ) if (card.classList.contains(k)) { say(PROJ[k][0], { face: PROJ[k][1], prop: PROJ[k][2], ms: 3000 }); break; }
  });
  on('.study-btn', 'click', function () { say('Case report open. Problem, method, result.', { face: 'down', prop: 'clip', ms: 2800, force: true }); });
  on('#lights', 'click', function () {
    setTimeout(function () {
      var dark = root.getAttribute('data-theme') === 'dark';
      say(dark ? 'Lights off. Reading-room mode.' : 'Lights on.', { face: dark ? 'happy' : 'surprise', ms: 2200, force: true });
    }, 30);
  });
  on('a[href^="mailto:"]', 'pointerenter', function () { say("That's the one. Email goes straight to him.", { face: 'happy', ms: 2600, hop: true, every: 20000 }); });
  on('a[href^="mailto:"]', 'click', function () { say('Opening your mail app.', { face: 'love', prop: 'heart', ms: 2600, force: true }); });

  /* ---------- sections ---------- */
  var LINES = [
    null,
    ['Two sides: reading the scans, and testing the models that read them.', 'happy'],
    ['Six projects. Hover one and I will take a look.', 'down'],
    ['Radiology resident at Aga Khan University Hospital since 2024.', 'think'],
    ['Five papers published, two more on the way.', '5'],
    ['Registered with the GMC (UK) and the PMDC.', 'happy'],
    ["Write to him. I'll wait right here.", 'love']
  ];
  var PROPS = ['', '', 'laptop', 'think', 'clip', '', 'heart'];
  var FACES = ['neutral', 'neutral', 'down', 'neutral', 'neutral', 'neutral', 'happy'];
  var last = SECTIONS_LAST();
  function SECTIONS_LAST() { return LINES.length - 1; }
  window.Scout = {
    say: say,
    section: function (i) {
      secIdx = i;
      go(decide());
      baseProp = PROPS[i] || '';
      if (!napping) { prop(baseProp); baseFace = FACES[i] || 'neutral'; if (!st.talk) show(baseFace); }
      var l = LINES[i];
      if (l && !seen('sec' + i)) setTimeout(function () { say(l[0], { face: l[1], ms: 3600 }); }, jump ? 900 : 0);
    }
  };

  /* ---------- phones: duck out of sight while scrolling, back when it stops ---------- */
  var tuckT = 0;
  addEventListener('scroll', function () {
    if (mode !== 'dock') return;
    root.classList.add('sb-tuck');
    clearTimeout(tuckT);
    tuckT = setTimeout(function () { root.classList.remove('sb-tuck'); }, 900);
  }, { passive: true });
})();
