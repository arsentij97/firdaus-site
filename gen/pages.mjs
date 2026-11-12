/*
  Страницы городов: node gen/pages.mjs <папка сайта>

  Пишет в папку:
    /namaz/<город>.html, /namaz/index.html               — время намаза, ru
    /en/prayer-times/<city>.html, /en/prayer-times/index — то же, en
    /ramadan/<город>.html, /ramadan/index.html           — Рамадан 2027, ru
    /en/ramadan/<city>.html, /en/ramadan/index.html      — то же, en
  и обновляет в ней sitemap.xml и llms.txt между метками gen:start / gen:end.

  Зовут его двое: site/build.mjs при выкладке и ежедневная задача в
  репозитории сайта (gen/daily.yml) — статический текст «сегодня» и таблица
  месяца для поисковика должны быть свежими. В браузере время всё равно
  пересчитывает assets/namaz.js на день человека.

  «Сегодня» у каждого города — свои сутки по его поясу: задача идёт в 19:05
  UTC, это полночь в Казахстане и ещё день в Лондоне.
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CITIES, COUNTRIES } from './cities.mjs';
import { render, root } from './render.mjs';

const SITE = 'https://firdaus.life';
const APPSTORE = 'https://apps.apple.com/app/id6806738733';

/* ── расчёт: тот же файл, что в браузере ── */
export function loadCalc(dir = root) {
  if (globalThis.FirdausNamaz) return globalThis.FirdausNamaz;
  const code = fs.readFileSync(path.join(dir, 'assets/adhan-4.4.4.min.js'), 'utf8');
  const ex = {};
  new Function('exports', 'module', 'define', code)(ex, { exports: ex }, undefined);
  globalThis.adhan = ex;
  new Function(fs.readFileSync(path.join(dir, 'assets/namaz.js'), 'utf8'))();
  return globalThis.FirdausNamaz;
}
const N = loadCalc();

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const LOC = { ru: 'ru-RU', en: 'en-GB' };
const noon = (y, m, d) => new Date(Date.UTC(y, m - 1, d, 12));
const fmtDate = (lang, ymd, o) => new Intl.DateTimeFormat(LOC[lang], { timeZone: 'UTC', ...o }).format(noon(...ymd)).replace(/\s*г\.$/, '');
const longDate = (lang, ymd) => fmtDate(lang, ymd, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const dayMonth = (lang, ymd) => fmtDate(lang, ymd, { day: 'numeric', month: 'long' });
const monthOnly = (lang, ymd) => fmtDate(lang, ymd, { month: 'long' });
const num = (lang, n) => new Intl.NumberFormat(LOC[lang]).format(n);
const mins = (d, tz) => { const [h, m] = N.hm(d, tz).split(':').map(Number); return h * 60 + m; };
const offsetLabel = (tz, at) => {
  const p = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' }).formatToParts(at).find((x) => x.type === 'timeZoneName')?.value ?? '';
  return p.replace('GMT', 'UTC') || 'UTC';
};

/* ── адреса ── */
const URL = {
  namaz: (c, lang) => (lang === 'ru' ? `/namaz/${c.slug}` : `/en/prayer-times/${c.slug}`),
  ramadan: (c, lang) => (lang === 'ru' ? `/ramadan/${c.slug}` : `/en/ramadan/${c.slug}`),
  hub: (kind, lang) => (kind === 'namaz' ? (lang === 'ru' ? '/namaz/' : '/en/prayer-times/') : lang === 'ru' ? '/ramadan/' : '/en/ramadan/'),
};
const FILE = (u) => (u.endsWith('/') ? u.slice(1) + 'index.html' : u.slice(1) + '.html');

/* ── метод: короткое имя, полный текст, сверка ── */
const MADHAB = { ru: (h) => (h ? 'Аср по ханафитскому мазхабу' : 'Аср по шафиитскому мазхабу'), en: (h) => (h ? 'Hanafi Asr' : 'Standard (Shafi) Asr') };
function method(c, lang) {
  const p = N.preset(c);
  const ru = lang === 'ru';
  const add = Math.abs(c.lat) >= N.DUMK.fromLat ? N.DUMK.north : N.DUMK.south;
  const M = {
    KZ: {
      short: ru ? 'ДУМК' : 'DUMK',
      auth: ru ? 'ДУМК' : 'DUMK',
      text: ru
        ? `Время посчитано по методу ДУМК — Духовного управления мусульман Казахстана: Фаджр и Иша — когда солнце на 15° под горизонтом, Аср по ханафитскому мазхабу (тень вдвое длиннее предмета). Сверху — запас ведомства (ихтият): восход на ${-add.sunrise} мин раньше, Зухр на ${add.dhuhr} мин, Аср и Магриб на ${add.asr} мин позже астрономического момента${c.lat >= 48 ? ' — так ДУМК считает севернее 48° широты' : ''}.`
        : `Times follow the method of DUMK, the Spiritual Administration of Muslims of Kazakhstan: Fajr and Isha at 15° below the horizon, Hanafi Asr (shadow twice the object's length), plus DUMK's safety margin (ihtiyat): sunrise ${-add.sunrise} min earlier, Dhuhr ${add.dhuhr} min, Asr and Maghrib ${add.asr} min later than the astronomical moment${c.lat >= 48 ? ' — the margin DUMK uses north of 48° latitude' : ''}.`,
      check: ru
        ? 'Сверено с таблицей ДУМК по шести городам на каждый день 2026 и 2027 годов: расхождение не больше минуты.'
        : 'Checked against the official DUMK timetable for six cities, every day of 2026 and 2027: within one minute.',
    },
    KG: {
      short: ru ? 'ДУМ Кыргызстана' : 'Muftiate of Kyrgyzstan',
      auth: ru ? 'ДУМ Кыргызстана' : 'the Muftiate of Kyrgyzstan',
      text: ru
        ? 'Время посчитано как в таблице Духовного управления мусульман Кыргызстана: Фаджр при 18°, Иша при 16° под горизонтом, Аср по ханафитскому мазхабу, Магриб через 7 минут после заката — такой запас печатает сам муфтият.'
        : 'Times follow the timetable of the Spiritual Administration of Muslims of Kyrgyzstan: Fajr at 18°, Isha at 16°, Hanafi Asr, Maghrib 7 minutes after sunset — the margin the Muftiate itself publishes.',
      check: ru ? 'Сверено с таблицей муфтията по Бишкеку и Ошу: расхождение до двух минут.' : 'Checked against the Muftiate timetable for Bishkek and Osh: within two minutes.',
    },
    UZ: {
      short: ru ? 'Всемирная исламская лига' : 'Muslim World League',
      text: ru ? 'Время посчитано по методу Всемирной исламской лиги: Фаджр при 18°, Иша при 17° под горизонтом, Аср по ханафитскому мазхабу.' : 'Times follow the Muslim World League method: Fajr at 18°, Isha at 17°, Hanafi Asr.',
    },
    TJ: {
      short: ru ? 'Всемирная исламская лига' : 'Muslim World League',
      text: ru ? 'Время посчитано по методу Всемирной исламской лиги: Фаджр при 18°, Иша при 17° под горизонтом, Аср по ханафитскому мазхабу.' : 'Times follow the Muslim World League method: Fajr at 18°, Isha at 17°, Hanafi Asr.',
    },
    RU: {
      short: ru ? 'Совет муфтиев России' : 'Council of Muftis of Russia',
      auth: ru ? 'Совет муфтиев России' : 'the Council of Muftis of Russia',
      text: ru
        ? `Время посчитано по углам Совета муфтиев России: Фаджр при 18°, Иша при 15° под горизонтом; восход на 4 минуты раньше, Зухр и Магриб на 5 минут позже астрономического момента. ${c.hanafi ? 'Аср — по ханафитскому мазхабу, как в таблице ДУМ Республики Татарстан.' : 'Аср — по шафиитскому мазхабу (одна тень), ханафитский — строкой под временем.'}`
        : `Times follow the angles of the Council of Muftis of Russia: Fajr at 18°, Isha at 15°; sunrise 4 minutes earlier, Dhuhr and Maghrib 5 minutes later than the astronomical moment. ${c.hanafi ? 'Asr is Hanafi, as in the timetable of the Muftiate of Tatarstan.' : 'Asr is standard (one shadow); the Hanafi Asr is shown under the times.'}`,
      check: c.hanafi
        ? ru ? 'В приложении Firdaus для Татарстана есть официальная таблица ДУМ РТ; расчёт на этой странице может отличаться от неё на несколько минут.' : 'In the Firdaus app, Tatarstan gets the official timetable of the Muftiate of Tatarstan; this page is calculated and may differ from it by a few minutes.'
        : ru ? 'Углы сверены с таблицей Совета муфтиев России по Москве; в других городах и сезонах возможна разница в пару минут.' : 'The angles were checked against the Council of Muftis of Russia timetable for Moscow; other cities and seasons may differ by a couple of minutes.',
    },
    AZ: {
      short: ru ? 'Управление мусульман Кавказа' : 'Caucasus Muslims Board',
      text: ru
        ? 'Время посчитано как в таблице Управления мусульман Кавказа: Фаджр при 16°, Иша при 15° под горизонтом, Аср по ханафитскому мазхабу, Магриб через 16 минут после заката — такой запас стоит в таблице управления.'
        : 'Times follow the Caucasus Muslims Board timetable: Fajr at 16°, Isha at 15°, Hanafi Asr, Maghrib 16 minutes after sunset — the margin printed in the Board’s own timetable.',
      check: ru ? 'Сверено с таблицей управления: расхождение до двух минут.' : 'Checked against the Board’s timetable: within two minutes.',
    },
    TR: {
      short: ru ? 'Диянет' : 'Diyanet',
      text: ru ? 'Время посчитано по методу Диянета — Управления по делам религии Турции; Аср по одной тени, как в таблице Диянета.' : 'Times follow the method of Diyanet, Türkiye’s Presidency of Religious Affairs; Asr by one shadow, as in the Diyanet timetable.',
      check: ru ? 'Сверено с таблицей Диянета: расхождение до двух минут. В приложении Firdaus для Турции есть сама таблица Диянета.' : 'Checked against the Diyanet timetable: within two minutes. In the Firdaus app, Türkiye gets the Diyanet timetable itself.',
    },
    AE: {
      short: ru ? 'Метод ОАЭ' : 'UAE method',
      text: ru ? 'Время посчитано по методу, принятому в ОАЭ: Фаджр и Иша при 18,2° под горизонтом, с поправками в 3 минуты на восход, Зухр, Аср и Магриб.' : 'Times follow the method used in the UAE: Fajr and Isha at 18.2° below the horizon, with 3-minute adjustments to sunrise, Dhuhr, Asr and Maghrib.',
    },
    GB: {
      short: 'Moonsighting Committee',
      text: ru ? 'Время посчитано по методу Moonsighting Committee Worldwide: Фаджр и Иша при 18° с сезонной поправкой для северных широт — летом в Британии солнце не опускается так низко.' : 'Times follow the Moonsighting Committee Worldwide method: Fajr and Isha at 18° with a seasonal adjustment for northern latitudes — in a British summer the sun never sinks that low.',
    },
    US: {
      short: 'ISNA',
      text: ru ? 'Время посчитано по методу ISNA — Исламского общества Северной Америки: Фаджр и Иша при 15° под горизонтом.' : 'Times follow the ISNA method (Islamic Society of North America): Fajr and Isha at 15° below the horizon.',
    },
  }[c.cc];
  const fallbackCheck = ru
    ? 'Это расчёт по общепринятому методу. Расписание твоей мечети может отличаться на несколько минут — в приложении метод и мазхаб меняются в настройках.'
    : 'This is a calculation by a widely used method. Your mosque’s timetable may differ by a few minutes — the app lets you change the method and madhab.';
  return { short: M.short, madhab: MADHAB[lang](p.hanafi), text: M.text, check: M.check ?? fallbackCheck, hanafi: p.hanafi };
}

/* ── шапка и подвал ── */
const NAV = {
  ru: (cur) => `<a href="/namaz/"${cur === 'namaz' ? ' aria-current="page"' : ''}>Время намаза</a>
      <a href="/ramadan/"${cur === 'ramadan' ? ' aria-current="page"' : ''}>Рамадан 2027</a>
      <a href="/#features">Возможности</a>
      <a href="/support">Поддержка</a>`,
  en: (cur) => `<a href="/en/prayer-times/"${cur === 'namaz' ? ' aria-current="page"' : ''}>Prayer times</a>
      <a href="/en/ramadan/"${cur === 'ramadan' ? ' aria-current="page"' : ''}>Ramadan 2027</a>
      <a href="/en/#features">Features</a>
      <a href="/en/support">Support</a>`,
};
const appBtn = (lang, cls = 'btn') =>
  lang === 'ru'
    ? `<a class="${cls}" href="${APPSTORE}" data-link="appstore" data-soon="Скоро в App Store"><span data-label>${cls.includes('sm') ? 'App Store' : 'Загрузить в App Store'}</span></a>`
    : `<a class="${cls}" href="${APPSTORE}" data-link="appstore" data-soon="Coming soon to the App Store"><span data-label>${cls.includes('sm') ? 'App Store' : 'Download on the App Store'}</span></a>`;

function header(lang, cur, other) {
  const ru = lang === 'ru';
  return `<div id="top-mark" aria-hidden="true"></div>
<header class="top">
  <div class="wrap">
    <a class="lockup" href="${ru ? '/' : '/en/'}" aria-label="${ru ? 'Firdaus, на главную' : 'Firdaus home'}"><img src="/assets/logo-68.webp" width="34" height="34" alt="">Firdaus</a>
    <nav aria-label="${ru ? 'Разделы' : 'Sections'}">
      ${NAV[lang](cur)}
    </nav>
    ${ru ? `<a class="chip" href="${other}" data-lang="en" hreflang="en" lang="en">EN<span class="sr"> Read in English</span></a>` : `<a class="chip" href="${other}" data-lang="ru" hreflang="ru" lang="ru">RU<span class="sr"> Читать по-русски</span></a>`}
    ${appBtn(lang, 'btn sm')}
  </div>
</header>`;
}
function footer(lang) {
  const ru = lang === 'ru';
  return `<footer class="foot">
  <div class="wrap">
    <div class="foot-grid">
      ${ru
        ? '<a href="/namaz/">Время намаза</a>\n      <a href="/ramadan/">Рамадан 2027</a>\n      <a href="/about">О Firdaus</a>\n      <a href="/partners">Партнёрам</a>\n      <a href="/support">Поддержка</a>\n      <a href="/privacy">Политика конфиденциальности</a>\n      <a href="/terms">Условия</a>'
        : '<a href="/en/prayer-times/">Prayer times</a>\n      <a href="/en/ramadan/">Ramadan 2027</a>\n      <a href="/en/about">About Firdaus</a>\n      <a href="/en/partners">Partners</a>\n      <a href="/en/support">Support</a>\n      <a href="/en/privacy">Privacy Policy</a>\n      <a href="/en/terms">Terms</a>'}
      <span class="sp"></span>
      <span>© 2026 Firdaus</span>
    </div>
    <p>${ru ? 'Firdaus: приложение для iPhone. Apple, iPhone и App Store являются товарными знаками Apple Inc.' : 'Firdaus is an iPhone app. Apple, iPhone and App Store are trademarks of Apple Inc.'}</p>
  </div>
</footer>`;
}

function head({ lang, title, desc, url, ru, en, og, built, ld, calc = true }) {
  return `<!doctype html>
<html lang="${lang}" data-built="${built}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE}${url}">
<link rel="alternate" hreflang="ru" href="${SITE}${ru}">
<link rel="alternate" hreflang="en" href="${SITE}${en}">
<link rel="alternate" hreflang="x-default" href="${SITE}${en}">
<meta name="theme-color" content="#0A0A0A">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Firdaus">
<meta property="og:locale" content="${lang === 'ru' ? 'ru_RU' : 'en_US'}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${SITE}${url}">
<meta property="og:image" content="${SITE}/assets/og/${og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${SITE}/assets/og/${og}">
<link rel="icon" type="image/png" href="/assets/favicon-48.png">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<link rel="stylesheet" href="/assets/site.css">
<link rel="stylesheet" href="/assets/namaz.css">
<script src="/assets/site.js"></script>
${calc ? '<script defer src="/assets/adhan-4.4.4.min.js"></script>\n<script defer src="/assets/namaz.js"></script>\n' : ''}<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>`;
}

const crumbs = (lang, items) =>
  `<nav class="crumbs" aria-label="${lang === 'ru' ? 'Навигация' : 'Breadcrumb'}">${items
    .map(([name, href], i) => (i < items.length - 1 ? `<a href="${href}">${esc(name)}</a><span aria-hidden="true">/</span>` : `<span aria-current="page">${esc(name)}</span>`))
    .join('')}</nav>`;
const crumbsLd = (items) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, href], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE + href })),
});
const faqHtml = (qs) => qs.map((q) => `<details class="q"${q.lang ? ` lang="${q.lang}"` : ''}><summary>${esc(q.q)}</summary><div class="a"><p>${q.a}</p></div></details>`).join('\n  ');
const strip = (h) => h.replace(/<[^>]+>/g, '');
const faqLd = (qs) => ({
  '@type': 'FAQPage',
  mainEntity: qs.map((q) => ({ '@type': 'Question', name: q.q, ...(q.lang ? { inLanguage: q.lang } : {}), acceptedAnswer: { '@type': 'Answer', text: strip(q.a) } })),
});
const placeLd = (c, lang, url) => ({
  '@type': 'Place',
  '@id': SITE + url + '#place',
  name: lang === 'ru' ? c.ru : c.en,
  alternateName: [...new Set([c.alt?.[lang], c.kk, lang === 'ru' ? c.en : c.ru].filter((x) => x && x !== (lang === 'ru' ? c.ru : c.en)))],
  geo: { '@type': 'GeoCoordinates', latitude: c.lat, longitude: c.lon },
  address: { '@type': 'PostalAddress', addressLocality: lang === 'ru' ? c.ru : c.en, addressCountry: c.cc },
});
const cta = (lang, text) =>
  `<section class="cta" aria-labelledby="cta-h">
    <img src="/assets/logo-192.png" width="64" height="64" alt="" loading="lazy" decoding="async">
    <div><h2 id="cta-h">${lang === 'ru' ? 'Напоминания и близкие — в приложении' : 'Reminders and loved ones — in the app'}</h2><p>${text}</p></div>
    <div class="acts">${appBtn(lang)}<a class="btn ghost" href="${lang === 'ru' ? '/' : '/en/'}">${lang === 'ru' ? 'Подробнее' : 'Learn more'}</a></div>
  </section>`;

