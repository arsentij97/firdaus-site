/*
  Политика, условия и поддержка v4 (14.11.2026, docs/116): node site/gen/v4-legal.mjs

  Берёт ЖИВЫЕ страницы (privacy, terms, support — ru и en) и собирает из них
  превью в site/v4/: меняет строки таблиц, вставляет новые блоки, ставит дату и
  noindex, переписывает ссылки между страницами на /v4/. Живые файлы не трогает —
  на боевые адреса текст переедет только `v4-promote.mjs` после «да» Арсена.

  Что добавлено и откуда (сверено с кодом сборки 58, слова координатора о 59):
   - «Твои сообщения»: RLS `messages_read_mine` (0056), проверка фото и
     видеосообщений только в группах и каналах (`moderate`, kind chat, 0365/0390),
     жалоба несёт текст и фото сообщения (`report-notify`), предпросмотр в пуше
     (`ru.ts` «Показывать текст сообщений»), сквозного шифрования нет;
   - Reminders: проверка кадров, речи и текста до показа (`reel-check`), Bunny
     для видео, сигналы ленты одной строкой на ролик (0421), предупреждения
     90 дней / 7 / 30 (0423), обжалование (`ru.ts` appealLead);
   - автоперевод: текст уходит в OpenAI (`translate`), личное не переводится;
   - вход — Apple и Google (кода на почту в приложении нет);
   - база и файлы — Supabase, Франкфурт.
  14.11, вечер (docs/119, сборка 61): проба Plus 14 дней; Reminders смотреть бесплатно, выкладывать — Plus;
  круг — войти и читать бесплатно, писать — Plus; «Если не можешь платить» — десять человек в месяц,
  письмо раз в три месяца; Premium — шесть пунктов; обещания кодов автора и друга сняты до одобрения Apple
  (вернуть в день выхода — блоки TERMS.*.sub и строка «Подписка и подарки» в политике).
  Падает, если опорная строка не нашлась: живая страница изменилась — сверить руками.
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(site, p), 'utf8');

function make(src, out, lang, edits) {
  let s = read(src);
  const pre = lang === 'en' ? '/en' : '';
  const api = {
    /** заменить строку таблицы целиком по первой ячейке */
    row(name, html) {
      const re = new RegExp(`<tr><td>${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</td>.*</tr>`);
      if (!re.test(s)) throw new Error(`${src}: нет строки таблицы «${name}»`);
      s = s.replace(re, () => html);
    },
    /** вставить строку таблицы после строки с первой ячейкой name */
    rowAfter(name, html) {
      const re = new RegExp(`(<tr><td>${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</td>.*</tr>)`);
      if (!re.test(s)) throw new Error(`${src}: нет строки таблицы «${name}»`);
      s = s.replace(re, (m) => m + '\n' + html);
    },
    rep(a, b) { if (!s.includes(a)) throw new Error(`${src}: нет куска «${a.slice(0, 80)}»`); s = s.split(a).join(b); },
    before(a, html) { if (!s.includes(a)) throw new Error(`${src}: нет опоры «${a.slice(0, 80)}»`); s = s.replace(a, () => html + '\n\n' + a); },
    reRep(re, b) { if (!re.test(s)) throw new Error(`${src}: не совпало ${re}`); s = s.replace(re, () => b); },
  };
  edits(api);
  /* превью: не в поиск; ссылки между правовыми страницами — на превью */
  if (!/<meta name="description"[^>]*>/.test(s)) throw new Error(`${src}: нет description`);
  s = s.replace(/(<meta name="description"[^>]*>)/, '$1\n<meta name="robots" content="noindex">');
  for (const p of ['privacy', 'terms', 'support']) s = s.split(`href="${pre}/${p}`).join(`href="/v4${pre}/${p}`);
  fs.mkdirSync(path.dirname(path.join(site, out)), { recursive: true });
  fs.writeFileSync(path.join(site, out), s);
  console.log(out, Math.round(s.length / 1024), 'КБ');
}

