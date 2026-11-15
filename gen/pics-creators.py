"""
Картинки страницы авторов (15.11.2026): python site/gen/pics-creators.py <папка снимков> <папка фото основателей>

  <папка снимков>        — настоящие экраны приложения 1206×2622 (look-web.mjs --bare --full,
                           402×874 @3×, тёмная тема): cr2-<ru|en>-<экран>.png. Как сняты —
                           README, «Страница авторов, вторая редакция».
  <папка фото основателей> — аватары и баннеры профилей @arsen и @jantyko из приложения
                           (profiles.avatar_path / banner_path, хранилище media):
                           arsen-avatar.jpg, arsen-banner.jpg, jantyko-avatar.jpg, jantyko-banner.jpg.

Пишет в site/assets/img: `cr-<язык>-<имя>-{480,960}.{avif,webp}`, `cr-<ник>-{224,448}` и
`cr-<ник>-ban-{720,1200}`. Размеры — PICS в gen/render.mjs, блок creators.
"""
import os
import sys
from PIL import Image

shots, people = sys.argv[1], sys.argv[2]
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'img')

# имя на сайте ← снимок; у Reminders в английском — экран паузы: у демо-ролика английская подпись-заглушка
SCREENS = {
    'reel-pause': 'reel-pause', 'umma': 'umma', 'home': 'home', 'studio': 'studio',
    'studio-reel': 'studio-reel', 'studio-langs': 'studio-reel-2', 'profile': 'profile',
    'focus': 'focus', 'qibla': 'qibla', 'quran': 'quran', 'dhikr': 'dhikr',
    'messages': 'messages', 'creators': 'creators', 'reels': {'ru': 'reel', 'en': 'reel-pause'},
}


def save(im, base, q_avif=60, q_webp=80):
    im.save(base + '.avif', quality=q_avif, speed=4)
    im.save(base + '.webp', quality=q_webp, method=6)


for lang in ('ru', 'en'):
    for name, src in SCREENS.items():
        s = src[lang] if isinstance(src, dict) else src
        im = Image.open(os.path.join(shots, f'cr2-{lang}-{s}.png')).convert('RGB')
        for w in (480, 960):
            h = round(im.height * w / im.width)
            save(im.resize((w, h), Image.LANCZOS), os.path.join(out, f'cr-{lang}-{name}-{w}'))
        print(f'cr-{lang}-{name}', im.size)

for nick in ('arsen', 'jantyko'):
    av = Image.open(os.path.join(people, f'{nick}-avatar.jpg')).convert('RGB')
    side = min(av.size)
    av = av.crop(((av.width - side) // 2, (av.height - side) // 2, (av.width + side) // 2, (av.height + side) // 2))
    for w in (224, 448):
        save(av.resize((w, w), Image.LANCZOS), os.path.join(out, f'cr-{nick}-{w}'), 62, 82)
    ban = Image.open(os.path.join(people, f'{nick}-banner.jpg')).convert('RGB')
    h3 = round(ban.width / 3)
    top = max(0, (ban.height - h3) // 2)
    ban = ban.crop((0, top, ban.width, top + min(h3, ban.height)))
    for w in (720, 1200):
        save(ban.resize((w, round(ban.height * w / ban.width)), Image.LANCZOS), os.path.join(out, f'cr-{nick}-ban-{w}'))
    print(f'cr-{nick}', ban.size)
