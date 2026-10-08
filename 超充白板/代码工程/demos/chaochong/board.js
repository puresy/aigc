// 白板手绘解说（y3 RSA 型）「超充」——一整块大白板＝世界，相机跟着口播在板上移动，最后拉远看全图。
// 语法卡：references/动画语法/y3_whiteboard.md（黑 #0A0503＋唯一强调色橙；写字比口播晚约 0.3–0.5s、说完 1s 内写完；
//   板上平滑移动 sineInOut；手只在画的时候入画，空档长就从右下退出；收尾拉远看全图）。
// 时间全部挂在口播句子上：S(i) = 第 i 句开说的秒数（timing.js 由 工具/tts.py 生成），换口播只要重新生成 timing.js。
// 版式：14 块板蛇形排布（第 1 行左→右，第 2 行右→左，第 3 行左→右），每块内容在局部 x 200–1720、y 70–860（底部让给字幕）。
(() => {
const W = 1920, H = 1080;
const { clamp, lerp } = U;
const seg = MO.seg;
const CC = window.CC = {};
const INK = '#0A0503', OR = '#EF7226', WASH = 'rgba(239,114,38,.22)', GREYWASH = 'rgba(10,5,3,.08)', BOARD = '#FBFBFB';
const LW = 6.5, SPEED = 3600;
const VO = window.VO, LN = VO.lines;
const S = i => LN[i].at, E = i => LN[i].end;

const B = DG.board({ ink: INK, lw: LW, speed: SPEED, font: '"LXGWWenKai-500"' });
const go = t => B.at(Math.max(B.cur, t));             // 不倒退：上一笔没画完就接着排
const tr = DG.xform, arc = DG.arcPts;

// ---------- 每块板：局部坐标 → 世界坐标 ----------
let O = [0, 0];
const P = (x, y) => [O[0] + x, O[1] + y];
const PS = pts => pts.map(([x, y]) => P(x, y));
const line = (pts, o = {}) => B.line(PS(pts), o);
const rline = (pts, o = {}) => B.line(PS(pts), { smooth: false, ...o });
const text = (s, x, y, size, o = {}) => B.text(s, ...P(x, y), size, o);
const pop = (s, x, y, size, o = {}) => B.pop(s, ...P(x, y), size, { col: OR, ...o });
const fill = (pts, col = WASH, dur = 0.25) => B.fill(U.poly(PS(pts)), col, dur);
const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y + 1]];
// 写字：按这句话剩下的时间定速度（标题慢、正文快），夹在 4–16 字/秒
const say = (s, x, y, size, o = {}) => { const n = [...s].length; B.text(s, ...P(x, y), size, { rate: clamp(o.rate || n / (o.within || 0.9), 4, 16), ...o }); };

