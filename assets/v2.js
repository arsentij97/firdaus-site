/*
  Firdaus — сайт v2: движение и живые куски. Встаёт внутрь страницы при сборке.
  Общий site.js (константы, кнопка App Store, появление .reveal, шапка) идёт
  рядом и раньше; здесь только то, чего на старом сайте не было:

   1. .lit — абзац «правды»: слова зажигаются по мере прокрутки.
   2. .story — телефон держится на месте, экран меняется по главам.
   3. .daily — время намаза в Алматы на сегодня и отсчёт до следующего, кибла,
      последняя треть ночи. Считает та же библиотека, что страницы городов и
      приложение (assets/adhan + assets/namaz.js); грузится, когда блок близко.
   4. Партнёры: честный калькулятор и заявка письмом.

  Всё уважает prefers-reduced-motion. Без скрипта страница читается целиком.
*/
(function () {
  'use strict';
  var doc = document;
  var lang = doc.documentElement.lang === 'en' ? 'en' : 'ru';
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };

  doc.addEventListener('DOMContentLoaded', function () {
    lit();
    story();
    daily();
    calc();
    apply();
  });

  /* ── 1. слова зажигаются ── */
  function lit() {
    var els = $$('.lit');
    if (!els.length || still) return;
    els.forEach(function (el) {
      var out = doc.createDocumentFragment();
      Array.prototype.slice.call(el.childNodes).forEach(function (n) {
        var hl = n.nodeType === 1 && n.classList.contains('hl');
        var text = n.textContent;
        text.split(/(\s+)/).forEach(function (w) {
          if (!w) return;
          if (/^\s+$/.test(w)) { out.appendChild(doc.createTextNode(w)); return; }
          var s = doc.createElement('span');
          s.className = 'wd' + (hl ? ' hl' : '');
          s.textContent = w;
          out.appendChild(s);
        });
      });
      el.textContent = '';
      el.appendChild(out);
      el.classList.add('split');
    });
    var words = els.map(function (el) { return $$('.wd', el); });
    var ticking = false;
    function draw() {
      ticking = false;
      var vh = window.innerHeight;
      els.forEach(function (el, i) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -vh || r.top > vh * 1.5) return;
        var p = (vh * 0.82 - r.top) / (r.height + vh * 0.25);
        p = Math.max(0, Math.min(1, p));
        var n = Math.round(p * words[i].length);
        words[i].forEach(function (w, k) { w.classList.toggle('on', k < n); });
      });
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(draw); } }, { passive: true });
    window.addEventListener('resize', draw);
    requestAnimationFrame(function () { requestAnimationFrame(draw); });
  }

  /* ── 2. главы и экран телефона ── */
  function story() {
    var chs = $$('.ch[data-k]');
    var shots = $$('.sticky .scr img[data-k]');
    var dots = $$('.dots i');
    if (!chs.length || !('IntersectionObserver' in window)) { chs.forEach(function (c) { c.classList.add('on', 'seen'); }); return; }
    function set(k) {
      shots.forEach(function (p) { (p.parentNode.tagName === 'PICTURE' ? p.parentNode : p).classList.toggle('on', p.getAttribute('data-k') === k); });
      chs.forEach(function (c, i) {
        var on = c.getAttribute('data-k') === k;
        c.classList.toggle('on', on);
        if (on) c.classList.add('seen');
        if (dots[i]) dots[i].classList.toggle('on', on);
      });
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) set(e.target.getAttribute('data-k')); });
    }, { rootMargin: '-42% 0px -42% 0px' });
    chs.forEach(function (c) { io.observe(c); });
    set(chs[0].getAttribute('data-k'));
  }

  /* ── 3. каждый день: время, кибла, ночь ── */
  function daily() {
    var box = $('.daily[data-city]');
    if (!box) return;
    var city;
    try { city = JSON.parse(box.getAttribute('data-city')); } catch (e) { return; }
    var started = false;
    function load(src, cb) { var s = doc.createElement('script'); s.src = src; s.onload = cb; doc.head.appendChild(s); }
    function go() {
      if (started) return;
      started = true;
      if (window.FirdausNamaz) return run();
      load('/assets/adhan-4.4.4.min.js', function () { load('/assets/namaz.js', run); });
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); go(); } }, { rootMargin: '600px 0px' });
      io.observe(box);
    } else go();

    var NAMES = lang === 'en'
      ? { fajr: 'Fajr', sunrise: 'Sunrise', dhuhr: 'Dhuhr', jumua: "Jumu'ah", asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' }
      : { fajr: 'Фаджр', sunrise: 'Восход', dhuhr: 'Зухр', jumua: 'Джума', asr: 'Аср', maghrib: 'Магриб', isha: 'Иша' };
    var UNTIL = lang === 'en' ? 'until ' : 'до ';

    function run() {
      var N = window.FirdausNamaz;
      if (!N) return;
      var ymd = N.today(city.tz);
      var t = N.day(city, ymd[0], ymd[1], ymd[2]);
      var tm = N.addDays(ymd, 1);
      var t2 = N.day(city, tm[0], tm[1], tm[2]);
      var friday = N.wd(ymd[0], ymd[1], ymd[2]) === 5;
      var rows = $('.times', box);
      if (rows) {
        rows.innerHTML = '';
        N.KEYS.forEach(function (k) {
          var d = doc.createElement('div');
          d.setAttribute('data-k', k);
          d.innerHTML = '<span></span><b></b>';
          d.firstChild.textContent = k === 'dhuhr' && friday ? NAMES.jumua : NAMES[k];
          d.lastChild.textContent = N.hm(t[k], city.tz);
          rows.appendChild(d);
        });
      }
      var night = $('[data-night]', box);
      if (night) {
        var start = new Date(t.maghrib.getTime() + (t2.fajr - t.maghrib) * 2 / 3);
        night.textContent = N.hm(start, city.tz);
      }
      var needle = $('[data-needle]', box);
      var deg = $('[data-qibla]', box);
      var q = N.qibla(city);
      if (needle) needle.setAttribute('transform', 'rotate(' + q.toFixed(1) + ' 60 60)');
      if (deg) deg.textContent = Math.round(q) + '°';

      var left = $('[data-left]', box);
      var leftl = $('[data-leftl]', box);
      var order = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
      function tick() {
        var now = Date.now();
        var next = null, key = null;
        for (var i = 0; i < order.length; i++) if (t[order[i]].getTime() > now) { next = t[order[i]]; key = order[i]; break; }
        if (!next) { next = t2.fajr; key = 'fajr'; }
        var cur = null;
        for (var j = 0; j < N.KEYS.length; j++) if (t[N.KEYS[j]].getTime() <= now) cur = N.KEYS[j];
        $$('.times div', box).forEach(function (d) {
          var k = d.getAttribute('data-k');
          d.classList.toggle('now', k === key);
          d.classList.toggle('past', t[k].getTime() <= now && k !== key);
        });
        var s = Math.max(0, Math.floor((next - now) / 1000));
        var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
        if (left) left.textContent = h + ':' + (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
        var name = key === 'dhuhr' && friday ? NAMES.jumua : NAMES[key];
        if (leftl) leftl.textContent = UNTIL + (lang === 'ru' ? genitive(name) : name) + ' · ' + N.hm(next, city.tz);
        void cur;
      }
      tick();
      setInterval(tick, 1000);
    }
    function genitive(n) {
      return { 'Фаджр': 'Фаджра', 'Зухр': 'Зухра', 'Джума': 'Джумы', 'Аср': 'Асра', 'Магриб': 'Магриба', 'Иша': 'Иши' }[n] || n;
    }
  }

  /* ── 4. партнёры: калькулятор ──
     ДОЛЯ С ОДНОЙ ОПЛАТЫ — 533 ₸ (docs/89 §6): Plus на месяц в Казахстане 3 790 ₸,
     НДС 16 % в цене, комиссия Apple 15 %, наш налог 4 % → 2 666 ₸ чистыми,
     20 % партнёру. Поменялись цена или ставка — поменять PER_PAY и строку
     расчёта на странице. */
  function calc() {
    var form = $('#calc-form');
    if (!form) return;
    var PER_PAY = 533.23;
    var MIN_PAYOUT = 10000;
    var mode = 'once';
    var loc = lang === 'en' ? 'en-US' : 'ru-RU';
    var fmt = function (n) { var s = Math.round(n).toLocaleString(loc); return lang === 'en' ? s : s.replace(/[\s  ,]/g, ' '); };
    var audOf = function (v) {
      var n = Math.pow(10, 3 + (3 * v) / 100);
      var step = n < 10000 ? 500 : n < 100000 ? 1000 : 10000;
      return Math.round(n / step) * step;
    };
    var fill = function (el) { el.style.setProperty('--p', ((el.value - el.min) / (el.max - el.min)) * 100 + '%'); };
    var T = lang === 'en'
      ? { tg: '₸', first: 'first month', last: '12th month', small: 'Under 10,000 ₸ a month, payouts add up and arrive once they reach 10,000 ₸.' }
      : { tg: '₸', first: 'в первый месяц', last: 'в 12-й месяц', small: 'Меньше 10 000 ₸ в месяц: сумма копится и приходит, когда наберётся 10 000 ₸.' };
    function draw() {
      var a = $('#c-aud'), i = $('#c-in'), p = $('#c-pay'), k = $('#c-keep');
      [a, i, p, k].forEach(fill);
      var aud = audOf(Number(a.value));
      var inst = aud * Number(i.value) / 100;
      var pay0 = inst * Number(p.value) / 100;
      var keep = Number(k.value) / 100;
      var months = [];
      var payers = 0;
      for (var m = 0; m < 12; m++) {
        payers = payers * keep;
        if (m === 0) payers += pay0;
        else if (mode === 'monthly') payers += pay0 * 0.5;
        months.push(payers * PER_PAY);
      }
      var year = months.reduce(function (s, x) { return s + x; }, 0);
      var max = Math.max.apply(null, months) || 1;
      $('#o-aud').textContent = fmt(aud);
      $('#o-in').textContent = String(i.value).replace('.', lang === 'en' ? '.' : ',') + '%';
      $('#o-pay').textContent = p.value + '%';
      $('#o-keep').textContent = k.value + '%';
      $('#o-sum').textContent = fmt(year) + ' ' + T.tg;
      $('#o-first').textContent = fmt(months[0]) + ' ' + T.tg;
      $('#o-last').textContent = fmt(months[11]) + ' ' + T.tg;
      $('#o-inst').textContent = fmt(inst);
      $('#o-payers').textContent = fmt(pay0);
      $$('.bars i').forEach(function (b, n) { b.style.height = Math.max(2, (months[n] / max) * 100) + '%'; });
      var low = $('#o-low');
      if (low) { low.textContent = months[0] < MIN_PAYOUT ? T.small : ''; low.hidden = months[0] >= MIN_PAYOUT; }
    }
    $$('input[type=range]', form).forEach(function (el) { el.addEventListener('input', draw); });
    $$('.seg button', form.parentNode).forEach(function (b) {
      b.addEventListener('click', function () {
        mode = b.getAttribute('data-mode');
        $$('.seg button', form.parentNode).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        draw();
      });
    });
    draw();
  }

  /* ── заявка: своего сервера нет — письмо на partners@ (как assets/partners.js) ── */
  function apply() {
    var form = $('#apply-form');
    if (!form) return;
    var T = lang === 'en'
      ? { subj: 'Firdaus partner application', fields: { name: 'Name', contact: 'Telegram or email', link: 'Page', where: 'Main platform', size: 'Followers', city: 'Country and city', about: 'About' } }
      : { subj: 'Заявка в партнёрскую программу Firdaus', fields: { name: 'Имя', contact: 'Telegram или почта', link: 'Страница', where: 'Главная площадка', size: 'Подписчиков', city: 'Страна и город', about: 'О чём пишет' } };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = false;
      ['f-name', 'f-contact', 'f-link'].forEach(function (id) {
        var el = doc.getElementById(id);
        var ok = el.value.trim().length > 1 && (id !== 'f-link' || /\S+\.\S+/.test(el.value));
        el.parentElement.classList.toggle('bad', !ok);
        el.setAttribute('aria-invalid', ok ? 'false' : 'true');
        if (!ok && !bad) { el.focus(); bad = true; }
      });
      if (bad) return;
      var lines = Object.keys(T.fields).map(function (k) {
        var el = form.elements[k];
        return T.fields[k] + ': ' + (el && el.value.trim() ? el.value.trim() : '-');
      });
      var to = (window.FIRDAUS && window.FIRDAUS.partnersEmail) || 'partners@firdaus.life';
      location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(T.subj) + '&body=' + encodeURIComponent(lines.join('\n'));
      form.classList.add('sent');
    });
  }
})();
