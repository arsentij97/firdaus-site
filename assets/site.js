/*
  Firdaus — сайт. Общий скрипт: константы, язык, появление, шапка.

  КОНСТАНТЫ — ЗДЕСЬ И ТОЛЬКО ЗДЕСЬ. В разметке страниц стоят те же значения
  про запас (скрипт выключен — ссылки всё равно живые); `node site/check.mjs`
  ловит расхождение. Поменял адрес — поменяй тут и прогони проверку: она
  назовёт страницы, где осталось старое.
*/
window.FIRDAUS = {
  /* Страница приложения. Номер — из mobile/eas.json (ascAppId). */
  appStoreUrl: 'https://apps.apple.com/app/id6806738733',
  /* Пока приложения нет в App Store — false: кнопки честно говорят «Скоро».
     В день выхода поставить true. */
  appStoreLive: false,
  /* Telegram поддержки. */
  telegramUrl: 'https://t.me/firdaus_support',
  telegramName: '@firdaus_support',
  /* Почта поддержки и партнёров — переадресация Porkbun на почту команды. */
  email: 'support@firdaus.life',
  partnersEmail: 'partners@firdaus.life',
  /* Своя схема приложения — mobile/app.json, "scheme". */
  scheme: 'firdaus://',
  /* Метка кампании App Store (App Store Connect → Аналитика приложений →
     Источники → «Создать ссылку кампании», число после pt=). Стоит — кнопки
     App Store несут pt и ct=<страница>, и Apple покажет установки по каждой
     странице сайта. Пусто — ссылки без меток. */
  appStorePt: '',
  /* АНАЛИТИКА САЙТА — одна строка. Пусто — на сайте нет ни одного счётчика.
     Ключ проекта PostHog (phc_…, тот же проект, что у приложения, ЕС).
     Режим без cookie и без хранения на устройстве: баннер согласия не нужен.
     Грузится после загрузки страницы и не мешает скорости. Разбор и
     альтернативы — docs/dela/seo-servisy.md. */
  posthogKey: 'phc_uZvV3CabWBg6WAE5MZpBKMHBtXHfxyuDgQGw5Wk89tFq',
};

(function () {
  var C = window.FIRDAUS;
  var root = document.documentElement;
  root.classList.add('js');
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* частный режим — живём без памяти */ } },
  };

  /* ── язык: русские страницы в корне, английские в /en/ ──
     Человек с нерусским телефоном, открывший /privacy из приложения или из
     App Store, должен сразу читать по-английски. Выбор руками запоминается и
     сильнее языка телефона. Роботов не трогаем: им обе версии нужны как есть. */
  var RU_FAMILY = /^(ru|kk|uk|be|uz|ky|tg|tt|az|hy|ka|mo|ba|ce)\b/i;
  var path = location.pathname;
  var onEn = /^\/en(\/|$)/.test(path);
  var auto = root.hasAttribute('data-lang-auto');
  if (auto && !onEn && !store.get('lang') && !/bot|crawl|spider|slurp|preview|facebookexternalhit/i.test(navigator.userAgent)) {
    var langs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'ru'];
    var ruReader = false;
    for (var i = 0; i < langs.length; i++) if (RU_FAMILY.test(langs[i])) ruReader = true;
    if (!ruReader && location.protocol !== 'file:') {
      location.replace('/en' + (path === '/' ? '/' : path.replace(/\.html$/, '').replace(/\/$/, '')) + location.search + location.hash);
      return;
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var each = function (sel, fn) { Array.prototype.forEach.call(document.querySelectorAll(sel), fn); };

    each('a[data-lang]', function (a) {
      a.addEventListener('click', function () { store.set('lang', a.getAttribute('data-lang')); });
    });

    /* адреса из констант */
    each('a[data-link="appstore"]', function (a) {
      if (C.appStoreLive) {
        a.href = C.appStoreUrl;
        if (C.appStorePt) {
          var ct = ('site' + path.replace(/\.html$/, '').replace(/[^a-z0-9]+/gi, '-')).replace(/-+$/, '').slice(0, 40);
          a.href += (a.href.indexOf('?') < 0 ? '?' : '&') + 'pt=' + encodeURIComponent(C.appStorePt) + '&ct=' + encodeURIComponent(ct) + '&mt=8';
        }
        a.addEventListener('click', function () { if (window.posthog && window.posthog.capture) window.posthog.capture('appstore_click', { page: path }); });
        return;
      }
      a.removeAttribute('href');
      a.setAttribute('aria-disabled', 'true');
      a.setAttribute('role', 'link');
      a.classList.add('soon');
      var label = a.querySelector('[data-label]') || a;
      label.textContent = a.getAttribute('data-soon') || label.textContent;
    });
    each('a[data-link="telegram"]', function (a) { a.href = C.telegramUrl; });
    each('a[data-link="email"]', function (a) { a.href = 'mailto:' + C.email; });
    each('a[data-link="partners"]', function (a) { a.href = 'mailto:' + C.partnersEmail; });
    each('[data-text="telegram"]', function (n) { n.textContent = C.telegramName; });
    each('[data-text="email"]', function (n) { n.textContent = C.email; });
    each('[data-text="partners"]', function (n) { n.textContent = C.partnersEmail; });

    /* шапка получает черту, когда страница ушла вверх (без слушателя прокрутки) */
    var top = document.querySelector('.top');
    var mark = document.getElementById('top-mark');
    if (top && mark && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { top.classList.toggle('scrolled', !e[0].isIntersecting); }).observe(mark);
    }

    /* появление блоков: один раз, когда блок вошёл в экран */
    var items = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      Array.prototype.forEach.call(items, function (el) { io.observe(el); });
    } else {
      Array.prototype.forEach.call(items, function (el) { el.classList.add('is-in'); });
    }
  });

  /* аналитика: PostHog без cookie, после загрузки страницы. Заглушка —
     как в официальном сниппете: очередь _i и вызовы до загрузки библиотеки. */
  if (C.posthogKey && location.protocol === 'https:') {
    var ph = window.posthog = [];
    ph.__SV = 1;
    ph._i = [[C.posthogKey, {
      api_host: 'https://eu.i.posthog.com',
      persistence: 'memory',
      person_profiles: 'identified_only',
      autocapture: false,
      capture_pageview: true,
      capture_pageleave: true,
      disable_session_recording: true,
      disable_surveys: true,
    }, 'posthog']];
    ph.capture = function () { ph.push(['capture'].concat(Array.prototype.slice.call(arguments))); };
    window.addEventListener('load', function () {
      setTimeout(function () {
        var sc = document.createElement('script');
        sc.async = true;
        sc.crossOrigin = 'anonymous';
        sc.src = 'https://eu-assets.i.posthog.com/static/array.js';
        document.head.appendChild(sc);
      }, 1500);
    });
  }
})();
