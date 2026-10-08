"""时间轴.json → 字幕.srt（与片内烧录字幕同一口径：开说前 0.06s 出，下一句前 0.06s 或说完 0.5s 后收）"""
import json, re, sys
L = json.load(open(sys.argv[1]))['lines']
def f(t):
    ms = int(round(t * 1000)); return f'{ms//3600000:02d}:{ms//60000%60:02d}:{ms//1000%60:02d},{ms%1000:03d}'
out = []
for i, l in enumerate(L):
    a = l['at'] - 0.06; b = min(L[i + 1]['at'] - 0.06, l['end'] + 0.5) if i + 1 < len(L) else l['end'] + 0.6
    out.append(f"{i+1}\n{f(a)} --> {f(b)}\n{re.sub(r'(\d),(\d{3})', r'\1\2', l['text'])}\n")
open(sys.argv[2], 'w').write('\n'.join(out))
