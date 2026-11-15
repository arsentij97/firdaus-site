"""
Картинки сайта v4 (14.11.2026): python site/gen/pics-v4.py <папка снимков> <папка стикеров>

  <папка снимков>  — экраны приложения 1206×2622 (look-web.mjs --bare --full, 402×874 @3×):
                     ru-home.png, ru-svoi.png, ru-with.png, ru-umma.png, ru-focus.png,
                     ru-focus2.png и то же с en-. Как сняты — README, «Сайт v4».
  <папка стикеров> — готовые наборы (docs/stikery/README.md, `$D/final`).

Пишет в site/assets/img: экраны `v4-<язык>-<имя>-{480,960}.{avif,webp}` и стикеры
`v4-st-<имя>-<язык>.{avif,webp}` (AVIF живой, WebP — неподвижный запасной).
Список размеров — PICS в gen/render.mjs, блок v4.
"""
import os
import shutil
import sys
from PIL import Image

shots, stickers = sys.argv[1], sys.argv[2]
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'img')

SCREENS = ['home', 'svoi', 'with', 'umma', 'focus', 'focus2']
for lang in ('ru', 'en'):
    for name in SCREENS:
        src = os.path.join(shots, f'{lang}-{name}.png')
        im = Image.open(src).convert('RGB')
        for w in (480, 960):
            h = round(im.height * w / im.width)
            small = im.resize((w, h), Image.LANCZOS)
            base = os.path.join(out, f'v4-{lang}-{name}-{w}')
            small.save(base + '.avif', quality=62, speed=4)
            small.save(base + '.webp', quality=80, method=6)
        print(f'v4-{lang}-{name}', im.size)

# стикер: (имя на сайте, набор, файл, есть ли надпись на двух языках)
STICKERS = [
    ('azan', 'vputi', 'vputi-azan', True),
    ('begu', 'vputi', 'vputi-begu', True),
    ('chaj', 'chaj', 'chaj-chaj', True),
]
for site_name, pack, file, worded in STICKERS:
    for lang in ('ru', 'en'):
        stem = f'{file}.{lang}' if worded else file
        live = os.path.join(stickers, pack, stem + '.avif')
        still = os.path.join(stickers, pack, stem + '.still.png')
        dst = os.path.join(out, f'v4-st-{site_name}-{lang}')
        shutil.copyfile(live, dst + '.avif')
        Image.open(still).convert('RGBA').resize((320, 320), Image.LANCZOS).save(dst + '.webp', quality=84, method=6)
        print(f'v4-st-{site_name}-{lang}', os.path.getsize(dst + '.avif') // 1024, 'КБ')
