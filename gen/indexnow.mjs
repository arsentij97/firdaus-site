/*
  IndexNow — сказать Bing, Яндексу (и всем, кто в протоколе) «эти адреса
  обновились»: node gen/indexnow.mjs <папка сайта> [--changed]

  Без флага — все адреса из sitemap.xml (после выкладки).
  --changed — только страницы, изменённые последним коммитом (ежедневная
  задача: обновилось «сегодня» у городов).

  Ключ — файл /<KEY>.txt в корне сайта с тем же текстом внутри. Ключ не
  секрет: протокол требует, чтобы он лежал открыто.
  Google IndexNow не читает — ему карта сайта в Search Console.

  Что сделает это неверным: сменится ключ — поменять KEY и файл вместе.
*/
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const KEY = '565b62693125231e9a7c28aef51bbd23';
const HOST = 'firdaus.life';
const ENDPOINTS = ['https://api.indexnow.org/indexnow', 'https://yandex.com/indexnow'];

function urls(dir, changed) {
  const all = [...fs.readFileSync(path.join(dir, 'sitemap.xml'), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (!changed) return all;
  const files = execFileSync('git', ['-C', dir, 'diff', '--name-only', 'HEAD~1', 'HEAD'], { encoding: 'utf8' }).split('\n').filter((f) => f.endsWith('.html'));
  const toUrl = (f) => `https://${HOST}/` + f.replace(/(^|\/)index\.html$/, '$1').replace(/\.html$/, '');
  const set = new Set(files.map(toUrl));
  return all.filter((u) => set.has(u));
}

export async function ping(list) {
  const out = [];
  for (let i = 0; i < list.length; i += 10000) {
    const body = JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: list.slice(i, i + 10000) });
    for (const ep of ENDPOINTS) {
      try {
        const r = await fetch(ep, { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' }, body });
        out.push(`${ep}: ${r.status}`);
      } catch (e) {
        out.push(`${ep}: ${e.message}`);
      }
    }
  }
  return out;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const dir = path.resolve(process.argv[2] ?? '.');
  const list = urls(dir, process.argv.includes('--changed'));
  if (!list.length) { console.log('IndexNow: менять нечего'); process.exit(0); }
  const res = await ping(list);
  console.log(`IndexNow: адресов ${list.length}\n  ` + res.join('\n  '));
}
