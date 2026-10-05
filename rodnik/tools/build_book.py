"""Refresh the static archive from the reviewed BookGrandpa files. No source files are changed."""
from pathlib import Path
import argparse
import json
import re
import urllib.request
from PIL import Image, ImageFont

SITE = Path(__file__).resolve().parents[1]
COLS, ROWS = 28, 42


def rect_percent(box, size, grid):
    w,h = size
    gx,gy = grid
    x1,y1,x2,y2 = box
    return [round((x1/gx+(COLS-w/gx)/2)/COLS*100,5),
            round((y1/gy+(ROWS-h/gy)/2)/ROWS*100,5),
            round((x2-x1)/gx/COLS*100,5), round((y2-y1)/gy/ROWS*100,5)]


def prepare_ink(source, out, stem, measurement, entry):
    image = Image.open(source/'Прозрачный_текст'/f'{stem}.png').convert('RGBA')
    assert list(image.size) == measurement['size'], f'Recalibrate changed source: {stem}'
    body = image.copy()
    box = measurement.get('numberBox')
    if box:
        box = tuple(round(v/1000*(image.width if i%2==0 else image.height)) for i,v in enumerate(box))
        number = image.crop(box)
        body.paste((0,0,0,0),box)
        bounds = number.getchannel('A').getbbox()
        assert bounds, f'Empty handwritten number: {stem}'
        number = number.crop(bounds)
        number.save(out/'numbers'/f'{stem}.webp','WEBP',lossless=True,method=6)
        entry['numberImage'] = f'assets/numbers/{stem}.webp?v=1'
        entry['numberSize'] = list(number.size)
        entry['numberLayout'] = [round(number.width/measurement['grid'][0]/COLS*100,5),
                                 round(number.height/measurement['grid'][1]/ROWS*100,5)]
        entry['numberBox'] = list(box)
    bounds = body.getchannel('A').getbbox()
    entry['sourceSize'] = list(image.size)
    entry['grid'] = measurement['grid']
    if bounds:
        body = body.crop(bounds)
        body.save(out/'pages'/f'{stem}.webp','WEBP',lossless=True,method=6)
        entry.update(image=f'assets/pages/{stem}.webp?v=2',width=body.width,height=body.height,
                     sourceBox=list(bounds),layout=rect_percent(bounds,image.size,measurement['grid']))


def prepare_text(pages, out):
    font = ImageFont.truetype(str(out/'fonts/Neucha.ttf'),100)
    lengths = {p['id']:max((font.getlength(line)/100 for line in p['text'].splitlines()),default=0)
               for p in pages if p['kind'] in ('page','contents')}
    font_cells = min(.8, 25.8/max(lengths.values()))
    max_lines = max(len(p['text'].splitlines()) for p in pages)
    line_cells = min(1,39/max_lines)
    for p in pages:
        if p['kind'] not in ('page','contents') or not p['text']:
            continue
        width = lengths[p['id']]*font_cells
        height = len(p['text'].splitlines())*line_cells
        x,y,w,h = p.get('layout',[8,8,84,84])
        left = min(max(1,(x+w/2)/100*COLS-width/2),COLS-width-1)
        top = min(max(1,(y+h/2)/100*ROWS-height/2),ROWS-height-2)
        p['textLayout'] = [round(left/COLS*100,5),round(top/ROWS*100,5),
                           round(width/COLS*100,5),round(height/ROWS*100,5)]
    return {'columns':COLS,'rows':ROWS,'textFontCells':round(font_cells,6),'textLineCells':round(line_cells,6)}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', type=Path, default=Path.home() / 'Desktop' / 'BookGrandpa')
    args = parser.parse_args()
    source = args.source
    out = SITE / 'assets'
    (out / 'pages').mkdir(parents=True, exist_ok=True)
    (out / 'numbers').mkdir(exist_ok=True)
    (out / 'fonts').mkdir(exist_ok=True)
    measurements = json.loads((SITE/'tools/page_layout.json').read_text(encoding='utf-8'))
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
        entry = {'id': stem, 'number': number, 'kind': 'page' if number else 'contents', 'text': text}
        measurement = measurements.get(stem+'.png')
        assert measurement and measurement.get('reviewed'), f'Review layout and number first: {stem}'
        prepare_ink(source,out,stem,measurement,entry)
        pages.append(entry)
        available += 1
    pages.append({'id': 'back', 'kind': 'back', 'text': ''})
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
            'pages': pages, 'contents': contents, 'layout':prepare_text(pages,out)}
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
