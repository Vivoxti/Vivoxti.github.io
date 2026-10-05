"""Check numbering, assets and exact agreement with reviewed TXT before publishing."""
from pathlib import Path
import argparse
import json
import re
from PIL import Image

site = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--source', type=Path, default=Path.home() / 'Desktop' / 'BookGrandpa')
args = parser.parse_args()
data = json.loads((site / 'assets/book.json').read_text(encoding='utf-8'))
pages = data['pages']
assert len({p['id'] for p in pages}) == len(pages), 'Duplicate page IDs'
assert [p['number'] for p in pages if p.get('number')] == list(range(3, 165)), 'Wrong page order'
assert data['missing'] == [p['number'] for p in pages if p['kind'] == 'missing']
checked = 0
for page in pages:
    if page.get('image'):
        with Image.open(site / page['image']) as image:
            assert image.mode == 'RGBA', page['id']
            assert image.size == (page['width'], page['height']), page['id']
    if page['kind'] not in ('page', 'contents'):
        continue
    text = (args.source / 'Расшифровки_TXT' / (page['id'] + '.txt')).read_text(encoding='utf-8-sig').strip('\n\r')
    if page.get('number'):
        number = page['number']
        text = '' if text.strip() == str(number) else re.sub(rf'\n\s*{number}\s*$', '', text).rstrip()
    assert text == page['text'], f"Transcript differs: {page['id']}"
    checked += 1
assert checked == data['available']
assert all(3 <= row['number'] <= 164 for row in data['contents'])
assert not next(p for p in pages if p['id'] == '060')['text'], 'Blank sheet contains extra text'
for filename in ['index.html', 'style.css', 'app.js', 'icon.svg', 'assets/cover.webp', 'assets/fonts/Neucha.ttf', 'assets/fonts/OFL.txt']:
    assert (site / filename).is_file(), f'Missing file: {filename}'
print(json.dumps({'book_entries': len(pages), 'verified_transcripts': checked,
                  'contents_links': len(data['contents']), 'missing': data['missing'], 'result': 'OK'}))
