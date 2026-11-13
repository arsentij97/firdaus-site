/*
  Как страница уезжает быстрой: стили и общий скрипт — внутрь страницы,
  `<img data-pic="…">` — в <picture> с AVIF и WebP. Раньше жило в build.mjs;
  вынесено сюда 13.11, потому что ежедневная пересборка страниц городов идёт
  в репозитории сайта (arsentij97/firdaus-site), где build.mjs нет, а gen/ есть.

  root — корень сайта: site/ здесь или корень firdaus-site там. В обоих лежат
  assets/site.css, assets/site.js, assets/namaz.css.
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* Картинки сайта (assets/img): имя → [малая, большая] как [ширина, высота].
   Получены из картин приложения (mobile/assets/scene-*.jpg) и снимка главного
   экрана; пересобрать — README, раздел «Картинки». */
export const PICS = {
  gate: [[420, 642], [760, 1162]],
  phone: [[300, 664], [560, 1239]],
  'phone-en': [[300, 664], [560, 1239]],
  moon: [[800, 602], [1080, 813]],
  circle: [[480, 512], [877, 936]],
  night: [[360, 645], [640, 1147]],
  sujud: [[800, 597], [1080, 806]],
  lions: [[800, 569], [1206, 858]],
  dawn: [[900, 768], [1206, 1029]],
  'st-salam': [[220, 220]],
  'st-dua': [[220, 220]],
  'st-krutoj': [[220, 220]],
  'st-alhamdulillah': [[220, 220]],
  /* Сайт v2 (превью /v2/, 13.11): экраны из кадров App Store
     (docs/shots/appstore/<язык>/69, вырезан экран 954×2073) и картины в
     родном размере. Пересобрать — README, раздел «Сайт v2». */
  'v2-ru-01': [[480, 1043], [954, 2073]],
  'v2-ru-02': [[480, 1043], [954, 2073]],
  'v2-ru-04': [[480, 1043], [954, 2073]],
  'v2-ru-05': [[480, 1043], [954, 2073]],
  'v2-ru-06': [[480, 1043], [954, 2073]],
  'v2-ru-07': [[480, 1043], [954, 2073]],
  'v2-ru-08': [[480, 1043], [954, 2073]],
  'v2-en-01': [[480, 1043], [954, 2073]],
  'v2-en-02': [[480, 1043], [954, 2073]],
  'v2-en-04': [[480, 1043], [954, 2073]],
  'v2-en-05': [[480, 1043], [954, 2073]],
  'v2-en-06': [[480, 1043], [954, 2073]],
  'v2-en-07': [[480, 1043], [954, 2073]],
  'v2-en-08': [[480, 1043], [954, 2073]],
  'v2-plus': [[720, 1281], [877, 1560]],
  'v2-dawn': [[720, 1280], [1206, 2144]],
  'v2-moon': [[720, 1290], [1080, 1935]],
  'v2-road': [[720, 1280], [1080, 1920]],
  'v2-lions': [[720, 1280], [1206, 2144]],
  'v2-gate': [[720, 1280], [1080, 1920]],
  /* Сайт v3 (превью /v3/, 13.11): живая съёмка (Google Flow, одна обработка —
     README, «Сайт v3») и свет на бархате (docs/brand/fon-*). Блок между
     метками пишет скрипт обработки, руками не править. */
  /* v3:start */
  'v3-door': [[1280, 714], [2048, 1143]],
  'v3-door-m': [[720, 900], [1080, 1350]],
  'v3-family': [[1280, 714], [2048, 1143]],
  'v3-familytall': [[720, 938], [1080, 1406]],
  'v3-night': [[480, 600], [760, 950]],
  'v3-qibla': [[480, 600], [760, 950]],
  'v3-quran': [[480, 600], [760, 950]],
  'v3-sisters': [[1280, 720], [2048, 1152]],
  'v3-sisters-m': [[720, 900], [1080, 1350]],
  'v3-slip': [[1280, 800], [2048, 1280]],
  'v3-slip-m': [[720, 900], [1080, 1350]],
  'v3-tabledu': [[640, 800], [1120, 1400]],
  'v3-tabledu-en': [[640, 800], [1120, 1400]],
  'v3-tasbih': [[480, 600], [760, 950]],
  'v3-tea': [[1280, 714], [2048, 1143]],
  'v3-tea-m': [[720, 900], [1080, 1350]],
  'v3-umma': [[1280, 720], [2048, 1152]],
  'v3-umma-m': [[720, 900], [1080, 1350]],
  'v3-velvet': [[1200, 978], [1536, 1252]],
  'v3-velvet-m': [[720, 938], [1080, 1406]],
  'v3-walk': [[640, 800], [1120, 1400]],
  'v3-window': [[1280, 714], [2048, 1143]],
  'v3-window-m': [[720, 900], [1080, 1350]],
  /* v3:end */
};