/* ── данные города на сегодня и на год ── */
function facts(c, now) {
  const today = N.today(c.tz, now);
  const t = N.day(c, ...today);
  const hm = Object.fromEntries(N.KEYS.map((k) => [k, N.hm(t[k], c.tz)]));
  const asrAlt = N.hm(N.day(c, ...today, { hanafi: !N.preset(c).hanafi }).asr, c.tz);
  const year = today[0];
  let early = null, late = null, mEarly = null, mLate = null;
  for (let x = [year, 1, 1]; x[0] === year; x = N.addDays(x, 1)) {
    const d = N.day(c, ...x);
    const f = mins(d.fajr, c.tz), m = mins(d.maghrib, c.tz);
    if (!early || f < early.v) early = { v: f, at: x, s: N.hm(d.fajr, c.tz) };
    if (!late || f > late.v) late = { v: f, at: x, s: N.hm(d.fajr, c.tz) };
    if (!mEarly || m < mEarly.v) mEarly = { v: m, at: x, s: N.hm(d.maghrib, c.tz) };
    if (!mLate || m > mLate.v) mLate = { v: m, at: x, s: N.hm(d.maghrib, c.tz) };
  }
  const R = N.RAMADAN.start;
  const r1 = N.day(c, ...R);
  const rLastYmd = N.addDays(R, N.RAMADAN.days - 1);
  const rLast = N.day(c, ...rLastYmd);
  const q = N.qibla(c);
  return {
    today, t, hm, asrAlt, year, early, late, mEarly, mLate,
    r1: { suhur: N.hm(r1.fajr, c.tz), iftar: N.hm(r1.maghrib, c.tz), ms: r1.maghrib - r1.fajr },
    rLast: { ymd: rLastYmd, suhur: N.hm(rLast.fajr, c.tz), iftar: N.hm(rLast.maghrib, c.tz), ms: rLast.maghrib - rLast.fajr },
    qibla: Math.round(q), qiblaExact: q,
    mecca: Math.round(N.toMecca(c) / 10) * 10,
    tzLabel: offsetLabel(c.tz, t.dhuhr),
    built: N.iso(...today),
  };
}
const DIRS = {
  ru: ['на север', 'на северо-восток', 'на восток', 'на юго-восток', 'на юг', 'на юго-запад', 'на запад', 'на северо-запад'],
  en: ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'],
};
const dir = (lang, deg) => DIRS[lang][Math.round(deg / 45) % 8];
const near = (c, n = 6) =>
  CITIES.filter((x) => x !== c)
    .map((x) => ({ x, km: N.distanceKm(c, x) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, n);
const nameOf = (c, lang) => (lang === 'ru' ? c.ru : c.en);
const daysTo = (from, to) => Math.round((noon(...to) - noon(...from)) / 864e5);

function dial(lang, deg) {
  const L = lang === 'ru' ? ['С', 'В', 'Ю', 'З'] : ['N', 'E', 'S', 'W'];
  let ticks = '';
  for (let a = 0; a < 360; a += 15) {
    const long = a % 90 === 0;
    ticks += `<line x1="120" y1="${long ? 16 : 20}" x2="120" y2="${long ? 30 : 26}" transform="rotate(${a} 120 120)" stroke="currentColor" stroke-opacity="${long ? 0.55 : 0.25}" stroke-width="${long ? 2 : 1.5}" stroke-linecap="round"/>`;
  }
  return `<div class="dial-wrap"><svg class="dial" data-dial viewBox="0 0 240 240" role="img" aria-label="${lang === 'ru' ? `Кибла: ${deg}° от севера` : `Qibla: ${deg}° from north`}" style="color:var(--muted)">
      <circle cx="120" cy="120" r="108" fill="var(--surface)" stroke="var(--line-2)"/>
      ${ticks}
      <g font-family="var(--sans)" font-size="15" font-weight="600" text-anchor="middle" fill="currentColor"><text x="120" y="50">${L[0]}</text><text x="196" y="125">${L[1]}</text><text x="120" y="201">${L[2]}</text><text x="44" y="125">${L[3]}</text></g>
      <g transform="rotate(${deg} 120 120)"><line x1="120" y1="120" x2="120" y2="40" stroke="var(--gold)" stroke-width="4" stroke-linecap="round"/><rect x="111" y="26" width="18" height="18" rx="3" fill="#111" stroke="var(--gold)" stroke-width="2"/><line x1="111" y1="32" x2="129" y2="32" stroke="var(--gold)" stroke-width="2"/></g>
      <circle cx="120" cy="120" r="6" fill="var(--moon)"/>
    </svg></div>`;
}

/* ═════════════════════ страница «время намаза в городе» ═════════════════════ */
function namazPage(c, lang, F) {
  const ru = lang === 'ru';
  const M = method(c, lang);
  const name = nameOf(c, lang);
  const url = URL.namaz(c, lang);
  const loc = ru ? c.loc : `in ${c.en}`;
  const country = COUNTRIES[c.cc][lang];
  const T = F.hm;
  const dateText = longDate(lang, F.today);
  const hij = N.hijri(lang, ...F.today);
  const monthLabel = `${monthOnly(lang, F.today)} ${F.today[0]}`;
  const names = N.L[lang].names;
  const kz = c.cc === 'KZ';
  const kkLine = kz
    ? `<p class="aside-line" lang="kk">${esc(c.kk)} намаз уақыты бүгін: Таң <b data-t="fajr">${T.fajr}</b> · Күн шығуы <b data-t="sunrise">${T.sunrise}</b> · Бесін <b data-t="dhuhr">${T.dhuhr}</b> · Екінті <b data-t="asr">${T.asr}</b> · Ақшам <b data-t="maghrib">${T.maghrib}</b> · Құптан <b data-t="isha">${T.isha}</b></p>`
    : '';
  const altAsr = `<p class="aside-line">${ru ? (M.hanafi ? 'Аср по шафиитскому мазхабу (одна тень)' : 'Аср по ханафитскому мазхабу') : M.hanafi ? 'Standard (Shafi) Asr' : 'Hanafi Asr'}: <b data-t="asr-alt">${F.asrAlt}</b></p>`;
  const title = ru ? `Время намаза ${c.loc} сегодня и на ${monthOnly(lang, F.today)} ${F.today[0]} | Firdaus` : `Prayer Times in ${c.en} Today & ${monthLabel} | Firdaus`;
  const short = (k) => `${names[k]} ${T[k]}`;
  const desc = ru
    ? `Время намаза ${c.loc} на сегодня, ${dayMonth(lang, F.today)}: ${['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map(short).join(', ')}. Расписание на месяц (${M.short}), кибла ${F.qibla}°.${kz ? ` Намаз уақыты ${c.kk}.` : ''}`
    : `Prayer times in ${c.en} today, ${dayMonth(lang, F.today)}: ${['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map(short).join(', ')}. Monthly timetable (${M.short}), Qibla ${F.qibla}°.`;
  const otherUrl = URL.namaz(c, ru ? 'en' : 'ru');
  const hubName = ru ? 'Время намаза' : 'Prayer times';
  const crumbItems = [['Firdaus', ru ? '/' : '/en/'], [hubName, URL.hub('namaz', lang)], [name, url]];
  const ramUrl = URL.ramadan(c, lang);

  const faq = ru
    ? [
        { q: `Когда сегодня Фаджр ${c.loc}?`, a: `Сегодня, ${dayMonth(lang, F.today)}, Фаджр (утренний намаз${kz ? ', по-казахски — таң' : ''}) ${c.loc} начинается в ${T.fajr}. Его время длится до восхода солнца — ${T.sunrise}.` },
        { q: `Когда сегодня Иша ${c.loc}?`, a: `Иша (ночной намаз${kz ? ', құптан' : ''}) сегодня начинается в ${T.isha}. Магриб — в ${T.maghrib}, Аср — в ${T.asr}, Зухр — в ${T.dhuhr}.` },
        { q: `Как узнать киблу ${c.loc}?`, a: `Кибла ${c.loc} — ${F.qibla}° от севера по часовой стрелке, то есть ${dir(lang, F.qiblaExact)}. Встань лицом на север и повернись вправо на ${F.qibla}°. Проще — компас на этой странице с телефона или в приложении Firdaus: стрелка с Каабой и карта с линией до Мекки. До Каабы по прямой — ${num(lang, F.mecca)} км.` },
        { q: `По какому методу считается время намаза ${c.loc}?`, a: `${M.text} ${M.check}` },
        { q: `Когда начнётся Рамадан (Ураза) 2027 ${c.loc}?`, a: `По календарю Умм аль-Кура первый день поста — 8 февраля 2027 года, последний — 8 или 9 марта; точную дату объявляет ${kz ? 'ДУМК' : 'духовное управление мусульман'}. В первый день сухур ${c.loc} — до ${F.r1.suhur}, ифтар — в ${F.r1.iftar}. Расписание на весь месяц — на странице <a href="${ramUrl}">Рамадан 2027 ${c.loc}</a>.` },
        { q: `Есть ли приложение с временем намаза ${c.loc}?`, a: `Да — Firdaus для iPhone. Бесплатно навсегда: время намаза (${M.short}), кибла, напоминание о каждом намазе, Коран с переводом и тасбих. А ещё в нём близкие: брат, друг или мама видят, помолился ли ты, и могут мягко напомнить. Скоро в App Store.` },
        ...(kz ? [{ lang: 'kk', q: `${c.kk} намаз уақыты бүгін қандай?`, a: `Бүгін ${c.kk} қаласында: Таң — ${T.fajr}, Күн шығуы — ${T.sunrise}, Бесін — ${T.dhuhr}, Екінті — ${T.asr}, Ақшам — ${T.maghrib}, Құптан — ${T.isha}. Есеп ҚМДБ әдісі бойынша.` }] : []),
      ]
    : [
        { q: `What time is Fajr in ${c.en} today?`, a: `Today, ${dayMonth(lang, F.today)}, Fajr in ${c.en} begins at ${T.fajr} and lasts until sunrise at ${T.sunrise}.` },
        { q: `What time is Isha in ${c.en} today?`, a: `Isha begins at ${T.isha} today. Maghrib is at ${T.maghrib}, Asr at ${T.asr} and Dhuhr at ${T.dhuhr}.` },
        { q: `Which way is the Qibla in ${c.en}?`, a: `The Qibla in ${c.en} is ${F.qibla}° clockwise from north — roughly ${dir(lang, F.qiblaExact)}. Face north and turn right by ${F.qibla}°. Easier: use the compass on this page on your phone, or the Firdaus app — a compass with the Kaaba and a map with a line to Mecca. Mecca is ${num(lang, F.mecca)} km away in a straight line.` },
        { q: `Which calculation method is used for ${c.en}?`, a: `${M.text} ${M.check}` },
        { q: `When does Ramadan 2027 start in ${c.en}?`, a: `By the Umm al-Qura calendar the first day of fasting is 8 February 2027 and the last is 8 or 9 March; the exact date is announced by local religious authorities. On the first day suhoor in ${c.en} ends at ${F.r1.suhur} and iftar is at ${F.r1.iftar}. The full month is on <a href="${ramUrl}">Ramadan 2027 in ${c.en}</a>.` },
        { q: `Is there a prayer times app for ${c.en}?`, a: `Yes — Firdaus for iPhone. Free forever: prayer times (${M.short}), Qibla, a reminder for every prayer, the Quran with a translation and a tasbih counter. And your loved ones are in it: a brother, a friend or your mother can see whether you have prayed and send a gentle reminder. Coming soon to the App Store.` },
      ];

  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', '@id': SITE + url, url: SITE + url, name: title, inLanguage: lang, dateModified: F.built, isPartOf: { '@id': `${SITE}/#site` }, about: { '@id': SITE + url + '#place' }, publisher: { '@id': `${SITE}/#org` } },
      placeLd(c, lang, url),
      faqLd(faq),
      crumbsLd(crumbItems),
    ],
  };

  const cells = N.KEYS.map((k) => `<div role="listitem" data-k="${k}"${k === 'sunrise' ? ' class="rise"' : ''}><span>${names[k]}</span><b data-t="${k}">${T[k]}</b></div>`).join('');
  const nb = near(c);
  const nearHtml = nb.map(({ x, km }) => `<a href="${URL.namaz(x, lang)}">${esc(nameOf(x, lang))} <small>${num(lang, Math.round(km))} ${ru ? 'км' : 'km'}</small></a>`).join('');
  const fastLen = N.dur(F.r1.ms, lang);

  const body = `${header(lang, 'namaz', otherUrl)}
<main class="wrap city">
  ${crumbs(lang, crumbItems)}
  <p class="eyebrow">${esc(country)}${kz ? ' · <span lang="kk">намаз уақыты</span>' : ''}</p>
  <h1>${ru ? `Время намаза ${esc(c.loc)}` : `Prayer times in ${esc(c.en)}`}</h1>
  <p class="stamp"><span data-today-label>${esc(dateText)}${hij ? ' · ' + esc(hij) : ''}</span></p>
  <div class="today" role="list" aria-label="${ru ? 'Время намаза на сегодня' : 'Today’s prayer times'}">${cells}</div>
  <p class="next" data-next hidden></p>
  ${altAsr}
  ${kkLine}

  ${cta(lang, ru ? `Firdaus напомнит о каждом намазе ${esc(c.loc)} и покажет киблу. Брат, друг или мама видят, помолился ли ты, и могут мягко напомнить. Время, кибла и напоминания — бесплатно.` : `Firdaus reminds you of every prayer in ${esc(c.en)} and shows the Qibla. A brother, a friend or your mother can see whether you have prayed and send a gentle reminder. Times, Qibla and reminders are free.`)}

  <section class="city-sec" id="${ru ? 'raspisanie' : 'timetable'}" aria-labelledby="sched-h">
    <h2 id="sched-h">${ru ? `Расписание намаза ${esc(c.loc)} на месяц` : `${esc(c.en)} prayer timetable for the month`}</h2>
    <p>${ru ? `Время местное (${F.tzLabel}), посчитано по методу ${esc(M.short)}. Сегодняшний день подсвечен, пятница — день джума-намаза.` : `Local time (${F.tzLabel}), calculated by the ${esc(M.short)} method. Today is highlighted; Friday is the day of Jumu'ah.`}</p>
    <div class="sched-bar">
      <div class="seg" role="group" aria-label="${ru ? 'Период' : 'Period'}"><button type="button" data-mode="week" aria-pressed="false">${ru ? 'Неделя' : 'Week'}</button><button type="button" data-mode="month" aria-pressed="true">${ru ? 'Месяц' : 'Month'}</button></div>
      <div class="month-nav"><button class="icon-btn" type="button" data-step="-1" aria-label="${ru ? 'Предыдущий месяц' : 'Previous month'}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg></button><b data-month-label aria-live="polite">${esc(monthLabel)}</b><button class="icon-btn" type="button" data-step="1" aria-label="${ru ? 'Следующий месяц' : 'Next month'}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button></div>
    </div>
    <div class="scroll"><table class="sched month">
      <caption class="sr">${ru ? `Время намаза ${esc(c.loc)}, ${esc(monthLabel)}` : `Prayer times in ${esc(c.en)}, ${esc(monthLabel)}`}</caption>
      <thead><tr><th scope="col">${N.L[lang].date}</th>${N.KEYS.map((k) => `<th scope="col">${names[k]}</th>`).join('')}</tr></thead>
      <tbody data-sched>${N.monthRows(c, F.today[0], F.today[1], lang, F.today)}</tbody>
    </table></div>
  </section>

  <section class="city-sec" id="${ru ? 'kibla' : 'qibla'}" aria-labelledby="qibla-h">
    <h2 id="qibla-h">${ru ? `Кибла ${esc(c.loc)}` : `Qibla direction in ${esc(c.en)}`}</h2>
    <div class="qibla">
      ${dial(lang, F.qibla)}
      <div>
        <p class="big num">${F.qibla}°<small>${ru ? `от севера, ${dir(lang, F.qiblaExact)}` : `from north, ${dir(lang, F.qiblaExact)}`}</small></p>
        <p>${ru ? `Встань лицом на север и повернись по часовой стрелке на ${F.qibla}° — это направление на Каабу в Мекке. До неё ${num(lang, F.mecca)} км по прямой.` : `Face north and turn clockwise by ${F.qibla}° — that is the direction of the Kaaba in Mecca, ${num(lang, F.mecca)} km away in a straight line.`}</p>
        <div class="acts"><button class="btn ghost" type="button" data-compass hidden>${ru ? 'Включить компас телефона' : 'Use my phone’s compass'}</button></div>
        <p data-compass-hint hidden>${ru ? 'Держи телефон ровно и поворачивайся, пока золотая стрелка не встанет вверх, к метке.' : 'Hold the phone flat and turn until the gold arrow points straight up to the mark.'}</p>
      </div>
    </div>
  </section>

  <section class="city-sec" id="${ru ? 'metod' : 'method'}" aria-labelledby="method-h">
    <h2 id="method-h">${ru ? 'Как посчитано' : 'How it is calculated'}</h2>
    <dl class="facts">
      <div><dt>${ru ? 'Метод' : 'Method'}</dt><dd>${esc(M.short)}<small>${esc(M.madhab)}</small></dd></div>
      <div><dt>${ru ? 'Кибла' : 'Qibla'}</dt><dd>${F.qibla}°<small>${ru ? 'от севера' : 'from north'}</small></dd></div>
      <div><dt>${ru ? 'До Мекки' : 'To Mecca'}</dt><dd>${num(lang, F.mecca)} ${ru ? 'км' : 'km'}<small>${ru ? 'по прямой до Каабы' : 'straight line to the Kaaba'}</small></dd></div>
      <div><dt>${ru ? 'Хиджра сегодня' : 'Hijri today'}</dt><dd>${esc(hij)}<small>${ru ? 'календарь Умм аль-Кура' : 'Umm al-Qura calendar'}</small></dd></div>
    </dl>
    <p style="margin-top:22px">${M.text}</p>
    <p>${M.check}</p>
    <p>${ru
      ? `В ${F.year} году самый ранний Фаджр ${esc(c.loc)} — <b>${F.early.s}</b> (${dayMonth(lang, F.early.at)}), самый поздний — <b>${F.late.s}</b> (${dayMonth(lang, F.late.at)}). Магриб раньше всего наступает в <b>${F.mEarly.s}</b> (${dayMonth(lang, F.mEarly.at)}), позже всего — в <b>${F.mLate.s}</b> (${dayMonth(lang, F.mLate.at)}).`
      : `In ${F.year} the earliest Fajr in ${esc(c.en)} is <b>${F.early.s}</b> (${dayMonth(lang, F.early.at)}) and the latest is <b>${F.late.s}</b> (${dayMonth(lang, F.late.at)}). Maghrib comes earliest at <b>${F.mEarly.s}</b> (${dayMonth(lang, F.mEarly.at)}) and latest at <b>${F.mLate.s}</b> (${dayMonth(lang, F.mLate.at)}).`}</p>
  </section>

  <section class="city-sec" aria-labelledby="ram-h">
    <h2 id="ram-h">${ru ? `Рамадан 2027 ${esc(c.loc)}` : `Ramadan 2027 in ${esc(c.en)}`}</h2>
    <p>${ru
      ? `Ожидается с 8 февраля 2027 года. В первый день сухур — до <b>${F.r1.suhur}</b>, ифтар — в <b>${F.r1.iftar}</b>, пост длится ${fastLen}.${kz ? ` <span lang="kk">Ораза 2027: сәресі — ${F.r1.suhur}, ауызашар — ${F.r1.iftar}.</span>` : ''}`
      : `Expected from 8 February 2027. On the first day suhoor ends at <b>${F.r1.suhur}</b> and iftar is at <b>${F.r1.iftar}</b> — a fast of ${fastLen}.`}</p>
    <p><a class="textlink" href="${ramUrl}">${ru ? 'Расписание сухура и ифтара на весь месяц' : 'Suhoor and iftar times for the whole month'}</a></p>
  </section>

  <section class="city-sec faq" id="faq" aria-labelledby="faq-h">
    <h2 id="faq-h">${ru ? 'Частые вопросы' : 'Questions'}</h2>
  ${faqHtml(faq)}
  </section>

  <section class="city-sec" aria-labelledby="near-h">
    <h2 id="near-h">${ru ? 'Время намаза в соседних городах' : 'Prayer times in nearby cities'}</h2>
    <div class="near">${nearHtml}</div>
    <p style="margin-top:18px"><a class="textlink" href="${URL.hub('namaz', lang)}">${ru ? 'Все города' : 'All cities'}</a></p>
  </section>
</main>
${footer(lang)}
<script type="application/json" id="namaz-city">${JSON.stringify({ slug: c.slug, cc: c.cc, tz: c.tz, lat: c.lat, lon: c.lon, hanafi: c.hanafi ?? null, lang })}</script>
</body>
</html>
`;
  return {
    url,
    title,
    desc,
    html: head({ lang, title, desc, url, ru: URL.namaz(c, 'ru'), en: URL.namaz(c, 'en'), og: lang === 'ru' ? 'home-ru.jpg' : 'home-en.jpg', built: F.built, ld }) + '\n' + body,
  };
}

/* ═════════════════════ страница «Рамадан 2027 в городе» ═════════════════════ */
function ramadanPage(c, lang, F) {
  const ru = lang === 'ru';
  const M = method(c, lang);
  const url = URL.ramadan(c, lang);
  const name = nameOf(c, lang);
  const kz = c.cc === 'KZ';
  const country = COUNTRIES[c.cc][lang];
  const left = daysTo(F.today, N.RAMADAN.start);
  const lastLabel = dayMonth(lang, F.rLast.ymd);
  const auth = ru ? (kz ? 'ДУМК' : c.cc === 'TR' ? 'Диянет' : 'духовное управление мусульман') : kz ? 'DUMK' : c.cc === 'TR' ? 'Diyanet' : 'local religious authorities';
  const title = ru ? `Ураза 2027 ${c.loc} — расписание сухура и ифтара | Рамадан` : `Ramadan 2027 in ${c.en} — Suhoor & Iftar Times | Firdaus`;
  const desc = ru
    ? `Рамадан 2027 ${c.loc}: ожидаемо с 8 февраля по 8 марта. Сухур и ифтар на каждый день (${M.short}): в 1-й день сухур до ${F.r1.suhur}, ифтар в ${F.r1.iftar}.${kz ? ` Ораза 2027 кестесі, ${c.kk}.` : ''}`
    : `Ramadan 2027 in ${c.en}: expected 8 February – 8 March. Suhoor and iftar for every day (${M.short}): day 1 suhoor ends ${F.r1.suhur}, iftar ${F.r1.iftar}.`;
  const crumbItems = [['Firdaus', ru ? '/' : '/en/'], [ru ? 'Рамадан 2027' : 'Ramadan 2027', URL.hub('ramadan', lang)], [name, url]];
  const faq = ru
    ? [
        { q: `Когда начинается Ураза 2027 ${kz ? 'в Казахстане' : c.loc}?`, a: `По календарю Умм аль-Кура Рамадан 1448 года начинается 8 февраля 2027 года: первый сухур — утром 8 февраля, первый ифтар — вечером того же дня. Начало месяца определяют по луне, поэтому дата может сдвинуться на день — её объявляет ${auth}.` },
        { q: `До скольки можно есть сухур ${c.loc}?`, a: `До начала Фаджра. В первый день Рамадана ${c.loc} — до ${F.r1.suhur}, в последний (${lastLabel}) — до ${F.rLast.suhur}. Время каждого дня — в таблице выше.` },
        { q: `Во сколько ифтар ${c.loc}?`, a: `Ифтар — с наступлением Магриба: в первый день в ${F.r1.iftar}, в последний (${lastLabel}) — в ${F.rLast.iftar}.` },
        { q: `Сколько длится пост ${c.loc}?`, a: `В первый день — ${N.dur(F.r1.ms, lang)}, к концу месяца — ${N.dur(F.rLast.ms, lang)}: дни в феврале и марте быстро прибавляют.` },
        { q: 'Когда Ураза-байрам 2027?', a: `Ожидаемо 9 марта 2027 года${kz ? ' (Ораза айт)' : ''}, если Рамадан продлится 29 дней, или 10 марта — если 30. Дату объявляет ${auth}.` },
        { q: 'Есть ли приложение, которое напомнит о сухуре и ифтаре?', a: `Firdaus для iPhone напоминает о каждом намазе — в том числе о Фаджре, когда кончается сухур, и о Магрибе, времени ифтара, — по тому же методу (${M.short}). А близкие в нём видят, помолился ли ты, и могут мягко напомнить. Скоро в App Store.` },
        ...(kz ? [{ lang: 'kk', q: `Ораза 2027 ${c.kk}: сәресі және ауызашар уақыты қандай?`, a: `Ораза 2027 жылы 8 ақпанда басталады деп күтілуде. Бірінші күні ${c.kk} қаласында сәресі — ${F.r1.suhur}, ауызашар — ${F.r1.iftar}. Нақты күнді ҚМДБ жариялайды.` }] : []),
      ]
    : [
        { q: `When does Ramadan 2027 start in ${c.en}?`, a: `By the Umm al-Qura calendar, Ramadan 1448 begins on 8 February 2027: the first suhoor is on the morning of 8 February and the first iftar that evening. The month starts with the moon, so the date may move by a day — it is announced by ${auth}.` },
        { q: `When does suhoor end in ${c.en}?`, a: `At the start of Fajr. On the first day of Ramadan in ${c.en} suhoor ends at ${F.r1.suhur}; on the last day (${lastLabel}) at ${F.rLast.suhur}. Every day is in the table above.` },
        { q: `What time is iftar in ${c.en}?`, a: `Iftar is at Maghrib: ${F.r1.iftar} on the first day and ${F.rLast.iftar} on the last (${lastLabel}).` },
        { q: `How long is the fast in ${c.en}?`, a: `${N.dur(F.r1.ms, lang)} on the first day and ${N.dur(F.rLast.ms, lang)} by the end of the month.` },
        { q: 'When is Eid al-Fitr 2027?', a: `Expected on 9 March 2027 if Ramadan lasts 29 days, or 10 March if it lasts 30. The date is announced by ${auth}.` },
        { q: 'Is there an app that reminds me of suhoor and iftar?', a: `Firdaus for iPhone reminds you of every prayer — including Fajr, when suhoor ends, and Maghrib, the time for iftar — by the same method (${M.short}). And your loved ones in it can see whether you have prayed and send a gentle reminder. Coming soon to the App Store.` },
      ];
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', '@id': SITE + url, url: SITE + url, name: title, inLanguage: lang, dateModified: F.built, isPartOf: { '@id': `${SITE}/#site` }, about: { '@id': SITE + url + '#place' }, publisher: { '@id': `${SITE}/#org` } },
      placeLd(c, lang, url),
      faqLd(faq),
      crumbsLd(crumbItems),
    ],
  };
  const nb = near(c);
  const body = `${header(lang, 'ramadan', URL.ramadan(c, ru ? 'en' : 'ru'))}
<main class="wrap city">
  ${crumbs(lang, crumbItems)}
  <p class="eyebrow">${ru ? `Ураза 2027 · ${esc(country)}` : `Ramadan 1448 · ${esc(country)}`}</p>
  <h1>${ru ? `Рамадан 2027 ${esc(c.loc)}` : `Ramadan 2027 in ${esc(c.en)}`}</h1>
  <p class="stamp">${ru ? 'Ожидаемо с 8 февраля по 8 марта 2027 · 1–29 рамадана 1448 года' : 'Expected 8 February – 8 March 2027 · 1–29 Ramadan 1448'}</p>
  ${left > 0 ? `<div class="count"><b data-ramadan-left>${ru ? plural(left, 'день', 'дня', 'дней') : `${left} ${left === 1 ? 'day' : 'days'}`}</b><span>${ru ? 'до первого дня поста' : 'until the first fast'}</span></div>` : ''}
  <dl class="facts">
    <div><dt>${ru ? 'Сухур в 1-й день' : 'Suhoor ends, day 1'}</dt><dd>${ru ? 'до ' : ''}${F.r1.suhur}<small>${ru ? 'начало Фаджра' : 'start of Fajr'}</small></dd></div>
    <div><dt>${ru ? 'Ифтар в 1-й день' : 'Iftar, day 1'}</dt><dd>${F.r1.iftar}<small>${ru ? 'Магриб' : 'Maghrib'}</small></dd></div>
    <div><dt>${ru ? 'Пост в 1-й день' : 'Fast, day 1'}</dt><dd>${N.dur(F.r1.ms, lang)}<small>${ru ? `к концу — ${N.dur(F.rLast.ms, lang)}` : `by the end — ${N.dur(F.rLast.ms, lang)}`}</small></dd></div>
    <div><dt>${ru ? 'Ураза-байрам' : 'Eid al-Fitr'}</dt><dd>${ru ? '9 марта' : '9 March'}<small>${ru ? 'или 10-го, по луне' : 'or the 10th, by the moon'}</small></dd></div>
  </dl>
  ${kz ? `<p class="aside-line" lang="kk">Ораза 2027 кестесі, ${esc(c.kk)}: бірінші күні сәресі — <b>${F.r1.suhur}</b>, ауызашар — <b>${F.r1.iftar}</b>.</p>` : ''}

  ${cta(lang, ru ? `Firdaus напомнит о Фаджре — конце сухура — и о Магрибе, времени ифтара, ${esc(c.loc)}. Брат, друг или мама видят, помолился ли ты, и могут мягко напомнить.` : `Firdaus reminds you of Fajr — when suhoor ends — and Maghrib, the time for iftar, in ${esc(c.en)}. A brother, a friend or your mother can see whether you have prayed and send a gentle reminder.`)}

  <section class="city-sec" aria-labelledby="ram-t">
    <h2 id="ram-t">${ru ? `Расписание сухура и ифтара ${esc(c.loc)}` : `Suhoor and iftar times in ${esc(c.en)}`}</h2>
    <p>${ru ? `Сухур — до начала Фаджра, ифтар — с наступлением Магриба. Время местное (${F.tzLabel}), метод — ${esc(M.short)}, как в <a class="textlink" href="${URL.namaz(c, lang)}">расписании намаза ${esc(c.loc)}</a>.` : `Suhoor ends at the start of Fajr; iftar is at Maghrib. Local time (${F.tzLabel}), ${esc(M.short)} method — the same as the <a class="textlink" href="${URL.namaz(c, lang)}">${esc(c.en)} prayer timetable</a>.`}</p>
    <div class="scroll" style="margin-top:18px"><table class="sched">
      <caption class="sr">${ru ? `Рамадан 2027 ${esc(c.loc)}: сухур и ифтар` : `Ramadan 2027 in ${esc(c.en)}: suhoor and iftar`}</caption>
      <thead><tr><th scope="col" style="text-align:left">${N.L[lang].day}</th><th scope="col" class="l">${N.L[lang].date}</th><th scope="col">${N.L[lang].suhur}</th><th scope="col">${N.L[lang].iftar}</th><th scope="col" class="dur">${N.L[lang].fast}</th></tr></thead>
      <tbody data-ramadan>${N.ramadanRows(c, lang, F.today)}</tbody>
    </table></div>
    <p class="note">${ru ? `Даты — по календарю Умм аль-Кура. Начало и конец месяца определяют по луне, точную дату объявляет ${auth}; тридцатая строка — на случай, если месяц будет полным.` : `Dates follow the Umm al-Qura calendar. The month begins and ends with the moon; the exact date is announced by ${auth}. The 30th row is there in case the month is complete.`}</p>
  </section>

  <section class="city-sec faq" aria-labelledby="faq-h">
    <h2 id="faq-h">${ru ? 'Частые вопросы' : 'Questions'}</h2>
  ${faqHtml(faq)}
  </section>

  <section class="city-sec" aria-labelledby="near-h">
    <h2 id="near-h">${ru ? 'Рамадан 2027 в соседних городах' : 'Ramadan 2027 in nearby cities'}</h2>
    <div class="near">${nb.map(({ x }) => `<a href="${URL.ramadan(x, lang)}">${esc(nameOf(x, lang))}</a>`).join('')}</div>
    <p style="margin-top:18px"><a class="textlink" href="${URL.hub('ramadan', lang)}">${ru ? 'Все города' : 'All cities'}</a></p>
  </section>
</main>
${footer(lang)}
<script type="application/json" id="namaz-city">${JSON.stringify({ slug: c.slug, cc: c.cc, tz: c.tz, lat: c.lat, lon: c.lon, hanafi: c.hanafi ?? null, lang })}</script>
</body>
</html>
`;
  return {
    url,
    title,
    desc,
    html: head({ lang, title, desc, url, ru: URL.ramadan(c, 'ru'), en: URL.ramadan(c, 'en'), og: lang === 'ru' ? 'home-ru.jpg' : 'home-en.jpg', built: F.built, ld }) + '\n' + body,
  };
}
function plural(n, a, b, c) {
  const m10 = n % 10, m100 = n % 100;
  return `${n} ${m10 === 1 && m100 !== 11 ? a : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? b : c}`;
}

