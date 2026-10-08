"""片尾拉远时的一小段提示音：C 大调三音拨弦（谐波＋指数衰减）＋一层很轻的长音垫，叠进口播混音。
用法：python3 outro.py 口播_混音.wav 起点秒 输出.wav"""
import sys, wave, numpy as np
src, t0, out = sys.argv[1], float(sys.argv[2]), sys.argv[3]
w = wave.open(src); sr, ch, n = w.getframerate(), w.getnchannels(), w.getnframes()
x = np.frombuffer(w.readframes(n), np.int16).reshape(-1, ch).astype(np.float32) / 32768
def pluck(f, dur):
    t = np.arange(int(sr * dur)) / sr
    s = sum(a * np.sin(2 * np.pi * f * k * t) for k, a in [(1, 1), (2, .35), (3, .12), (4, .05)])
    return s * np.exp(-t * 3.2) * np.minimum(1, t / 0.006)
y = np.zeros(len(x), np.float32)
for i, f in enumerate([523.25, 659.25, 783.99, 1046.5]):     # C5 E5 G5 C6
    a = int((t0 + i * 0.16) * sr); p = pluck(f, 2.6)[: len(y) - a]; y[a:a + len(p)] += p * (0.7 if i < 3 else 0.5)
t = np.arange(len(y) - int(t0 * sr)) / sr                    # 长音垫：C3+G3，缓入缓出
pad = (np.sin(2 * np.pi * 130.81 * t) + .6 * np.sin(2 * np.pi * 196 * t)) * np.minimum(1, t / 0.6) * np.clip((t[-1] - t) / 0.8, 0, 1) * .25
y[int(t0 * sr):] += pad
y *= 0.15 / max(1e-6, np.abs(y).max())                       # 峰值约 −16.5 dBFS：比口播低得多
x = np.clip(x + y[:, None], -1, 1)
o = wave.open(out, 'wb'); o.setnchannels(ch); o.setsampwidth(2); o.setframerate(sr); o.writeframes((x * 32767).astype(np.int16).tobytes())
