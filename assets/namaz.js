/*
  Firdaus — время намаза на страницах городов (/namaz/…, /en/prayer-times/…,
  /ramadan/…). Один файл на две жизни:

   1. СБОРКА (node, gen/pages.mjs) считает им статический текст и таблицы,
      чтобы поисковик видел время без скрипта.
   2. БРАУЗЕР пересчитывает то же самое на сегодняшний день человека, ведёт
      отсчёт до следующего намаза, листает месяцы и включает компас киблы.

  Строки таблиц собирают одни и те же функции в обоих местах — разъехаться
  статике и живому виду нечем.

  МЕТОД — КАК В ПРИЛОЖЕНИИ. Библиотека та же (adhan 4.4.4, лежит рядом), пресеты
  стран повторяют mobile/src/lib/method.ts строка в строку, параметры собираются
  как buildParams в mobile/src/lib/prayer.ts. Расхождение с приложением ловит
  site/sverka-namaz.mjs (его зовёт check.mjs): пресеты против method.ts и время
  против таблицы ДУМК и официальных строк table.test.mjs.

  Что сделает это неверным: приложение сменит библиотеку или пресет страны —
  тогда поправить PRESETS ниже (сверка упадёт и назовёт страну).
*/
(function (G) {
  'use strict';
  var A = G.adhan;
  if (!A) return;

  /* ── пресеты стран: копия method.ts (PRESETS), только нужные сайту ── */
  var PRESETS = {
    KZ: { method: 'NorthAmerica', hanafi: true, high: 'angle', ihtiyat: 'dumk' },
    KG: { method: 'MuslimWorldLeague', hanafi: true, angles: { fajr: 18, isha: 16 }, offsets: { maghrib: 7 } },
    UZ: { method: 'MuslimWorldLeague', hanafi: true },
    TJ: { method: 'MuslimWorldLeague', hanafi: true },
    RU: { method: 'MuslimWorldLeague', hanafi: false, high: 'angle', angles: { fajr: 18, isha: 15 }, offsets: { sunrise: -4, dhuhr: 5, maghrib: 5 } },
    AZ: { method: 'MuslimWorldLeague', hanafi: true, angles: { fajr: 16, isha: 15 }, offsets: { maghrib: 16 } },
    TR: { method: 'Turkey', hanafi: false },
    AE: { method: 'Dubai', hanafi: false },
    GB: { method: 'MoonsightingCommittee', hanafi: false },
    US: { method: 'NorthAmerica', hanafi: false },
  };
  var FALLBACK = { method: 'MuslimWorldLeague', hanafi: false };
  /* Запас ДУМК — DUMK_IHTIYAT в method.ts, разбор в docs/93-vremya-dumk.md. */
  var DUMK = { fromLat: 48, south: { sunrise: -3, dhuhr: 2, asr: 3, maghrib: 3 }, north: { sunrise: -5, dhuhr: 4, asr: 5, maghrib: 5 } };
  var KEYS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
  var KAABA = { lat: 21.4225, lon: 39.8262 };

  function preset(city) {
    var p = PRESETS[city.cc] || FALLBACK;
    var out = {};
    for (var k in p) out[k] = p[k];
    if (city.hanafi != null) out.hanafi = city.hanafi;
    return out;
  }

  function params(p, city, hanafi) {
    var prm = A.CalculationMethod[p.method]();
    if (p.angles) { prm.fajrAngle = p.angles.fajr; prm.ishaAngle = p.angles.isha; prm.ishaInterval = 0; }
    prm.madhab = hanafi ? A.Madhab.Hanafi : A.Madhab.Shafi;
    prm.highLatitudeRule = p.high === 'angle' ? A.HighLatitudeRule.TwilightAngle : A.HighLatitudeRule.recommended(new A.Coordinates(city.lat, city.lon));
    var off = p.offsets || {};
    for (var i = 0; i < KEYS.length; i++) prm.adjustments[KEYS[i]] = off[KEYS[i]] || 0;
    if (p.ihtiyat === 'dumk' && p.method === 'NorthAmerica') {
      var add = Math.abs(city.lat) >= DUMK.fromLat ? DUMK.north : DUMK.south;
      for (var key in add) prm.adjustments[key] += add[key];
    }
    return prm;
  }

  /** Время на гражданские сутки y-m-d (месяц с 1). Возвращает моменты Date. */
  function day(city, y, m, d, opts) {
    var p = preset(city);
    var hanafi = opts && opts.hanafi != null ? opts.hanafi : p.hanafi;
    var t = new A.PrayerTimes(new A.Coordinates(city.lat, city.lon), new Date(y, m - 1, d), params(p, city, hanafi));
    var out = {};
    for (var i = 0; i < KEYS.length; i++) out[KEYS[i]] = t[KEYS[i]];
    return out;
  }

  var fmtCache = {};
  function fmt(tz, lang, o) {
    var key = tz + lang + JSON.stringify(o);
    if (!fmtCache[key]) { var oo = { timeZone: tz }; for (var k in o) oo[k] = o[k]; fmtCache[key] = new Intl.DateTimeFormat(lang, oo); }
    return fmtCache[key];
  }
  function parts(f, date) {
    var r = {};
    f.formatToParts(date).forEach(function (x) { r[x.type] = x.value; });
    return r;
  }
  /** «05:20» в поясе города. */
  function hm(date, tz) {
    var p = parts(fmt(tz, 'en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }), date);
    return p.hour + ':' + p.minute;
  }
  /** Сегодняшние сутки города: [год, месяц, число]. */
  function today(tz, now) {
    var p = parts(fmt(tz, 'en-US', { year: 'numeric', month: 'numeric', day: 'numeric' }), now || new Date());
    return [Number(p.year), Number(p.month), Number(p.day)];
  }
  /* Полдень UTC — безопасная точка, чтобы спросить у Intl про дату. */
  function noon(y, m, d) { return new Date(Date.UTC(y, m - 1, d, 12)); }
  function addDays(ymd, n) {
    var t = noon(ymd[0], ymd[1], ymd[2]);
    t.setUTCDate(t.getUTCDate() + n);
    return [t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()];
  }
  function daysIn(y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); }
  function wd(y, m, d) { return noon(y, m, d).getUTCDay(); }

  var L = {
    ru: {
      names: { fajr: 'Фаджр', sunrise: 'Восход', dhuhr: 'Зухр', asr: 'Аср', maghrib: 'Магриб', isha: 'Иша' },
      friday: 'Джума', date: 'Дата', day: 'День', suhur: 'Сухур до', iftar: 'Ифтар', fast: 'Пост',
      h: 'ч', min: 'мин', next: 'Следующий намаз', in: 'через', now: 'сейчас', maybe: 'если месяц полный',
      tomorrow: 'завтра',
    },
    en: {
      names: { fajr: 'Fajr', sunrise: 'Sunrise', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' },
      friday: "Jumu'ah", date: 'Date', day: 'Day', suhur: 'Suhoor ends', iftar: 'Iftar', fast: 'Fast',
      h: 'h', min: 'min', next: 'Next prayer', in: 'in', now: 'now', maybe: 'if the month has 30 days',
      tomorrow: 'tomorrow',
    },
  };
  function dateLabel(lang, y, m, d) {
    var f = fmt('UTC', lang === 'ru' ? 'ru-RU' : 'en-GB', { day: 'numeric', month: 'short', weekday: 'short' });
    var p = parts(f, noon(y, m, d));
    var mon = (p.month || '').replace('.', '');
    return '<span class="d">' + p.day + '<span class="mo"> ' + mon + '</span></span> <span class="w">' + p.weekday.replace('.', '') + '</span>';
  }
  function iso(y, m, d) { return y + '-' + (m < 10 ? '0' : '') + m + '-' + (d < 10 ? '0' : '') + d; }
  function dur(ms, lang) {
    var mins = Math.round(ms / 60000);
    return Math.floor(mins / 60) + ' ' + L[lang].h + ' ' + (mins % 60) + ' ' + L[lang].min;
  }

  /** Строки расписания: from — [г,м,ч], n дней. todayYmd подсвечивает сегодня. */
  function rows(city, from, n, lang, todayYmd) {
    var out = '';
    var t = todayYmd ? iso(todayYmd[0], todayYmd[1], todayYmd[2]) : '';
    for (var i = 0; i < n; i++) {
      var x = addDays(from, i);
      var tm = day(city, x[0], x[1], x[2]);
      var cls = [];
      if (iso(x[0], x[1], x[2]) === t) cls.push('now');
      if (wd(x[0], x[1], x[2]) === 5) cls.push('fri');
      out += '<tr' + (cls.length ? ' class="' + cls.join(' ') + '"' : '') + '><th scope="row">' + dateLabel(lang, x[0], x[1], x[2]) + '</th>';
      for (var k = 0; k < KEYS.length; k++) out += '<td>' + hm(tm[KEYS[k]], city.tz) + '</td>';
      out += '</tr>';
    }
    return out;
  }
  function monthRows(city, y, m, lang, todayYmd) { return rows(city, [y, m, 1], daysIn(y, m), lang, todayYmd); }
  function monthName(lang, y, m) {
    var name = fmt('UTC', lang === 'ru' ? 'ru-RU' : 'en-GB', { month: 'long' }).format(noon(y, m, 1));
    return name + ' ' + y;
  }

  /* Рамадан 1448 по Умм аль-Кура: 1-й день — 8 февраля 2027, 29 дней; 30-я
     строка — на случай полного месяца (кончается он по луне, заранее не
     знает никто). Дату объявляют ведомства — тексты страниц так и говорят. */
  var RAMADAN = { start: [2027, 2, 8], days: 29, maybe: 30 };
  function ramadanRows(city, lang, todayYmd) {
    var out = '';
    var t = todayYmd ? iso(todayYmd[0], todayYmd[1], todayYmd[2]) : '';
    for (var i = 0; i < RAMADAN.maybe; i++) {
      var x = addDays(RAMADAN.start, i);
      var tm = day(city, x[0], x[1], x[2]);
      var cls = [];
      if (iso(x[0], x[1], x[2]) === t) cls.push('now');
      if (i >= RAMADAN.days) cls.push('maybe');
      out += '<tr' + (cls.length ? ' class="' + cls.join(' ') + '"' : '') + '><td class="n">' + (i + 1) + '</td><th scope="row">' + dateLabel(lang, x[0], x[1], x[2]) +
        (i >= RAMADAN.days ? '<small>' + L[lang].maybe + '</small>' : '') + '</th><td>' + hm(tm.fajr, city.tz) + '</td><td>' + hm(tm.maghrib, city.tz) + '</td><td class="dur">' + dur(tm.maghrib - tm.fajr, lang) + '</td></tr>';
    }
    return out;
  }

  function qibla(city) { return A.Qibla(new A.Coordinates(city.lat, city.lon)); }
  function distanceKm(a, b) {
    var R = 6371, r = Math.PI / 180;
    var dLat = (b.lat - a.lat) * r, dLon = (b.lon - a.lon) * r;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  function toMecca(city) { return distanceKm(city, KAABA); }
  /** Хиджра по Умм аль-Кура — тот же календарь, что на главном экране приложения. */
  function hijri(lang, y, m, d) {
    try {
      var p = parts(fmt('UTC', (lang === 'ru' ? 'ru' : 'en') + '-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' }), noon(y, m, d));
      return p.day + ' ' + p.month + ' ' + p.year.replace(/\D/g, '');
    } catch (e) { return ''; }
  }

  var API = {
    KEYS: KEYS, PRESETS: PRESETS, DUMK: DUMK, RAMADAN: RAMADAN, KAABA: KAABA, L: L,
    preset: preset, day: day, hm: hm, today: today, addDays: addDays, daysIn: daysIn, wd: wd, iso: iso, dur: dur,
    rows: rows, monthRows: monthRows, monthName: monthName, ramadanRows: ramadanRows,
    qibla: qibla, distanceKm: distanceKm, toMecca: toMecca, hijri: hijri, dateLabel: dateLabel,
  };
  G.FirdausNamaz = API;

  /* ───────────────────────── страница в браузере ───────────────────────── */
  if (typeof document === 'undefined') return;
  var cfgEl = document.getElementById('namaz-city');
  if (!cfgEl) return;
  var city;
  try { city = JSON.parse(cfgEl.textContent); } catch (e) { return; }
  var lang = city.lang === 'en' ? 'en' : 'ru';
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  var todayYmd = today(city.tz);
  var stamp = iso(todayYmd[0], todayYmd[1], todayYmd[2]);
  var page = document.documentElement.getAttribute('data-built');

  /* 1. Сегодня: страница собрана в другие сутки — пересчитать текст. */
  var times = day(city, todayYmd[0], todayYmd[1], todayYmd[2]);
  if (page !== stamp) {
    KEYS.forEach(function (k) { $$('[data-t="' + k + '"]').forEach(function (n) { n.textContent = hm(times[k], city.tz); }); });
    var alt = $('[data-t="asr-alt"]');
    if (alt) alt.textContent = hm(day(city, todayYmd[0], todayYmd[1], todayYmd[2], { hanafi: !preset(city).hanafi }).asr, city.tz);
    var dl = $('[data-today-label]');
    if (dl) {
      var f = new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
      var h = hijri(lang, todayYmd[0], todayYmd[1], todayYmd[2]);
      dl.textContent = f.format(noon(todayYmd[0], todayYmd[1], todayYmd[2])).replace(/\s*г\.$/, '') + (h ? ' · ' + h : '');
    }
  }

  /* 2. Текущий и следующий намаз, отсчёт. Восход — не намаз: после него
        «сейчас» никого, следующий — Зухр. */
  var cells = {};
  $$('.today [data-k]').forEach(function (n) { cells[n.getAttribute('data-k')] = n; });
  var nextEl = $('[data-next]');
  function tick() {
    var now = new Date();
    var ymd = today(city.tz, now);
    if (iso(ymd[0], ymd[1], ymd[2]) !== stamp) { location.reload(); return; }
    var cur = null, nxt = null;
    var order = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
    for (var i = 0; i < order.length; i++) {
      if (times[order[i]] <= now) cur = order[i];
      else if (!nxt) nxt = order[i];
    }
    if (cur === 'sunrise') cur = null;
    /* до Фаджра ещё идёт время вчерашней Иши */
    if (!cur && nxt === 'fajr') cur = 'isha';
    if (nxt === 'sunrise') nxt = 'dhuhr';
    Object.keys(cells).forEach(function (k) {
      cells[k].classList.toggle('cur', k === cur);
      cells[k].classList.toggle('nxt', k === nxt);
    });
    if (!nextEl) return;
    var target, name;
    if (nxt) { target = times[nxt]; name = L[lang].names[nxt]; }
    else {
      var tm = addDays(ymd, 1);
      target = day(city, tm[0], tm[1], tm[2]).fajr;
      name = L[lang].names.fajr + ' (' + L[lang].tomorrow + ')';
    }
    var left = Math.max(0, target - now);
    var mins = Math.ceil(left / 60000);
    var str = mins >= 60 ? Math.floor(mins / 60) + ' ' + L[lang].h + ' ' + (mins % 60) + ' ' + L[lang].min : mins + ' ' + L[lang].min;
    nextEl.innerHTML = L[lang].next + ': <b>' + name + '</b> ' + L[lang].in + ' <b class="num">' + str + '</b> · ' + hm(target, city.tz);
    nextEl.hidden = false;
  }
  if (cells.fajr) { tick(); setInterval(tick, 30000); }

  /* 3. Неделя / месяц и листание месяцев. */
  var body = $('[data-sched]');
  var label = $('[data-month-label]');
  var shown = [todayYmd[0], todayYmd[1]];
  var mode = 'month';
  function draw() {
    if (!body) return;
    if (mode === 'week') {
      body.innerHTML = rows(city, todayYmd, 7, lang, todayYmd);
    } else {
      body.innerHTML = monthRows(city, shown[0], shown[1], lang, todayYmd);
    }
    if (label) label.textContent = mode === 'week' ? '' : monthName(lang, shown[0], shown[1]);
    $$('[data-mode]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-mode') === mode)); });
    $$('[data-step]').forEach(function (b) { b.hidden = mode === 'week'; });
  }
  if (body) {
    if (page !== stamp) draw();
    $$('[data-mode]').forEach(function (b) {
      b.addEventListener('click', function () { mode = b.getAttribute('data-mode'); draw(); });
    });
    $$('[data-step]').forEach(function (b) {
      b.addEventListener('click', function () {
        var s = Number(b.getAttribute('data-step'));
        var m = shown[1] + s;
        shown = [shown[0] + (m > 12 ? 1 : m < 1 ? -1 : 0), ((m + 11) % 12) + 1];
        mode = 'month';
        draw();
      });
    });
  }

  /* 4. Рамадан: подсветка дня и отсчёт. */
  var rBody = $('[data-ramadan]');
  if (rBody && page !== stamp) rBody.innerHTML = ramadanRows(city, lang, todayYmd);
  var rLeft = $('[data-ramadan-left]');
  if (rLeft) {
    var start = noon(RAMADAN.start[0], RAMADAN.start[1], RAMADAN.start[2]);
    var diff = Math.round((start - noon(todayYmd[0], todayYmd[1], todayYmd[2])) / 864e5);
    if (diff > 0) rLeft.textContent = lang === 'ru' ? plural(diff, 'день', 'дня', 'дней') : diff + (diff === 1 ? ' day' : ' days');
  }
  function plural(n, a, b, c) {
    var m10 = n % 10, m100 = n % 100;
    return n + ' ' + (m10 === 1 && m100 !== 11 ? a : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? b : c);
  }

  /* 5. Компас киблы. iPhone спрашивает разрешение по нажатию; без датчика
        кнопку не показываем — остаётся градус и рисунок. */
  var dial = $('[data-dial]');
  var go = $('[data-compass]');
  var hint = $('[data-compass-hint]');
  if (dial && go && 'DeviceOrientationEvent' in window && window.matchMedia && matchMedia('(pointer: coarse)').matches) {
    go.hidden = false;
    go.addEventListener('click', function () {
      var start = function () {
        var on = function (e) {
          var hd = typeof e.webkitCompassHeading === 'number' ? e.webkitCompassHeading : e.absolute && e.alpha != null ? 360 - e.alpha : null;
          if (hd == null) return;
          dial.style.transform = 'rotate(' + -hd + 'deg)';
          if (hint) hint.hidden = false;
        };
        window.addEventListener('ontouchstart' in window && 'ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation', on);
        go.hidden = true;
      };
      var D = window.DeviceOrientationEvent;
      if (D && typeof D.requestPermission === 'function') D.requestPermission().then(function (r) { if (r === 'granted') start(); }).catch(function () {});
      else start();
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);