/* ═════════════════════ хабы ═════════════════════ */
function hubPage(kind, lang, all, now) {
  const ru = lang === 'ru';
  const url = URL.hub(kind, lang);
  const namaz = kind === 'namaz';
  const title = namaz
    ? ru ? 'Время намаза по городам Казахстана, СНГ и мира | Firdaus' : 'Prayer Times by City — Kazakhstan, Central Asia & World | Firdaus'
    : ru ? 'Ураза 2027: расписание сухура и ифтара по городам | Рамадан 2027' : 'Ramadan 2027: Suhoor & Iftar Times by City | Firdaus';
  const desc = namaz
    ? ru ? 'Время намаза на сегодня и на месяц для городов Казахстана (по методу ДУМК), Кыргызстана, Узбекистана, России и мира. Кибла и расписание — бесплатно.' : 'Prayer times today and for the month in cities of Kazakhstan (DUMK method), Central Asia, Russia and worldwide, with Qibla direction.'
    : ru ? 'Рамадан 2027 ожидается с 8 февраля по 8 марта. Время сухура и ифтара на каждый день для городов Казахстана, СНГ и мира. Ораза 2027 кестесі.' : 'Ramadan 2027 is expected from 8 February to 8 March. Suhoor and iftar times for every day in cities of Kazakhstan, Central Asia, Russia and worldwide.';
  const groups = {};
  for (const c of CITIES) (groups[c.cc] ??= []).push(c);
  const today = N.today('Etc/GMT-5', now);
  const items = Object.entries(groups)
    .map(([cc, list]) => {
      return `<section class="hub-group" aria-labelledby="g-${cc}"><h2 id="g-${cc}">${esc(COUNTRIES[cc][lang])}</h2><div class="hub-list">${list
        .map((c) => {
          const F = all.get(c.slug);
          const hint = namaz ? `${N.L[lang].names.fajr} ${F.hm.fajr} · ${N.L[lang].names.isha} ${F.hm.isha}` : `${ru ? 'ифтар 8 фев' : 'iftar 8 Feb'} · ${F.r1.iftar}`;
          return `<a href="${(namaz ? URL.namaz : URL.ramadan)(c, lang)}">${esc(nameOf(c, lang))}<span>${hint}</span></a>`;
        })
        .join('')}</div></section>`;
    })
    .join('\n  ');
  const crumbItems = [['Firdaus', ru ? '/' : '/en/'], [namaz ? (ru ? 'Время намаза' : 'Prayer times') : ru ? 'Рамадан 2027' : 'Ramadan 2027', url]];
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CollectionPage', '@id': SITE + url, url: SITE + url, name: title, inLanguage: lang, isPartOf: { '@id': `${SITE}/#site` }, publisher: { '@id': `${SITE}/#org` } },
      { '@type': 'ItemList', itemListElement: CITIES.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: nameOf(c, lang), url: SITE + (namaz ? URL.namaz : URL.ramadan)(c, lang) })) },
      crumbsLd(crumbItems),
    ],
  };
  const left = daysTo(today, N.RAMADAN.start);
  const body = `${header(lang, kind, URL.hub(kind, ru ? 'en' : 'ru'))}
<main class="wrap city">
  ${crumbs(lang, crumbItems)}
  <p class="eyebrow">${namaz ? (ru ? 'Время намаза · <span lang="kk">намаз уақыты</span>' : 'Salah times') : ru ? 'Ураза 2027 · <span lang="kk">Ораза 2027</span>' : 'Ramadan 1448'}</p>
  <h1>${namaz ? (ru ? 'Время намаза по городам' : 'Prayer times by city') : ru ? 'Рамадан 2027' : 'Ramadan 2027'}</h1>
  <p class="lead" style="margin-top:12px">${namaz
    ? ru ? 'Сегодня, на неделю и на месяц. Казахстан — по методу ДУМК, сверено с таблицей ведомства до минуты; другие страны — по методу их духовных управлений. На каждой странице — кибла и расписание Рамадана.' : 'Today, this week and this month. Kazakhstan follows DUMK, checked against its official timetable to the minute; other countries follow their own authorities. Every page has the Qibla and the Ramadan timetable.'
    : ru ? 'Ожидается с 8 февраля по 8 марта 2027 года (1448 год хиджры). Время сухура и ифтара на каждый день — выбери город.' : 'Expected from 8 February to 8 March 2027 (1448 AH). Suhoor and iftar times for every day — choose your city.'}</p>
  ${!namaz && left > 0 ? `<div class="count"><b data-ramadan-left>${ru ? plural(left, 'день', 'дня', 'дней') : `${left} days`}</b><span>${ru ? 'до первого дня поста' : 'until the first fast'}</span></div>` : ''}
  ${items}
  ${cta(lang, ru ? 'Firdaus напомнит о каждом намазе и покажет киблу там, где ты есть. Брат, друг или мама видят, помолился ли ты, и могут мягко напомнить. Время, кибла и напоминания — бесплатно.' : 'Firdaus reminds you of every prayer and shows the Qibla wherever you are. A brother, a friend or your mother can see whether you have prayed and send a gentle reminder. Times, Qibla and reminders are free.')}
</main>
${footer(lang)}
</body>
</html>
`;
  return {
    url,
    title,
    desc,
    html: head({ lang, title, desc, url, ru: URL.hub(kind, 'ru'), en: URL.hub(kind, 'en'), og: lang === 'ru' ? 'home-ru.jpg' : 'home-en.jpg', built: N.iso(...today), ld, calc: false }) + '\n' + body,
  };
}

