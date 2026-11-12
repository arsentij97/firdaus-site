/*
  Партнёрская страница: калькулятор дохода и заявка письмом.

  ДОЛЯ С ОДНОЙ ОПЛАТЫ — 533 ₸: Plus на месяц в Казахстане 3 790 ₸, НДС 16 % в
  цене, комиссия Apple 15 %, наш налог 4 % → 2 666,16 ₸ чистыми, 20 % партнёру
  (docs/89 §6). Поменялись цена или ставка — поменять PER_PAY.

  ЗАЯВКА. Своего сервера у сайта нет: форма собирает письмо на partners@ и
  открывает почту человека. Переадресация partners@ → почта команды стоит у
  Porkbun. Когда появится кабинет — форма поедет туда.
*/
(function () {
  var PER_PAY = 533;
  var lang = document.documentElement.lang === 'en' ? 'en' : 'ru';
  var T = lang === 'en'
    ? { cur: ' ₸', year: function (s) { return '≈ ' + s + ' ₸ a year'; }, locale: 'en-US', subj: 'Firdaus partner application', fields: { name: 'Name', contact: 'Telegram or email', link: 'Page', where: 'Main platform', size: 'Followers', city: 'Country and city', about: 'About' } }
    : { cur: ' ₸', year: function (s) { return '≈ ' + s + ' ₸ за год'; }, locale: 'ru-RU', subj: 'Заявка в партнёрскую программу Firdaus', fields: { name: 'Имя', contact: 'Telegram или почта', link: 'Страница', where: 'Главная площадка', size: 'Подписчиков', city: 'Страна и город', about: 'О чём пишет' } };
  var fmt = function (n) {
    var s = Math.round(n).toLocaleString(T.locale);
    return lang === 'en' ? s : s.replace(/[\s  ,]/g, ' ');
  };
  var $ = function (id) { return document.getElementById(id); };

  /* подписчики: ползунок 0–100 по логарифму, 1 000 … 1 000 000 */
  var audOf = function (v) {
    var n = Math.pow(10, 3 + (3 * v) / 100);
    var step = n < 10000 ? 500 : n < 100000 ? 1000 : 10000;
    return Math.round(n / step) * step;
  };
  var fill = function (el) {
    var p = ((el.value - el.min) / (el.max - el.min)) * 100;
    el.style.setProperty('--p', p + '%');
  };

  function calc() {
    var a = $('c-aud'), i = $('c-in'), p = $('c-pay');
    if (!a) return;
    var aud = audOf(Number(a.value));
    var inst = Math.round((aud * Number(i.value)) / 100);
    var payers = Math.round((inst * Number(p.value)) / 100);
    var month = payers * PER_PAY;
    $('o-aud').textContent = fmt(aud);
    $('o-in').textContent = String(i.value).replace('.', lang === 'en' ? '.' : ',') + '%';
    $('o-pay').textContent = p.value + '%';
    $('o-inst').textContent = fmt(inst);
    $('o-payers').textContent = fmt(payers);
    $('o-sum').textContent = fmt(month) + T.cur;
    $('o-year').textContent = T.year(fmt(month * 12));
    [a, i, p].forEach(fill);
  }
  ['c-aud', 'c-in', 'c-pay'].forEach(function (id) { var el = $(id); if (el) el.addEventListener('input', calc); });
  calc();

  /* заявка */
  var form = $('apply-form');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var bad = false;
    ['f-name', 'f-contact', 'f-link'].forEach(function (id) {
      var el = $(id);
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
})();
