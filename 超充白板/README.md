# 超充白板解说（huashu-art-motion · y3 白板手绘语法）

口播：`口播.txt`（41 句；空行只是给配音分段停顿用）。成片在 `成片/`：

| 文件 | 说明 |
|---|---|
| `成片/超充白板解说.mp4` | 1920×1080 · 30fps · H.264 + AAC，113.9s，字幕已烧录，口播响度 −16 LUFS |
| `成片/超充白板解说.srt` | 同口径外挂字幕（平台支持外挂字幕时可用无字幕版 + srt，见下） |
| `成片/封面.jpg` / `成片/全图.jpg` | 封面候选（7.3s 开场板 / 结尾全图） |
| `成片/超充解说_混搭.mp4` | **混搭版**：按段落换 6 种解说语法（动态大字 / 发布会卡片 / 3b1b 公式 / 科普星球 / 经济学人图 / 豆子角色），112.5s，同一条配音和字幕 |
| `风格样张/风格对比.jpg` | 同一段内容 8 种风格各一帧，选风格用 |

## 配音说明
你只给了口播文本，没有录音，所以配音是 **Google 翻译朗读（女声）合成的引导音轨**，加速 1.2 倍，逐句合成后按真实时长排时间轴。
**要换成你自己的录音**：把录音逐句切好（或整段录完给我），重新跑下面第 1 步生成 `音频/时间轴.json`，画面、字幕会自动跟着新时间轴走。

## 复现
```sh
# 0) 引擎从 skill 复制（代码工程里只提交了本片的 demos/chaochong/）
cp -rn ../.claude/skills/huashu-art-motion/scripts/engine/* 代码工程/
# 1) 配音 + 时间轴（逐句 TTS → 去静音 → 1.2 倍速 → 拼整轨）
python3 工具/tts.py 口播.txt 音频/ --tempo 1.2
python3 -c "import json;d=json.load(open('音频/时间轴.json'));open('代码工程/demos/chaochong/timing.js','w').write('window.VO = '+json.dumps(d,ensure_ascii=False)+';\n')"
ffmpeg -i 音频/口播.wav -af "highpass=f=70,loudnorm=I=-16:TP=-1.5:LRA=11,apad" -ar 48000 -ac 2 -t 114.6 音频/口播_混音.wav
python3 工具/outro.py 音频/口播_混音.wav 110.95 音频/口播_混音_片尾.wav     # 片尾拉远时一小段轻提示音
python3 工具/srt.py 音频/时间轴.json 成片/超充白板解说.srt
# 2) 出片（本机 Playwright 浏览器版本不同就去掉 ==1.56.0）
cd 代码工程 && uv run --with playwright==1.56.0 python render.py --film demos/chaochong --fps 30 --crf 18 --out ../成片/超充白板解说.mp4 --audio ../音频/口播_混音_片尾.wav
# 无字幕版：在 demos/chaochong/board.js 顶部加 window.NO_SUBS = true 再渲
# 3) 验收
cd ../../.claude/skills/huashu-art-motion && uv run --with playwright==1.56.0 --with numpy --with pillow python scripts/qa.py --project ../../../超充白板/代码工程 --film demos/chaochong --sub-band 0
```

## 画面结构
一整块白板分 14 块，蛇形排布（第 1 行左→右，第 2 行右→左，第 3 行左→右），相机跟着口播平移，结尾拉远看全图。
黑线 + 唯一强调色橙；每句话开说后约 0.3s 落笔写关键词、画图标；字幕在屏幕底部，板上内容不进字幕带。
时间全部挂在句子上（`S(i)` = 第 i 句开说时刻），换配音不用改画面代码。

## 混搭版（按段换语法）
`工具/mix_build.py` 一份脚本管全片：每段一个参数化片段 spec（`混搭/spec/`），cue 时间全挂在口播句子上；片段之间在句间停顿处硬切，字幕最后用 ASS 统一烧录。
```sh
python3 工具/mix_build.py specs && python3 工具/mix_build.py render && python3 工具/mix_build.py final
```
| 段 | 口播 | 语法 |
|---|---|---|
| 1 | 开场：超充功率→还要多久 | y5 动态大字 |
| 2 | 第一批兆瓦级、比亚迪 1500kW、互通换电、第二批 500–600kW | t2 发布会卡片 |
| 3 | 纸面≠实际、补能速度 = min(车,桩,站,网,人) | t1 3b1b |
| 4 | 车桩站网人五问 | y1 科普星球 |
| 5 | 国庆峰值 1780 万辆、日常 1.8 倍 | t3 经济学人图 |
| 6 | 新车也施展不出来、一辆一辆来 | y4 豆子角色（本片加了导航屏与排队插入镜头） |
| 7 | 理想化：普及、≈加油站、10→5 分钟、储能 | t2 发布会卡片 |
| 8 | 天时地利人和→评论区聊聊 | y5 动态大字 |
