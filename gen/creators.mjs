/*
  Страница для авторов: node site/gen/creators.mjs [--check]
  Пишет <превью>/creators/index.html и <превью>/en/creators/index.html, а также
  запасную страницу ссылки-приглашения <превью>/creators/apply/ (+ en) — см. applyPage.
  (превью = site/v4, пока папка есть; после переезда v4 — корень сайта).

  ВТОРАЯ РЕДАКЦИЯ, 15.11.2026 — слова Арсена: «мы не должны ныть и просить прийти первыми —
  мы продаём ценность, перспективу и вау»; Instagram и TikTok называть прямо (бесконечная
  лента, дофамин, музыка как топливо алгоритма); показать всё, что автор получает бесплатно;
  только настоящие экраны приложения; страница — для дня, когда Firdaus уже в App Store.
  Поэтому здесь нет ни «скоро запуск», ни формы «занять место»: главная кнопка — App Store,
  вторая — заявка в приложении. Функция creator-lead остаётся для учёта визитов.

  ЗАЧЕМ СКРИПТ. Страница одна, языков два: разметка общая, слова — в двух словарях с
  одинаковыми ключами. Правки текста — здесь, не в готовых файлах.

  ЛИЧНАЯ ССЫЛКА. ?n=Имя&r=reciter&h=ник&l=en&ref=… — имя, статус и ник живут только в
  браузере (assets/creators.js), ставятся через textContent; в разметке чужих имён нет.

  ФАКТЫ (сверено 15.11): что даёт программа — supabase/migrations/0541 (автору Premium на
  время участия через access_grants), docs/120, docs/126 (Студия), mobile/src/lib/plusRule.ts
  и premiumRule.ts (что платно), docs/110 §10.1 (как лента выбирает язык), docs/89 §6 и
  docs/90 (20 % / 5 %, 533 ₸), mobile/src/lib/reels/rules.ts (3–90 с; без инструментов).
  Цена Premium на странице — docs/90 §2.

  --check — ничего не пишет, падает, если готовые файлы разошлись со скриптом.

  Что сделает это неверным: поменялись условия программ, цены docs/90, что даёт статус
  (0541) или список статусов (тогда же поправить ROLES в creators.js и в creator-lead).
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const preview = fs.existsSync(path.join(root, 'v4'));
const B = preview ? '/v4' : '';
const APP_STORE = 'https://apps.apple.com/app/id6806738733';

export const ROLES = ['reciter', 'imam', 'hafiz', 'ustaz', 'mosque', 'creator', 'public'];

const SPRITE = `<svg class="sprite" aria-hidden="true" focusable="false">
<symbol id="i-check" viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.2L19 7"/></symbol>
<symbol id="i-pause" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M10 9v6M14 9v6"/></symbol>
<symbol id="i-mic" viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4"/></symbol>
<symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 3l7 3v6c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/></symbol>
<symbol id="i-ig" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.600"/><path d="M16.800 7.200h.01"/></symbol>
<symbol id="i-tt" viewBox="0 0 24 24"><path d="M14 4v10.500a3.500 3.500 0 1 1-3.500-3.500"/><path d="M14 4c.300 2.600 2 4.300 4.500 4.500"/></symbol>
<symbol id="i-seal" viewBox="0 0 24 24"><path fill="#D9B95C" stroke="none" d="M12 1.600l2.500 1.900 3.100-.300 1.300 2.900 2.900 1.300-.300 3.100 1.900 2.500-1.900 2.500.300 3.100-2.900 1.300-1.300 2.900-3.100-.300L12 24.400l-2.500-1.900-3.100.300-1.300-2.900-2.900-1.300.300-3.100L.600 13l1.900-2.500-.300-3.100 2.900-1.300 1.300-2.900 3.100.300z" transform="translate(1.200 .200) scale(.9)"/><path d="M7.800 12.300l2.900 2.900 5.500-5.700" stroke="#0B100E" stroke-width="2.200" fill="none" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-as" viewBox="0 0 24 24"><rect width="24" height="24" rx="5.6" fill="#1A8CFF"/><g fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"><path d="M10.4 6.2l5.3 9.4M13.6 6.2L8 16.1M6.1 13.4h6.6M15.4 13.4h2.5M7 17.6l-.8 1.3M17 16.3l.9 1.6"/></g></symbol>
</svg>`;

const ic = (id) => `<svg class="i" aria-hidden="true"><use href="#i-${id}"/></svg>`;
const seal = `<svg class="seal" aria-hidden="true"><use href="#i-seal"/></svg>`;
const asIcon = `<svg class="as" aria-hidden="true"><use href="#i-as"/></svg>`;

const T = {
  ru: {
    lang: 'ru', locale: 'ru_RU', altLocale: 'en_US',
    title: 'Программа авторов Firdaus',
    desc: 'Instagram и TikTok держат людей в ленте. Firdaus ведёт их к намазу. Программа авторов: золотая галочка, Firdaus Premium бесплатно, Студия и 20 % партнёрских.',
    ogTitle: 'В TikTok ваш аят стоит между розыгрышем и танцем',
    ogDesc: 'Firdaus — соцсеть, которая приводит к намазу. Программа авторов: галочка, Premium бесплатно, 20 % партнёрских.',
    ogAlt: 'Программа авторов Firdaus',
    home: 'Firdaus, на главную', navAria: 'Разделы',
    nav: ['Почему', 'Алгоритм', 'Статус', 'Заработок', 'Бесплатно', 'Как вступить'],
    langChip: 'EN', langSr: ' Read in English', langAttr: 'en',
    store: 'Скачать в App Store', join: 'Стать автором', joinShort: 'Стать автором',
    greet: 'Ассаляму алейкум.', greetName: '{n}, ассаляму алейкум.',
    invite: 'Личное приглашение',
    h1a: '<span data-cr="what">В TikTok ваш аят</span> стоит между розыгрышем и танцем.',
    h1b: 'В Firdaus — между азаном и намазом.',
    what: {
      quran: 'В TikTok ваш аят', talk: 'В TikTok ваше напоминание', video: 'В TikTok ваш ролик',
    },
    tick: { quran: 'Ваш аят', talk: 'Ваше напоминание', video: 'Ваш ролик' },
    lead: 'Instagram и TikTok построены, чтобы держать человека в ленте как можно дольше. Что он смотрит, алгоритму всё равно. <b>Firdaus — соцсеть, которая приводит к намазу.</b> Мы зовём сюда тех, кто делает лучший исламский контент.',
    heroFine: 'Для iPhone. Авторам программы — Premium бесплатно. Без эксклюзива: Instagram и TikTok остаются с вами.',
    heroAlt: ['Reminders в Firdaus: «Время Аср. Лента подождёт» и кнопка «Отметить намаз»', 'Умма в Firdaus: лента записей'],

    painKick: 'Как устроены их ленты',
    painH: 'Алгоритм Instagram и TikTok работает не на вас. Он работает на время в приложении.',
    painLead: 'Вы знаете это изнутри. Мы тоже — поэтому строили по-другому.',
    why: [
      ['Бесконечная лента на дофамине', 'Конца у ленты нет по замыслу. Каждый свайп — маленькая награда, и мозг ждёт следующую. Чем дольше человек листает, тем больше рекламы увидел: это и есть их бизнес.'],
      ['Музыка — топливо алгоритма', 'Трендовый звук толкает ролик в рекомендации. Вы не ставите музыку из принципа — и знаете, чем это кончается: охват падает, ролик тонет.'],
      ['Ваш зритель уходит в мусор', 'Человек досмотрел ваш ролик, сказал «СубханАллах» — и через секунду листает дальше: розыгрыш, танец, чужая жизнь. Найти вас там снова — как искать сокровище в мусоре.'],
    ],
    feedT: 'Где стоит ваш ролик в их ленте',
    feed: [['😂', 'Пранк в метро'], ['💃', 'Танец под трендовый звук'], ['📦', 'Распаковка за 7 секунд'], ['🎰', 'Реклама ставок'], ['☪', 'Ваш аят'], ['💍', 'Чужая свадьба'], ['🔥', 'Скандал дня'], ['🤳', 'Пранк над мамой']],
    feedV: 'Ваш ролик здесь — <b>одна карточка из бесконечных</b>. Алгоритм держит человека, а не ведёт его.',

    baseKick: 'Firdaus',
    baseH: 'Соцсеть, которая приводит к намазу.',
    baseLead: 'Мы не боремся с TikTok за минуты. Мы строили ленту, после которой человек встаёт на намаз, а не листает до двух ночи.',
    pillars: [
      ['Только ислам', 'Каждая лента ведёт к дину', 'Reminders, Умма, сообщения — всё вокруг веры. Чтение, хутба, семья, быт, кухня, путь к исламу: всё, что снято с адабом, здесь к месту. До показа каждый ролик проходит проверку кадров, речи и текста, жалобы разбирает команда. Ваш ролик стоит рядом с дуа, а не рядом с пранком.', 'Лента Reminders в Firdaus'],
      ['Время намаза', 'Firdaus живёт по времени намаза', 'На главном экране — отсчёт до конца времени намаза. Пришло время — ролик в Reminders останавливается: «Лента подождёт». Ваш контент не держит человека в телефоне, а отпускает его на намаз.', 'Главный экран Firdaus: отсчёт до конца времени намаза'],
      ['Без музыки', 'Без музыки — это правило, а не наказание', 'В Reminders нет музыкальных инструментов ни у кого. Голос, слово и нашид без инструментов — стандарт ленты. Вашему ролику не с кем соревноваться в громкости.', 'Умма в Firdaus: записи и автоперевод'],
    ],

    algoKick: 'Алгоритм',
    algoH: 'Лента ищет вашему ролику своих зрителей.',
    algoLead: 'Не тех, кто случайно остановится, а тех, кто поймёт и досмотрит.',
    steps3: [
      ['Ваш язык', 'Первые показы — людям, которые понимают язык ролика.'],
      ['Круг шире', 'Ролик досматривают и сохраняют лучше среднего — показов становится больше.'],
      ['Весь мир', 'Сильный ролик выходит за границу языка, к мусульманам по всему миру.'],
    ],
    notes: [
      ['Чтение Корана — без границы языка', 'Лента считает чтение понятным каждому мусульманину и показывает его всем, а не только тем, кто говорит по-арабски.'],
      ['Новым авторам — прибавка', 'Первые три ролика нового автора получают прибавку на пробных показах. Крупные аккаунты вас не заслоняют: решает, как смотрят, а не сколько у вас подписчиков.'],
      ['Сейчас — лучшее время зайти', 'Firdaus только вышел в App Store, и авторов в Reminders пока немного: сильный ролик видит вся лента. Кто пришёл первым, растёт вместе с площадкой.'],
      ['Всё видно в Студии', 'По каждому ролику: просмотры, досмотры, откуда пришли зрители и на каких языках они говорят.'],
    ],
    algoAlt: ['Студия автора: сколько зрителей увидели, смотрели и досмотрели ролик', 'Студия автора: на каких языках говорят зрители ролика'],

    stKick: 'Статус',
    stH: 'Ваше имя — с золотой галочкой.',
    stLead: 'Галочку ставит только команда и только после проверки. Под именем — ваш статус. Люди сразу видят, кто перед ними, а копии без галочки видны издалека.',
    stRoles: ['Чтец Корана', 'Имам', 'Хафиз', 'Устаз', 'Мечеть', 'Автор Firdaus'],
    stMine: 'Ваш статус в Firdaus',
    stLife: 'Снимаете семью, быт, кухню, путь в вере? Ваш статус — «Автор Firdaus».',
    stNick: 'Тот же ник в Firdaus: @{h}',
    stAlt: 'Профиль в Firdaus: золотая галочка и подпись статуса под именем',
    roles: {
      reciter: ['Чтец Корана', 'Ваше чтение лента показывает всем мусульманам, на каком бы языке они ни говорили.'],
      imam: ['Имам', 'Мысль после хутбы за полторы минуты дойдёт и до тех, кто не был в мечети.'],
      hafiz: ['Хафиз', 'Подпись «Хафиз» под именем, и чтение Корана — без границы языка.'],
      ustaz: ['Устаз', 'Короткий урок находит тех, кто понимает ваш язык, а сильный уходит дальше.'],
      mosque: ['Мечеть', 'Страница мечети с золотой галочкой: люди видят, что она настоящая.'],
      creator: ['Автор Firdaus', 'Значок «Автор Firdaus», Premium и Студия с первого дня в программе.'],
      public: ['Известная личность', 'Галочка защищает ваше имя: копии без неё видны сразу.'],
    },

    prKick: 'Всё приложение — вам',
    prH: 'Обычный пользователь платит за Premium. Автор программы — нет.',
    prLead: 'Программа авторов открывает весь Firdaus: каждую функцию и золотой полумесяц у имени, на всё время участия.',
    priceOld: '5 390 ₸ в месяц', priceNew: '0 ₸', priceNote: 'Premium — старший уровень подписки, выше Plus. Для авторов программы — бесплатно',
    focusKick: 'Фокус',
    focusH: 'Instagram и TikTok закрыты, пока намаз не прочитан.',
    focusP: 'Фокус закрывает на время намаза приложения, которые вы выберете. Открываются они, когда намаз прочитан. Это то, чего не даст ни одна соцсеть: она зарабатывает на обратном.',
    focusLi: ['Сами выбираете, что закрыть', 'Отсчёт до конца времени намаза', 'Отметка намаза с проверкой'],
    focusAlt: 'Фокус в Firdaus: «Закрыто. Идёт Аср» и отсчёт до конца времени намаза',
    feats: [
      ['home', 'Время намаза', 'Точное время по вашему городу и отсчёт до следующего намаза.'],
      ['qibla', 'Кибла', 'Направление на Каабу из любой точки мира.'],
      ['quran', 'Коран', 'Арабский текст, переводы и место, где вы остановились.'],
      ['dhikr', 'Зикры', 'Утренние и вечерние азкары с прогрессом и тасбих.'],
      ['umma', 'Умма', 'Лента как X: записи, ответы и автоперевод с других языков.'],
      ['reels', 'Reminders', 'Смотреть может каждый. Выкладывать — только с подпиской: вам открыто.'],
      ['messages', 'Сообщения', 'Переписка со стикерами и видеокружками.'],
      ['studio', 'Студия', 'Статистика каждого ролика, как в TikTok Studio.'],
    ],
    featAlt: {
      home: 'Главный экран Firdaus: время намаза и отсчёт', qibla: 'Кибла в Firdaus', quran: 'Коран в Firdaus: арабский текст и перевод', dhikr: 'Зикры в Firdaus',
      umma: 'Умма в Firdaus', reels: 'Reminders в Firdaus', messages: 'Сообщения в Firdaus', studio: 'Студия автора в Firdaus',
    },
    crescent: ['Золотой полумесяц', 'Знак Premium у имени — в Умме, сообщениях и профиле.'],

    mKick: 'Халяльный заработок',
    mH: 'Деньги — честными цифрами.',
    mLead: 'Скажем прямо: за просмотры Firdaus не платит и не обещает. Деньги здесь честные — доля с подписок людей, которых вы привели, и заказы брендов следующим шагом.',
    pBadge: 'Работает сейчас', pH: 'Партнёрская программа',
    pP: 'Ваш партнёрский код подписчики вводят в приложении — и оформляют Firdaus Plus. С каждой их оплаты вам приходит доля, пока они платят. Выплата раз в месяц. Роли автора и партнёра совмещаются.',
    pct: [['20%', 'с каждой оплаты подписки тех, кого вы привели'], ['5%', 'с оплат тех, кого привели они, первые 12 месяцев']],
    calcL: 'Сколько ваших подписчиков оплачивает Plus (100 — это 0,1 % от 100 тысяч)', calcWho: 'человек', calcIn: 'Страна', calcOut: 'вам в месяц',
    calcGroups: ['Казахстан · Plus 3 790 ₸', 'США, Европа и другие · Plus $9,99', 'Страны Залива · Plus $12,99', 'СНГ, Турция, Малайзия · Plus $4,99'],
    calcFine: 'С оплаты Plus за месяц в Казахстане (3 790 ₸) после НДС, комиссии Apple и налога вам приходит 533 ₸. <b>Это пример, а не обещание:</b> доход зависит от того, сколько людей придёт и останется.',
    bBadge: 'Следующий шаг', bH: 'Заказы от халяльных брендов',
    bP: 'Бренды будут размещать задания, а авторы — снимать рекламу в своём стиле, на органике.',
    bLi: ['Только халяльные бренды', 'Каждый бренд одобряет команда', 'Авторы программы — первыми'],
    mNote: 'Партнёрский код заводит команда: попросите его вместе с заявкой автора.',
    terms: [
      ['Без эксклюзива', 'Продолжайте вести Instagram и TikTok. Уходить оттуда не нужно.'],
      ['Ролики — ваши', 'Всё, что вы публикуете, остаётся вашим. Удалить можно в любой момент.'],
      ['Без плана', 'Обязательного числа роликов нет. Выкладываете, когда есть что сказать.'],
      ['Выйти — в любой день', 'Из программы можно выйти когда угодно, без условий.'],
    ],

    sH: 'Начните с того, что уже сняли.',
    sLead: 'Ролики без музыки, которые уже лежат в вашем Instagram и TikTok, можно выложить в Firdaus в первый же день. Переснимать ничего не нужно.',
    sLi: [['От 3 до 90 секунд.', 'Вертикальные, квадратные и горизонтальные.'], ['Отметьте язык ролика', 'или «без слов» — лента сама найдёт зрителей.'], ['Голос и нашиды без инструментов', 'подходят. Музыкальные инструменты — нет.']],

    hKick: 'Как вступить',
    hH: 'Три шага до золотой галочки.',
    hSteps: [
      ['Скачайте Firdaus', 'Из App Store. Вход через Apple или Google — меньше минуты.'],
      ['Подайте заявку в приложении', 'Настройки → Программа авторов. Укажите свой Instagram или TikTok и на пару минут поставьте в описание профиля код <code>FIRDAUS-XXXXXX</code>: так мы видим, что страница ваша.'],
      ['Команда подтверждает', 'Золотая галочка, статус под именем и Premium. Ответ придёт уведомлением.'],
    ],
    hFine: 'Отбираем вручную. Ориентир — около 10 000 подписчиков, но смотрим на качество, а не на цифру.',
    hPersonal: ['Ответьте на наше сообщение', 'Вас пригласили лично: подайте заявку в приложении (Настройки → Программа авторов) и ответьте на наше сообщение в директе с этого аккаунта. Код в описание ставить не нужно — галочку поставим сами.'],
    hAlt: 'Экран «Программа авторов» в Firdaus',

    tKick: 'Кто делает Firdaus',
    tH: 'Основатели.',
    tLead: 'Firdaus сделан без инвестора и без алгоритмов вовлечённости — от сервера до каждого экрана. Мы строим его из Казахстана для всей уммы и каждую заявку автора читаем лично.',
    team: [
      ['arsen', 'Арсен', '@arsen', 'Основатель и CEO, студент-медик.'],
      ['jantyko', 'Жантемир', '@jantyko', 'Сооснователь, студент Назарбаев Университета.'],
    ],
    tAlt: ['Арсен, основатель Firdaus', 'Жантемир, сооснователь Firdaus'],

    fH: 'Ваш контент ведёт к Аллаху. <span class="w">Пусть и лента ведёт туда же.</span>',
    fFine: 'Firdaus для iPhone. Программа авторов: золотая галочка, Premium бесплатно, 20 % партнёрских.',

    foot: ['О Firdaus', 'Партнёрам', 'Поддержка', 'Политика конфиденциальности', 'Условия'],
    footNote: 'Firdaus — приложение для iPhone. Apple, iPhone и App Store — товарные знаки Apple Inc. Экраны на странице — настоящие экраны приложения Firdaus с демонстрационным профилем. Имя и ник из личной ссылки показываются только в вашем браузере.',
    apply: {
      title: 'Заявка на статус в Firdaus',
      desc: 'Ссылка открывает в приложении Firdaus заявку на статус с золотой галочкой или в программу авторов.',
      ogTitle: 'Вас приглашают в Firdaus',
      ogDesc: 'Заявка на статус с золотой галочкой и в программу авторов. Откройте ссылку в приложении Firdaus.',
      to: 'Заявка на статус с золотой галочкой', toAuthor: 'Заявка в программу авторов',
      h1a: 'Откройте', h1b: 'в приложении Firdaus',
      lead: 'Заявка подаётся в приложении и занимает пару минут: вы называете свои страницы в соцсетях и ставите наш код в описание профиля. Так мы знаем, что это вы.',
      yours: 'Вас приглашают как:', author: 'Автор Firdaus',
      open: 'Открыть в Firdaus',
      hint: 'Кнопка сработает, если Firdaus уже стоит на этом iPhone.',
      hintFail: 'Не открылось? Значит, Firdaus на этом телефоне пока нет. Скачайте его — кнопка чуть ниже.',
      hintIab: 'Не открывается? {app} держит ссылки у себя. Нажмите ⋯ вверху справа, выберите «{menu}» и нажмите кнопку ещё раз.',
      menuExt: 'Открыть во внешнем браузере', menuBr: 'Открыть в браузере',
      hintAndroid: 'Firdaus — приложение для iPhone. Откройте эту ссылку на iPhone.',
      hintDesk: 'Откройте эту ссылку на iPhone, где стоит Firdaus.',
      noH: 'Ещё нет приложения?',
      liveP: 'Скачайте Firdaus, а потом откройте эту ссылку ещё раз: заявка откроется в приложении.',
      liveBtn: 'Скачать в App Store',
      more: 'Что Firdaus даёт авторам',
      footNote: 'Firdaus — приложение для iPhone. Apple, iPhone и App Store — товарные знаки Apple Inc.',
    },
  },
  en: {
    lang: 'en', locale: 'en_US', altLocale: 'ru_RU',
    title: 'Firdaus Creator Program',
    desc: 'Instagram and TikTok keep people scrolling. Firdaus leads them to prayer. The Creator Program: a gold check, free Firdaus Premium, Studio analytics and a 20% partner share.',
    ogTitle: 'On TikTok, your ayah plays between a prank and a dance',
    ogDesc: 'Firdaus is the social network that leads to prayer. Creator Program: gold check, free Premium, 20% partner share.',
    ogAlt: 'Firdaus Creator Program',
    home: 'Firdaus home', navAria: 'Sections',
    nav: ['Why', 'Algorithm', 'Status', 'Earnings', 'Free', 'How to join'],
    langChip: 'RU', langSr: ' Читать по-русски', langAttr: 'ru',
    store: 'Download on the App Store', join: 'Become a creator', joinShort: 'Join',
    greet: 'Assalamu alaikum.', greetName: '{n}, assalamu alaikum.',
    invite: 'Personal invitation',
    h1a: '<span data-cr="what">On TikTok, your ayah</span> plays between a prank and a dance.',
    h1b: 'On Firdaus, it plays between the adhan and the prayer.',
    what: {
      quran: 'On TikTok, your ayah', talk: 'On TikTok, your reminder', video: 'On TikTok, your video',
    },
    tick: { quran: 'Your ayah', talk: 'Your reminder', video: 'Your video' },
    lead: 'Instagram and TikTok are built to keep people in the feed as long as possible. The algorithm doesn’t care what they watch. <b>Firdaus is the social network that leads to prayer.</b> We’re bringing in the people who make the best Islamic content.',
    heroFine: 'For iPhone. Creators in the program get Premium free. No exclusivity: keep your Instagram and TikTok.',
    heroAlt: ['Reminders on Firdaus: “It’s time for Asr. The feed will wait” and a Mark prayer button', 'Umma on Firdaus: the feed of posts'],

    painKick: 'How their feeds work',
    painH: 'The Instagram and TikTok algorithm doesn’t work for you. It works for time spent in the app.',
    painLead: 'You know this from the inside. So do we, which is why we built something else.',
    why: [
      ['An endless feed on dopamine', 'The feed never ends, by design. Every swipe is a small reward, and the brain waits for the next one. The longer people scroll, the more ads they see: that is their business.'],
      ['Music fuels the algorithm', 'A trending sound pushes a video into recommendations. You leave music out on principle, and you know how that ends: reach drops and the video sinks.'],
      ['Your viewer scrolls into junk', 'Someone watches your video to the end, says “SubhanAllah”, and a second later scrolls on: a prank, a dance, a stranger’s life. Finding you there again is like looking for treasure in a landfill.'],
    ],
    feedT: 'Where your video sits in their feed',
    feed: [['😂', 'Subway prank'], ['💃', 'Dance to a trending sound'], ['📦', 'Unboxing in 7 seconds'], ['🎰', 'Betting ad'], ['☪', 'Your ayah'], ['💍', 'A stranger’s wedding'], ['🔥', 'Drama of the day'], ['🤳', 'Pranking mom']],
    feedV: 'Here your video is <b>one card in an endless stack</b>. The algorithm holds people. It doesn’t lead them anywhere.',

    baseKick: 'Firdaus',
    baseH: 'The social network that leads to prayer.',
    baseLead: 'We don’t compete with TikTok for minutes. We built a feed after which people get up to pray, not keep scrolling until 2 a.m.',
    pillars: [
      ['Only Islam', 'Every feed leads to the deen', 'Reminders, Umma, messages: everything revolves around faith. Recitation, khutbah, family, home, cooking, the path to Islam: anything filmed with adab belongs here. Before it’s shown, every video is checked frame, speech and text, and the team handles reports. Your video sits next to a dua, not next to a prank.', 'The Reminders feed on Firdaus'],
      ['Prayer time', 'Firdaus runs on prayer time', 'The home screen counts down to the end of the prayer window. When it’s time, the video in Reminders pauses: “The feed will wait.” Your content doesn’t hold people on their phones. It releases them to pray.', 'Firdaus home screen: countdown to the end of the prayer window'],
      ['No music', 'No music is the rule, not a penalty', 'Nobody uses musical instruments in Reminders. Voice, words and nasheeds without instruments are the standard. Your video has no one to out-shout.', 'Umma on Firdaus: posts and auto-translation'],
    ],

    algoKick: 'Algorithm',
    algoH: 'The feed finds the right viewers for your video.',
    algoLead: 'Not whoever happens to stop, but people who will understand it and watch to the end.',
    steps3: [
      ['Your language', 'The first views go to people who understand the language of the video.'],
      ['A wider circle', 'People finish and save it more than average, so it gets shown more.'],
      ['The whole world', 'A strong video crosses the language line, to Muslims everywhere.'],
    ],
    notes: [
      ['Quran recitation has no language barrier', 'The feed treats recitation as understood by every Muslim and shows it to everyone, not only Arabic speakers.'],
      ['A boost for new creators', 'A new creator’s first three videos get a boost in trial views. Big accounts don’t bury you: what matters is how people watch, not how many followers you have.'],
      ['Now is the best time to join', 'Firdaus has just launched on the App Store, and Reminders has few creators so far: a strong video reaches the whole feed. Those who come first grow with the platform.'],
      ['It’s all in Studio', 'For every video: views, completion, where viewers came from and which languages they speak.'],
    ],
    algoAlt: ['Creator Studio: how many viewers saw, watched and finished a video', 'Creator Studio: which languages a video’s viewers speak'],

    stKick: 'Status',
    stH: 'Your name, with a gold check.',
    stLead: 'Only the team gives the check, and only after verification. Your status sits under your name. People see right away who you are, and copycats without a check stand out.',
    stRoles: ['Quran reciter', 'Imam', 'Hafiz', 'Teacher', 'Mosque', 'Firdaus Creator'],
    stMine: 'Your status on Firdaus',
    stLife: 'Filming family, home, cooking, your path in faith? Your status is Firdaus Creator.',
    stNick: 'Same handle on Firdaus: @{h}',
    stAlt: 'A Firdaus profile: gold check and status under the name',
    roles: {
      reciter: ['Quran reciter', 'The feed shows your recitation to every Muslim, whatever language they speak.'],
      imam: ['Imam', 'A thought from the khutbah, in ninety seconds, reaches people who weren’t at the mosque.'],
      hafiz: ['Hafiz', '“Hafiz” under your name, and your recitation crosses every language line.'],
      ustaz: ['Teacher', 'A short lesson finds people who speak your language, and a strong one travels further.'],
      mosque: ['Mosque', 'A mosque page with a gold check: people see it’s the real one.'],
      creator: ['Firdaus Creator', 'The Firdaus Creator badge, Premium and Studio from your first day in the program.'],
      public: ['Public figure', 'The check protects your name: copycats without it stand out at once.'],
    },

    prKick: 'The whole app is yours',
    prH: 'Regular users pay for Premium. Creators in the program don’t.',
    prLead: 'The Creator Program unlocks all of Firdaus: every feature and the gold crescent by your name, for as long as you’re in the program.',
    priceOld: '$13.99 a month', priceNew: '$0', priceNote: 'Premium is the top subscription tier, above Plus. Free for creators in the program',
    focusKick: 'Focus',
    focusH: 'Instagram and TikTok stay locked until you’ve prayed.',
    focusP: 'Focus locks the apps you choose during prayer time. They open once you’ve prayed. No social network will ever give you this: they make money on the opposite.',
    focusLi: ['You choose what to lock', 'Countdown to the end of prayer time', 'Prayer check-in with verification'],
    focusAlt: 'Focus on Firdaus: “Locked. It’s Asr time” with a countdown',
    feats: [
      ['home', 'Prayer times', 'Accurate times for your city and a countdown to the next prayer.'],
      ['qibla', 'Qibla', 'The direction of the Kaaba from anywhere in the world.'],
      ['quran', 'Quran', 'Arabic text, translations and the place where you stopped.'],
      ['dhikr', 'Dhikr', 'Morning and evening adhkar with progress, plus a tasbih.'],
      ['umma', 'Umma', 'A feed like X: posts, replies and auto-translation from other languages.'],
      ['reels', 'Reminders', 'Anyone can watch. Posting takes a subscription: for you, it’s open.'],
      ['messages', 'Messages', 'Chats with stickers and video circles.'],
      ['studio', 'Studio', 'Analytics for every video, like TikTok Studio.'],
    ],
    featAlt: {
      home: 'Firdaus home screen: prayer times and countdown', qibla: 'Qibla on Firdaus', quran: 'Quran on Firdaus: Arabic text and translation', dhikr: 'Dhikr on Firdaus',
      umma: 'Umma on Firdaus', reels: 'Reminders on Firdaus', messages: 'Messages on Firdaus', studio: 'Creator Studio on Firdaus',
    },
    crescent: ['Gold crescent', 'The Premium mark by your name, in Umma, messages and your profile.'],

    mKick: 'Halal earnings',
    mH: 'Money, in honest numbers.',
    mLead: 'Straight talk: Firdaus doesn’t pay for views and doesn’t promise to. The money here is honest: a share of subscriptions from people you bring, and brand deals as the next step.',
    pBadge: 'Live now', pH: 'Partner Program',
    pP: 'Your followers enter your partner code in the app and subscribe to Firdaus Plus. You get a share of every payment they make, for as long as they pay. Paid out monthly. You can be a creator and a partner at once.',
    pct: [['20%', 'of every subscription payment from people you bring'], ['5%', 'of payments from people they bring, for the first 12 months']],
    calcL: 'How many of your followers pay for Plus (100 is 0.1% of 100K)', calcWho: 'people', calcIn: 'Country', calcOut: 'to you per month',
    calcGroups: ['Kazakhstan · Plus 3,790 ₸', 'US, Europe and others · Plus $9.99', 'Gulf countries · Plus $12.99', 'CIS, Turkey, Malaysia · Plus $4.99'],
    calcFine: 'From a $9.99 monthly Plus payment in the US, after Apple’s commission and our tax, you get $1.63. <b>This is an example, not a promise:</b> income depends on how many people come and stay.',
    bBadge: 'Next step', bH: 'Paid work from halal brands',
    bP: 'Brands will post briefs, and creators will make the ad in their own style, as organic content.',
    bLi: ['Halal brands only', 'The team approves every brand', 'Creators in the program get first access'],
    mNote: 'The team sets up your partner code: ask for it along with your creator application.',
    terms: [
      ['No exclusivity', 'Keep running your Instagram and TikTok. You don’t have to leave.'],
      ['Your videos stay yours', 'Everything you post remains yours. Delete anything, any time.'],
      ['No quota', 'There’s no required number of videos. Post when you have something to say.'],
      ['Leave any day', 'You can leave the program whenever you like, no strings attached.'],
    ],

    sH: 'Start with what you’ve already filmed.',
    sLead: 'The music-free videos already on your Instagram and TikTok can go up on Firdaus on day one. No need to reshoot anything.',
    sLi: [['3 to 90 seconds.', 'Vertical, square and horizontal.'], ['Tag the language', 'or “no words”, and the feed finds the viewers.'], ['Voice and nasheeds without instruments', 'are fine. Musical instruments are not.']],

    hKick: 'How to join',
    hH: 'Three steps to a gold check.',
    hSteps: [
      ['Download Firdaus', 'From the App Store. Sign in with Apple or Google in under a minute.'],
      ['Apply in the app', 'Settings → Creator Program. Add your Instagram or TikTok and put the code <code>FIRDAUS-XXXXXX</code> in your bio for a couple of minutes: that’s how we see the page is yours.'],
      ['The team confirms', 'Gold check, status under your name and Premium. You’ll get a notification with the answer.'],
    ],
    hFine: 'We select by hand. The guideline is about 10,000 followers, but we look at quality, not the number.',
    hPersonal: ['Reply to our message', 'You were invited personally: apply in the app (Settings → Creator Program) and reply to our direct message from this account. No code in your bio needed: we’ll add the check ourselves.'],
    hAlt: 'The Creator Program screen on Firdaus',

    tKick: 'Who builds Firdaus',
    tH: 'The founders.',
    tLead: 'Firdaus is built with no investor and no engagement algorithms, from the server to every screen. We build it from Kazakhstan for the whole ummah and read every creator application personally.',
    team: [
      ['arsen', 'Arsen', '@arsen', 'Founder and CEO, medical student.'],
      ['jantyko', 'Zhantemir', '@jantyko', 'Co-founder, student at Nazarbayev University.'],
    ],
    tAlt: ['Arsen, founder of Firdaus', 'Zhantemir, co-founder of Firdaus'],

    fH: 'Your content points to Allah. <span class="w">Let the feed point there too.</span>',
    fFine: 'Firdaus for iPhone. Creator Program: gold check, free Premium, 20% partner share.',

    foot: ['About Firdaus', 'Partners', 'Support', 'Privacy Policy', 'Terms'],
    footNote: 'Firdaus is an app for iPhone. Apple, iPhone and App Store are trademarks of Apple Inc. The screens on this page are real Firdaus app screens with a demo profile. The name and handle from a personal link are shown only in your browser.',
    apply: {
      title: 'Apply for a status on Firdaus',
      desc: 'This link opens the application for a gold-check status or the Creator Program in the Firdaus app.',
      ogTitle: 'You’re invited to Firdaus',
      ogDesc: 'Apply for a gold-check status or the Creator Program. Open the link in the Firdaus app.',
      to: 'Application for a gold-check status', toAuthor: 'Creator Program application',
      h1a: 'Open it', h1b: 'in the Firdaus app',
      lead: 'You apply in the app, and it takes a couple of minutes: you name your social media pages and put our code in your profile bio. That’s how we know it’s you.',
      yours: 'You’re invited as:', author: 'Firdaus Creator',
      open: 'Open in Firdaus',
      hint: 'This works if Firdaus is already on this iPhone.',
      hintFail: 'Didn’t open? Then Firdaus isn’t on this phone yet. Download it with the button below.',
      hintIab: 'Not opening? {app} keeps links inside itself. Tap ⋯ at the top right, choose “{menu}”, then tap the button again.',
      menuExt: 'Open in external browser', menuBr: 'Open in browser',
      hintAndroid: 'Firdaus is an iPhone app. Open this link on an iPhone.',
      hintDesk: 'Open this link on an iPhone with Firdaus installed.',
      noH: 'Don’t have the app yet?',
      liveP: 'Download Firdaus, then open this link again: the application will open in the app.',
      liveBtn: 'Download on the App Store',
      more: 'What Firdaus offers creators',
      footNote: 'Firdaus is an app for iPhone. Apple, iPhone and App Store are trademarks of Apple Inc.',
    },
  },
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/* Настоящий экран приложения в корпусе iPhone (CSS). eager — только первый экран. */
const phone = (name, alt, { eager = false, cls = '', sizes = '(max-width: 860px) 70vw, 330px' } = {}) =>
  `<div class="phone${cls ? ' ' + cls : ''}">${SB}<img data-pic="${name}" alt="${esc(alt)}" sizes="${sizes}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async"></div>`;