// ---------- 图标（局部坐标，s = 缩放；原点见各自注释） ----------
const arrow = (a, b, o = {}) => {                      // 箭头：线＋箭头（两笔）
  const { col = INK, w = LW, head = 34 } = o;
  line([a, [lerp(a[0], b[0], .5) + (o.bend || 0), lerp(a[1], b[1], .5) - (o.bend || 0) * .3], b], { col, w, speed: o.speed || SPEED * 1.3 });
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), h1 = [b[0] - head * Math.cos(ang - .5), b[1] - head * Math.sin(ang - .5)], h2 = [b[0] - head * Math.cos(ang + .5), b[1] - head * Math.sin(ang + .5)];
  rline([h1, b, h2], { col, w, min: .08 });
};
const check = (x, y, s = 1, col = OR) => rline([[x - 26 * s, y], [x - 6 * s, y + 22 * s], [x + 34 * s, y - 30 * s]], { col, w: LW, min: .12 });
const cross = (x, y, s = 1, col = OR) => { rline([[x - 30 * s, y - 30 * s], [x + 30 * s, y + 30 * s]], { col, min: .08 }); rline([[x + 30 * s, y - 30 * s], [x - 30 * s, y + 30 * s]], { col, min: .08 }); };
const bolt = (x, y, s = 1, col = OR, f = true) => {     // 闪电，中心 (x,y)，高约 140·s
  const pts = [[12, -70], [-30, 8], [0, 8], [-14, 70], [32, -14], [2, -14], [12, -70]].map(([a, b]) => [x + a * s, y + b * s]);
  rline(pts, { col, w: LW * Math.min(1, .6 + s * .4), min: .2 }); if (f) fill(pts, col === OR ? WASH : GREYWASH);
};
const pile = (x, y, s = 1, o = {}) => {                 // 充电桩，原点 = 底部中心，高 360·s
  const k = ([a, b]) => [x + a * s, y + b * s];
  rline([[-70, 0], [-70, -330], [-50, -360], [50, -360], [70, -330], [70, 0]].map(k), { w: o.w || LW, speed: SPEED * 1.4 });
  rline([[-100, 0], [100, 0]].map(k), { w: o.w || LW });
  rline(rect(-42, -320, 84, 62).map(k), { w: (o.w || LW) * .75, speed: SPEED * 1.6 });
  if (o.bolt !== false) bolt(x, y - 170 * s, s * .9, o.boltCol || OR);
  line([[70, -230], [130, -200], [150, -110], [125, -30]].map(k), { w: (o.w || LW) * .85 });
  rline(rect(108, -32, 34, 36).map(k), { w: (o.w || LW) * .8, min: .1 });
};
const car = (x, y, s = 1, o = {}) => {                  // 侧面小车，原点 = 地面中心，长 360·s
  const k = ([a, b]) => [x + a * s * (o.flip ? -1 : 1), y + b * s];
  line([[-180, -42], [-182, -88], [-128, -102], [-72, -158], [58, -160], [118, -104], [176, -92], [180, -44], [138, -42]].map(k), { w: o.w || LW, speed: SPEED * 1.3 });
  line([[-70, -42], [70, -42]].map(k), { w: o.w || LW });
  rline([[-58, -106], [-40, -142], [48, -142], [92, -106], [-58, -106]].map(k), { w: (o.w || LW) * .75, speed: SPEED * 1.6 });
  for (const cx of [-105, 105]) line(arc(cx, -40, 36, 36, -Math.PI / 2, Math.PI * 1.55, 18).map(k), { w: o.w || LW, speed: SPEED * 1.8, min: .06 });
  if (o.bolt) bolt(...k([0, -78]), s * .32, OR, false);
};
const clock = (x, y, r, o = {}) => {                    // 钟，中心 (x,y)
  line(DG.ellipsePts(x, y, r, r, -Math.PI / 2, 1.04, 40), { w: LW, speed: SPEED * 1.4 });
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; rline([[x + Math.cos(a) * r * .8, y + Math.sin(a) * r * .8], [x + Math.cos(a) * r * .92, y + Math.sin(a) * r * .92]], { w: LW * .8, min: .03, gap: .01 }); }
  rline([[x, y], [x, y - r * .62]], { min: .08 }); rline([[x, y], [x + r * .45, y + r * .12]], { min: .08, col: o.handCol || INK });
};
const pylon = (x, y, s = 1) => {                        // 电塔，原点 = 底部中心，高 320·s
  const k = ([a, b]) => [x + a * s, y + b * s];
  rline([[-85, 0], [-20, -320], [20, -320], [85, 0]].map(k), { speed: SPEED * 1.3 });
  rline([[-120, -250], [120, -250]].map(k)); rline([[-90, -170], [90, -170]].map(k));
  rline([[-64, -90], [44, -170], [-44, -170], [64, -90], [-64, -90]].map(k), { w: LW * .7 });
  for (const [a, b] of [[-120, -250], [120, -250], [-90, -170], [90, -170]]) rline([[a, b], [a, b + 26]].map(k), { w: LW * .7, min: .03, gap: .01 });
};
const battery = (x, y, w, h, o = {}) => {               // 电池，左上 (x,y)
  rline(rect(x, y, w, h), { speed: SPEED * 1.4 }); rline(rect(x + w, y + h * .32, w * .08, h * .36), { min: .06 });
  const n = o.bars || 3; for (let i = 0; i < n; i++) { const bx = x + 16 + i * (w - 32) / n; fill(rect(bx, y + 14, (w - 32) / n - 12, h - 28), WASH, .15); rline(rect(bx, y + 14, (w - 32) / n - 12, h - 28), { w: LW * .6, col: OR, speed: SPEED * 2.4, min: .06 }); }
};
const pump = (x, y, s = 1) => {                         // 加油机，原点 = 底部中心，高 340·s
  const k = ([a, b]) => [x + a * s, y + b * s];
  rline([[-75, 0], [-75, -340], [75, -340], [75, 0]].map(k), { speed: SPEED * 1.4 }); rline([[-105, 0], [105, 0]].map(k));
  rline(rect(-48, -310, 96, 72).map(k), { w: LW * .75 });
    line([[0, -190], ...arc(0, -150, 26, 26, -Math.PI * .22, Math.PI * 1.22, 14), [0, -190]].map(k), { w: LW * .8, min: .1 });   // 油滴：和充电桩的闪电区分开
  line([[75, -280], [128, -270], [138, -150], [132, -80]].map(k), { w: LW * .85 }); rline([[118, -90], [150, -60], [160, -72]].map(k), { w: LW * .9, min: .06 });
};
const people = (x, y, s = 1, n = 3) => {                // 一群人，原点 = 底部中心
  for (let i = 0; i < n; i++) { const cx = x + (i - (n - 1) / 2) * 92 * s, h = i % 2 ? 0 : 14 * s;
    line(DG.ellipsePts(cx, y - 128 * s - h, 27 * s, 27 * s, -Math.PI / 2, 1.02, 20), { w: LW * .9, speed: SPEED * 2, min: .06, gap: .01 });
    line(arc(cx, y, 46 * s, 84 * s - h, Math.PI, Math.PI * 2, 16), { w: LW * .9, speed: SPEED * 2, min: .06, gap: .01 }); }
};
const pin = (x, y, s = 1, col = INK) => line([[0, 0], ...arc(0, -62, 34, 34, Math.PI * .78, Math.PI * 2.22, 20), [0, 0]].map(([a, b]) => [x + a * s, y + b * s]), { col, w: LW * .8, speed: SPEED * 2.2, min: .08, gap: .01 });
const neq = (x, y, s = 1) => { rline([[x - 60 * s, y - 22 * s], [x + 60 * s, y - 22 * s]], { col: OR, w: LW + 3, min: .1 }); rline([[x - 60 * s, y + 22 * s], [x + 60 * s, y + 22 * s]], { col: OR, w: LW + 3, min: .1 }); rline([[x + 34 * s, y - 70 * s], [x - 34 * s, y + 70 * s]], { col: OR, w: LW + 3, min: .1 }); };
const cloud = (x, y, rx, ry) => { const pts = []; for (let i = 0; i <= 96; i++) { const a = -Math.PI / 2 + i / 96 * Math.PI * 2.04, k = 1 + .11 * Math.abs(Math.sin(a * 5)); pts.push([x + Math.cos(a) * rx * k, y + Math.sin(a) * ry * k]); } line(pts, { speed: SPEED * 1.6, amp: 1 }); };
const bubble = (x, y, w, h, o = {}) => rline([[x + 30, y], [x + w - 30, y], [x + w, y + 30], [x + w, y + h - 30], [x + w - 30, y + h], [x + 150, y + h], [x + 70, y + h + 70], [x + 90, y + h], [x + 30, y + h], [x, y + h - 30], [x, y + 30], [x + 30, y]], { col: o.col || INK, w: o.w || LW, speed: SPEED * 1.4 });
const underline = (x0, x1, y, col = OR) => line([[x0, y], [lerp(x0, x1, .5), y + 6], [x1, y - 2]], { col, w: LW + 1, speed: SPEED * 1.6 });
const circle = (x, y, rx, ry, col = OR) => line(DG.ellipsePts(x, y, rx, ry, -2.6, 1.08, 44), { col, w: LW, speed: SPEED * 1.5 });