function picture(attrs) {
  const name = /data-pic="([^"]+)"/.exec(attrs)?.[1];
  const set = PICS[name];
  if (!set) throw new Error(`нет картинки «${name}» в PICS`);
  const rest = attrs.replace(/\s*data-pic="[^"]+"/, '');
  const src = (ext) => set.map(([w]) => `/assets/img/${name}-${w}.${ext} ${w}w`).join(', ');
  const [W, H] = set[set.length - 1];
  const file = (ext) => (name.startsWith('st-') ? `/assets/img/${name}.${ext}` : `/assets/img/${name}-${W}.${ext}`);
  if (name.startsWith('st-')) {
    return `<picture><source type="image/avif" srcset="${file('avif')}"><img src="${file('webp')}" width="${W}" height="${H}"${rest}></picture>`;
  }
  const sizes = /sizes="([^"]+)"/.exec(rest)?.[1] ?? '100vw';
  /* Сайт v3: data-pic-m — свой кадр для телефона (вертикальный), до 760 px. */
  const m = /\s*data-pic-m="([^"]+)"/.exec(rest);
  let mobile = '';
  if (m) {
    const ms = PICS[m[1]];
    if (!ms) throw new Error(`нет картинки «${m[1]}» в PICS`);
    const msrc = (ext) => ms.map(([w]) => `/assets/img/${m[1]}-${w}.${ext} ${w}w`).join(', ');
    mobile = `<source media="(max-width: 760px)" type="image/avif" srcset="${msrc('avif')}" sizes="100vw"><source media="(max-width: 760px)" type="image/webp" srcset="${msrc('webp')}" sizes="100vw">`;
  }
  const noSizes = rest.replace(/\s*sizes="[^"]+"/, '').replace(/\s*data-pic-m="[^"]+"/, '');
  return `<picture>${mobile}<source type="image/avif" srcset="${src('avif')}" sizes="${sizes}"><img src="${file('webp')}" srcset="${src('webp')}" sizes="${sizes}" width="${W}" height="${H}"${noSizes}></picture>`;
}

const minCss = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s*\n\s*/g, '').replace(/\s*([{};,>])\s*/g, '$1');
const asset = (name) => fs.readFileSync(path.join(root, 'assets', name), 'utf8');

export function render(html) {
  return html
    .replace('<link rel="stylesheet" href="/assets/site.css">', () => `<style>${minCss(asset('site.css'))}</style>`)
    .replace('<link rel="stylesheet" href="/assets/namaz.css">', () => `<style>${minCss(asset('namaz.css'))}</style>`)
    .replace('<script src="/assets/site.js"></script>', () => `<script>${asset('site.js')}</script>`)
    .replace('<link rel="stylesheet" href="/assets/v2.css">', () => `<style>${minCss(asset('v2.css'))}</style>`)
    .replace('<script src="/assets/v2.js"></script>', () => `<script>${asset('v2.js')}</script>`)
    .replace('<link rel="stylesheet" href="/assets/v3.css">', () => `<style>${minCss(asset('v3.css'))}</style>`)
    .replace('<script src="/assets/v3.js"></script>', () => `<script>${asset('v3.js')}</script>`)
    .replace(/<img((?:\s+[a-z-]+(?:="[^"]*")?)*\s+data-pic="[^"]+"(?:\s+[a-z-]+(?:="[^"]*")?)*)\s*\/?>/g, (_, a) => picture(a));
}