/* Строка состояния iOS поверх снимка: снимки сняты без неё (--bare). */
const SB = '<span class="sb" aria-hidden="true"><b>9:41</b><svg viewBox="0 0 66 12"><g fill="#fff"><rect x="0" y="7" width="3" height="5" rx="1"/><rect x="4.6" y="5" width="3" height="7" rx="1"/><rect x="9.2" y="2.6" width="3" height="9.4" rx="1"/><rect x="13.8" y="0" width="3" height="12" rx="1"/><path d="M29 2.4a10 10 0 0 1 7 2.9l1.3-1.4a12 12 0 0 0-16.6 0L22 5.3a10 10 0 0 1 7-2.9zm0 3.7a6.2 6.2 0 0 1 4.4 1.8l1.3-1.4a8.2 8.2 0 0 0-11.4 0l1.3 1.4A6.2 6.2 0 0 1 29 6.1zm0 3.6c.7 0 1.3.3 1.8.7L29 12.2l-1.8-1.8c.5-.4 1.1-.7 1.8-.7z"/><rect x="42" y="1" width="21" height="10" rx="3" fill="none" stroke="#fff" stroke-opacity=".45"/><rect x="44" y="3" width="15" height="6" rx="1.6"/><path d="M64.5 4.4v3.2c.7-.2 1.2-.9 1.2-1.6s-.5-1.4-1.2-1.6z" fill-opacity=".45"/></g></svg></span>';
/* Верх экрана для карточки возможности */
const crop = (name, alt) => `<div class="crop"><img data-pic="${name}" alt="${esc(alt)}" sizes="(max-width: 760px) 44vw, 260px" loading="lazy" decoding="async"></div>`;