// ---------- 14 块板 ----------
// o = 世界原点；cam = 局部相机中心与缩放；first = 首句；B1 开场先推近标题再拉开（pre）
const BLOCKS = [
  // 列距 1950：相机停稳时邻块的内容（局部 x≥200）完全在画外，不留半截字；每块的橙色引线都放在空白处，不穿过字
  { o: [0, 0], cam: [1110, 540, 0.97], first: 0, pre: [700, 520, 1.2], lead: [[2060, 700], [2200, 700]] },
  { o: [2550, 0], cam: [960, 540, 1], first: 3 },
  { o: [4500, 0], cam: [960, 540, 1], first: 5, lead: [[1560, 230], [1760, 230]] },
  { o: [6450, 0], cam: [960, 540, 1], first: 8, lead: [[1600, 860], [1790, 860]] },
  { o: [8400, 0], cam: [960, 540, 1], first: 11 },
  { o: [8400, 1080], cam: [960, 540, 1], first: 13, lead: [[230, 905], [60, 905]] },
  { o: [6450, 1080], cam: [960, 540, 1], first: 15, lead: [[360, 790], [160, 790]] },
  { o: [4500, 1080], cam: [960, 540, 1], first: 18, lead: [[240, 545], [80, 545]] },
  { o: [2550, 1080], cam: [960, 540, 1], first: 23 },
  { o: [600, 1080], cam: [960, 540, 1], first: 26 },
  { o: [600, 2160], cam: [960, 540, 1], first: 30 },
  { o: [2550, 2160], cam: [960, 540, 1], first: 33, late: 0.35 },
  { o: [4500, 2160], cam: [960, 540, 1], first: 36, lead: [[1560, 720], [1760, 720]] },
  { o: [6450, 2160], cam: [960, 540, 1], first: 38 },
];
const MOVE = 1.0;                                       // 块间平移时长（sineInOut）；到位 = 首句开说 + 0.55（新块的第一笔在相机落定前就开画）
const ARRIVE = BLOCKS.map((b, k) => k ? S(b.first) + 0.55 + (b.late || 0) : 0);   // late：上一块需要多停一会儿时，这一块晚到
const END = [];
const blk = k => { O = BLOCKS[k].o; };
// 块尾的橙色引线：指向下一块的方向，在相机起跑时画（手领着相机走）
const lead = k => {
  const nb = BLOCKS[k + 1]; if (!nb) return;
  const dx = Math.sign(nb.o[0] - BLOCKS[k].o[0]), dy = Math.sign(nb.o[1] - BLOCKS[k].o[1]);
  go(ARRIVE[k + 1] - MOVE - 0.1);
  if (BLOCKS[k].lead) arrow(...BLOCKS[k].lead, { col: OR, head: 28 });
  else if (dy) { const x = BLOCKS[k].o[0] === Math.max(...BLOCKS.map(b => b.o[0])) ? 1800 : 130; arrow([x, 640], [x, 860], { col: OR, bend: 0, head: 28 }); }
  else if (dx > 0) arrow([1560, 470], [1760, 470], { col: OR, bend: 14, head: 28 });
  else arrow([360, 470], [160, 470], { col: OR, bend: -14, head: 28 });
};