/* ═════════════════════ карта сайта и llms.txt ═════════════════════ */
function between(text, block, open, close) {
  const re = new RegExp(`${open}[\\s\\S]*?${close}`);
  if (!re.test(text)) throw new Error(`нет меток ${open} … ${close}`);
  return text.replace(re, () => `${open}\n${block}\n${close}`);
}
function sitemapBlock(pages, lastmod) {
  return pages
    .map(
      (p) => `  <url>
    <loc>${SITE}${p.url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${p.priority}</priority>
    <xhtml:link rel="alternate" hreflang="ru" href="${SITE}${p.ru}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${SITE}${p.en}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${p.en}"/>
  </url>`,
    )
    .join('\n');
}
function llmsBlock() {
  const lines = ['## Prayer times by city (время намаза по городам)', '', 'Free pages with today\'s times, the monthly timetable, Qibla and Ramadan 2027 suhoor/iftar for each city. Kazakhstan uses the DUMK method (checked against the official DUMK timetable within one minute).', ''];
  for (const c of CITIES) lines.push(`- ${c.en} (${c.ru}${c.kk && c.kk !== c.ru ? ', ' + c.kk : ''}): ${SITE}${URL.namaz(c, 'en')} · ${SITE}${URL.namaz(c, 'ru')} · Ramadan 2027: ${SITE}${URL.ramadan(c, 'en')}`);
  return lines.join('\n');
}

