import sys
from fontTools.ttLib import TTFont
f = TTFont(sys.argv[1]); cm = f.getBestCmap()
txt = sys.argv[2]
print('missing:', ''.join(sorted({c for c in txt if not c.isspace() and ord(c) not in cm})))