// ===== B1 开场：超充功率卷到新境界 / 国庆上高速 / 差别？（L0–L2）=====
blk(0);
B.at(-0.55);                                            // 开场第一帧就有桩（封面不空板）
pile(420, 800, 1.05);
go(S(0) + 0.15);
say('超充功率', 640, 360, 118, { within: 0.8 });
say('卷到新境界', 640, 500, 96, { col: OR, within: 0.8 });
line([[640, 760], [800, 740], [930, 660], [1010, 560]], { col: OR, w: LW + 1, speed: SPEED * 1.6 });
rline([[972, 572], [1012, 556], [1018, 598]], { col: OR, min: .08 });
text('kW', 1030, 660, 72, { rate: 12 });
// L1 国庆真上了高速：路＋车
go(S(1) + 0.3);
say('国庆 · 高速', 1290, 330, 92, { within: 0.7 });
rline([[1180, 840], [2020, 840]], { speed: SPEED * 2 });
for (let i = 0; i < 6; i++) rline([[1200 + i * 140, 880], [1270 + i * 140, 880]], { w: LW * .8, min: .03, gap: .01 });
car(1560, 836, 1.05, { bolt: true });
line([[1300, 700], [1350, 700]], { w: 4, min: .03 }); line([[1270, 740], [1340, 740]], { w: 4, min: .03 });   // 速度线
// L2 你感受到差别了吗
go(S(2) + 0.25);
pop('差别？', 1800, 600, 150);
circle(1800, 560, 275, 118);
END[0] = B.cur; lead(0);

// ===== B2 究竟还有多久 / 这些超充才能真正改变局面（L3–L4）=====
blk(1);
go(S(3) + 0.3);
say('究竟还有多久？', 780, 440, 104, { within: 0.7 });
clock(480, 420, 190, { handCol: OR });
go(S(4) + 0.3);
pile(860, 850, 0.62);
arrow([1000, 700], [1180, 700], { head: 30 });
say('真正改变局面', 1220, 730, 92, { col: OR, within: 0.65 });
underline(1220, 1700, 768);
END[1] = B.cur; lead(1);

// ===== B3 第一批兆瓦级超充站 / 已发布并开始落地 / 比亚迪 1500kW 站点破万（L5–L7）=====
blk(2);
go(S(5) + 0.3);
say('第一批', 240, 220, 110, { within: 0.6 });
pop('兆瓦级', 790, 220, 110);
bolt(1060, 180, 0.8);
go(S(6) + 0.3);
say('已发布', 250, 360, 70, { within: 0.4 }); check(500, 335);
say('开始落地', 600, 360, 70, { within: 0.4 }); check(920, 335);
go(S(7) + 0.25);
pile(380, 850, 0.78, { bolt: true });
say('比亚迪', 600, 560, 88, { within: 0.35 });
pop('1500 kW', 600, 700, 120, { align: 'left' });
go(S(7) + 1.3);
say('站点破万', 1270, 420, 84, { within: 0.35 });
for (const [px, py] of [[1300, 600], [1430, 560], [1560, 610], [1680, 560], [1360, 730], [1500, 720], [1640, 740]]) pin(px, py, .8, INK);
pop('10000+', 1490, 860, 80);
END[2] = B.cur; lead(2);

// ===== B4 吉利小鹏规划落地 / 蔚来与吉利互通 / 换电和超充同步加入（L8–L10）=====
blk(3);
go(S(8) + 0.3);
say('吉利 · 小鹏', 240, 210, 88, { within: 0.5 });
arrow([760, 185], [900, 185], { head: 28 });
pin(990, 230, 1.0, OR);
say('规划落地', 1060, 210, 88, { within: 0.4 });
go(S(9) + 0.25);
line(DG.ellipsePts(380, 520, 120, 120, -Math.PI / 2, 1.03, 36), { speed: SPEED * 1.8 });
text('蔚来', 380, 545, 72, { align: 'center', rate: 12 });
line(DG.ellipsePts(860, 520, 120, 120, -Math.PI / 2, 1.03, 36), { speed: SPEED * 1.8 });
text('吉利', 860, 545, 72, { align: 'center', rate: 12 });
arrow([520, 490], [720, 490], { col: OR, head: 26 }); arrow([720, 560], [520, 560], { col: OR, head: 26 });
pop('互通', 620, 420, 76);
go(S(10) + 0.15);
battery(1060, 440, 230, 130, { bars: 2 });
text('换电', 1175, 660, 72, { align: 'center', rate: 12 });
pop('＋', 1390, 530, 110, { col: INK });
pile(1580, 620, 0.5);
text('超充', 1580, 720, 72, { align: 'center', rate: 12 });
say('同步加入', 1240, 830, 76, { col: OR, within: 0.25 });
END[3] = B.cur; lead(3);

// ===== B5 第二批 500kW 以上 / 华为 理想 特斯拉 500–600kW（L11–L12），功率尺把两批放在一起比 =====
blk(4);
go(S(11) + 0.3);
say('第二批', 240, 200, 104, { within: 0.5 });
pop('500 kW+', 610, 200, 104, { align: 'left' });
go(S(12) + 0.2);
const brands = [['华为', 380], ['理想', 760], ['特斯拉', 1140]];
for (const [nm, x] of brands) { pile(x, 560, 0.62, { w: LW * .9 }); text(nm, x, 650, 64, { align: 'center', rate: 14 }); }
// 功率尺：0–1500 kW，500–600 橙色（第二批），1000–1500 斜线（第一批兆瓦级）
const RX = kw => 260 + kw / 1500 * 1400;
go(S(12) + 2.0);
rline([[RX(0), 790], [RX(1500), 790]], { speed: SPEED * 2.2 });
for (const kw of [0, 500, 1000, 1500]) { rline([[RX(kw), 776], [RX(kw), 806]], { w: LW * .7, min: .03, gap: .01 }); }
for (const kw of [0, 500, 1000, 1500]) text(String(kw), RX(kw), 852, 44, { align: 'center', rate: 30 });
fill(rect(RX(500), 760, RX(600) - RX(500), 30), 'rgba(239,114,38,.6)', .2);
pop('500–600 kW', RX(550), 735, 66);
fill(rect(RX(1000), 760, RX(1500) - RX(1000), 30), 'rgba(10,5,3,.22)', .2);
text('第一批', RX(1250), 740, 52, { align: 'center', rate: 20 });
text('kW', RX(1500) + 50, 805, 44, { rate: 20 });
END[4] = B.cur; lead(4);

