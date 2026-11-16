"""KoPub 보충 글꼴 만들기 — 기본 서브셋(public/fonts/KoPubWorld*-{Light,Medium,Bold}.woff2)에 없는 글자를 원본에서 뽑아 보충 파일로 만든다.

왜: 기본 서브셋은 한글 672자뿐이라, 거기 없는 글자는 Noto 글꼴로 섞여 보인다(2026-11-16 실측: 사이트 글자의 1.2%, 한글 226종).
구조: 기본(그대로) + ext1(사이트 문구에 실제로 쓰이는 나머지 글자) + ext2(그 밖의 완성형 한글 2,350자 나머지).
      보충 파일은 unicode-range 로 «그 글자가 화면에 있을 때만» 내려받는다. 기본 파일은 건드리지 않는다.

쓰는 법 (저장소 맨 위에서):
  python3 scripts/build-kopub-ext-fonts.py [--src 원본OTF폴더] [--extra 글자가_든_텍스트파일 ...] [--tag v2]
  - 원본 OTF: 저장소 밖 ~/Desktop/KD4-HUB/06-brand/KOPUBWORLD_OTF_FONTS2026 (public/ 에는 최적화본만 둔다)
  - 필요: pip install fonttools brotli
  - 글자를 늘려 다시 만들 때는 --tag 를 올린다(/fonts 는 1년 immutable 캐시 — 같은 이름으로 덮어쓰면 방문자에게 안 바뀜).
결과: public/fonts/KoPubWorld{Dotum,Batang}-{Light,Medium,Bold}-ext{1,2}-<tag>.woff2 12개 + styles/kopub-ext.css
"""
import argparse, pathlib, re, sys
from fontTools.ttLib import TTFont
from fontTools import subset

ROOT = pathlib.Path(__file__).resolve().parent.parent
ap = argparse.ArgumentParser()
ap.add_argument('--src', default=str(pathlib.Path.home() / 'Desktop/KD4-HUB/06-brand/KOPUBWORLD_OTF_FONTS2026'))
ap.add_argument('--extra', nargs='*', default=[], help='사이트에 실제로 보이는 글자가 든 텍스트 파일(크롤 결과 등)')
ap.add_argument('--tag', default='v1')
args = ap.parse_args()

FACES = [('Dotum', 'Light', 300), ('Dotum', 'Medium', 400), ('Dotum', 'Bold', 700),
         ('Batang', 'Light', 300), ('Batang', 'Medium', 400), ('Batang', 'Bold', 700)]
SYMBOLS = '○●◎◇◆□■△▽☆♡♥♪♬↑↔⇒⇔⑧⑭⑮㈜㎡㎝㎞㎏℃™『』《》〈〉【】〔〕〃〜～！？（）：；，．％＆＋－／'

def is_hangul(c): return 0xAC00 <= ord(c) <= 0xD7A3

# 1) 사이트 문구에 쓰이는 글자 = 소스(주석 제외) + --extra 파일
used = set()
for d in ('app', 'components', 'lib', 'data', 'content'):
    for f in (ROOT / d).rglob('*'):
        if f.suffix in ('.ts', '.tsx', '.md', '.mdx', '.json') and f.is_file():
            t = f.read_text(encoding='utf-8', errors='ignore')
            t = re.sub(r'/\*.*?\*/', '', t, flags=re.S); t = re.sub(r'(?m)^\s*//.*$', '', t); t = re.sub(r'\s//\s.*$', '', t, flags=re.M)
            used.update(t)
for f in args.extra:
    used.update(pathlib.Path(f).read_text(encoding='utf-8'))

# 2) 완성형 한글 2,350자 (KS X 1001)
ksx = set()
for hi in range(0xB0, 0xC9):
    for lo in range(0xA1, 0xFF):
        try: ksx.add(bytes([hi, lo]).decode('euc_kr'))
        except UnicodeDecodeError: pass
assert len(ksx) == 2350, len(ksx)

def ranges(cps):
    cps = sorted(cps); out = []; s = p = cps[0]
    for c in cps[1:] + [None]:
        if c is not None and c == p + 1: p = c; continue
        out.append(f'U+{s:X}' if s == p else f'U+{s:X}-{p:X}')
        if c is not None: s = p = c
    return ', '.join(out)

css = ['/* 자동 생성 파일 — 손으로 고치지 말 것. 만드는 법: scripts/build-kopub-ext-fonts.py (맨 위 설명 참고)',
       '   KoPub 보충 글꼴: 기본 서브셋(styles/globals.css 의 @font-face 6개)에 없는 글자를 같은 KoPub 으로 보여 주기 위한 파일.',
       '   unicode-range 에 적힌 글자가 화면에 있을 때만 내려받는다. ext1 = 사이트 문구에 쓰이는 나머지 글자, ext2 = 그 밖의 완성형 한글. */', '']
report = []
for fam, wname, weight in FACES:
    core_path = ROOT / f'public/fonts/KoPubWorld{fam}-{wname}.woff2'
    core = set(TTFont(str(core_path)).getBestCmap().keys())
    src = pathlib.Path(args.src) / f'KoPubWorld {fam}_Pro {wname}.otf'
    full = set(TTFont(str(src)).getBestCmap().keys())
    ext1 = {ord(c) for c in used if is_hangul(c)} | {ord(c) for c in SYMBOLS}
    ext1 = (ext1 & full) - core
    ext2 = ({ord(c) for c in ksx} & full) - core - ext1
    for name, cps in (('ext1', ext1), ('ext2', ext2)):
        out = ROOT / f'public/fonts/KoPubWorld{fam}-{wname}-{name}-{args.tag}.woff2'
        opt = subset.Options(); opt.flavor = 'woff2'; opt.hinting = False; opt.desubroutinize = True
        opt.layout_features = ['*']; opt.name_IDs = ['*']  # 저작권·라이선스 표기(이름표 0·13·14 등)를 그대로 둔다; opt.notdef_outline = True; opt.drop_tables += ['DSIG', 'VORG', 'vhea', 'vmtx', 'BASE']
        font = subset.load_font(str(src), opt)
        s = subset.Subsetter(opt); s.populate(unicodes=sorted(cps)); s.subset(font)
        subset.save_font(font, str(out), opt)
        report.append((out.name, len(cps), out.stat().st_size))
        css += ['@font-face {', f"  font-family: 'KoPubWorld {fam}';", '  font-style: normal;', f'  font-weight: {weight};', '  font-display: swap;',
                f"  src: url('/fonts/{out.name}') format('woff2');", f'  unicode-range: {ranges(cps)};', '}']
(ROOT / 'styles/kopub-ext.css').write_text('\n'.join(css) + '\n', encoding='utf-8')
for n, k, sz in report: print(f'{n:48s} {k:5d}자 {sz/1024:6.1f}KB')
print('styles/kopub-ext.css', round((ROOT / 'styles/kopub-ext.css').stat().st_size / 1024, 1), 'KB')