const storeBtn = (t, cls = '') => `<a class="btn${cls}" href="${APP_STORE}" data-link="appstore">${asIcon}<span data-label>${t.store}</span></a>`;
const joinBtn = (t, L, cls = ' ghost') => `<a class="btn${cls}" href="${B}${L}/creators/apply/?status=author" data-cr-join>${t.join}</a>`;

function page(t) {
  const en = t.lang === 'en';
  const alt = `${B}${en ? '' : '/en'}/creators/`;
  const home = `${B}${en ? '/en' : ''}/`;
  const L = en ? '/en' : '';
  const canon = `https://firdaus.life${en ? '/en' : ''}/creators/`;
  const p = (s) => `cr-${en ? 'en' : 'ru'}-${s}`;
  /* В страницу для скрипта уходит только то, что он подставляет сам. */
  const data = {
    lang: t.lang, alt, apply: `${B}${L}/creators/apply/`,
    greet: t.greet, greetName: t.greetName, what: t.what, tick: t.tick, stNick: t.stNick, hPersonal: t.hPersonal,
    roles: t.roles, calcGroups: t.calcGroups,
  };
  return `<!doctype html>
<html lang="${t.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${t.title}</title>
<meta name="description" content="${esc(t.desc)}">
${preview ? '<meta name="robots" content="noindex">\n' : ''}<link rel="canonical" href="${canon}">
<link rel="alternate" hreflang="ru" href="https://firdaus.life/creators/">
<link rel="alternate" hreflang="en" href="https://firdaus.life/en/creators/">
<link rel="alternate" hreflang="x-default" href="https://firdaus.life/en/creators/">
<meta name="theme-color" content="#0B100E">
<meta name="apple-itunes-app" content="app-id=6806738733">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Firdaus">
<meta property="og:locale" content="${t.locale}">
<meta property="og:locale:alternate" content="${t.altLocale}">
<meta property="og:title" content="${esc(t.ogTitle)}">
<meta property="og:description" content="${esc(t.ogDesc)}">
<meta property="og:url" content="${canon}">
<meta property="og:image" content="https://firdaus.life/assets/og/creators-${t.lang}.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(t.ogAlt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(t.ogTitle)}">
<meta name="twitter:description" content="${esc(t.ogDesc)}">
<meta name="twitter:image" content="https://firdaus.life/assets/og/creators-${t.lang}.jpg">
<link rel="icon" type="image/png" href="/assets/favicon-48.png">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<script>
/* Язык по ссылке (l=ru|en, остальное — английская), иначе по телефону; метки из ссылки — на всю сессию.
   Личная ссылка поисковикам не нужна: noindex. */
(function(){var d=document.documentElement,q=location.search,en=d.lang==='en';d.className='js';
var m=/[?&]l=([a-z]{2})/i.exec(q),want=m?(m[1].toLowerCase()==='ru'?'ru':'en'):null;
if(!want&&!/bot|crawl|spider|slurp|preview|facebookexternalhit/i.test(navigator.userAgent)){var s=null;try{s=localStorage.getItem('lang')}catch(e){}
if(s==='ru'||s==='en')want=s;else{var a=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||'ru'],ru=false;for(var i=0;i<a.length;i++)if(/^(ru|kk|uk|be|uz|ky|tg|tt|az|hy|ka|ba|ce)\\b/i.test(a[i]))ru=true;want=ru?'ru':'en'}}
if(want&&(want==='en')!==en&&location.protocol!=='file:'){location.replace('${alt}'+q+location.hash);return}
if(q.length>1){var r=document.createElement('meta');r.name='robots';r.content='noindex';document.head.appendChild(r);if(/[?&][nrh]=/.test(q))d.className='js cr-wait'}
})();
</script>
<link rel="stylesheet" href="/assets/creators.css">
<script src="/assets/site.js"></script>
<script>
/* Эта страница — для дня, когда Firdaus уже в App Store (слово Арсена 15.11): кнопки App Store живые
   здесь всегда, не дожидаясь общего флага сайта. Флаг сайта остаётся для остальных страниц. */

</script>
</head>
<body>
${SPRITE}
<i id="top-mark" aria-hidden="true"></i>
<header class="top">
<div class="wrap">
<a class="lockup" href="${home}" aria-label="${esc(t.home)}"><img src="/assets/logo-68.webp" width="32" height="32" alt="">Firdaus</a>
<nav aria-label="${t.navAria}">
<a href="#pochemu">${t.nav[0]}</a>
<a href="#algoritm">${t.nav[1]}</a>
<a href="#status">${t.nav[2]}</a>
<a href="#dohod">${t.nav[3]}</a>
<a href="#premium">${t.nav[4]}</a>
<a href="#kak">${t.nav[5]}</a>
</nav>
<a class="chip" href="${alt}" data-lang="${t.langAttr}" data-cr-alt hreflang="${t.langAttr}" lang="${t.langAttr}">${t.langChip}<span class="sr">${t.langSr}</span></a>
<a class="btn sm" href="#kak">${t.joinShort}</a>
</div>
</header>

<main>
<section class="hero" id="top">
<div class="wrap hero-grid">
<div>
<p class="greet"><span class="salam" data-cr="greet">${t.greet}</span><span class="invite" data-cr-if="personal" hidden>${seal}<b data-cr="invite">${t.invite}</b></span></p>
<h1>${t.h1a} <span class="w">${t.h1b}</span></h1>
<p class="lead">${t.lead}</p>
<div class="acts">${storeBtn(t)}${joinBtn(t, L)}</div>
<p class="fine">${t.heroFine}</p>
</div>
<div class="duo">
${phone(p('umma'), t.heroAlt[1], { cls: 'back', sizes: '(max-width: 919px) 52vw, 220px' })}
${phone(p('reel-pause'), t.heroAlt[0], { eager: true, cls: 'front glow', sizes: '(max-width: 919px) 70vw, 340px' })}
</div>
</div>
</section>

<section class="sec pain" id="pochemu">
<div class="wrap">
<div class="sec-head rv"><span class="kick">${t.painKick}</span><h2>${t.painH}</h2><p class="lead">${t.painLead}</p></div>
<div class="pain-grid">
<ol class="why">
${t.why.map(([h, b], i) => `<li class="rv" style="--i:${i}"><h3>${h}</h3><p>${b}</p></li>`).join('\n')}
</ol>
<div class="feedbox rv" aria-label="${esc(t.feedT)}">
<p class="t">${t.feedT}</p>
<div class="reel" aria-hidden="true"><ul>
${[...t.feed, ...t.feed].map(([e, s]) => (/аят|ayah/i.test(s) ? `<li class="me"><i>${e}</i><span data-cr="tick">${s}</span></li>` : `<li><i>${e}</i>${s}</li>`)).join('')}
</ul></div>
<p class="v">${t.feedV}</p>
</div>
</div>
</div>
</section>

<section class="sec base" id="firdaus">
<div class="wrap">
<div class="sec-head rv"><span class="kick em">${t.baseKick}</span><h2>${t.baseH}</h2><p class="lead">${t.baseLead}</p></div>
<div class="pillars">
${t.pillars.slice(0, 2).map(([tag, h, b, a], i) => `<div class="pillar${i % 2 ? ' flip' : ''}">
<div class="pv rv">${phone(p(['umma', 'home'][i]), a)}</div>
<div class="rv"><span class="tag">${ic(['check', 'pause'][i])}${tag}</span><h3>${h}</h3><p class="body">${b}</p></div>
</div>`).join('\n')}
</div>
<div class="rule rv"><span class="tag">${ic('mic')}${t.pillars[2][0]}</span><h3>${t.pillars[2][1]}</h3><p class="body">${t.pillars[2][2]}</p></div>

<div class="algo" id="algoritm">
<div class="sec-head rv"><span class="kick em">${t.algoKick}</span><h2>${t.algoH}</h2><p class="lead">${t.algoLead}</p></div>
<ol class="steps3">
${t.steps3.map(([h, b], i) => `<li class="rv" style="--i:${i}"><span class="n">${i + 1}</span><b>${h}</b><p>${b}</p></li>`).join('\n')}
</ol>
<div class="algo-grid">
<div class="pair rv">${phone(p('studio-reel'), t.algoAlt[0], { sizes: '(max-width: 920px) 44vw, 260px' })}${phone(p('studio-langs'), t.algoAlt[1], { sizes: '(max-width: 920px) 44vw, 260px' })}</div>
<div class="notes">
${t.notes.map(([h, b], i) => `<div class="rv${i === 0 ? '' : ''}" data-cr-note="${i}" style="--i:${i}"><b>${h}</b><p>${b}</p></div>`).join('\n')}
</div>
</div>
</div>
</div>
</section>

<section class="sec status" id="status">
<div class="wrap st-grid">
<div class="rv">${phone(p('profile'), t.stAlt)}</div>
<div>
<div class="sec-head rv"><span class="kick">${t.stKick}</span><h2>${t.stH}</h2><p class="lead">${t.stLead}</p></div>
<div class="roles rv" data-cr-roles>${t.stRoles.map((r, i) => `<span data-role="${['reciter', 'imam', 'hafiz', 'ustaz', 'mosque', 'creator'][i]}">${seal}${r}</span>`).join('')}</div>
<p class="fine rv" style="margin-top:14px">${t.stLife}</p>
<div class="mine rv" data-cr-if="role" hidden>
<p class="fine">${t.stMine}</p>
<p class="who">${seal}<span data-cr="role"></span></p>
<p data-cr="roleText"></p>
<p class="nick" data-cr="nickLine" hidden></p>
</div>
</div>
</div>
</section>

<section class="sec money" id="dohod">
<div class="wrap">
<div class="sec-head rv"><span class="kick">${t.mKick}</span><h2>${t.mH}</h2><p class="lead">${t.mLead}</p></div>
<div class="mgrid">
<div class="card rv">
<span class="badge">${t.pBadge}</span>
<h3>${t.pH}</h3>
<p>${t.pP}</p>
<div class="pct">${t.pct.map(([n, s]) => `<div><b>${n}</b><span>${s}</span></div>`).join('')}</div>
<div class="calc" data-calc>
<div class="row"><label for="c-n">${t.calcL}</label><span class="ppl"><span class="num" data-calc-n>100</span> ${t.calcWho}</span></div>
<input id="c-n" type="range" min="10" max="3000" step="10" value="100" data-calc-range>
<div class="row"><select aria-label="${t.calcIn}" data-calc-g>${t.calcGroups.map((g, i) => `<option value="${i}"${(en ? i === 1 : i === 0) ? ' selected' : ''}>${g}</option>`).join('')}</select>
<div><output class="num" data-calc-out>${en ? '≈ $163' : '≈ 53 300 ₸'}</output><span class="fine">${t.calcOut}</span></div></div>
<p class="fine">${t.calcFine}</p>
</div>
</div>
<div class="card brand rv" style="--i:1">
<span class="badge next">${t.bBadge}</span>
<h3>${t.bH}</h3>
<p>${t.bP}</p>
<ul>${t.bLi.map((s) => `<li>${ic('check')}${s}</li>`).join('')}</ul>
</div>
</div>
<p class="fine mnote rv">${t.mNote}</p>
</div>
</section>

<section class="sec prem" id="premium">
<div class="wrap">
<div class="sec-head rv"><span class="kick">${t.prKick}</span><h2>${t.prH}</h2><p class="lead">${t.prLead}</p>
<p class="price"><s>${t.priceOld}</s><b>${t.priceNew}</b><span>${t.priceNote}</span></p></div>
<div class="focus rv">
<div><span class="kick">${t.focusKick}</span><h3>${t.focusH}</h3><p class="body">${t.focusP}</p>
<ul>${t.focusLi.map((s) => `<li>${ic('check')}${s}</li>`).join('')}</ul></div>
<div>${phone(p('focus'), t.focusAlt)}</div>
</div>
<div class="fgrid">
${t.feats.map(([k, h, b], i) => `<div class="fcard rv" style="--i:${i % 4}"><div class="tx"><b>${h}</b><p>${b}</p></div>${crop(p(k), t.featAlt[k])}</div>`).join('\n')}
</div>
</div>
</section>



<section class="start">
<div class="wrap start-grid">
<div class="rv"><h2>${t.sH}</h2><p class="lead" style="margin-top:18px">${t.sLead}</p></div>
<ul class="rv">${t.sLi.map(([a, b]) => `<li>${ic('check')}<p><b>${a}</b> <span>${b}</span></p></li>`).join('')}</ul>
</div>
</section>

<section class="terms">
<div class="wrap"><ul class="tgrid">${t.terms.map(([h, b], i) => `<li class="rv" style="--i:${i}">${ic('check')}<b>${h}</b><p>${b}</p></li>`).join('')}</ul></div>
</section>

<section class="sec how" id="kak">
<div class="wrap">
<div class="sec-head rv"><span class="kick">${t.hKick}</span><h2>${t.hH}</h2></div>
<div class="how-grid">
<div>
<ol class="s3">
${t.hSteps.map(([h, b], i) => `<li class="rv" style="--i:${i}"><span class="n">${i + 1}</span><b${i === 1 ? ' data-cr-p="h"' : ''}>${h}</b><p${i === 1 ? ' data-cr-p="b"' : ''}>${b}</p></li>`).join('\n')}
</ol>
<div class="acts rv">${storeBtn(t)}${joinBtn(t, L)}</div>
<p class="fine rv" data-cr-hide="personal">${t.hFine}</p>
</div>
<div class="rv">${phone(p('creators'), t.hAlt)}</div>
</div>
</div>
</section>

<section class="sec team" id="komanda">
<div class="wrap">
<div class="sec-head rv"><span class="kick">${t.tKick}</span><h2>${t.tH}</h2><p class="lead">${t.tLead}</p></div>
<div class="team-grid">
${t.team.map(([k, name, nick, role], i) => `<div class="person rv" style="--i:${i}">
<div class="ban"><img data-pic="cr-${k}-ban" alt="" sizes="(max-width: 760px) 100vw, 580px" loading="lazy" decoding="async"></div>
<div class="ph"><img data-pic="cr-${k}" alt="${esc(t.tAlt[i])}" sizes="112px" loading="lazy" decoding="async"></div>
<div class="tx"><b>${name}</b><span class="nick">${nick}</span><p>${role}</p></div>
</div>`).join('\n')}
</div>
</div>
</section>

<section class="final">
<div class="wrap">
<h2 class="rv">${t.fH}</h2>
<div class="acts rv">${storeBtn(t)}${joinBtn(t, L)}</div>
<p class="fine rv">${t.fFine}</p>
</div>
</section>
</main>

${footer(t, t.footNote)}
<script type="application/json" id="cr-data">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>
<script src="/assets/creators.js"></script>
</body>
</html>
`;
}