// ===== B6 听起来很好 / 但纸面参数不等于实际体验（L13–L14）=====
blk(5);
go(S(13) + 0.2);
say('听起来很好', 240, 200, 92, { within: 0.7 });
rline([[260, 300], [500, 300], [560, 360], [560, 800], [260, 800], [260, 300]], { speed: SPEED * 1.6 });
rline([[500, 300], [500, 360], [560, 360]], { w: LW * .7, min: .05 });
text('1500kW', 410, 470, 64, { align: 'center', rate: 14 });
for (const y of [560, 630, 700]) rline([[300, y], [520, y]], { w: 4, min: .04, gap: .01 });
go(S(14) + 0.3);
text('纸面参数', 410, 880 - 20, 60, { align: 'center', rate: 16 });
neq(800, 560, 1.15);
pile(1150, 800, 0.72);
// 实际：桩上方的小表盘，指针只到一小格
line(arc(1300, 420, 120, 120, Math.PI, Math.PI * 2, 20), { speed: SPEED * 1.6 });
rline([[1300, 420], [1218, 372]], { col: OR, w: LW + 1, min: .1 });
text('实际体验', 1300, 860, 60, { align: 'center', rate: 16 });
pop('?', 1420, 380, 90);
END[5] = B.cur; lead(5);

// ===== B7 补能是短板效应 / 车 桩 站 网 人 / 都可能成为短板（L15–L17）——木桶 =====
blk(6);
go(S(15) + 0.3);
say('短板效应', 220, 230, 112, { within: 0.65 });
text('补能速度 = 最短那块', 220, 330, 54, { rate: 16 });
const STAVES = [['车', 330], ['桩', 400], ['站', 300], ['网', 470], ['人', 380]];   // 各块板的顶（y）
const BX0 = 840, SW = 118, BOT = 840;
go(S(15) + 1.9);
line(arc(BX0 + SW * 2.5, BOT - 10, SW * 2.5 + 10, 34, 0, Math.PI, 24), { speed: SPEED * 1.8 });
STAVES.forEach(([nm, top], i) => rline([[BX0 + i * SW, BOT - 10], [BX0 + i * SW, top], [BX0 + (i + 1) * SW, top], [BX0 + (i + 1) * SW, BOT - 10]], { w: LW * .9, speed: SPEED * 2.4 }));
for (const yy of [560, 720]) line([[BX0 + 4, yy], [BX0 + SW * 5 - 4, yy + 4]], { w: LW * .7, speed: SPEED * 2.4 });
STAVES.forEach(([nm], i) => { go(S(16) + 0.35 + i * 0.66); text(nm, BX0 + (i + 0.5) * SW, 660, 76, { align: 'center', rate: 6 }); });
go(S(17) + 0.2);
const LOW = Math.max(...STAVES.map(s => s[1]));        // 水只能装到最短那块
fill([[BX0, LOW + 6], [BX0 + SW * 5, LOW + 6], [BX0 + SW * 5, BOT - 10], [BX0, BOT - 10]], WASH, .4);
line([[BX0 - 20, LOW + 6], [BX0 + SW * 5 + 20, LOW + 6]], { col: OR, w: LW, speed: SPEED * 1.8 });
arrow([BX0 + SW * 3.5, 400], [BX0 + SW * 3.5, 455], { col: OR, head: 22 });
say('都可能成为短板', 220, 480, 72, { col: OR, within: 0.6 });
END[6] = B.cur; lead(6);

// ===== B8 五个问题，一行一个（L18–L22）=====
blk(7);
const QROWS = [
  [18, '车', '老车型能吃满功率吗？', (y) => car(560, y + 38, 0.42)],
  [19, '桩', '排的是超充桩吗？', (y) => pile(560, y + 52, 0.32, { w: LW * .8 })],
  [20, '站', '多车同充，功率被摊薄', (y) => { pile(520, y + 52, 0.32, { w: LW * .8 }); arrow([560, y - 20], [640, y - 50], { col: OR, head: 18, w: 5 }); arrow([560, y], [640, y + 10], { col: OR, head: 18, w: 5 }); }],
  [21, '网', '电网容量撑得住吗？', (y) => pylon(560, y + 52, 0.36)],
  [22, '人', '多少人和你同时出门？', (y) => people(560, y + 52, 0.55)],
];
QROWS.forEach(([li, k, q, icon], r) => {
  const y = 150 + r * 158;
  go(S(li) + 0.25);
  line(DG.ellipsePts(330, y - 10, 52, 52, -Math.PI / 2, 1.03, 28), { col: OR, speed: SPEED * 2.2, min: .1 });
  text(k, 330, y + 14, 62, { align: 'center', col: OR, rate: 10 });
  icon(y);
  say(q, 700, y + 14, 64, { within: 0.85 });
});
END[7] = B.cur; lead(7);

