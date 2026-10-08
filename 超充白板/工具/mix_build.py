"""混搭版：按段落换解说语法（huashu-art-motion 的参数化片段 clips/*.js），每段一个 spec，时间全挂在口播句子上。
用法（在 超充白板/ 下）：
  python3 工具/mix_build.py specs            # 只写 spec 到 混搭/spec/
  python3 工具/mix_build.py render [段号…]   # 渲片段（默认全部）→ 混搭/片段/
  python3 工具/mix_build.py stills           # 每段抽 3 帧 → 混搭/静帧/
  python3 工具/mix_build.py final            # 拼接 + 烧字幕 + 混音 → 成片/超充解说_混搭.mp4
段落边界 = 下一段首句开说前 0.35s（硬切落在句间停顿里）。字幕不进片段：片段都让开底部 safe.bottom，最后统一用 ASS 烧。
"""
import json, re, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VO = json.load(open(ROOT / '音频/时间轴.json')); L = VO['lines']
S = lambda i: L[i]['at']; E = lambda i: L[i]['end']
OUT = ROOT / '混搭'; SPEC = OUT / 'spec'; CLIP = OUT / '片段'
FPS, SAFE = 30, {'bottom': 190}
TOTAL = 112.5
ORANGE = '#ff7a1a'

# 每段：(编号, 首句, 语法, 名称, cue 生成函数(段起点 t0) → (data, cues))
def seg1(t0):   # E 动态大字：开场钩子
    r = lambda t: round(t - t0, 3)
    return {'palette': [['#14213D', '#FFD23F'], ['#FF5A36', '#FFFFFF'], ['#F4EFE6', '#111111'], ['#FFD23F', '#111111']]}, [
        {'at': r(0.2), 'kind': 'title', 'text': '超充功率', 'sub': '今年卷到了新境界', 'data': {'key': '新境界'}},
        {'at': r(S(1) + 0.2), 'kind': 'title', 'text': '国庆·高速', 'sub': '真上了高速之后', 'data': {'key': '高速'}},
        {'at': r(S(2) + 0.25), 'kind': 'title', 'text': '差别？', 'sub': '你感受到了吗', 'data': {'key': '感受'}},
        {'at': r(S(3) + 0.2), 'kind': 'title', 'text': '还要多久？', 'sub': '超充才能真正改变局面', 'data': {'key': '改变局面'}},
        {'at': r(S(4) + 0.6), 'kind': 'highlight', 'data': {'word': '多久'}},
    ]
def seg2(t0):   # G 发布会：两批超充
    r = lambda t: round(t - t0, 3)
    return {'eyebrow': '2026 超充 · 第一批', 'title': '兆瓦级超充站', 'subtitle': '已经发布，并开始落地', 'accent': ORANGE}, [
        {'at': r(S(5) + 0.2), 'kind': 'title'},
        {'at': r(S(7) + 1.9), 'kind': 'number', 'text': '比亚迪单桩功率 · 站点破万', 'data': {'value': 1500, 'suffix': ' kW', 'label': '比亚迪'}},
        {'at': r(S(8) + 0.3), 'kind': 'card', 'text': '吉利 · 小鹏', 'sub': '也在规划落地', 'data': {'icon': 'clock'}},
        {'at': r(S(9) + 0.3), 'kind': 'card', 'text': '蔚来 × 吉利', 'sub': '补能网络互通', 'data': {'icon': 'layers'}},
        {'at': r(S(10) + 0.3), 'kind': 'card', 'text': '换电 + 超充', 'sub': '同步加入', 'data': {'icon': 'bolt'}},
        {'at': r(S(11) + 1.6), 'kind': 'number', 'text': '第二批 · 也来到 500 千瓦以上', 'data': {'value': 500, 'suffix': ' kW+', 'label': '第二批'}},
        {'at': r(S(12) + 0.3), 'kind': 'card', 'text': '华为', 'sub': '500–600 kW', 'data': {'icon': 'bolt'}},
        {'at': r(S(12) + 0.9), 'kind': 'card', 'text': '理想', 'sub': '500–600 kW', 'data': {'icon': 'bolt'}},
        {'at': r(S(12) + 1.5), 'kind': 'card', 'text': '特斯拉', 'sub': '500–600 kW', 'data': {'icon': 'bolt'}},
    ]