/* ═════════════════════ сборка ═════════════════════ */
export function generate(out, now = new Date()) {
  const all = new Map(CITIES.map((c) => [c.slug, facts(c, now)]));
  const pages = [];
  const write = (p, priority) => {
    const file = path.join(out, FILE(p.url));
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, render(p.html));
    pages.push({ ...p, priority });
  };
  for (const lang of ['ru', 'en']) {
    write(hubPage('namaz', lang, all, now), '0.9');
    write(hubPage('ramadan', lang, all, now), '0.8');
  }
  for (const c of CITIES) {
    const F = all.get(c.slug);
    for (const lang of ['ru', 'en']) {
      write(namazPage(c, lang, F), c.big ? '0.8' : '0.7');
      write(ramadanPage(c, lang, F), c.big ? '0.7' : '0.6');
    }
  }
  const alt = (u) => {
    for (const c of CITIES) for (const kind of ['namaz', 'ramadan']) for (const l of ['ru', 'en']) if (URL[kind](c, l) === u) return { ru: URL[kind](c, 'ru'), en: URL[kind](c, 'en') };
    for (const kind of ['namaz', 'ramadan']) for (const l of ['ru', 'en']) if (URL.hub(kind, l) === u) return { ru: URL.hub(kind, 'ru'), en: URL.hub(kind, 'en') };
    throw new Error('нет пары для ' + u);
  };
  const lastmod = new Date(now).toISOString().slice(0, 10);
  const sm = path.join(out, 'sitemap.xml');
  fs.writeFileSync(sm, between(fs.readFileSync(sm, 'utf8'), sitemapBlock(pages.map((p) => ({ ...p, ...alt(p.url) })), lastmod), '<!-- gen:start -->', '<!-- gen:end -->'));
  const llms = path.join(out, 'llms.txt');
  fs.writeFileSync(llms, between(fs.readFileSync(llms, 'utf8'), llmsBlock(), '<!-- gen:start -->', '<!-- gen:end -->'));
  return pages;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  if (!process.argv[2]) { console.error('укажи папку сайта: node gen/pages.mjs <папка> (исходники site/ не трогаем)'); process.exit(1); }
  const out = path.resolve(process.argv[2]);
  const pages = generate(out);
  console.log(`страниц городов: ${pages.length} → ${out}`);
}