// ===== B9 国庆流量峰值：新能源车 1780 万辆，日常的 1.8 倍（L23–L25）——柱从 0 起，高度比 = 1 : 1.8 =====
blk(8);
go(S(23) + 0.3);
say('国庆假期 · 流量峰值', 240, 190, 86, { within: 0.8 });
const BASE = 820, HD = 300;                             // 日常柱高；国庆 = 1.8 倍
rline([[300, BASE], [1500, BASE]], { speed: SPEED * 2 });
rline([[480, BASE], [480, BASE - HD], [700, BASE - HD], [700, BASE]], { speed: SPEED * 2 });
fill([[480, BASE - HD], [700, BASE - HD], [700, BASE], [480, BASE]], GREYWASH, .2);
text('日常', 590, BASE + 62, 60, { align: 'center', rate: 12 });
go(S(24) + 0.3);
rline([[900, BASE], [900, BASE - HD * 1.8], [1120, BASE - HD * 1.8], [1120, BASE]], { col: OR, speed: SPEED * 1.6 });
fill([[900, BASE - HD * 1.8], [1120, BASE - HD * 1.8], [1120, BASE], [900, BASE]], WASH, .3);
text('国庆峰值', 1010, BASE + 62, 60, { align: 'center', rate: 12 });
pop('1780万辆', 1170, 360, 96, { align: 'left' });
text('新能源车 · 国庆峰值', 1180, 450, 52, { rate: 16 });
go(S(25) + 0.25);
line([[700, BASE - HD - 20], [790, BASE - HD * 1.45], [880, BASE - HD * 1.8 + 10]], { col: OR, speed: SPEED * 1.6 });
rline([[846, BASE - HD * 1.8 + 6], [882, BASE - HD * 1.8 + 8], [872, BASE - HD * 1.8 + 44]], { col: OR, min: .08 });
text('×1.8', 540, 330, 96, { col: OR, rate: 8 });
END[8] = B.cur; lead(8);

// ===== B10 新车也施展不出来 / 不是续航和新老款的问题 / 一辆一辆来（L26–L29）=====
blk(9);
go(S(26) + 0.3);
car(420, 420, 0.8, { bolt: true });
say('近两年的超充新车', 700, 260, 72, { within: 0.7 });
go(S(26) + 2.1);
underline(700, 1270, 290); check(640, 330, 0.9);
go(S(27) + 0.2);
say('也施展不出来', 700, 370, 80, { col: OR, within: 0.6 });
go(S(28) + 0.35);
say('续航长短', 1360, 210, 64, { within: 0.35 });
say('新款老款', 1360, 300, 64, { within: 0.35 });
rline([[1350, 188], [1620, 192]], { col: OR, w: LW, min: .1 }); rline([[1350, 278], [1620, 282]], { col: OR, w: LW, min: .1 });
pop('不是问题', 1490, 385, 56);
go(S(29) + 0.3);
pile(1600, 820, 0.5);
[1300, 980, 660].forEach((x, i) => { car(x, 816, 0.5, { w: LW * .85 }); text(String(i + 1), x, 690, 50, { align: 'center', col: OR, rate: 10 }); });
say('一辆一辆来', 640, 560, 84, { col: OR, within: 0.35 });
END[9] = B.cur; lead(9);

// ===== B11 理想化：几年后超充车普及 / 流转速度接近加油站（L30–L32）=====
blk(10);
go(S(30) + 0.25);
cloud(520, 220, 260, 110);
say('理想化', 520, 250, 92, { align: 'center', within: 0.7 });
go(S(31) + 0.3);
say('几年后', 920, 230, 76, { within: 0.4 });
say('超充车型普及', 920, 330, 76, { within: 0.5 });
for (const x of [1000, 1180, 1360]) car(x, 450, 0.38, { bolt: true, w: LW * .75 });
go(S(32) + 0.2);
text('流转速度', 900, 560, 64, { col: OR, align: 'center', rate: 14 });
pump(560, 820, 0.85);
text('加油站', 560, 880, 56, { align: 'center', rate: 16 });
pop('≈', 900, 690, 180);
pile(1200, 820, 0.82);
text('超充站', 1200, 880, 56, { align: 'center', rate: 16 });
END[10] = B.cur; lead(10);

// ===== B12 高峰单车占用 10→5 分钟 / 电站储能扛电网压力（L33–L35）=====
blk(11);
go(S(33) + 0.5);
say('高峰时间', 240, 210, 96, { within: 0.7 });
go(S(34) + 0.3);
clock(450, 520, 170);
fill([[450, 520], ...arc(450, 520, 150, 150, -Math.PI / 2, -Math.PI / 2 + Math.PI / 3, 16)], WASH, .3);
say('单车占用', 700, 420, 72, { within: 0.35 });
say('10分钟', 700, 540, 84, { within: 0.3 });
arrow([970, 515], [1060, 515], { head: 24 });
text('甚至', 1095, 452, 68, { col: OR, rate: 10 });
pop('5分钟', 1090, 550, 110, { align: 'left' });
go(S(35) + 0.3);
battery(560, 700, 200, 110, { bars: 4 });
text('电站储能', 660, 880, 56, { align: 'center', rate: 14 });
arrow([800, 755], [1020, 755], { col: OR, head: 28 });
pylon(1180, 860, 0.62);
text('电网压力', 1430, 760, 64, { rate: 12 });
pop('↓', 1700, 755, 110);
END[11] = B.cur; lead(11);