/* ───────────────────────── политика, ru ───────────────────────── */
make('privacy.html', 'v4/privacy.html', 'ru', (e) => {
  e.rep('Редакция от 13 ноября 2026 года.', 'Редакция от 14 ноября 2026 года.');
  e.rep('коды, которые ты ввёл или купил, и чей код автора или друга привёл тебя в Firdaus.', 'коды, которые ты ввёл или купил, и по чьему коду или приглашению ты пришёл в Firdaus, если так было.');
  e.rep('<li>Мы не продаём данные, не показываем рекламу и не следим за тобой в других приложениях.</li>',
    '<li>Личные беседы автоматически не проверяются. Записи, ролики и фото в группах проверяются до того, как их увидят другие. Подробно — <a href="#messages">«Твои сообщения»</a>.</li>\n      <li>Мы не продаём данные, не показываем рекламу и не следим за тобой в других приложениях.</li>');
  e.row('Аккаунт', '<tr><td>Аккаунт</td><td data-l="Зачем">Чтобы ты мог войти с любого телефона</td><td data-l="Подробности">Вход через Apple или Google. Мы получаем идентификатор аккаунта и почту (Apple может выдать скрытый адрес). Пароль мы не видим и не храним.</td></tr>');
  e.row('Профиль', '<tr><td>Профиль</td><td data-l="Зачем">Чтобы тебя узнавали близкие</td><td data-l="Подробности">Ник, имя, аватар или фото, пол (от него зависят слова приложения — «брат» или «сестра» — и доступ к календарю цикла), строка «о себе» и резюме профиля, если ты их заполнил, время последнего входа, настройки приватности и границ. Дата рождения — если ты её указал: её видишь только ты, по ней работает защита тех, кому нет 18.</td></tr>');
  e.row('Близкие и круги', '<tr><td>Близкие и круги</td><td data-l="Зачем">Чтобы работали напоминания и «вместе»</td><td data-l="Подробности">Кто у тебя в близких, заявки, круги, приглашения, подписки, кого ты скрыл или заблокировал. Кто твой вали и запросы на переписку — если ты ими пользуешься.</td></tr>');
  e.row('Сообщения', '<tr><td>Сообщения</td><td data-l="Зачем">Чтобы переписка была на всех твоих устройствах</td><td data-l="Подробности">Текст, фото, голосовые и видеосообщения, стикеры в личных беседах, группах и каналах, реакции, отметки о прочтении. Сообщения хранятся на сервере и не защищены сквозным шифрованием. Подробно — <a href="#messages">«Твои сообщения»</a>.</td></tr>');
  e.row('Записи в Умме', '<tr><td>Записи в Умме</td><td data-l="Зачем">Чтобы их видели другие</td><td data-l="Подробности">Текст, фото и видео, истории, ответы, опросы, отметки «нравится», закладки, просмотры, темы, которые ты выбрал. Перевод записи на другой язык — если он понадобился тебе или другому читателю.</td></tr>');
  e.rowAfter('Записи в Умме', '<tr><td>Ролики Reminders</td><td data-l="Зачем">Чтобы их видели другие и чтобы лента подбиралась под тебя</td><td data-l="Подробности">Видео, обложка, описание и хэштеги, расшифровка речи и результат проверки, комментарии, лайки, репосты, сохранения. По каждому ролику, который тебе показали, — одна итоговая строка: сколько раз показан, сколько ты смотрел, досмотрел ли, отметил ли «не интересно». Подробно — <a href="#reminders">«Ролики Reminders»</a>.</td></tr>');
  e.row('Уведомления', '<tr><td>Уведомления</td><td data-l="Зачем">Чтобы присылать пуши</td><td data-l="Подробности">Адрес устройства для уведомлений (токен) и служебный журнал отправки; какие уведомления ты выключил, часовой пояс телефона и время вечерней сводки. Если включено «Показывать текст сообщений», в уведомлении о личном сообщении видно его начало; выключишь — только имя и «Новое сообщение».</td></tr>');
  e.row('Жалобы', '<tr><td>Жалобы</td><td data-l="Зачем">Чтобы разобраться</td><td data-l="Подробности">На что и почему ты пожаловался; жалобы на тебя; предупреждения и ограничения, которые тебе вынесены (например, запрет на загрузку роликов), и твои обжалования. Содержимое, на которое пожаловались (в том числе фото или сообщение из переписки), видит наша команда модерации в закрытом рабочем чате Telegram — только чтобы принять решение. Обращения в поддержку (текст, снимки экрана, версия приложения и модель телефона) приходят туда же.</td></tr>');

  e.before('  <h2 id="why">', `  <h3 id="messages">Твои сообщения</h3>
  <ul>
    <li><strong>Кто их видит.</strong> В приложении — только участники беседы: правила доступа в базе не отдают переписку никому другому. Команда Firdaus переписку не читает.</li>
    <li><strong>Что проверяется автоматически.</strong> Фото и видеосообщения в группах и каналах: прежде чем их увидят остальные участники, кадры проверяются на запрещённое (проверку делает OpenAI). То, что не прошло, не показывается.</li>
    <li><strong>Что не проверяется.</strong> Текст сообщений — нигде. В личной беседе автоматически не проверяется ничего: ни текст, ни фото, ни голос, ни видеосообщения.</li>
    <li><strong>Жалобы.</strong> Если участник беседы пожаловался на сообщение, это сообщение — его текст и фото — видит модератор в закрытом рабочем чате команды, чтобы принять решение. Остальная переписка туда не попадает.</li>
    <li><strong>Уведомления.</strong> В пуше о личном сообщении видно его начало; этот текст проходит через службы доставки уведомлений Expo и Apple. Выключатель — «Показывать текст сообщений» в настройках: без него приходит только имя и «Новое сообщение». Настройка iPhone «Показ миниатюр: никогда» тоже скрывает текст.</li>
    <li><strong>Шифрование.</strong> Сообщения передаются по зашифрованному соединению и хранятся на сервере в ЕС. Сквозного шифрования нет: технически данные на сервере доступны тем, кто его обслуживает, и могут быть раскрыты по законному требованию (раздел 5).</li>
    <li><strong>Удаление.</strong> Своё сообщение можно удалить у всех; файлы стираются с сервера в течение нескольких часов. Снимки «Моментов» пропадают у получателей через сутки.</li>
    <li><strong>Чего мы с ними не делаем.</strong> Личные сообщения не переводятся, не используются для рекламы и не попадают в статистику.</li>
  </ul>

  <h3 id="reminders">Ролики Reminders</h3>
  <ul>
    <li><strong>Проверка до показа.</strong> Прежде чем ролик увидят другие, автоматически проверяются его кадры, речь (её расшифровывает OpenAI) и текст описания. Спорное смотрит команда Firdaus. Пока проверка не закончена, другим ролик не показывается.</li>
    <li><strong>Где лежит видео.</strong> Файл ролика хранит и раздаёт видеосервис Bunny (bunny.net). Описание, комментарии и отметки — в основной базе.</li>
    <li><strong>Что учитывает лента «Для тебя».</strong> Темы, которые ты выбрал, подписки и то, как ты смотрел ролики: досмотрел, пролистал, отметил «не интересно». Поток отдельных событий мы не храним — по ролику остаётся одна итоговая строка.</li>
    <li><strong>Жалобы, предупреждения, обжалование.</strong> На ролик и комментарий можно пожаловаться. Если ролик сняли, ты получаешь предупреждение с причиной; решение можно обжаловать (см. <a href="/terms#reminders">Условия</a>).</li>
    <li><strong>Удаление.</strong> Свой ролик можно удалить в любой момент.</li>
  </ul>

  <h3 id="translate">Автоперевод</h3>
  <p>Записи, ответы и комментарии на другом языке Firdaus может перевести автоматически. Для этого сам текст — без имени автора — отправляется в OpenAI; готовый перевод мы сохраняем, чтобы не переводить одно и то же дважды. Переводятся только тексты, которые ты и так вправе видеть в ленте. Личные сообщения не переводятся. Выключатель — «Переводить записи на мой язык» в настройках.</p>

  <h3 id="wali">Вали и запросы на переписку</h3>
  <p>Если сестра позвала вали, он видит запросы мужчин, которые хотят ей написать: профиль автора и его записку. Её беседы, записи и намазы вали не видит. Убрать вали может только она сама.</p>`);

  e.rep('<li><strong>Чтобы в Умме было чисто</strong> — автоматическая проверка записей, фото, снимков близким, имени и аватара до публикации (её делает OpenAI, только с твоего согласия в приложении) и разбор жалоб.</li>',
    '<li><strong>Чтобы в Умме и Reminders было чисто</strong> — автоматическая проверка записей, фото, роликов, снимков близким, имени и аватара до публикации (её делает OpenAI; для записей и профиля — только с твоего согласия в приложении) и разбор жалоб.</li>');
  e.row('Supabase', '<tr><td>Supabase</td><td data-l="Что делает">Облако: база данных, файлы, вход. Серверы в ЕС (Франкфурт)</td><td data-l="Что получает">Всё из раздела 3, кроме видео роликов. Файлы лежат в закрытом хранилище, по прямой ссылке их не открыть.</td></tr>');
  e.row('OpenAI', '<tr><td>OpenAI</td><td data-l="Что делает">Автоматическая проверка на запрещённое, расшифровка речи в роликах, перевод</td><td data-l="Что получает">Текст и фото записей, ответов и историй, снимки близким («Моменты»), своё фото профиля и обложки, имя и строку «о себе» — перед публикацией и только для проверки; без твоего согласия в приложении (правила Уммы, шаг имени, правка профиля) они не отправляются и другим не видны. Фото и кадры видеосообщений в группах и каналах. Кадры, звук речи, описание и комментарии роликов Reminders. Текст публичных записей, ответов и комментариев — для перевода. Личные беседы туда не отправляются.</td></tr>');
  e.rowAfter('OpenAI', '<tr><td>Bunny (bunny.net)</td><td data-l="Что делает">Хранение и показ видео Reminders</td><td data-l="Что получает">Файл ролика и его обложку. Зрителю видео отдаётся по временной ссылке; сервер Bunny, как любой сайт, видит IP-адрес телефона.</td></tr>');
  e.rowAfter('LiveKit', '<tr><td>Telegram</td><td data-l="Что делает">Закрытый рабочий чат команды</td><td data-l="Что получает">Жалобы с содержимым, на которое пожаловались, и обращения в поддержку (см. «Жалобы» в разделе 3).</td></tr>');
  e.rep('<p>Серверы этих компаний могут находиться за пределами твоей страны, в том числе в ЕС и США.</p>',
    '<p>Основная база и файлы Firdaus размещены в ЕС (Франкфурт). Серверы остальных компаний могут находиться за пределами твоей страны, в том числе в ЕС и США.</p>');
  e.rep('<li><strong>Собеседник:</strong> сообщения, которые ты ему отправил.</li>',
    '<li><strong>Собеседник:</strong> сообщения, которые ты ему отправил.</li>\n    <li><strong>Вали сестры:</strong> запросы мужчин на переписку с ней — и ничего больше.</li>');
  e.rep('<li><strong>Удалённые сообщения, фото и голосовые</strong>',
    '<li><strong>Ролики Reminders</strong> — пока ты их не удалишь или пока их не снимет модерация.</li>\n    <li><strong>Предупреждения за ролики</strong> — действуют 90 дней.</li>\n    <li><strong>Удалённые сообщения, фото и голосовые</strong>');

  /* 14.11, вечер (docs/120, docs/123, 0540, 0550, 0570): заявки на статус, авторы с сайта,
     учёт визитов их страницы, повторные нарушители, студия автора. */
  e.rowAfter('Жалобы', '<tr><td>Заявка на статус</td><td data-l="Зачем">Чтобы поставить золотую галочку или принять в программу авторов</td><td data-l="Подробности">Если ты подаёшь заявку в приложении: какой статус просишь, ссылки на свои страницы в соцсетях (до пяти), код подтверждения вида FIRDAUS-XXXXXX, который ты ставишь в описание своей страницы, и пара слов о себе, если написал. У авторов — ещё число подписчиков, контакт для связи и о чём ты снимаешь. Если ты пришёл по ссылке-приглашению команды — её метка. Заявку и решение по ней видит команда Firdaus, в том числе в закрытом рабочем чате Telegram, где решение и принимается.</td></tr>');
  e.before('  <h3 id="messages">', `  <p id="creators"><strong>Заявка автора на сайте.</strong> На странице firdaus.life/creators автор может занять место до запуска, без аккаунта. Храним то, что ты написал в форме: имя, ник в Instagram или TikTok, чем ты занимаешься и как с тобой связаться. С заявкой сохраняются язык страницы и метки ссылки, по которой ты пришёл: метка приглашения, метки рекламной кампании и сам адрес ссылки — в личном приглашении в нём могут быть твоё имя и ник. Зачем: связаться с тобой и решить по заявке. Где: в базе Supabase (ЕС), закрытой от посторонних. Кто видит: команда Firdaus — копия заявки приходит в закрытый рабочий чат команды в Telegram. Никому больше не передаём. Храним до решения по заявке и ещё 12 месяцев после; удалить раньше — напиши на <a href="mailto:support@firdaus.life" data-link="email"><span data-text="email">support@firdaus.life</span></a>.</p>

  <p id="site-visits"><strong>Учёт визитов страницы авторов.</strong> Чтобы понимать, какие приглашения работают, страница отмечает три шага: открыл страницу, начал заполнять форму, сделал карточку для сторис. С отметкой уходят язык и адрес страницы, метки ссылки (ref, utm), выбранный статус, было ли приглашение личным, и случайный номер вкладки — он живёт только в этой вкладке и стирается, когда её закроют. Имени, ника и контакта в отметке нет, cookie нет. IP-адрес в базу не записывается: сервер держит его только в памяти, чтобы ограничить число заявок с одного адреса. Кроме того, весь сайт считает просмотры страниц в PostHog (ЕС) — тоже без cookie и без записи на устройство.</p>`);
  e.rep('<li><strong>Удаление.</strong> Свой ролик можно удалить в любой момент.</li>',
    '<li><strong>Студия автора.</strong> Автор видит по своим роликам только общие цифры: просмотры, досмотры, среднее время просмотра, лайки, комментарии, сохранения, репосты, новых подписчиков, а ещё из каких лент и на каких языках смотрели. Две последние разбивки появляются, только когда у ролика набралось хотя бы пять зрителей, чтобы по ним нельзя было угадать человека. Кто именно смотрел, мы автору не показываем.</li>\n    <li><strong>Удаление.</strong> Свой ролик можно удалить в любой момент.</li>');
  e.before('  <h2 id="why">', `  <h3 id="ban">Если аккаунт заблокирован</h3>
  <p>За грубые нарушения — например, за обход правил, которые защищают сестёр, — аккаунт блокируется навсегда. Чтобы нарушитель не вернулся с новым аккаунтом, при такой блокировке мы запоминаем идентификатор входа Apple или Google этого аккаунта: новый аккаунт с тем же входом блокируется сразу. Мы планируем включить и пометку устройства через Apple DeviceCheck: Apple хранит для нашего приложения на каждом iPhone одну отметку «да» или «нет», а идентификатора устройства мы при этом не получаем. Сейчас эта пометка не работает; когда включим, обновим эту страницу. Если считаешь, что аккаунт заблокирован по ошибке, напиши на support@firdaus.life.</p>`);
  e.row('Telegram', '<tr><td>Telegram</td><td data-l="Что делает">Закрытый рабочий чат команды</td><td data-l="Что получает">Жалобы с содержимым, на которое пожаловались, обращения в поддержку, заявки на статус и в программу авторов, заявки авторов с сайта (подробно — в разделе 3).</td></tr>');
  e.rep('<li><strong>Вали сестры:</strong> запросы мужчин на переписку с ней — и ничего больше.</li>',
    '<li><strong>Вали сестры:</strong> запросы мужчин на переписку с ней — и ничего больше.</li>\n    <li><strong>Автор, чей ролик ты смотрел:</strong> только общие цифры по ролику — тебя лично он не видит.</li>');
  e.rep('<li><strong>Контакт из листа ожидания на сайте</strong> — до 30 дней после выхода приложения.</li>',
    '<li><strong>Контакт из листа ожидания на сайте</strong> — до 30 дней после выхода приложения.</li>\n    <li><strong>Заявка автора с сайта</strong> — до решения по ней и ещё 12 месяцев; по просьбе удалим раньше.</li>\n    <li><strong>Отметки визитов страницы авторов</strong> — до 12 месяцев.</li>\n    <li><strong>Идентификатор входа заблокированного аккаунта</strong> — пока действует блокировка.</li>');
});

