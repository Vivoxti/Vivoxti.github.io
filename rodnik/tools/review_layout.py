"""Export contact sheets showing the same physical scale and original placements."""
from pathlib import Path
import argparse
import json
from PIL import Image, ImageDraw, ImageFont

SITE = Path(__file__).resolve().parents[1]


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args()
    args.output.mkdir(parents=True,exist_ok=True)
    data=json.loads((SITE/'assets/book.json').read_text(encoding='utf8'))
    pages=[p for p in data['pages'] if p['kind'] in ('page','contents')]
    font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',19)
    for start in range(0,len(pages),12):
        sheet=Image.new('RGB',(1440,1755),'#efeee9')
        draw=ImageDraw.Draw(sheet)
        for j,p in enumerate(pages[start:start+12]):
            paper=Image.new('RGBA',(336,504),'#eadcc0')
            d=ImageDraw.Draw(paper)
            for x in range(0,337,12):d.line((x,0,x,504),fill='#b2b8a9',width=1)
            for y in range(0,505,12):d.line((0,y,336,y),fill='#b2b8a9',width=1)
            if p.get('image'):
                ink=Image.open(SITE/p['image'].split('?')[0]).convert('RGBA')
                x,y,w,h=p['layout']
                ink=ink.resize((max(1,round(w/100*336)),max(1,round(h/100*504))),Image.Resampling.LANCZOS)
                paper.alpha_composite(ink,(round(x/100*336),round(y/100*504)))
            if p.get('numberImage'):
                number=Image.open(SITE/p['numberImage'].split('?')[0]).convert('RGBA')
                w,h=p['numberLayout']
                number=number.resize((max(1,round(w/100*336)),max(1,round(h/100*504))),Image.Resampling.LANCZOS)
                paper.alpha_composite(number,((336-number.width)//2,round(504*.97)-number.height))
            px,py=j%4*360+12,j//4*585+40
            sheet.paste(paper.convert('RGB'),(px,py))
            draw.text((px,py-28),p['id'],font=font,fill='#333')
        sheet.save(args.output/f'layout-{start//12+1:02}.jpg',quality=94)
    print(f'Reviewed layout contact sheets: {(len(pages)+11)//12}')


if __name__=='__main__':main()
