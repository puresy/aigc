"""按块列出检查时刻：每块到位后 +1.2s（画到一半）与离开前 0.05s（画完）。和 board.js 的 ARRIVE/MOVE 口径一致。"""
import json, sys
L = json.load(open(sys.argv[1]))['lines']; FIRST = [0, 3, 5, 8, 11, 13, 15, 18, 23, 26, 30, 33, 36, 38]
arr = [0] + [L[i]['at'] + 0.55 for i in FIRST[1:]]; leave = [a - 1.0 for a in arr[1:]] + [110.95]
ts = []
for k in range(len(FIRST)): ts += [arr[k] + 1.2, leave[k] - 0.05]
print(','.join(f'{t:.2f}' for t in ts + [113.5]))
