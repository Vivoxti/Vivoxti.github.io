"""Measure notebook rules and prepare a reviewable layout without changing source ink."""
from pathlib import Path
import argparse
import json
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont


def grid_pitch(image, axis):
    gray = cv2.cvtColor(np.array(image.convert('RGB')), cv2.COLOR_RGB2GRAY).astype(np.float32)
    h, w = gray.shape
    gray = gray[round(h*.06):round(h*.92), round(w*.07):round(w*.93)]
    # Long rules contribute at many positions; handwriting and stains do not.
    smooth = cv2.GaussianBlur(gray, (0, 0), 7)
    dark = np.maximum(smooth-gray, 0)
    kernel = np.ones((1, 45) if axis == 'y' else (45, 1), np.uint8)
    rules = cv2.morphologyEx(dark, cv2.MORPH_OPEN, kernel)
    signal = rules.mean(axis=1 if axis == 'y' else 0)
    signal -= cv2.GaussianBlur(signal.reshape(-1, 1), (1, 0), 12).ravel()
    signal -= signal.mean()
    ac = np.correlate(signal, signal, mode='full')[len(signal)-1:]
    ac /= max(ac[0], 1e-9)
    # The pages were photographed at roughly 20-45 pixels per 5 mm square.
    lo, hi = 15, 50
    candidates = [i for i in range(lo, hi) if ac[i] >= ac[i-1] and ac[i] > ac[i+1]]
    def score(i):
        return sum(ac[round(i*k)]/k for k in range(1, 5) if round(i*k) < len(ac))
    peak = max(candidates, key=score) if candidates else int(np.argmax(ac[lo:hi])+lo)
    delta = .5*(ac[peak+1]-ac[peak-1])/max(1e-9, 2*ac[peak]-ac[peak-1]-ac[peak+1])
    return round(peak+float(np.clip(delta, -.5, .5)), 3), round(float(ac[peak]), 3)


def writing_pitch(ink, number_box):
    alpha = np.array(ink.getchannel('A'))
    if number_box:
        x1,y1,x2,y2 = [round(v/1000*(ink.width if i%2==0 else ink.height)) for i,v in enumerate(number_box)]
        alpha[y1:y2,x1:x2] = 0
    rows = (alpha>120).sum(axis=1).astype(np.float32)
    rows = cv2.GaussianBlur(rows.reshape(-1,1),(1,0),1.5).ravel()
    active = rows > max(5, rows.max()*.09)
    edges = np.diff(np.r_[0,active.astype(int),0])
    starts, ends = np.where(edges==1)[0], np.where(edges==-1)[0]
    centers = [(a+b)/2 for a,b in zip(starts,ends) if b-a>=6 and rows[a:b].sum()>40]
    gaps = np.diff(centers)
    gaps = gaps[(gaps>19)&(gaps<37)]
    return round(float(np.median(gaps)),3) if len(gaps)>1 else None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--review', type=Path, required=True)
    parser.add_argument('--files', nargs='+', help='Only calibrate named page stems, e.g. 086')
    args = parser.parse_args()
    args.review.mkdir(parents=True, exist_ok=True)
    config = json.loads((args.source/'_Инструменты/прозрачность.json').read_text(encoding='utf-8-sig'))
    candidates = json.loads((args.source/'_Инструменты/номер_области_кандидат.json').read_text(encoding='utf-8-sig'))
    measured = {}
    font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 18)
    number_sheet = None
    items = [(k, v) for k,v in sorted(config.items()) if k != '000_Обложка.png']
    if args.files:
        names={Path(name).stem for name in args.files}
        items=[(k,v) for k,v in items if Path(k).stem in names]
        assert {Path(k).stem for k,v in items} == names, 'Unknown source pages'
    for index, (name, cfg) in enumerate(items):
        photo = Image.open(args.source/'Исходники/02_Кадрированные_PNG'/name)
        ink = Image.open(args.source/'Прозрачный_текст'/name).convert('RGBA')
        gx, cx = grid_pitch(photo, 'x')
        gy, cy = grid_pitch(photo, 'y')
        regions = [r if isinstance(r, list) else r['box'] for r in cfg.get('regions', [])]
        number = next((r for r in regions if r[1] >= 920), candidates.get(name)) if name[:3].isdigit() else None
        writing = writing_pitch(ink, number)
        raw = [gx,gy]
        if cy < .2 or not 22 <= gy <= 35:
            gy = writing or gx
        if cx < .2 or not 22 <= gx <= 35 or abs(gx/gy-1)>.17:
            gx = gy
        measured[name] = {'grid': [gx, gy], 'rawGrid': raw, 'writingPitch': writing,
                          'confidence': [cx,cy], 'size': list(ink.size), 'numberBox': number,'reviewed':False}
        if index % 40 == 0:
            number_sheet = Image.new('RGB', (1000, 800), '#f2e8d0')
        d = ImageDraw.Draw(number_sheet)
        x, y = index%5*200, index%40//5*100
        d.text((x+5,y+5), name, font=font, fill='#333')
        if number:
            box = tuple(round(v/1000*(ink.width if i%2 == 0 else ink.height)) for i,v in enumerate(number))
            cut = ink.crop(box)
            bg=Image.new('RGBA',cut.size,'#f2e8d0'); bg.alpha_composite(cut)
            bg.thumbnail((170,65)); number_sheet.paste(bg.convert('RGB'),(x+10,y+30))
        if index%40 == 39 or index == len(items)-1:
            number_sheet.save(args.review/f'numbers-{index//40+1}.jpg', quality=94)
    (args.review/'calibration.json').write_text(json.dumps(measured,ensure_ascii=False,indent=2),encoding='utf8')
    print(json.dumps({'pages':len(measured), 'low_confidence':[k for k,v in measured.items() if min(v['confidence'])<.2]},ensure_ascii=True))


if __name__ == '__main__':
    main()