// ===== B13 天时地利人和 / 下一次高峰补能突破（L36–L37）=====
blk(12);
['天时', '地利', '人和'].forEach((w, i) => { go(S(36) + 0.3 + i * 0.62); pop(w, 420 + i * 340, 240, 104, { col: INK }); });
go(S(36) + 2.2);
['天时', '地利', '人和'].forEach((w, i) => check(530 + i * 340, 140, 0.8));
go(S(37) + 0.3);
line([[240, 600], [1700, 600]], { col: INK, w: 4, speed: SPEED * 2.4 });
text('高峰瓶颈', 260, 580, 52, { rate: 14 });
line([[760, 860], [870, 720], [960, 470]], { col: OR, w: LW + 3, speed: SPEED * 1.4 });
rline([[910, 500], [962, 462], [990, 520]], { col: OR, w: LW + 3, min: .1 });
for (const [a, b] of [[[930, 610], [880, 570]], [[980, 610], [1040, 570]], [[955, 640], [955, 690]]]) rline([a, b], { col: OR, w: 5, min: .04, gap: .01 });
say('下一次高峰补能突破', 1060, 470, 80, { col: OR, within: 0.6 });
END[12] = B.cur; lead(12);

// ===== B14 2026 是参数年 / 什么时候本质变化 / 评论区聊聊（L38–L40）=====
blk(13);
go(S(38) + 0.3);
pop('2026', 420, 260, 140, { col: INK });
say('= 参数年？', 620, 260, 104, { within: 0.5 });
go(S(39) + 0.3);
arrow([300, 470], [1080, 470], { head: 32 });
text('2026', 300, 540, 52, { align: 'center', rate: 12 });
say('本质变化？', 1140, 495, 92, { col: OR, within: 0.6 });
go(S(40) + 0.15);
bubble(620, 610, 640, 170, { col: OR });
pop('评论区聊聊', 940, 725, 96);
END[13] = B.cur;
CC.END = END; CC.ARRIVE = ARRIVE; CC.board = B;

// ---------- 相机：每块到位后轻微漂移，块间 sineInOut 平移，结尾拉远看全图 ----------
const OVER_T0 = 110.95, OVER_T1 = 112.75;
const ov = (() => { const xs = BLOCKS.map(b => b.o[0]), ys = BLOCKS.map(b => b.o[1]);
  const x0 = Math.min(...xs) + 200, x1 = Math.max(...xs) + 1720, y0 = Math.min(...ys) + 70, y1 = Math.max(...ys) + 900;
  return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, z: Math.min(W / (x1 - x0) * 0.94, H / (y1 - y0) * 0.94) }; })();
const KEYS = [];
BLOCKS.forEach((b, k) => {
  const c = { x: b.o[0] + b.cam[0], y: b.o[1] + b.cam[1], z: b.cam[2] };
  const leave = k + 1 < BLOCKS.length ? ARRIVE[k + 1] - MOVE : OVER_T0;
  if (k === 0) {                                        // 开场：先推近标题，L1 开说前拉开到整块
    const p = { x: b.o[0] + b.pre[0], y: b.o[1] + b.pre[1], z: b.pre[2] };
    KEYS.push({ t: 0, ...p }, { t: S(1) - 0.35, x: p.x + 14, y: p.y + 4, z: p.z * 1.02, ease: MO.sineInOut }, { t: S(1) + 0.75, ...c, ease: MO.sineInOut });
  } else KEYS.push({ t: ARRIVE[k], ...c, ease: MO.sineInOut });
  KEYS.push({ t: leave, x: c.x + 12, y: c.y + 4, z: c.z * 1.018, ease: MO.sineInOut });
});
KEYS.push({ t: OVER_T1, ...ov, ease: MO.sineInOut }, { t: window.FILM_DURATION, ...ov, z: ov.z * 0.985, ease: MO.sineInOut });
const camAt = ft => CAM.at(KEYS, ft);
CC.camAt = camAt; CC.KEYS = KEYS;

