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
  const noSizes = rest.replace(/\s*sizes="[^"]+"/, '');
  return `<picture><source type="image/avif" srcset="${src('avif')}" sizes="${sizes}"><img src="${file('webp')}" srcset="${src('webp')}" sizes="${sizes}" width="${W}" height="${H}"${noSizes}></picture>`;
}

const minCss = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s*\n\s*/g, '').replace(/\s*([{};,>])\s*/g, '$1');
const asset = (name) => fs.readFileSync(path.join(root, 'assets', name), 'utf8');

export function render(html) {
  return html
    .replace('<link rel="stylesheet" href="/assets/site.css">', () => `<style>${minCss(asset('site.css'))}</style>`)
    .replace('<link rel="stylesheet" href="/assets/namaz.css">', () => `<style>${minCss(asset('namaz.css'))}</style>`)
    .replace('<script src="/assets/site.js"></script>', () => `<script>${asset('site.js')}</script>`)
    .replace(/<img((?:\s+[a-z-]+(?:="[^"]*")?)*\s+data-pic="[^"]+"(?:\s+[a-z-]+(?:="[^"]*")?)*)\s*\/?>/g, (_, a) => picture(a));
}