function footer(t, note) {
  const L = t.lang === 'en' ? '/en' : '';
  return `<footer class="foot">
<div class="wrap">
<div class="foot-grid">
<a href="${B}${L}/">Firdaus</a>
<a href="${L}/about">${t.foot[0]}</a>
<a href="${L}/partners">${t.foot[1]}</a>
<a href="${B}${L}/support">${t.foot[2]}</a>
<a href="${B}${L}/privacy">${t.foot[3]}</a>
<a href="${B}${L}/terms">${t.foot[4]}</a>
<span class="sp"></span>
<span>© 2026 Firdaus</span>
</div>
<div class="social">
<a href="https://www.instagram.com/firdaus.social" rel="noopener">${ic('ig')}Instagram · @firdaus.social</a>
<a href="https://www.tiktok.com/@firdaus.app" rel="noopener">${ic('tt')}TikTok · @firdaus.app</a>
</div>
<p>${note}</p>
</div>
</footer>`;
}

/* Только нужные значки из общего набора: страница заявки маленькая. */
const sprite = (ids) => `<svg class="sprite" aria-hidden="true" focusable="false">\n${ids.map((id) => {
  const m = new RegExp(`<symbol id="i-${id}"[\\s\\S]*?</symbol>`).exec(SPRITE);
  if (!m) throw new Error(`creators: нет значка i-${id}`);
  return m[0];
}).join('\n')}\n</svg>`;