def eq(cur):     # 短板公式：第 cur 项（车桩站网人）高亮成黄色，-1 = 全白
    T = [{'s': '补能速度', 'zh': True}, {'s': '=', 'gap': 20}, {'s': 'min(', 'gap': 4}]
    for k, n in enumerate('车桩站网人'):
        T.append({'s': n, 'zh': True, 'gap': 4, **({'col': 'YELLOW'} if k == cur else {})})
        if k < 4: T.append({'s': ',', 'gap': 14})
    return T + [{'s': ')'}]
def seg3(t0):   # F 3b1b：纸面 ≠ 实际，短板效应 = min(...)
    r = lambda t: round(t - t0, 3)
    return {}, [
        {'at': r(S(13) + 0.2), 'kind': 'title', 'text': '听起来很好……'},
        {'at': r(S(14) + 0.3), 'kind': 'title', 'text': '但纸面参数 ≠ 实际体验'},
        {'at': r(S(14) + 1.0), 'kind': 'point', 'text': '纸面：单桩峰值功率'},
        {'at': r(S(14) + 2.0), 'kind': 'point', 'text': '实际：一路上每个环节都算数'},
        {'at': r(S(15) + 0.3), 'kind': 'point', 'text': '补能是短板效应'},
        {'at': r(S(15) + 1.4), 'kind': 'equation', 'dur': 1.2, 'data': {'tokens': eq(-1)}},
    ] + [{'at': r(S(16) + d), 'kind': 'equation', 'dur': 0.45, 'data': {'tokens': eq(k)}} for k, d in enumerate([1.2, 1.9, 2.6, 3.2, 3.6])] + [
        {'at': r(S(17) + 0.3), 'kind': 'highlight', 'data': {'target': 'equation'}},
    ]
def seg4(t0):   # B Kurzgesagt：五个环节，一问一个节点（问题本身在字幕里）
    r = lambda t: round(t - t0, 3)
    names = ['车', '桩', '站', '网', '人']
    return {'center': '高峰补能', 'flow': True, 'place': [[-600, 20], [-380, -220], [0, -330], [380, -220], [600, 20]]}, [{'at': r(S(18) - 0.25), 'kind': 'title', 'text': '五个环节，都可能是短板'}] + \
        [{'at': r(S(18) + 0.05 + k * 0.12), 'kind': 'point', 'text': n} for k, n in enumerate(names)] + \
        [{'at': r(S(18 + k) + (1.3 if k == 0 else 0.25)), 'kind': 'highlight', 'data': {'index': k}} for k in range(5)]
def seg5(t0):   # H 经济学人图：国庆峰值 1.8 倍
    r = lambda t: round(t - t0, 3)
    return {'title': '今年国庆假期：新能源车流量峰值', 'unit': '新能源车数量，相对日常的倍数', 'chart': 'bar', 'decimals': 1, 'suffix': ' 倍', 'colors': {'main': '#1f6fb2', 'accent': ORANGE},
            'series': [{'label': '日常', 'value': 1}, {'label': '国庆峰值', 'value': 1.8}], 'xAxis': 'category'}, [
        {'at': r(S(23) + 0.2), 'kind': 'title'},
        {'at': r(S(23) + 1.2), 'kind': 'bar', 'data': {'index': 0}},
        {'at': r(S(24) + 2.6), 'kind': 'number', 'text': '国庆峰值新能源车', 'data': {'value': 1780, 'suffix': ' 万辆'}},
        {'at': r(S(25) + 0.05), 'kind': 'bar', 'data': {'index': 1}},
        {'at': r(S(25) + 1.3), 'kind': 'highlight', 'data': {'index': 1}, 'text': '是日常的'},
    ]