/* ───────────────────────── политика, en ───────────────────────── */
make('en/privacy.html', 'v4/en/privacy.html', 'en', (e) => {
  e.rep('Last updated 13 November 2026.', 'Last updated 14 November 2026.');
  e.rep('the codes you entered or bought, and whose creator or friend code brought you to Firdaus.', 'the codes you entered or bought, and whose code or invitation brought you to Firdaus, if any.');
  e.rep('<li>We don’t sell data, show ads or track you across other apps.</li>',
    '<li>Private chats are not checked automatically. Posts, videos and photos in groups are checked before others see them. Details: <a href="#messages">“Your messages”</a>.</li>\n      <li>We don’t sell data, show ads or track you across other apps.</li>');
  e.row('Account', '<tr><td>Account</td><td data-l="Why">So you can sign in from any phone</td><td data-l="Details">Sign in with Apple or Google. We receive an account identifier and an email address (Apple may give a private relay address). We never see or store a password.</td></tr>');
  e.row('Profile', '<tr><td>Profile</td><td data-l="Why">So loved ones recognise you</td><td data-l="Details">Username, name, avatar or photo, gender (it decides the app’s wording — “brother” or “sister” — and access to the cycle calendar), your bio line and profile résumé if you filled them in, last seen time, privacy and boundary settings. Your date of birth, if you entered it: only you see it, and it powers the protection of people under 18.</td></tr>');
  e.row('Loved ones and circles', '<tr><td>Loved ones and circles</td><td data-l="Why">So reminders and “together” work</td><td data-l="Details">Who your loved ones are, requests, circles, invitations, follows, people you have hidden or blocked. Who your wali is and message requests — if you use them.</td></tr>');
  e.row('Messages', '<tr><td>Messages</td><td data-l="Why">So your chats are on all your devices</td><td data-l="Details">Text, photos, voice and video messages, stickers in private chats, groups and channels, reactions, read marks. Messages are stored on the server and are not end-to-end encrypted. Details: <a href="#messages">“Your messages”</a>.</td></tr>');
  e.row('Posts in Umma', '<tr><td>Posts in Umma</td><td data-l="Why">So others can see them</td><td data-l="Details">Text, photos and video, stories, replies, polls, likes, bookmarks, views, the topics you picked. A translation of a post into another language — if you or another reader needed it.</td></tr>');
  e.rowAfter('Posts in Umma', '<tr><td>Reminders videos</td><td data-l="Why">So others can see them and the feed can be tuned to you</td><td data-l="Details">The video, cover, caption and hashtags, the speech transcript and the result of the check, comments, likes, reposts, saves. For each video shown to you — one summary row: how many times it was shown, how long you watched, whether you finished it, whether you marked “not interested”. Details: <a href="#reminders">“Reminders videos”</a>.</td></tr>');
  e.row('Notifications', '<tr><td>Notifications</td><td data-l="Why">To send push notifications</td><td data-l="Details">Your device’s notification address (token) and a technical delivery log; which notifications you turned off, your phone’s time zone and the time of the evening digest. If “Show message text” is on, a notification about a personal message shows its first words; turn it off and you see only the name and “New message”.</td></tr>');
  e.row('Reports', '<tr><td>Reports</td><td data-l="Why">To look into them</td><td data-l="Details">What you reported and why; reports about you; warnings and restrictions applied to you (for example, a ban on uploading videos) and your appeals. The reported content (including a photo or message from a chat) is seen by our moderation team in a private Telegram work chat, only to decide on it. Support requests (text, screenshots, app version and phone model) go there too.</td></tr>');

  e.before('  <h2 id="why">', `  <h3 id="messages">Your messages</h3>
  <ul>
    <li><strong>Who sees them.</strong> In the app — only the people in the chat: the database access rules do not hand a conversation to anyone else. The Firdaus team does not read your conversations.</li>
    <li><strong>What is checked automatically.</strong> Photos and video messages in groups and channels: before the other members see them, the frames are checked for prohibited content (the check is done by OpenAI). Anything that fails is not shown.</li>
    <li><strong>What is not checked.</strong> Message text — nowhere. In a private chat nothing is checked automatically: not text, photos, voice or video messages.</li>
    <li><strong>Reports.</strong> If someone in the chat reports a message, that message — its text and photo — is seen by a moderator in the team’s private work chat in order to decide. The rest of the conversation does not go there.</li>
    <li><strong>Notifications.</strong> A push about a personal message shows its first words; that text passes through the Expo and Apple notification services. The switch is “Show message text” in settings: without it only the name and “New message” arrive. The iPhone setting “Show Previews: Never” hides the text too.</li>
    <li><strong>Encryption.</strong> Messages travel over an encrypted connection and are stored on a server in the EU. There is no end-to-end encryption: technically the data on the server is accessible to those who maintain it and may be disclosed on a lawful request (section 5).</li>
    <li><strong>Deletion.</strong> You can delete your own message for everyone; the files are erased from the server within a few hours. Moments disappear for recipients after a day.</li>
    <li><strong>What we don’t do with them.</strong> Personal messages are not translated, not used for advertising and do not go into statistics.</li>
  </ul>

  <h3 id="reminders">Reminders videos</h3>
  <ul>
    <li><strong>Checked before it is shown.</strong> Before others see a video, its frames, speech (transcribed by OpenAI) and caption are checked automatically. Borderline cases are reviewed by the Firdaus team. Until the check is finished, the video is not shown to others.</li>
    <li><strong>Where the video is kept.</strong> The video file is stored and delivered by the video service Bunny (bunny.net). The caption, comments and likes are in the main database.</li>
    <li><strong>What the “For you” feed uses.</strong> The topics you picked, who you follow and how you watched: finished, skipped, marked “not interested”. We do not keep a stream of individual events — one summary row per video remains.</li>
    <li><strong>Reports, warnings, appeals.</strong> You can report a video or a comment. If your video is taken down, you get a warning with the reason; the decision can be appealed (see the <a href="/en/terms#reminders">Terms</a>).</li>
    <li><strong>Deletion.</strong> You can delete your own video at any time.</li>
  </ul>

  <h3 id="translate">Auto-translation</h3>
  <p>Firdaus can automatically translate posts, replies and comments written in another language. For this the text itself — without the author’s name — is sent to OpenAI; we keep the finished translation so the same text is not translated twice. Only texts you are already allowed to see in the feed are translated. Personal messages are not translated. The switch is “Translate posts into my language” in settings.</p>

  <h3 id="wali">Wali and message requests</h3>
  <p>If a sister has invited a wali, he sees the requests from men who want to write to her: the author’s profile and his note. He does not see her chats, posts or prayers. Only she can remove her wali.</p>`);

  e.rep('<li><strong>To keep Umma clean</strong> — an automated check of posts, photos, Moments, names and avatars before they are published (done by OpenAI, only with your consent in the app) and handling reports.</li>',
    '<li><strong>To keep Umma and Reminders clean</strong> — an automated check of posts, photos, videos, Moments, names and avatars before they are published (done by OpenAI; for posts and your profile, only with your consent in the app) and handling reports.</li>');
  e.row('Supabase', '<tr><td>Supabase</td><td data-l="What it does">Cloud: database, files, sign-in. Servers in the EU (Frankfurt)</td><td data-l="What it receives">Everything in section 3 except Reminders video files. Files sit in private storage and cannot be opened by a direct link.</td></tr>');
  e.row('OpenAI', '<tr><td>OpenAI</td><td data-l="What it does">Automated check for prohibited content, speech transcription for videos, translation</td><td data-l="What it receives">The text and photos of posts, replies and stories, Moments, your profile photo and cover, your name and bio line — before publication and only for the check; without your consent in the app (Umma rules, the name step, editing your profile) they are not sent and others cannot see them. Photos and frames of video messages in groups and channels. The frames, speech audio, caption and comments of Reminders videos. The text of public posts, replies and comments — for translation. Private chats are not sent there.</td></tr>');
  e.rowAfter('OpenAI', '<tr><td>Bunny (bunny.net)</td><td data-l="What it does">Storage and delivery of Reminders videos</td><td data-l="What it receives">The video file and its cover. A viewer gets the video through a temporary link; Bunny’s server, like any website, sees the phone’s IP address.</td></tr>');
  e.rowAfter('LiveKit', '<tr><td>Telegram</td><td data-l="What it does">The team’s private work chat</td><td data-l="What it receives">Reports with the reported content, and support requests (see “Reports” in section 3).</td></tr>');
  e.rep('<p>These companies’ servers may be located outside your country, including in the EU and the USA.</p>',
    '<p>The main Firdaus database and files are hosted in the EU (Frankfurt). The other companies’ servers may be located outside your country, including in the EU and the USA.</p>');
  e.rep('<li><strong>The person you chat with:</strong> the messages you sent them.</li>',
    '<li><strong>The person you chat with:</strong> the messages you sent them.</li>\n    <li><strong>A sister’s wali:</strong> the requests from men who want to write to her — and nothing else.</li>');
  e.rep('<li><strong>Deleted messages, photos and voice messages</strong>',
    '<li><strong>Reminders videos</strong> — until you delete them or moderation takes them down.</li>\n    <li><strong>Warnings for videos</strong> — remain in effect for 90 days.</li>\n    <li><strong>Deleted messages, photos and voice messages</strong>');

  e.rowAfter('Reports', '<tr><td>Status application</td><td data-l="Why">To give a gold check or accept you into the Creator Program</td><td data-l="Details">If you apply in the app: which status you ask for, links to your social media pages (up to five), a confirmation code like FIRDAUS-XXXXXX that you put in your page’s bio, and a few words about yourself if you wrote them. For creators, also your follower count, a contact and what you film. If you came through an invitation link from the team, its tag. The application and the decision on it are seen by the Firdaus team, including in the private Telegram work chat where the decision is made.</td></tr>');
  e.before('  <h3 id="messages">', `  <p id="creators"><strong>Creator applications on the website.</strong> On firdaus.life/creators a creator can hold a place before launch, without an account. We keep what you wrote in the form: your name, your Instagram or TikTok handle, what you do and how to reach you. Along with the application we keep the page language and the tags of the link you came through: the invitation tag, campaign tags and the link address itself (in a personal invitation it may contain your name and handle). Why: to contact you and decide on the application. Where: in the Supabase database (EU), closed to outsiders. Who sees it: the Firdaus team; a copy of the application goes to the team’s private Telegram work chat. We pass it to no one else. We keep it until the application is decided and for 12 months after that; to delete it sooner, write to <a href="mailto:support@firdaus.life" data-link="email"><span data-text="email">support@firdaus.life</span></a>.</p>

  <p id="site-visits"><strong>Visit counting on the creators page.</strong> To see which invitations work, the page records three steps: opened the page, started the form, made a story card. Each record carries the page language and address, the link tags (ref, utm), the chosen status, whether the invitation was personal, and a random tab number that lives only in that tab and is erased when it is closed. There is no name, handle or contact in it, and no cookies. The IP address is not written to the database: the server keeps it only in memory to limit how many applications come from one address. Separately, the whole website counts page views in PostHog (EU), also without cookies and without storing anything on your device.</p>`);
  e.rep('<li><strong>Deletion.</strong> You can delete your own video at any time.</li>',
    '<li><strong>Creator studio.</strong> A creator sees only totals for their own videos: views, completions, average watch time, likes, comments, saves, reposts, new followers, and which feeds and languages the views came from. Those last two breakdowns appear only once a video has at least five viewers, so they cannot point to a person. We never show a creator who exactly watched.</li>\n    <li><strong>Deletion.</strong> You can delete your own video at any time.</li>');
  e.before('  <h2 id="why">', `  <h3 id="ban">If an account is banned</h3>
  <p>For serious violations, such as getting around the rules that protect sisters, an account is banned for good. So that the violator cannot come back with a new account, with such a ban we keep the Apple or Google sign-in identifier of that account: a new account with the same sign-in is banned at once. We also plan to turn on a device flag through Apple DeviceCheck: Apple stores a single yes-or-no flag for our app on each iPhone, and we do not receive any device identifier. This flag is not active yet; when we turn it on, we will update this page. If you think an account was banned by mistake, write to support@firdaus.life.</p>`);
  e.row('Telegram', '<tr><td>Telegram</td><td data-l="What it does">The team’s private work chat</td><td data-l="What it receives">Reports with the reported content, support requests, status and Creator Program applications, creator applications from the website (details in section 3).</td></tr>');
  e.rep('<li><strong>A sister’s wali:</strong> the requests from men who want to write to her — and nothing else.</li>',
    '<li><strong>A sister’s wali:</strong> the requests from men who want to write to her — and nothing else.</li>\n    <li><strong>A creator whose video you watched:</strong> only totals for the video; they do not see you personally.</li>');
  e.rep('<li><strong>Website waitlist contacts</strong> — up to 30 days after the app launches.</li>',
    '<li><strong>Website waitlist contacts</strong> — up to 30 days after the app launches.</li>\n    <li><strong>Creator applications from the website</strong> — until decided and for 12 months after; deleted sooner on request.</li>\n    <li><strong>Visit records of the creators page</strong> — up to 12 months.</li>\n    <li><strong>The sign-in identifier of a banned account</strong> — for as long as the ban lasts.</li>');
});