// ---------- 笔：画的时候跟着笔尖；两笔间隔短 → 沿弧线滑过去；间隔长 → 从右下退出、下一笔前再进来 ----------
const handed = B.S.filter(s => s.kind !== 'pop' && s.kind !== 'fill' && (s.kind !== 'custom' || s.handed !== false));
const OFF = [W * 1.08, H * 1.25];
const penAt = (ft, cam, tip) => {
  if (tip) return CAM.toScreen(cam, tip[0], tip[1]);
  let prev = null, next = null;
  for (const s of handed) { if (s.t1 <= ft) prev = s; else if (s.t0 > ft && !next) next = s; }
  const gap = prev && next ? next.t0 - prev.t1 : 1e9;
  if (prev && next && gap < 0.9) return B.penAt(ft, cam, null);
  // 退出 0.35s cubicIn；进入 0.35s cubicOut
  if (next && ft > next.t0 - 0.35) { const b = CAM.toScreen(cam, ...startPt(next)), q = MO.cubicOut(clamp((ft - (next.t0 - 0.35)) / 0.35)); return [lerp(OFF[0], b[0], q), lerp(OFF[1], b[1], q)]; }
  if (prev && ft < prev.t1 + 0.35) { const a = CAM.toScreen(cam, ...endPt(prev)), q = MO.cubicIn(clamp((ft - prev.t1) / 0.35)); return [lerp(a[0], OFF[0], q), lerp(a[1], OFF[1], q)]; }
  return null;
};
const tw = s => s.size * [...s.str].length * 0.9;
const endPt = s => s.kind === 'line' ? s.pts[s.pts.length - 1] : [s.align === 'center' ? s.x + tw(s) / 2 : s.x + tw(s), s.y - s.size * 0.3];
const startPt = s => s.kind === 'line' ? s.pts[0] : [s.align === 'center' ? s.x - tw(s) / 2 : s.x, s.y - s.size * 0.3];

// ---------- 字幕（屏幕空间，底部居中；拉远看全图时不出） ----------
const SUB = { size: 50, y: 1012, font: '"PuHui-Bold"' };
const SPAN = LN.map((l, i) => [l.at - 0.06, i + 1 < LN.length ? Math.min(LN[i + 1].at - 0.06, l.end + 0.5) : l.end + 0.6]);
const subText = s => s.replace(/(\d),(\d{3})/g, '$1$2');   // 字幕里不用千分位逗号（和板上 1500 kW 一致）
const subAt = ft => { for (let i = 0; i < LN.length; i++) { const [a, b] = SPAN[i]; if (ft >= a && ft < b) return { s: subText(LN[i].text), a, b, joinIn: i > 0 && SPAN[i - 1][1] >= a - 1e-6, joinOut: i + 1 < LN.length && SPAN[i + 1][0] <= b + 1e-6 }; } return null; };
const drawSub = (c, ft) => {
  const u = subAt(ft); if (!u) return;
  c.save(); c.font = `${SUB.size}px ${SUB.font}`; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  const w = c.measureText(u.s).width, pad = 26;
  c.globalAlpha = (u.joinIn ? 1 : clamp((ft - u.a) / 0.08)) * (u.joinOut ? 1 : clamp((u.b - ft) / 0.08));   // 句句相接时硬切，不闪空框
  c.fillStyle = 'rgba(20,16,14,.78)'; c.beginPath(); c.roundRect(W / 2 - w / 2 - pad, SUB.y - SUB.size - 10, w + pad * 2, SUB.size + 34, 14); c.fill();
  c.fillStyle = '#FFFFFF'; c.fillText(u.s, W / 2, SUB.y);
  c.restore();
};
CC.subAt = subAt;

// ---------- 画 ----------
const drawBoard = (c, cam, ft) => {
  c.fillStyle = BOARD; c.fillRect(0, 0, W, H);
  const sm = PAINT.cached('ccsmudge', 1024, 1024, g => { const r = U.rng(5); for (let i = 0; i < 22; i++) { g.fillStyle = `rgba(120,120,130,${0.003 + r() * 0.005})`; g.beginPath(); g.ellipse(r() * 1024, r() * 1024, 80 + r() * 200, 14 + r() * 40, r() * 3, 0, 7); g.fill(); } });
  c.save(); const ox = -(((cam.x * cam.z) % 1024) + 1024) % 1024, oy = -(((cam.y * cam.z) % 1024) + 1024) % 1024; c.translate(ox, oy); c.fillStyle = c.createPattern(sm, 'repeat'); c.fillRect(0, 0, W + 1024, H + 1024); c.restore();
  c.save(); CAM.apply(c, cam); const r = B.draw(c, ft); c.restore();
  return r;
};
const shot = (c, lt, t) => {
  const ft = t, cam = camAt(ft);
  const { tip, col } = drawBoard(c, cam, ft);
  const hp = penAt(ft, cam, tip);
  if (hp) DG.pen(c, hp[0], hp[1], col || B.penColor(ft), Math.sin(ft * 7) * 0.03);
  if (!window.NO_SUBS) drawSub(c, ft);
};
CC.shot = shot;
for (const e of window.ERAS) SCENES[e.id] = { draw: shot, init: e.id === 'cc_b01' ? () => {
  // 字形检查：板上的字用霞鹜文楷，字幕用思源黑
  U.assertGlyphs('10px "LXGWWenKai-500"', B.S.filter(s => s.str).map(s => s.str).join(''), '白板');
  U.assertGlyphs(`10px ${SUB.font}`, LN.map(l => subText(l.text)).join(''), '字幕');
  // 时间线核对：每块最后一笔要在相机离开前画完
  const warn = [];
  END.forEach((e, k) => { const leave = k + 1 < BLOCKS.length ? ARRIVE[k + 1] - MOVE : OVER_T0; if (e > leave + 0.15) warn.push(`B${k + 1} 画完 ${e.toFixed(2)} > 相机离开 ${leave.toFixed(2)}`); });
  if (warn.length) console.warn('时间线：' + warn.join('；'));
  console.log('CC timeline', JSON.stringify(END.map(x => +x.toFixed(2))), JSON.stringify(ARRIVE.map(x => +x.toFixed(2))));
} : undefined };
})();