def seg6(t0):   # D 豆子角色：新车也施展不出来，一辆一辆来
    r = lambda t: round(t - t0, 3)
    return {'scene': 'charge'}, [
        {'at': r(S(26) + 0.1), 'kind': 'point', 'text': L[26]['text'], 'sub': '我的车支持超充！', 'data': {'pose': 'point'}},
        {'at': r(S(27) + 0.05), 'kind': 'react', 'dur': round(E(27) - S(27) + 0.1, 2)},
        {'at': r(S(28) + 0.05), 'kind': 'point', 'text': L[28]['text'], 'sub': '不是续航和新老款的问题', 'data': {'pose': 'shrug'}},
        {'at': r(S(29) + 0.05), 'kind': 'insert', 'sub': '导航到最近的超充站', 'text': '一辆一辆来', 'data': {'hit': r(S(29) + 2.3), 'app': '导航', 'mode': 'queue'}},
    ]
def seg7(t0):   # G 发布会：理想化的情况
    r = lambda t: round(t - t0, 3)
    return {'eyebrow': '展望', 'title': '理想化的情况', 'subtitle': '几年后，会是什么样', 'accent': '#2bb673'}, [
        {'at': r(S(30) + 0.2), 'kind': 'title'},
        {'at': r(S(31) + 0.3), 'kind': 'card', 'text': '超充车型普及', 'sub': '几年后成为主流', 'data': {'icon': 'check'}},
        {'at': r(S(32) + 0.3), 'kind': 'card', 'text': '流转速度 ≈ 加油站', 'sub': '快进快出', 'data': {'icon': 'clock'}},
        {'at': r(S(33) + 0.2), 'kind': 'card', 'text': '高峰时间', 'sub': '单车占用压下来', 'data': {'icon': 'chart'}},
        {'at': r(S(34) + 1.9), 'kind': 'number', 'text': '高峰单车占用', 'data': {'value': 10, 'suffix': ' 分钟', 'label': '压到'}},
        {'at': r(S(34) + 3.5), 'kind': 'number', 'text': '高峰单车占用', 'data': {'value': 5, 'suffix': ' 分钟', 'label': '甚至'}},
        {'at': r(S(35) + 0.3), 'kind': 'card', 'text': '电站储能', 'sub': '把电先存在站里', 'data': {'icon': 'layers'}},
        {'at': r(S(35) + 1.3), 'kind': 'card', 'text': '电网压力', 'sub': '由储能来扛', 'data': {'icon': 'bolt'}},
    ]
def seg8(t0):   # E 动态大字：收尾
    r = lambda t: round(t - t0, 3)
    return {'palette': [['#F4EFE6', '#111111'], ['#FF5A36', '#FFFFFF'], ['#14213D', '#FFD23F'], ['#FFD23F', '#111111'], ['#14213D', '#FFD23F']]}, [
        {'at': r(S(36) + 0.2), 'kind': 'title', 'text': '天时 地利 人和', 'sub': '都凑齐的时候', 'data': {'key': '都凑齐'}},
        {'at': r(S(37) + 0.3), 'kind': 'title', 'text': '突破', 'sub': '也许是下一次高峰补能突破', 'data': {'key': '高峰补能'}},
        {'at': r(S(37) + 1.9), 'kind': 'highlight', 'data': {'word': '突破'}},
        {'at': r(S(38) + 0.3), 'kind': 'title', 'text': '2026', 'sub': '如果说今年是参数年', 'data': {'key': '参数年'}},
        {'at': r(S(39) + 0.3), 'kind': 'title', 'text': '本质变化？', 'sub': '你觉得会在什么时候', 'data': {'key': '什么时候'}},
        {'at': r(S(40) + 0.1), 'kind': 'title', 'text': '评论区聊聊', 'sub': '说说你的判断', 'data': {'key': '判断'}},
    ]

SEGS = [(1, 0, 'y5_kinetic_type', seg1), (2, 5, 't2_keynote_ui', seg2), (3, 13, 't1_3b1b', seg3), (4, 18, 'y1_kurzgesagt', seg4),
        (5, 23, 't3_finance_chart', seg5), (6, 26, 'y4_storytime', seg6), (7, 30, 't2_keynote_ui', seg7), (8, 36, 'y5_kinetic_type', seg8)]
def bounds():
    starts = [0.0] + [round(S(f) - 0.35, 3) for _, f, _, _ in SEGS[1:]]
    return [(starts[k], starts[k + 1] if k + 1 < len(starts) else TOTAL) for k in range(len(SEGS))]