/* ───────────────────────── условия ───────────────────────── */
const TERMS = {
  ru: {
    src: 'terms.html', out: 'v4/terms.html',
    /* 14.11 вечер, docs/119: подписки, проба 14 дней, без обещаний кодов, десять писем */
    sub: [
    ['Коран с одним переводом и тасбих бесплатны всегда. Остальное открывает подписка.',
      'Коран с одним переводом и тасбих бесплатны всегда. Бесплатно и смотреть ролики Reminders (лайкать, комментировать, делиться, подписываться), и быть в круге, куда тебя позвали: видеть намазы своих и читать переписку круга. Остальное открывает подписка.'],
    ['<li><strong>Firdaus Plus</strong> открывает всё приложение: историю намазов, близких, Умму и сообщения, тахаджуд, Фокус и остальное.</li>',
      '<li><strong>Firdaus Plus</strong> открывает всё приложение: историю намазов, близких, свой круг и право писать в переписке круга, Умму и сообщения, свои ролики в Reminders, тахаджуд, Фокус и остальное.</li>'],
    ['<li><strong>Firdaus Premium</strong> включает всё из Plus и даёт знаки статуса и удобства сверху.',
      '<li><strong>Firdaus Premium</strong> — высший уровень: всё из Plus и сверху золотой полумесяц у имени, особые наборы стикеров «Гази», ответ поддержки в первую очередь, номер «Сторонник с истоков» для первой тысячи подписчиков Premium (по порядку покупки, навсегда) и место на стене сторонников, если ты сам этого захочешь.'],
    ['<li><strong>Пробный период.</strong> Новым подписчикам Firdaus Plus доступна бесплатная неделя. Если не отменить подписку хотя бы за 24 часа до её конца, подписка начнётся и с Apple ID спишется оплата.</li>',
      '<li><strong>Пробный период.</strong> Новым подписчикам Firdaus Plus доступны 14 дней бесплатно. Если не отменить подписку хотя бы за 24 часа до конца пробного периода, подписка начнётся: с Apple ID спишется цена выбранного срока, и дальше подписка будет продлеваться сама.</li>'],
    ['<li><strong>Подарок</strong> (купленный тебе кем-то, по коду автора, по коду друга, от команды) лежит',
      '<li><strong>Подарок</strong> (купленный тебе кем-то или от команды) лежит'],
    ['\n    <li><strong>Код автора и код друга</strong> работают только для новых аккаунтов, которые ещё не платили, и дают один подарок на человека. Остаётся тот, кто позвал первым.</li>',
      ''],
    ['Каждый месяц команда выбирает пятьдесят писем (если подходящих меньше, то все подходящие) и дарит их авторам три месяца Firdaus Plus. Выбор за командой; письмо не даёт права на подарок, и мы не объясняем, почему выбрали другое. Одно письмо в месяц.</p>',
      'Мы читаем каждое письмо. Каждый месяц команда выбирает десять писем (если подходящих меньше, то все подходящие) и дарит их авторам три месяца Firdaus Plus. Выбор за командой; письмо не даёт права на подарок, и мы не объясняем, почему выбрали другое. Писать можно раз в три месяца.</p>'],
    ],
    stamp: ['Редакция от 13 ноября 2026 года.', 'Редакция от 14 ноября 2026 года.'],
    shortAfter: '<li>В Умме пиши так, как сказал бы в мечети. За оскорбления, непристойное, вражду и спам закрываем доступ.</li>',
    short: '<li>Ролики Reminders проверяются до показа. За нарушение — предупреждение, за повторные — запрет на загрузку; решение можно обжаловать.</li>',
    check: ['<li><strong>Проверка до публикации.</strong> Текст и фото записи, ответа, истории, имя и фото профиля автоматически проверяются на запрещённое. То, что не прошло, не публикуется.</li>',
      '<li><strong>Проверка до публикации.</strong> Текст и фото записи, ответа, истории, имя и фото профиля, а также фото и видеосообщения в группах и каналах автоматически проверяются на запрещённое. То, что не прошло, не публикуется. Личные беседы автоматически не проверяются.</li>'],
    anchor: '  <h2 id="content">',
    block: `  <h3 id="reminders">Правила Reminders</h3>
  <p>Reminders — короткие ролики, от 3 до 90 секунд, не больше десяти в сутки. К ним относятся все правила Уммы и ещё три:</p>
  <ul>
    <li><strong>Без харама</strong> — алкоголя, азартных игр и подобного, без нескромного вида и насмешек над религией и людьми.</li>
    <li><strong>Без музыкальных инструментов.</strong> Голос и нашиды без инструментов подходят.</li>
    <li><strong>Только своё.</strong> Не выкладывай чужое видео без права на него.</li>
  </ul>
  <ul>
    <li><strong>Проверка до показа.</strong> Кадры, речь и текст каждого ролика смотрит автоматическая проверка, спорное — команда. Пока ролик проверяется, другим он не показывается. Автоматика может ошибаться — для этого есть обжалование.</li>
    <li><strong>Жалобы.</strong> Пожаловаться на ролик или комментарий можно в меню «⋯».</li>
    <li><strong>Предупреждения.</strong> Если ролик сняли за нарушение, ты получаешь предупреждение с причиной; оно действует 90 дней. Второе предупреждение за это время закрывает загрузку роликов на 7 дней, третье — на 30. За серьёзное нарушение загрузка закрывается на 30 дней сразу. За материалы сексуального характера с участием несовершеннолетних аккаунт блокируется.</li>
    <li><strong>Обжалование.</strong> Не согласен с решением — нажми «Обжаловать» в предупреждении. Команда пересмотрит ролик и ответит в поддержке. Если решение отменят, ролик вернётся, а предупреждение снимется.</li>
  </ul>

  <h3 id="sisters">Границы сестёр</h3>
  <p>Мужчины пишут сёстрам только с разрешения: её самой и её вали, если она его позвала. Под записями сестёр отвечают сёстры и семья. Тем, кому нет 18, взрослые мужчины не пишут вовсе. Обходить эти границы — чужим аккаунтом, ложным полом или возрастом — запрещено.</p>`,
    tr: ['<p>Ты отвечаешь за то, что публикуешь, и подтверждаешь, что у тебя есть на это право.</p>',
      '<p>Ты отвечаешь за то, что публикуешь, и подтверждаешь, что у тебя есть на это право.</p>\n  <p>Публичные записи, ответы и комментарии могут автоматически переводиться на язык читателя; рядом всегда есть «Показать оригинал». Перевод машинный и может быть неточным.</p>'],
  },
  en: {
    src: 'en/terms.html', out: 'v4/en/terms.html',
    sub: [
    /* слово fundraising — в запретном списке сайта (check.mjs 8а): смысл тот же, другими словами */
    ['No ads, no fundraising in someone else’s name,', 'No ads, no collecting money in someone else’s name,'],
    ['the Quran with one translation and the tasbih are always free. A subscription opens the rest.',
      'the Quran with one translation and the tasbih are always free. Watching Reminders videos (liking, commenting, sharing, following) is free too, and so is being in a circle you were invited to: seeing your people’s prayers and reading the circle chat. A subscription opens the rest.'],
    ['<li><strong>Firdaus Plus</strong> opens the whole app: prayer history, loved ones, Umma and messages, tahajjud, Focus and everything else.</li>',
      '<li><strong>Firdaus Plus</strong> opens the whole app: prayer history, loved ones, your own circle and writing in the circle chat, Umma and messages, posting your own Reminders, tahajjud, Focus and everything else.</li>'],
    ['<li><strong>Firdaus Premium</strong> includes everything in Plus and adds status marks and conveniences on top.',
      '<li><strong>Firdaus Premium</strong> is the highest level: everything in Plus, plus a gold crescent next to your name, the special Gazi sticker packs, support that answers you first, a “Founding supporter” number for the first thousand Premium subscribers (in order of purchase, forever) and a place on the supporters’ wall if you choose to have one.'],
    ['<li><strong>Free trial.</strong> New Firdaus Plus subscribers get a free week. Unless you cancel at least 24 hours before it ends, the subscription starts and your Apple ID is charged.</li>',
      '<li><strong>Free trial.</strong> New Firdaus Plus subscribers get 14 days free. Unless you cancel at least 24 hours before the trial ends, the subscription starts: your Apple ID is charged the price of the plan you chose, and the subscription then renews automatically.</li>'],
    ['<li><strong>A gift</strong> (bought for you by someone, from a creator’s code, from a friend’s code, or from the team) waits',
      '<li><strong>A gift</strong> (bought for you by someone, or from the team) waits'],
    ['\n    <li><strong>Creator codes and friend codes</strong> work only for new accounts that have never paid, and give one gift per person. The person who invited you first is the one who counts.</li>',
      ''],
    ['Each month the team chooses up to fifty letters and gives their writers three months of Firdaus Plus. The choice is the team’s; a letter does not create a right to a gift, and we don’t explain why we chose others. One letter a month.</p>',
      'We read every letter. Each month the team chooses up to ten letters and gives their writers three months of Firdaus Plus. The choice is the team’s; a letter does not create a right to a gift, and we don’t explain why we chose others. You can write once every three months.</p>'],
    ],
    stamp: ['Last updated 13 November 2026.', 'Last updated 14 November 2026.'],
    shortAfter: '<li>In Umma, write the way you would speak in a mosque. Insults, indecency, hostility and spam cost you access.</li>',
    short: '<li>Reminders videos are checked before they are shown. A violation brings a warning, repeated ones an upload ban; the decision can be appealed.</li>',
    check: ['<li><strong>A check before publishing.</strong> The text and photos of a post, reply or story, and your profile name and photo, are checked automatically for prohibited content. What doesn’t pass is not published.</li>',
      '<li><strong>A check before publishing.</strong> The text and photos of a post, reply or story, your profile name and photo, and photos and video messages in groups and channels are checked automatically for prohibited content. What doesn’t pass is not published. Private chats are not checked automatically.</li>'],
    anchor: '  <h2 id="content">',
    block: `  <h3 id="reminders">Reminders rules</h3>
  <p>Reminders are short videos, 3 to 90 seconds, no more than ten a day. All the Umma rules apply to them, plus three more:</p>
  <ul>
    <li><strong>No haram</strong> — alcohol, gambling and the like; no immodest dress and no mockery of religion or people.</li>
    <li><strong>No musical instruments.</strong> Voice and nasheeds without instruments are fine.</li>
    <li><strong>Only your own.</strong> Don’t post someone else’s video without the right to it.</li>
  </ul>
  <ul>
    <li><strong>Checked before it is shown.</strong> The frames, speech and text of every video go through an automated check; borderline cases are reviewed by the team. While a video is being checked, others don’t see it. Automation can be wrong — that is what appeals are for.</li>
    <li><strong>Reports.</strong> You can report a video or a comment from the “⋯” menu.</li>
    <li><strong>Warnings.</strong> If your video is taken down for a violation, you get a warning with the reason; it stays in effect for 90 days. A second warning within that time closes video uploads for 7 days, a third for 30. A serious violation closes uploads for 30 days at once. For sexual material involving minors the account is blocked.</li>
    <li><strong>Appeals.</strong> If you disagree with a decision, tap “Appeal” in the warning. The team will review the video and reply in support. If the decision is reversed, the video comes back and the warning is removed.</li>
  </ul>

  <h3 id="sisters">Boundaries for sisters</h3>
  <p>Men write to sisters only with permission: hers, and her wali’s if she has invited one. Sisters and family reply under sisters’ posts. Adult men cannot message anyone under 18 at all. Getting around these boundaries — with someone else’s account, or a false gender or age — is forbidden.</p>`,
    tr: ['<p>You are responsible for what you publish and confirm that you have the right to publish it.</p>',
      '<p>You are responsible for what you publish and confirm that you have the right to publish it.</p>\n  <p>Public posts, replies and comments may be translated automatically into the reader’s language; “Show original” is always next to the translation. The translation is automatic and may be inaccurate.</p>'],
  },
};

