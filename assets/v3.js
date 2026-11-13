/*
  Firdaus — сайт v3: движение и живые куски. Встаёт внутрь страницы при сборке.
  Общий site.js (константы, кнопка App Store, язык) идёт рядом и раньше.

   1. Шапка: высота одна с первого кадра, по прокрутке меняется только фон.
   2. Первый экран: город по часовому поясу, отсчёт до ближайшего намаза,
      уведомления от своих — стек, как на экране блокировки.
   3. Манифест: слова суры Аль-Аср зажигаются по мере прокрутки.
   4. «Намаз»: время на сегодня, кибла, последняя треть ночи — та же
      библиотека, что в приложении и на страницах городов (adhan + namaz.js);
      кибла на карточке — настоящий экран: «повернись» → совпало.
   5. Лента сцен: кнопки «назад/вперёд», лёгкое приближение фото опор.
   6. «Позови своих»: системное «Поделиться», иначе — ссылка в буфер.

  Всё уважает «уменьшить движение». Без скрипта страница читается целиком.
*/
(function () {
  'use strict';
  var doc = document;
  var lang = doc.documentElement.lang === 'en' ? 'en' : 'ru';
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };

  /* Город по часовому поясу. Координаты — центр города; Казахстан по ДУМК
     (namaz.js сам берёт пресет страны по cc). Неизвестный пояс — Алматы
     для русской страницы, Лондон для английской. */
  var CITIES = {
    'Asia/Almaty': ['KZ', 43.238293, 76.945465, 'Алматы', 'Almaty'],
    'Asia/Qostanay': ['KZ', 53.214, 63.6246, 'Костанай', 'Kostanay'],
    'Asia/Aqtobe': ['KZ', 50.2839, 57.167, 'Актобе', 'Aktobe'],
    'Asia/Aqtau': ['KZ', 43.6532, 51.1975, 'Актау', 'Aktau'],
    'Asia/Atyrau': ['KZ', 47.0945, 51.9238, 'Атырау', 'Atyrau'],
    'Asia/Oral': ['KZ', 51.2333, 51.3667, 'Уральск', 'Oral'],
    'Asia/Qyzylorda': ['KZ', 44.8488, 65.4823, 'Кызылорда', 'Kyzylorda'],
    'Asia/Bishkek': ['KG', 42.8746, 74.5698, 'Бишкек', 'Bishkek'],
    'Asia/Tashkent': ['UZ', 41.2995, 69.2401, 'Ташкент', 'Tashkent'],
    'Asia/Samarkand': ['UZ', 39.6542, 66.9597, 'Самарканд', 'Samarkand'],
    'Asia/Dushanbe': ['TJ', 38.5598, 68.787, 'Душанбе', 'Dushanbe'],
    'Asia/Baku': ['AZ', 40.4093, 49.8671, 'Баку', 'Baku'],
    'Europe/Moscow': ['RU', 55.7558, 37.6173, 'Москва', 'Moscow'],
    'Europe/Istanbul': ['TR', 41.0082, 28.9784, 'Стамбул', 'Istanbul'],
    'Asia/Dubai': ['AE', 25.2048, 55.2708, 'Дубай', 'Dubai'],
    'Europe/London': ['GB', 51.5074, -0.1278, 'Лондон', 'London'],
    'Europe/Berlin': ['DE', 52.52, 13.405, 'Берлин', 'Berlin'],
    'America/New_York': ['US', 40.7128, -74.006, 'Нью-Йорк', 'New York'],
  };
  function pickCity() {
    var tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { /* старый браузер */ }
    var fall = lang === 'en' ? 'Europe/London' : 'Asia/Almaty';
    var key = CITIES[tz] ? tz : fall;
    var c = CITIES[key];
    var GENC = {"Алматы":"Алматы","Костанай":"Костаная","Актобе":"Актобе","Актау":"Актау","Атырау":"Атырау","Уральск":"Уральска","Кызылорда":"Кызылорды","Бишкек":"Бишкека","Ташкент":"Ташкента","Самарканд":"Самарканда","Душанбе":"Душанбе","Баку":"Баку","Москва":"Москвы","Стамбул":"Стамбула","Дубай":"Дубая","Лондон":"Лондона","Берлин":"Берлина","Нью-Йорк":"Нью-Йорка"};
    return { tz: key, cc: c[0], lat: c[1], lon: c[2], name: lang === 'en' ? c[4] : c[3], gen: lang === 'en' ? c[4] : (GENC[c[3]] || c[3]) };
  }

  var NAMES = lang === 'en'
    ? { fajr: 'Fajr', sunrise: 'Sunrise', dhuhr: 'Dhuhr', jumua: "Jumu'ah", asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' }
    : { fajr: 'Фаджр', sunrise: 'Восход', dhuhr: 'Зухр', jumua: 'Джума', asr: 'Аср', maghrib: 'Магриб', isha: 'Иша' };
  var GEN = { 'Фаджр': 'Фаджра', 'Зухр': 'Зухра', 'Джума': 'Джумы', 'Аср': 'Асра', 'Магриб': 'Магриба', 'Иша': 'Иши' };
  var ORDER = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

  doc.addEventListener('DOMContentLoaded', function () {
    header();
    reveal();
    share();
    soon();
    namaz();
    /* остальное — когда страница уже нарисована: первый экран не ждёт */
    var later = function () { stack(); lit(); rails(); zoom(); scene(); qibla(); };
    var idle = window.requestIdleCallback || function (f) { setTimeout(f, 300); };
    if (doc.readyState === 'complete') idle(later); else window.addEventListener('load', function () { idle(later); });
  });


  /* лист ожидания: проверка, запись, ответ по-человечески */
  function waitlist(C, T, d) {
    var form = $('form', d), input = $('input', form), btn = $('button', form);
    var msg = $('#wl-msg', d), change = $('.wl-change', d), note = $('#wl-note', d);
    $('label', form).textContent = T.label;
    input.placeholder = T.ph;
    btn.textContent = T.btn;
    change.textContent = T.change;
    note.textContent = T.note;
    var pl = doc.createElement('a'); pl.href = T.privacyUrl; pl.textContent = T.privacy; note.appendChild(pl);
    var KEY = 'firdaus-waitlist';
    var mem = { get: function () { try { return localStorage.getItem(KEY); } catch (e) { return null; } }, set: function (v) { try { localStorage.setItem(KEY, v); } catch (e) { /* частный режим */ } } };
    var say = function (text, kind) { msg.textContent = text; msg.className = 'wl-msg' + (kind ? ' ' + kind : ''); };
    var done = function (text) { form.hidden = true; change.hidden = false; say(text, 'is-ok'); };
    if (mem.get()) done(T.again);
    change.addEventListener('click', function () { form.hidden = false; change.hidden = true; say(''); input.value = ''; input.focus(); });
    input.addEventListener('input', function () { if (msg.classList.contains('is-err')) { say(''); input.removeAttribute('aria-invalid'); } });
    var q = new URLSearchParams(location.search);
    var utm = (q.get('utm_source') || '').slice(0, 40);
    var camp = (q.get('utm_campaign') || '').slice(0, 40);
    var source = (utm ? 'utm:' + utm + (camp ? '/' + camp : '') : location.pathname).slice(0, 120);
    var busy = false;
    var fail = function (text) { say(text, 'is-err'); input.setAttribute('aria-invalid', 'true'); input.focus(); };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy) return;
      var v = input.value.trim();
      if (!v) return fail(T.empty);
      /* «username» без собаки — это Telegram */
      if (/^[A-Za-z0-9_]{5,32}$/.test(v)) v = '@' + v;
      if (v.indexOf('@') < 0 && !/t(elegram)?\.me\//i.test(v)) return fail(T.format);
      busy = true; btn.disabled = true; btn.textContent = T.busyBtn; form.setAttribute('aria-busy', 'true'); say('');
      fetch(C.supabaseUrl + '/rest/v1/rpc/join_waitlist', {
        method: 'POST',
        headers: { apikey: C.supabaseKey, Authorization: 'Bearer ' + C.supabaseKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: v, lang: lang, source: source }),
      })
        .then(function (r) { return r.ok ? r.json() : { ok: false, reason: 'net' }; })
        .then(function (r) {
          if (r && r.ok) {
            mem.set('1');
            done(T.ok);
            msg.focus();
            if (window.posthog && window.posthog.capture) window.posthog.capture('waitlist_join', { kind: v.charAt(0) === '@' || /t(elegram)?\.me/i.test(v) ? 'telegram' : 'email', source: source });
          } else fail(T[r && r.reason === 'format' ? 'format' : r && r.reason === 'busy' ? 'busy' : 'net']);
        })
        .catch(function () { fail(T.net); })
        .then(function () { busy = false; btn.disabled = false; btn.textContent = T.btn; form.removeAttribute('aria-busy'); });
    });
    d.addEventListener('close', function () { if (msg.classList.contains('is-err')) { say(''); input.removeAttribute('aria-invalid'); } });
  }

  /* без ключа базы — прежний путь: письмо на почту поддержки */
  function mailFallback(C, T, d) {
    var mail = $('a.btn', d);
    mail.textContent = T.mail;
    mail.href = 'mailto:' + (C.email || 'support@firdaus.life') + '?subject=' + encodeURIComponent(T.subj) + '&body=' + encodeURIComponent(T.body);
    var alt = $('.alt', d);
    var addr = C.email || 'support@firdaus.life';
    mail.addEventListener('click', function () {
      /* почта на телефоне может быть не настроена — адрес сразу в буфер и на экран */
      if (navigator.clipboard) navigator.clipboard.writeText(addr).catch(function () {});
      alt.innerHTML = '';
      alt.appendChild(doc.createTextNode(lang === 'en' ? 'If your mail app didn’t open, write to ' : 'Если почта не открылась — напиши на '));
      var b = doc.createElement('b'); b.textContent = addr; alt.appendChild(b);
      alt.appendChild(doc.createTextNode(lang === 'en' ? ' (address copied).' : ' (адрес скопирован).'));
    });
  }

  /* ── «Скоро в App Store»: не мёртвая кнопка, а лист ожидания ──
     site.js снимает ссылку, пока приложения нет в магазине (appStoreLive).
     Форма «почта или Telegram» пишет в базу приложения функцией join_waitlist
     (supabase/migrations/0370): одно сообщение в день выхода, без рассылок.
     Нет ключа в site.js — запасной путь: письмо на почту поддержки. */
  function soon() {
    var C = window.FIRDAUS || {};
    var btns = $$('a.soon[data-link="appstore"]');
    if (!btns.length || C.appStoreLive) return;
    var en = lang === 'en';
    var T = en
      ? { h: 'Firdaus is coming to the App Store', p: 'We’re getting ready for release. Leave your email or Telegram and we’ll message you once — on the day Firdaus is out.', label: 'Email or Telegram', ph: 'name@mail.com or @username', btn: 'Remind me on launch day', busyBtn: 'Saving…',
          ok: 'You’re on the list ✓ We’ll write on launch day.', again: 'You’re already on the list ✓ We’ll write on launch day.', change: 'Use another address',
          empty: 'Enter your email or Telegram, e.g. name@mail.com or @username.', format: 'That doesn’t look like an email or a Telegram username. Check for typos.', busy: 'Lots of sign-ups right now. Please try again in a minute.', net: 'Couldn’t send — check your connection and try again.',
          note: 'Only to tell you about the launch. No newsletters. ', privacy: 'Privacy policy', privacyUrl: '/en/privacy',
          mail: 'Remind me on launch day', subj: 'Waiting for Firdaus', body: 'Assalamu alaikum! Please let me know when Firdaus is on the App Store.', share: 'Invite your people', close: 'Close' }
      : { h: 'Firdaus скоро в App Store', p: 'Готовим выход. Оставь почту или Telegram — напишем один раз, в день, когда Firdaus появится в App Store.', label: 'Почта или Telegram', ph: 'name@mail.ru или @username', btn: 'Напомнить в день выхода', busyBtn: 'Записываем…',
          ok: 'Записали ✓ Напишем в день выхода.', again: 'Ты уже в списке ✓ Напишем в день выхода.', change: 'Записать другой адрес',
          empty: 'Впиши почту или Telegram — например, name@mail.ru или @username.', format: 'Не похоже на почту или Telegram. Проверь, нет ли опечатки.', busy: 'Сейчас записывается много людей. Попробуй через минуту.', net: 'Не получилось отправить — проверь интернет и попробуй ещё раз.',
          note: 'Только чтобы сообщить о запуске. Без рассылок. ', privacy: 'Политика конфиденциальности', privacyUrl: '/privacy',
          mail: 'Напомнить в день выхода', subj: 'Жду Firdaus', body: 'Ассаляму алейкум! Напишите мне, когда Firdaus выйдет в App Store.', share: 'Позвать своих', close: 'Закрыть' };
    var live = Boolean(C.supabaseUrl && C.supabaseKey && window.fetch);
    var d = doc.createElement('dialog');
    d.className = 'sheet';
    d.setAttribute('aria-labelledby', 'sheet-h');
    d.innerHTML = '<button class="x" type="button"><span class="sr"></span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
      '<img src="/assets/logo-68.webp" width="56" height="56" alt=""><h3 id="sheet-h"></h3><p></p>' +
      (live
        ? '<form class="wl" novalidate><label for="wl-in"></label><input id="wl-in" name="contact" type="email" inputmode="email" autocomplete="email" autocapitalize="off" autocorrect="off" spellcheck="false" maxlength="254" aria-describedby="wl-msg wl-note"><button class="btn" type="submit"></button></form>' +
          '<p id="wl-msg" class="wl-msg" role="status" aria-live="polite" tabindex="-1"></p><button class="wl-change" type="button" hidden></button>' +
          '<p id="wl-note" class="wl-note"></p><div class="acts"><button class="btn ghost" type="button" data-share-sheet></button></div>'
        : '<div class="acts"><a class="btn"></a><button class="btn ghost" type="button" data-share-sheet></button></div><p class="alt" aria-live="polite"></p>');
    $('h3', d).textContent = T.h;
    $('p', d).textContent = T.p;
    $('.x .sr', d).textContent = T.close;
    if (live) waitlist(C, T, d);
    else mailFallback(C, T, d);
    var sh = $('[data-share-sheet]', d);
    sh.textContent = T.share;
    sh.addEventListener('click', function () { var m = $('[data-share]'); if (m) m.click(); });
    $('.x', d).addEventListener('click', function () { d.close(); });
    d.addEventListener('click', function (e) {
      if (e.target !== d) return;
      /* фон — это клик вне прямоугольника листа; касание в отступ листа не закрывает его и не стирает набранное */
      var r = d.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close();
    });
    doc.body.appendChild(d);
    btns.forEach(function (a) {
      a.removeAttribute('aria-disabled');
      a.setAttribute('role', 'button');
      a.setAttribute('tabindex', '0');
      a.setAttribute('aria-haspopup', 'dialog');
      var open = function (e) { e.preventDefault(); if (d.showModal) d.showModal(); else d.setAttribute('open', ''); };
      a.addEventListener('click', open);
      a.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') open(e); });
    });
  }


  /* ── сцена «контраст»: чем дальше листаешь, тем больше чужих уведомлений;
     дальше Фокус закрывает приложения — шум разлетается, остаётся «Идёт Аср» ── */
  function scene() {
    var sc = $('.ct-scene');
    if (!sc) return;
    var stage = $('.stage', sc), scr = $('.phone .scr', sc), pill = $('.lockpill', sc);
    var ns = $$('.noise', sc);
    var DIR = [[-1, -0.7], [1, -0.4], [-1, 0.5], [1, 0.8]];
    var cl = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
    function draw(p) {
      var out = cl((p - 0.56) / 0.1);
      ns.forEach(function (n, i) {
        var inn = cl((p - 0.06 - i * 0.1) / 0.035);
        var d = DIR[i];
        n.style.opacity = (inn * (1 - out)).toFixed(3);
        n.style.transform = 'translate(' + (d[0] * out * 180).toFixed(1) + 'px,' + (d[1] * out * 140 + (1 - inn) * 18).toFixed(1) + 'px) rotate(' + (d[0] * out * 9).toFixed(2) + 'deg) scale(' + (0.95 + 0.05 * inn).toFixed(3) + ')';
      });
      var dim = p < 0.56 ? 0.38 * cl(p / 0.5) : 0.38 - 0.3 * out;
      stage.style.setProperty('--d', dim.toFixed(3));
      if (scr) scr.style.setProperty('--sd', (0.6 * (1 - out)).toFixed(3));
      if (pill) { var q = cl((p - 0.7) / 0.1); pill.style.opacity = q.toFixed(3); pill.style.transform = 'translate(-50%,' + ((1 - q) * 8).toFixed(1) + 'px)'; }
    }
    if (still) { draw(1); return; }
    var ticking = false;
    function upd() {
      ticking = false;
      var r = sc.getBoundingClientRect();
      var vh = window.innerHeight;
      if (r.bottom < 0 || r.top > vh) return;
      draw(cl(-r.top / Math.max(1, r.height - (vh - 64))));
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
    window.addEventListener('resize', upd);
    upd();
  }

  /* ── 1. шапка ── */
  function header() {
    var top = $('.top');
    if (!top) return;
    var on = false;
    function set() { var s = window.scrollY > 24; if (s !== on) { on = s; top.classList.toggle('scrolled', s); } }
    window.addEventListener('scroll', set, { passive: true });
    set();
  }

  /* ── появление ── */
  function reveal() {
    var els = $$('.reveal, .rise');
    if (still || !('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('seen'); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('seen'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ── 2. уведомления: новое сверху, старое уходит назад ── */
  function stack() {
    var box = $('.stack');
    if (!box) return;
    var cards = $$('.note-card', box);
    if (cards.length < 2) return;
    var i = 0;
    function draw() {
      cards.forEach(function (c, k) {
        var d = (i - k + cards.length) % cards.length;
        c.setAttribute('data-s', d === 0 ? '0' : d === 1 ? '1' : '2');
        c.setAttribute('aria-hidden', d === 0 ? 'false' : 'true');
      });
    }
    draw();
    if (still) return;
    var timer = null;
    function next() {
      i = (i + 1) % cards.length;
      var c = cards[i];
      c.setAttribute('data-s', 'in');
      void c.offsetWidth;
      requestAnimationFrame(draw);
    }
    function play() { if (!timer) timer = setInterval(next, 3600); }
    function stop() { clearInterval(timer); timer = null; }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { es[0].isIntersecting ? play() : stop(); }).observe(box);
    } else play();
    doc.addEventListener('visibilitychange', function () { doc.hidden ? stop() : play(); });
  }

  /* ── 3. манифест ── */
  function lit() {
    var els = $$('.lit');
    if (!els.length || still) return;
    els.forEach(function (el) {
      var out = doc.createDocumentFragment();
      Array.prototype.slice.call(el.childNodes).forEach(function (n) {
        var hl = n.nodeType === 1 && n.classList.contains('hl');
        n.textContent.split(/(\s+)/).forEach(function (w) {
          if (!w) return;
          if (/^\s+$/.test(w)) { out.appendChild(doc.createTextNode(w)); return; }
          var s = doc.createElement('span');
          s.className = 'wd' + (hl ? ' hl' : '');
          s.textContent = w;
          out.appendChild(s);
        });
      });
      el.setAttribute('aria-label', el.textContent);
      el.textContent = '';
      el.appendChild(out);
    });
    var words = els.map(function (el) { return $$('.wd', el); });
    var ticking = false;
    function draw() {
      ticking = false;
      var vh = window.innerHeight;
      els.forEach(function (el, i) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -vh || r.top > vh * 1.5) return;
        var p = (vh * 0.86 - r.top) / (r.height + vh * 0.2);
        p = Math.max(0, Math.min(1, p));
        var n = Math.round(p * words[i].length);
        words[i].forEach(function (w, k) { w.classList.toggle('on', k < n); });
      });
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(draw); } }, { passive: true });
    window.addEventListener('resize', draw);
    requestAnimationFrame(draw);
  }

  /* ── 5. лента сцен ── */
  function rails() {
    $$('[data-rail]').forEach(function (wrap) {
      var rail = $('.rail', wrap);
      var prev = $('[data-prev]', wrap), next = $('[data-next]', wrap);
      if (!rail || !prev || !next) return;
      function step() { var c = $('.scene', rail); return c ? c.getBoundingClientRect().width + 16 : 300; }
      function upd() {
        prev.disabled = rail.scrollLeft < 8;
        next.disabled = rail.scrollLeft + rail.clientWidth > rail.scrollWidth - 8;
      }
      prev.addEventListener('click', function () { rail.scrollBy({ left: -step(), behavior: still ? 'auto' : 'smooth' }); });
      next.addEventListener('click', function () { rail.scrollBy({ left: step(), behavior: still ? 'auto' : 'smooth' }); });
      rail.addEventListener('scroll', upd, { passive: true });
      window.addEventListener('resize', upd);
      upd();
    });
  }

  /* фото опор: при входе в кадр приближение 1.08 → 1 (только transform) */
  function zoom() {
    var ops = $$('.op');
    if (!ops.length || still) return;
    var ticking = false;
    function draw() {
      ticking = false;
      var vh = window.innerHeight;
      ops.forEach(function (op) {
        var r = op.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var p = Math.max(0, Math.min(1, (vh - r.top) / (vh + r.height * 0.5)));
        op.style.setProperty('--z', (1.08 - p * 0.08).toFixed(4));
      });
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(draw); } }, { passive: true });
    draw();
  }

  /* ── кибла на карточке «Один день»: экран «повернись вправо» сменяется
     «Ты смотришь на киблу», кольцо рамки загорается — как совпадение в руке.
     Повторяется, когда карточка снова входит в кадр. ── */
  function qibla() {
    $$('.qb').forEach(function (p) {
      if (still || !('IntersectionObserver' in window)) { p.classList.add('on'); return; }
      var t = null;
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          clearTimeout(t);
          if (e.isIntersecting) t = setTimeout(function () { p.classList.add('on'); }, 1100);
          else p.classList.remove('on');
        });
      }, { threshold: 0.7 }).observe(p);
    });
  }

  /* ── 6. позвать своих ── */
  function share() {
    var b = $('[data-share]');
    if (!b) return;
    var msg = $('.copied');
    b.addEventListener('click', function () {
      var url = 'https://firdaus.life' + (lang === 'en' ? '/en/' : '/');
      var text = b.getAttribute('data-share');
      if (navigator.share) { navigator.share({ title: 'Firdaus', text: text, url: url }).catch(function () {}); return; }
      var done = function () { if (msg) msg.textContent = lang === 'en' ? 'Link copied. Send it to your people.' : 'Ссылка скопирована. Отправь своим.'; };
      if (navigator.clipboard) navigator.clipboard.writeText(text + ' ' + url).then(done, function () {});
    });
  }

  /* ── 2 и 4. время намаза: грузим библиотеку после отрисовки ── */
  function namaz() {
    var city = pickCity();
    $$('[data-city-name]').forEach(function (n) { n.textContent = city.name; });
    $$('[data-city-gen]').forEach(function (n) { n.textContent = city.gen; });
    var go = function () {
      if (window.FirdausNamaz) return run(city);
      var s = doc.createElement('script');
      s.src = '/assets/adhan-4.4.4.min.js';
      s.onload = function () { var t = doc.createElement('script'); t.src = '/assets/namaz.js'; t.onload = function () { run(city); }; doc.head.appendChild(t); };
      doc.head.appendChild(s);
    };
    if (doc.readyState === 'complete') setTimeout(go, 200);
    else window.addEventListener('load', function () { setTimeout(go, 200); });
  }

  function run(city) {
    var N = window.FirdausNamaz;
    if (!N) return;
    var ymd = N.today(city.tz);
    var t = N.day(city, ymd[0], ymd[1], ymd[2]);
    var tm = N.addDays(ymd, 1);
    var t2 = N.day(city, tm[0], tm[1], tm[2]);
    var friday = N.wd(ymd[0], ymd[1], ymd[2]) === 5;
    var name = function (k) { return k === 'dhuhr' && friday ? NAMES.jumua : NAMES[k]; };

    var rows = $('.times');
    if (rows) {
      rows.innerHTML = '';
      N.KEYS.forEach(function (k) {
        var d = doc.createElement('div');
        d.setAttribute('data-k', k);
        d.innerHTML = '<span></span><b></b>';
        d.firstChild.textContent = name(k);
        d.lastChild.textContent = N.hm(t[k], city.tz);
        rows.appendChild(d);
      });
    }
    $$('[data-t]').forEach(function (n) { var k = n.getAttribute('data-t'); if (t[k]) n.textContent = N.hm(t[k], city.tz); });
    var night = new Date(t.maghrib.getTime() + (t2.fajr - t.maghrib) * 2 / 3);
    $$('[data-night]').forEach(function (n) { n.textContent = N.hm(night, city.tz); });
    var q = N.qibla(city);
    $$('[data-qibla]').forEach(function (n) { n.textContent = Math.round(q) + '°'; });

    var left = $$('[data-left]'), leftl = $$('[data-leftl]'), heroName = $$('[data-next-name]');
    function tick() {
      var now = Date.now();
      var key = null, next = null;
      for (var i = 0; i < ORDER.length; i++) if (t[ORDER[i]].getTime() > now) { key = ORDER[i]; next = t[key]; break; }
      if (!next) { key = 'fajr'; next = t2.fajr; }
      $$('.times div').forEach(function (d) {
        var k = d.getAttribute('data-k');
        d.classList.toggle('now', k === key);
        d.classList.toggle('past', t[k].getTime() <= now && k !== key);
      });
      var s = Math.max(0, Math.floor((next - now) / 1000));
      var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
      var str = h + ':' + (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
      left.forEach(function (n) { n.textContent = str; });
      var nm = name(key);
      heroName.forEach(function (n) { n.textContent = lang === 'ru' ? (GEN[nm] || nm) : nm; });
      var prev = null;
      for (var q = 0; q < ORDER.length; q++) if (t[ORDER[q]].getTime() <= now) prev = ORDER[q];
      if (!prev) prev = 'isha';
      $$('[data-prev-name]').forEach(function (n) { n.textContent = name(prev); });
      $$('[data-next-plain]').forEach(function (n) { n.textContent = nm; });
      $$('[data-next-time]').forEach(function (n) { n.textContent = N.hm(next, city.tz); });
      var fj = t.fajr.getTime() > now ? t.fajr : t2.fajr;
      $$('[data-fajr2]').forEach(function (n) { n.textContent = N.hm(fj, city.tz); });
      leftl.forEach(function (n) { n.textContent = (lang === 'en' ? 'until ' + nm : 'до ' + (GEN[nm] || nm)) + ' · ' + N.hm(next, city.tz); });
    }
    tick();
    setInterval(tick, 1000);
    $$('[data-live]').forEach(function (n) { n.hidden = false; });
  }
})();