def write_specs():
    SPEC.mkdir(parents=True, exist_ok=True)
    for (n, f, g, fn), (a, b) in zip(SEGS, bounds()):
        data, cues = fn(a)
        spec = {'grammar': g, 'duration': round(b - a, 3), 'fps': FPS, 'width': 1920, 'height': 1080, 'safe': SAFE, 'data': data, 'cues': cues}
        json.dump(spec, open(SPEC / f'{n}_{g}.json', 'w'), ensure_ascii=False, indent=1)
        print(f'{n} {g:18s} {a:7.2f}–{b:7.2f}  {len(cues)} cues')

def engine(): return ROOT / '代码工程'
def render(ids):
    CLIP.mkdir(parents=True, exist_ok=True)
    for p in sorted(SPEC.glob('*.json')):
        n = int(p.name.split('_')[0])
        if ids and n not in ids: continue
        subprocess.run(['uv', 'run', '-q', '--with', 'playwright==1.56.0', 'python', 'render.py', '--spec', str(p), '--out', str(CLIP / (p.stem + '.mp4'))], cwd=engine(), check=True)
def stills():
    d = OUT / '静帧'; d.mkdir(parents=True, exist_ok=True)
    for p in sorted(SPEC.glob('*.json')):
        dur = json.load(open(p))['duration']
        subprocess.run(['uv', 'run', '-q', '--with', 'playwright==1.56.0', 'python', 'render.py', '--spec', str(p), '--stills', f'{dur*0.3:.2f},{dur*0.62:.2f},{dur-0.15:.2f}', '--out', str(d / p.stem)], cwd=engine(), check=True)

def ass_time(t): cs = int(round(t * 100)); return f'{cs//360000}:{cs//6000%60:02d}:{cs//100%60:02d}.{cs%100:02d}'
def final():
    clips = sorted(CLIP.glob('*.mp4'), key=lambda p: int(p.name.split('_')[0]))
    lst = OUT / 'concat.txt'; lst.write_text(''.join(f"file '{c}'\n" for c in clips))
    silent = OUT / '拼接.mp4'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', str(lst), '-c', 'copy', str(silent)], check=True)
    # 字幕：思源黑 Bold（引擎 woff 转 ttf 给 libass），深色底框白字，底部居中
    fdir = OUT / 'fonts'; fdir.mkdir(exist_ok=True)
    ttf = fdir / 'NotoSansSC-Bold.ttf'
    if not ttf.exists():
        subprocess.run(['uv', 'run', '-q', '--with', 'fonttools', 'python', '-c',
            f"from fontTools.ttLib import TTFont; f=TTFont('{engine()}/lib/fonts/NotoSansSC-700.woff'); f.flavor=None; f.save('{ttf}')"], check=True)
    ev = []
    for i, l in enumerate(L):
        a = l['at'] - 0.06; b = min(L[i + 1]['at'] - 0.06, l['end'] + 0.5) if i + 1 < len(L) else l['end'] + 0.6
        ev.append(f"Dialogue: 0,{ass_time(a)},{ass_time(b)},Sub,,0,0,0,,{re.sub(r'(\d),(\d{3})', r'\1\2', l['text'])}")
    ass = OUT / '字幕.ass'
    ass.write_text('[Script Info]\nScriptType: v4.00+\nPlayResX: 1920\nPlayResY: 1080\nWrapStyle: 2\n\n[V4+ Styles]\n'
        'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n'
        'Style: Sub,Noto Sans SC,62,&H00FFFFFF,&H00FFFFFF,&H3A14100E,&H3A14100E,0,0,0,0,100,100,1,0,3,14,0,2,80,80,58,1\n\n'
        '[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n' + '\n'.join(ev) + '\n')
    out = ROOT / '成片/超充解说_混搭.mp4'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(silent), '-i', str(ROOT / '音频/口播_混音.wav'),
        '-vf', f"subtitles={ass}:fontsdir={fdir}", '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '256k', '-t', str(TOTAL), str(out)], check=True)
    print('->', out)

if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'specs': write_specs()
    elif cmd == 'render': render([int(x) for x in sys.argv[2:]])
    elif cmd == 'stills': stills()
    elif cmd == 'final': final()