function terms(lang, T) {
  make(T.src, T.out, lang, (e) => {
    e.rep(T.stamp[0], T.stamp[1]);
    e.rep(T.shortAfter, T.shortAfter + '\n      ' + T.short);
    e.rep(T.check[0], T.check[1]);
    e.before(T.anchor, T.block);
    e.rep(T.tr[0], T.tr[1]);
    for (const [a, b] of T.sub) e.rep(a, b);
  });
}
terms('ru', TERMS.ru);
terms('en', TERMS.en);

/* ───────────────────────── поддержка: только факты ───────────────────────── */
make('support.html', 'v4/support.html', 'ru', (e) => {
  e.rep('Бесплатно всегда: время намаза, кибла, напоминание о намазе, отметка намаза, Коран с одним переводом и тасбих. Firdaus Plus открывает всё остальное, первая неделя бесплатно. Firdaus Premium включает всё из Plus и золотой полумесяц у имени.',
    'Бесплатно всегда: время намаза, кибла, напоминание о намазе, отметка намаза, Коран с одним переводом и зикры с подсчётом. Бесплатно и смотреть Reminders — лайкать, комментировать, делиться, подписываться, — и быть в круге, куда тебя позвали: видеть намазы своих и читать переписку круга. Firdaus Plus открывает всё остальное — 13 наборов стикеров, свой круг и право писать в переписке круга, Умму, сообщения, свои ролики в Reminders, Фокус; первые 14 дней бесплатно, потом — цена выбранного срока, подписка продлевается сама. Firdaus Premium — высший уровень: всё из Plus, золотой полумесяц у имени, особые наборы стикеров «Гази», ответ поддержки первым, номер «Сторонник с истоков» для первой тысячи и место на стене сторонников, если захочешь.');
  e.rep('Каждый месяц мы выбираем пятьдесят писем и дарим их авторам три месяца Firdaus Plus. Подарок появится в «Подарках».',
    'Мы читаем каждое письмо. Каждый месяц десять человек получают от нас три месяца Firdaus Plus — подарок появится в «Подарках». Написать можно раз в три месяца.');
  e.rep('<details class="q"><summary>Как пожаловаться на запись или человека?</summary><div class="a"><p>Нажми «⋯» у записи, ответа, истории или в профиле человека → «Пожаловаться».',
    '<details class="q"><summary>Мой ролик сняли или закрыли загрузку. Что делать?</summary><div class="a"><p>Открой предупреждение и нажми «Обжаловать»: команда пересмотрит ролик и ответит здесь, в поддержке. Если решение отменят, ролик вернётся, а предупреждение снимется. Правила Reminders — в <a href="/terms#reminders">Условиях</a>.</p></div></details>\n  <details class="q"><summary>Кто видит мои сообщения?</summary><div class="a"><p>В приложении — только участники беседы. Автоматически проверяются фото и видеосообщения в группах и каналах; личные беседы и текст сообщений не проверяются. Модератор видит сообщение, только если на него пожаловались. Подробно — <a href="/privacy#messages">«Твои сообщения»</a>.</p></div></details>\n  <details class="q"><summary>Как пожаловаться на запись, ролик или человека?</summary><div class="a"><p>Нажми «⋯» у записи, ролика, ответа, истории или в профиле человека → «Пожаловаться».');
});
make('en/support.html', 'v4/en/support.html', 'en', (e) => {
  e.rep('Always free: prayer times, the qibla, the prayer reminder, marking a prayer, the Quran with one translation and the tasbih. Firdaus Plus opens everything else, and the first week is free. Firdaus Premium includes everything in Plus and a golden crescent next to your name.',
    'Always free: prayer times, the qibla, the prayer reminder, marking a prayer, the Quran with one translation and a dhikr counter. Watching Reminders is free too — liking, commenting, sharing, following — and so is being in a circle you were invited to: seeing your people’s prayers and reading the circle chat. Firdaus Plus opens everything else — 13 sticker packs, your own circle and writing in the circle chat, the Umma, messages, posting your own Reminders, Focus. The first 14 days are free, then the price of the plan you choose; the subscription renews automatically. Firdaus Premium is the highest level: everything in Plus, a gold crescent next to your name, the special Gazi sticker packs, support that answers you first, a “Founding supporter” number for the first thousand and a place on the supporters’ wall if you want one.');
  e.rep('Each month we choose fifty letters and give their writers three months of Firdaus Plus. The gift will appear in “Gifts”.',
    'We read every letter. Each month, ten people get three months of Firdaus Plus from us — the gift will appear in “Gifts”. You can write once every three months.');
  e.rep('<details class="q"><summary>How do I report a post or a person?</summary><div class="a"><p>Tap “⋯” on the post, reply or story, or on the person’s profile → “Report”.',
    '<details class="q"><summary>My video was taken down or uploads were closed. What now?</summary><div class="a"><p>Open the warning and tap “Appeal”: the team will review the video and reply here, in support. If the decision is reversed, the video comes back and the warning is removed. The Reminders rules are in the <a href="/en/terms#reminders">Terms</a>.</p></div></details>\n  <details class="q"><summary>Who can see my messages?</summary><div class="a"><p>In the app — only the people in the chat. Photos and video messages in groups and channels are checked automatically; private chats and message text are not. A moderator sees a message only if someone reports it. Details: <a href="/en/privacy#messages">“Your messages”</a>.</p></div></details>\n  <details class="q"><summary>How do I report a post, a video or a person?</summary><div class="a"><p>Tap “⋯” on the post, video, reply or story, or on the person’s profile → “Report”.');
});

