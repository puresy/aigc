"""口播文本 → 逐句 TTS（Google 翻译朗读，网络只放行这个）→ 去首尾静音、加速 → 拼成整轨 + 时间轴 JSON。
用法：python3 tts.py 口播.txt 音频/ [--tempo 1.2]
空行 = 段落分隔（句间停 0.16s，段间停 0.5s）。字幕用原文，朗读用 SPOKEN 里的读法。"""
import json, subprocess, sys, time, urllib.parse, urllib.request
from pathlib import Path

SPOKEN = [('1,500千瓦', '一千五百千瓦'), ('500-600千瓦', '五百到六百千瓦'), ('500千瓦', '五百千瓦'),
          ('1,780万辆', '一千七百八十万辆'), ('1.8倍', '一点八倍'), ('10分钟', '十分钟'), ('5分钟', '五分钟'),
          ('2026', '二零二六'), ('车、桩、站、网、人', '车，桩，站，网，人'), ('华为 理想 特斯拉', '华为，理想，特斯拉')]
src, out = Path(sys.argv[1]), Path(sys.argv[2]); tempo = float(sys.argv[sys.argv.index('--tempo') + 1]) if '--tempo' in sys.argv else 1.2
raw = out / 'raw'; raw.mkdir(parents=True, exist_ok=True)
SR, GAP, PGAP, LEAD = 48000, 0.16, 0.5, 0.6

def spoken(s):
    for a, b in SPOKEN: s = s.replace(a, b)
    return s
def dur(f): return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(f)]))

lines, para = [], 0
for ln in src.read_text().splitlines():
    if not ln.strip(): para += 1; continue
    lines.append({'text': ln.strip(), 'para': para})
items, t = [], LEAD
for i, L in enumerate(lines):
    mp3, wav = raw / f'{i:02d}.mp3', raw / f'{i:02d}.wav'
    if not mp3.exists() or mp3.stat().st_size == 0:
        q = urllib.parse.quote(spoken(L['text']))
        req = urllib.request.Request(f'https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=zh-CN&ttsspeed=1&q={q}', headers={'User-Agent': 'Mozilla/5.0'})
        for k in range(4):
            try: mp3.write_bytes(urllib.request.urlopen(req, timeout=30).read()); break
            except Exception as e: print('retry', i, e); time.sleep(2 ** k)
        time.sleep(0.3)
    # 去首尾静音 → 加速（atempo 不变调）→ 48k 单声道
    af = f'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse,atempo={tempo}'
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(mp3), '-af', af, '-ar', str(SR), '-ac', '1', str(wav)], check=True)
    d = dur(wav)
    if i and L['para'] != lines[i - 1]['para']: t += PGAP - GAP
    items.append({**L, 'i': i, 'at': round(t, 3), 'end': round(t + d, 3), 'wav': str(wav)}); t += d + GAP
total = round(t + 1.6, 3)
# 拼整轨：每句按 at 放进去（adelay），其余静音
inputs, flt = [], []
for k, it in enumerate(items):
    inputs += ['-i', it['wav']]; ms = int(it['at'] * 1000); flt.append(f'[{k}]adelay={ms}|{ms}[a{k}]')
flt.append(''.join(f'[a{k}]' for k in range(len(items))) + f'amix=inputs={len(items)}:normalize=0,apad=whole_dur={total},atrim=0:{total}[m]')
subprocess.run(['ffmpeg', '-y', '-v', 'error', *inputs, '-filter_complex', ';'.join(flt), '-map', '[m]', '-ar', str(SR), '-ac', '1', str(out / '口播.wav')], check=True)
json.dump({'total': total, 'lines': [{k: v for k, v in it.items() if k != 'wav'} for it in items]}, open(out / '时间轴.json', 'w'), ensure_ascii=False, indent=1)
for it in items: print(f"{it['at']:7.2f}-{it['end']:7.2f}  p{it['para']}  {it['text']}")
print('total', total)