/*
  /creators/apply — запасная страница ссылки-приглашения (docs/120, «Ссылки-приглашения»).
  У кого Firdaus стоит, iPhone открывает ссылку сразу в приложении (apple-app-site-association,
  /creators/apply*) и страницу не видит. Её видит тот, у кого приложения нет, кто открыл
  ссылку во встроенном браузере Instagram/TikTok, не с айфона или прямо с firdaus.life
  (Safari не открывает приложение по ссылке своего же сайта).
  Кнопка — firdaus://creators/apply?status=…&ref=… (status — латиница, ref — как cleanRef в
  mobile/src/lib/verifiedCore.ts). Ниже — App Store: страница для дня, когда приложение уже
  там (15.11; прежняя форма «оставить заявку на сайте» снята вместе с листом ожидания).
  Служебная: noindex и на боевом, в sitemap не идёт.
*/
const APPLY_JS = `(function(){var C=window.FIRDAUS||{},A;try{A=JSON.parse(document.getElementById('ap-data').textContent)}catch(e){return}
var $=function(s){return document.querySelector(s)},q={};
location.search.replace(/^\\?/,'').split('&').forEach(function(p){if(!p)return;var i=p.indexOf('='),k=i<0?p:p.slice(0,i),v=i<0?'':p.slice(i+1);try{q[decodeURIComponent(k)]=decodeURIComponent(v.replace(/\\+/g,' '))}catch(e){}});
var status=/^[A-Za-z]{1,24}$/.test(q.status||'')?q.status.toLowerCase():'';
var ref=/^[A-Za-z0-9_.:-]{1,80}$/.test(q.ref||'')?q.ref:'';
var MAP={imam:'imam',reciter:'reciter',qari:'reciter',hafiz:'hafiz',scholar:'ustaz',ustaz:'ustaz',org:'mosque',mosque:'mosque',public:'public',author:'creator',creator:'creator',blogger:'creator'};
var role=MAP.hasOwnProperty(status)?MAP[status]:'';
var open=$('[data-ap-open]'),hint=$('[data-ap-hint]');
var a=[];if(status)a.push('status='+status);if(ref)a.push('ref='+ref);
open.href=(C.scheme||'firdaus://')+'creators/apply'+(a.length?'?'+a.join('&'):'');
var chip=$('[data-ap-alt]');if(chip){var keep=location.search.replace(/^\\?/,'').split('&').filter(function(p){return p&&!/^l=/.test(p)});keep.push('l='+chip.getAttribute('data-lang'));chip.href=A.alt+'?'+keep.join('&')}
if(/^(author|creator|blogger)$/.test(status))$('[data-ap-to]').textContent=A.toAuthor;
if(role){$('[data-ap-role]').textContent=role==='creator'?A.author:A.roles[role];$('[data-ap-yours]').hidden=false}
var ua=navigator.userAgent||'',ios=/iPhone|iPad|iPod/.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1);
var iab=/Instagram/.test(ua)?['Instagram',A.menuExt]:/FBAN|FBAV|FB_IAB/.test(ua)?['Facebook',A.menuExt]:/BytedanceWebview|musical_ly|TikTok/i.test(ua)?['TikTok',A.menuBr]:null;
var say=function(s,on){hint.textContent=s;hint.classList.toggle('on',!!on)};
if(!ios){say(/Android/.test(ua)?A.hintAndroid:A.hintDesk);open.classList.add('ghost');var bs=document.querySelectorAll('[data-ap-live] .btn');for(var i=0;i<bs.length;i++)bs[i].classList.remove('ghost')}
else if(iab)say(A.hintIab.replace('{app}',iab[0]).replace('{menu}',iab[1]),true);
open.addEventListener('click',function(){if(!ios)return;var gone=false,t;var v=function(){if(document.visibilityState==='hidden'){gone=true;clearTimeout(t);document.removeEventListener('visibilitychange',v)}};document.addEventListener('visibilitychange',v);
t=setTimeout(function(){document.removeEventListener('visibilitychange',v);if(!gone)say(iab?A.hintIab.replace('{app}',iab[0]).replace('{menu}',iab[1]):A.hintFail,true)},1800)});
})();`;

