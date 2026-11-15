/*
  Страница для авторов (/creators), вторая редакция 15.11.2026. Встаёт внутрь страницы при сборке.

  ЛИЧНАЯ ССЫЛКА. ?n=Имя&r=reciter&h=ник&l=en&ref=<id>&utm_…  Всё берётся из адреса и живёт
  только в этом браузере: в разметке и на сервере чужих имён нет.
  ЗАЩИТА ОТ ПОДДЕЛКИ ССЫЛКИ: значения ставятся только через textContent, имя — буквы и
  пробелы до 40 знаков и трёх слов, статус — из белого списка ROLES, ник — латиница, цифры,
  точка и подчёркивание до 30. Вставки разметки из адреса нет нигде.

  ЧТО МЕНЯЕТ ЛИЧНАЯ ССЫЛКА: приветствие по имени, плашку «Личное приглашение · статус»,
  первую строку заголовка (аят — чтецу и хафизу, напоминание — имаму, устазу и мечети,
  ролик — остальным), карточку «Ваш статус» и статус в кнопке «Стать автором».

  «СТАТЬ АВТОРОМ». Ссылка ведёт на /creators/apply?status=…&ref=… (работает и без скрипта).
  На iPhone скрипт сначала зовёт приложение (firdaus://creators/apply…): Safari не открывает
  приложение по универсальной ссылке своего же сайта. Не открылось за 1,6 с — запасная страница.

  ВИЗИТЫ считаем сами: одна лёгкая запись в creator-lead без имени, ника и IP (событие visit).
  Метки utm_* и ref кладутся в sessionStorage и переживают переход ru ↔ en.

  Что сделает это неверным: сменится список статусов (тогда же — gen/creators.mjs и
  supabase/functions/creator-lead), адрес функции или цены docs/90 (доли ниже).
*/
(function () {
  var C = window.FIRDAUS || {};
  var D;
  try { D = JSON.parse(document.getElementById('cr-data').textContent); } catch (e) { return; }
  var ROLES = ['reciter', 'imam', 'hafiz', 'ustaz', 'mosque', 'creator', 'public'];
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var text = function (sel, v) { $$(sel).forEach(function (el) { el.textContent = v; }); };
  var ss = {
    get: function () { try { return JSON.parse(sessionStorage.getItem('cr') || '{}') || {}; } catch (e) { return {}; } },
    set: function (o) { try { sessionStorage.setItem('cr', JSON.stringify(o)); } catch (e) { /* частный режим — метки живут в адресе */ } },
  };

  /* ── адрес → чистые значения ── */
  var q = {};
  location.search.replace(/^\?/, '').split('&').forEach(function (p) {
    if (!p) return;
    var i = p.indexOf('='), k = i < 0 ? p : p.slice(0, i), v = i < 0 ? '' : p.slice(i + 1);
    try { q[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' ')); } catch (e) { /* битое кодирование — пропускаем */ }
  });
  function cleanName(v) {
    var s = String(v || '');
    try { s = s.replace(new RegExp('[^\\p{L}\\p{M} .\'’-]', 'gu'), ' '); } catch (e) { s = s.replace(/[^A-Za-zА-Яа-яЁё .'’-]/g, ' '); }
    s = s.replace(/\s+/g, ' ').trim().split(' ').slice(0, 3).join(' ');
    return s.slice(0, 40);
  }
  var cleanNick = function (v) { var s = String(v || '').replace(/^@/, ''); return /^[A-Za-z0-9._]{1,30}$/.test(s) ? s : ''; };
  var cleanTag = function (v, re) { var s = String(v || '').slice(0, 60); return re.test(s) ? s : ''; };
  var saved = ss.get();
  var st = {
    n: cleanName(q.n) || saved.n || '',
    r: ROLES.indexOf(q.r) >= 0 ? q.r : (ROLES.indexOf(saved.r) >= 0 ? saved.r : ''),
    h: cleanNick(q.h) || saved.h || '',
    ref: (/^[A-Za-z0-9-]{1,40}$/.test(q.ref || '') ? q.ref : '') || saved.ref || '',
    sid: saved.sid || (Date.now().toString(36) + Math.random().toString(36).slice(2, 10)),
    seen: saved.seen || {},
  };
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach(function (k) {
    st[k] = cleanTag(q[k], /^[A-Za-z0-9._~-]{1,60}$/) || saved[k] || '';
  });
  ss.set(st);
  var personal = Boolean(st.n || st.r || st.h);

  /* ── учёт визита. Без имени, ника и IP. ── */
  var API = C.supabaseUrl ? C.supabaseUrl + '/functions/v1/creator-lead' : '';
  var onSite = /(^|\.)firdaus\.life$/.test(location.hostname);
  function hit(ev) {
    if (!API || !onSite || st.seen[ev] || navigator.webdriver || /bot|crawl|spider|preview|facebookexternalhit|lighthouse/i.test(navigator.userAgent)) return;
    st.seen[ev] = 1;
    ss.set(st);
    var body = { kind: 'hit', ev: ev, personal: personal, sid: st.sid, lang: D.lang, page: location.pathname.slice(0, 80), ref: st.ref, role: st.r, utm_source: st.utm_source, utm_medium: st.utm_medium, utm_campaign: st.utm_campaign, utm_content: st.utm_content };
    try { fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive: true }).catch(function () {}); } catch (e) { /* учёт не должен ломать страницу */ }
  }

  /* ── личное приглашение ── */
  function applyPerson() {
    if (st.n) text('[data-cr="greet"]', D.greetName.replace('{n}', st.n));
    if (st.r) {
      var R = D.roles[st.r];
      text('[data-cr="role"]', R[0]);
      text('[data-cr="roleText"]', R[1]);
      text('[data-cr="invite"]', $('[data-cr="invite"]') ? $('[data-cr="invite"]').textContent + ' · ' + R[0] : '');
      var w = st.r === 'reciter' || st.r === 'hafiz' ? 'quran' : (st.r === 'imam' || st.r === 'ustaz' || st.r === 'mosque' ? 'talk' : 'video');
      text('[data-cr="what"]', D.what[w]);
      text('[data-cr="tick"]', D.tick[w]);
      $$('[data-cr-roles] [data-role]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-role') === st.r); });
      $$('[data-cr-if="role"]').forEach(function (el) { el.hidden = false; });
      /* чтецу и хафизу — заметка о Коране без границы языка выходит вперёд */
      if (st.r === 'reciter' || st.r === 'hafiz') { var nq = $('[data-cr-note="0"]'); if (nq) nq.classList.add('hl'); }
    }
    if (st.h) {
      var nl = $('[data-cr="nickLine"]');
      if (nl) { nl.textContent = D.stNick.replace('{h}', st.h); nl.hidden = false; }
    }
    if (personal) {
      $$('[data-cr-if="personal"]').forEach(function (el) { el.hidden = false; });
      $$('[data-cr-hide="personal"]').forEach(function (el) { el.hidden = true; });
      /* лично приглашённому — подтверждение ответом в директ, без кода в описании */
      text('[data-cr-p="h"]', D.hPersonal[0]);
      text('[data-cr-p="b"]', D.hPersonal[1]);
    }
    document.documentElement.classList.remove('cr-wait');
  }

  /* ── «Стать автором»: статус и метка в ссылке; на iPhone — сначала приложение ── */
  function joinLinks() {
    var status = st.r || 'author';
    var a = ['status=' + status];
    if (st.ref) a.push('ref=' + st.ref);
    var qs = '?' + a.join('&');
    var ua = navigator.userAgent || '';
    var ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    $$('[data-cr-join]').forEach(function (el) {
      el.href = D.apply + qs;
      el.addEventListener('click', function (e) {
        if (!ios) return;
        e.preventDefault();
        var gone = false;
        var v = function () { if (document.visibilityState === 'hidden') gone = true; };
        document.addEventListener('visibilitychange', v);
        location.href = (C.scheme || 'firdaus://') + 'creators/apply' + qs;
        setTimeout(function () { document.removeEventListener('visibilitychange', v); if (!gone) location.href = D.apply + qs; }, 1600);
      });
    });
  }

  /* язык: кнопка уносит с собой всю ссылку, меняя только l */
  $$('[data-cr-alt]').forEach(function (a) {
    var keep = location.search.replace(/^\?/, '').split('&').filter(function (p) { return p && !/^l=/.test(p); });
    keep.push('l=' + a.getAttribute('data-lang'));
    a.href = D.alt + '?' + keep.join('&');
  });

  /* ── доля партнёра: 20 % чистой выручки с оплаты Plus за месяц (docs/89 §6, цены docs/90 §2).
     Казахстан: 3 790 ₸ − НДС 16 % − Apple 15 % − налог 4 % → 2 666 ₸, 20 % = 533 ₸ (как PER_PAY
     на странице партнёров). Доллары: цена × 0,85 × 0,96 × 0,2. Порядок — как в списке страницы. ── */
  var GROUPS = [
    { per: 533, cur: '₸' },
    { per: 1.63, cur: '$' },
    { per: 2.12, cur: '$' },
    { per: 0.81, cur: '$' },
  ];
  function calc() {
    var box = $('[data-calc]');
    if (!box) return;
    var r = $('[data-calc-range]', box), g = $('[data-calc-g]', box), out = $('[data-calc-out]', box), n = $('[data-calc-n]', box);
    var fmt = function (v) { return Math.round(v).toLocaleString(D.lang === 'en' ? 'en-US' : 'ru-RU').replace(/,/g, D.lang === 'en' ? ',' : ' '); };
    function set() {
      var k = Number(r.value), G = GROUPS[Number(g.value)] || GROUPS[0], sum = k * G.per;
      n.textContent = fmt(k);
      out.textContent = '≈ ' + (G.cur === '$' ? '$' + fmt(sum) : fmt(sum) + ' ₸');
      r.style.setProperty('--p', ((k - r.min) / (r.max - r.min) * 100) + '%');
    }
    r.addEventListener('input', set);
    g.addEventListener('change', set);
    set();
  }

  /* ── появление ── */
  function reveal() {
    var els = $$('.rv');
    if (still || !hasIO) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    els.forEach(function (e) { io.observe(e); });
  }

  /* шапка темнеет, когда страница уехала */
  function header() {
    var top = $('.top'), mark = $('#top-mark');
    if (!top || !mark || !hasIO) return;
    new IntersectionObserver(function (es) { top.classList.toggle('scrolled', !es[0].isIntersecting); }).observe(mark);
  }

  applyPerson();
  joinLinks();
  calc();
  reveal();
  header();
  hit('visit');
})();
