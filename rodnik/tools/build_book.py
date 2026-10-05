"""Refresh the static archive from the reviewed BookGrandpa files. No source files are changed."""
from pathlib import Path
import argparse
import json
import re
import shutil
import urllib.request
from PIL import Image

SITE = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', type=Path, default=Path.home() / 'Desktop' / 'BookGrandpa')
    args = parser.parse_args()
    source = args.source
    out = SITE / 'assets'
    (out / 'pages').mkdir(parents=True, exist_ok=True)
    (out / 'fonts').mkdir(exist_ok=True)
    config = json.loads((source / '_Инструменты' / 'прозрачность.json').read_text(encoding='utf-8-sig'))
    pages = [{'id': 'title', 'kind': 'title', 'text': 'Родник\nВалентин Лаврищев'}]
    texts = source / 'Расшифровки_TXT'
    stems = [f'{number:03}' for number in range(3, 165)]
    stems += [p.stem for p in sorted(texts.glob('Содержание_*.txt'))]
    available = 0
    for stem in stems:
        txt = texts / f'{stem}.txt'
        number = int(stem) if stem.isdigit() else None
        if not txt.exists():
            pages.append({'id': stem, 'number': number, 'kind': 'missing', 'text': ''})
            continue
        text = txt.read_text(encoding='utf-8-sig').strip('\n\r')
        if number is not None:
            text = '' if text.strip() == str(number) else re.sub(rf'\n\s*{number}\s*$', '', text).rstrip()
        png = source / 'Прозрачный_текст' / f'{stem}.png'
        image = Image.open(png).convert('RGBA')
        # Exclude the old photographed footer; the website typesets a uniform page number.
        regions = config.get(png.name, {}).get('regions', [])
        body = [r if isinstance(r, list) else r['box'] for r in regions]
        body = [r for r in body if r[1] < 920]
        if body:
            bottom = min(image.height, round(max(r[3] for r in body) / 1000 * image.height))
            image = image.crop((0, 0, image.width, bottom))
            bbox = image.getchannel('A').getbbox()
        else:
            bbox = None
        entry = {'id': stem, 'number': number, 'kind': 'page' if number else 'contents', 'text': text}
        if bbox:
            image = image.crop(bbox)
            image.save(out / 'pages' / f'{stem}.webp', 'WEBP', lossless=True, method=6)
            entry.update(image=f'assets/pages/{stem}.webp', width=image.width, height=image.height)
        pages.append(entry)
        available += 1
    pages.append({'id': 'back', 'kind': 'back', 'text': 'Книга стихов моего деда\nВалентин Лаврищев'})
    contents = []
    section = ''
    for p in pages:
        if p['kind'] != 'contents':
            continue
        pending = ''
        for line in p['text'].splitlines():
            match = re.match(r'^\s*(.*?)\s*\.{2,}\s*(\d+)\s*$', line)
            if match:
                title = (pending + ' ' + match[1]).strip().replace('«', '').replace('»', '')
                contents.append({'title': title, 'number': int(match[2]), 'section': section})
                pending = ''
            elif line.strip() and line.strip() != 'СОДЕРЖАНИЕ':
                value = line.strip()
                if '«' in value and '»' not in value:
                    pending = value
                else:
                    section = value
    data = {'author': 'Валентин Лаврищев', 'title': 'Родник', 'available': available,
            'missing': [p['number'] for p in pages if p['kind'] == 'missing'],
            'pages': pages, 'contents': contents}
    (out / 'book.json').write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    Image.open(source / '000_Обложка.jpg').save(out / 'cover.webp', 'WEBP', quality=94, method=6)
    # Font and licence are kept locally so reading does not need a third-party connection.
    for filename in ['Neucha.ttf', 'OFL.txt']:
        target = out / 'fonts' / filename
        if not target.exists():
            urllib.request.urlretrieve(f'https://raw.githubusercontent.com/google/fonts/main/ofl/neucha/{filename}', target)
    print(json.dumps({'pages': len(pages), 'available': available, 'missing': data['missing'],
                      'contents': len(contents), 'assets_mb': round(sum(p.stat().st_size for p in out.rglob('*') if p.is_file()) / 1e6, 2)}))


if __name__ == '__main__':
    main()