function applyPage(t) {
  const a = t.apply;
  const en = t.lang === 'en';
  const L = en ? '/en' : '';
  const alt = `${B}${en ? '' : '/en'}/creators/apply/`;
  const canon = `https://firdaus.life${L}/creators/apply/`;
  const data = {
    lang: t.lang, alt, toAuthor: a.toAuthor, author: a.author,
    roles: Object.fromEntries(ROLES.map((r) => [r, t.roles[r][0]])),
    hintIab: a.hintIab, menuExt: a.menuExt, menuBr: a.menuBr, hintAndroid: a.hintAndroid, hintDesk: a.hintDesk, hintFail: a.hintFail,
  };
  return `<!doctype html>
<html lang="${t.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${a.title}</title>
<meta name="description" content="${esc(a.desc)}">
<meta name="robots" content="noindex">
<link rel="canonical" href="${canon}">
<meta name="theme-color" content="#0B100E">
<meta name="apple-itunes-app" content="app-id=6806738733">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Firdaus">
<meta property="og:locale" content="${t.locale}">
<meta property="og:title" content="${esc(a.ogTitle)}">
<meta property="og:description" content="${esc(a.ogDesc)}">
<meta property="og:url" content="${canon}">
<meta property="og:image" content="https://firdaus.life/assets/og/creators-${t.lang}.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(t.ogAlt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://firdaus.life/assets/og/creators-${t.lang}.jpg">
<link rel="icon" type="image/png" href="/assets/favicon-48.png">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<script>
/* Язык по ссылке (l=ru|en), иначе по выбору на сайте, иначе по телефону; метки ссылки едут с ним. */
(function(){var d=document.documentElement,q=location.search,en=d.lang==='en';d.className='js';
var m=/[?&]l=([a-z]{2})/i.exec(q),want=m?(m[1].toLowerCase()==='ru'?'ru':'en'):null;
if(!want&&!/bot|crawl|spider|slurp|preview|facebookexternalhit/i.test(navigator.userAgent)){var s=null;try{s=localStorage.getItem('lang')}catch(e){}
if(s==='ru'||s==='en')want=s;else{var a=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||'ru'],ru=false;for(var i=0;i<a.length;i++)if(/^(ru|kk|uk|be|uz|ky|tg|tt|az|hy|ka|ba|ce)\\b/i.test(a[i]))ru=true;want=ru?'ru':'en'}}
if(want&&(want==='en')!==en&&location.protocol!=='file:')location.replace('${alt}'+q+location.hash);
})();
</script>
<link rel="stylesheet" href="/assets/creators.css">
<script src="/assets/site.js"></script>
<script>
/* Страница дня выхода (15.11): App Store здесь живой всегда, общий флаг сайта не нужен. */

</script>
</head>
<body class="ap">
${sprite(['seal', 'ig', 'tt', 'as'])}
<i id="top-mark" aria-hidden="true"></i>
<header class="top">
<div class="wrap">
<a class="lockup" href="${B}${L}/" aria-label="${esc(t.home)}"><img src="/assets/logo-68.webp" width="32" height="32" alt="">Firdaus</a>
<a class="chip" href="${alt}" data-lang="${t.langAttr}" data-ap-alt hreflang="${t.langAttr}" lang="${t.langAttr}">${t.langChip}<span class="sr">${t.langSr}</span></a>
</div>
</header>

<main>
<section class="hero ap-hero">
<div class="wrap">
<div class="ap-col">
<p class="salam ar" lang="ar" dir="rtl">السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ ٱللَّهِ وَبَرَكَاتُهُ</p>
<p class="to" data-ap-to>${a.to}</p>
<h1>${a.h1a} <span class="w">${a.h1b}</span></h1>
<p class="lead">${a.lead}</p>
<p class="yours stamp" data-ap-yours hidden><span>${a.yours}</span> <b>${seal}<span data-ap-role></span></b></p>
<div class="acts"><a class="btn" href="firdaus://creators/apply" data-ap-open>${a.open}</a></div>
<p class="ap-hint" data-ap-hint role="status">${a.hint}</p>
<div class="ap-card" data-ap-live>
<h2>${a.noH}</h2>
<p>${a.liveP}</p>
<div class="acts"><a class="btn ghost" href="${APP_STORE}" data-link="appstore">${asIcon}<span data-label>${a.liveBtn}</span></a></div>
</div>
<a class="tlink ap-more" href="${B}${L}/creators/">${a.more}</a>
</div>
</div>
</section>
</main>

${footer(t, a.footNote)}
<script type="application/json" id="ap-data">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>
<script>
${APPLY_JS}
</script>
</body>
</html>
`;
}

export function build() {
  const out = {};
  for (const lang of ['ru', 'en']) {
    const keys = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' && !Array.isArray(v) ? keys(v, p + k + '.') : [p + k + (Array.isArray(v) ? `[${v.length}]` : '')]));
    if (lang === 'en' && keys(T.ru).join() !== keys(T.en).join()) throw new Error('creators: словари ru и en разошлись по ключам');
    const html = page(T[lang]);
    if (/undefined|\[object/.test(html)) throw new Error(`creators/${lang}: в разметке пустое место (undefined)`);
    if (lang === 'en') {
      const left = html.replace(/\/\*[\s\S]*?\*\//g, '').replace(/Читать по-русски/g, '').match(/[А-Яа-яЁё]{2,}/);
      if (left) throw new Error(`creators/en: осталась кириллица «${left[0]}»`);
    }
    out[`${preview ? 'v4/' : ''}${lang === 'en' ? 'en/' : ''}creators/index.html`] = html;
    const ap = applyPage(T[lang]);
    if (/undefined|\[object/.test(ap)) throw new Error(`creators/apply/${lang}: в разметке пустое место (undefined)`);
    if (lang === 'en') {
      const left = ap.replace(/\/\*[\s\S]*?\*\//g, '').replace('Читать по-русски', '').match(/[А-Яа-яЁё]{2,}/);
      if (left) throw new Error(`creators/apply/en: осталась кириллица «${left[0]}»`);
    }
    out[`${preview ? 'v4/' : ''}${lang === 'en' ? 'en/' : ''}creators/apply/index.html`] = ap;
  }
  return out;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const check = process.argv.includes('--check');
  for (const [file, html] of Object.entries(build())) {
    const to = path.join(root, file);
    if (check) {
      if (!fs.existsSync(to) || fs.readFileSync(to, 'utf8') !== html) { console.error(`${file}: разошлась со скриптом — node site/gen/creators.mjs`); process.exit(1); }
      continue;
    }
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.writeFileSync(to, html);
    console.log(file, Math.round(html.length / 1024) + ' КБ');
  }
}
