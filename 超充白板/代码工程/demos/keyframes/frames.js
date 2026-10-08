// 三张选风格关键帧：国庆高速服务区，超充桩前排长队。同一构图（右边充电棚、车队从右下往左上远处排过去），三种画风。
// A kf_cyber  赛博夜景：冷青＋警示橙，湿地面倒影，高速车流光轨，仪表盘式 HUD
// B kf_poster 构成主义海报：米白旧纸、红斜带、黑圆、红楔（闪电）刺入「高峰」，黑剪影车队斜线行进，方块大字
// C kf_dusk   新海诚黄昏：积雨云被夕阳染橙、丁达尔光束、车尾灯连成红线、光粒
(() => {
const W = 1920, H = 1080, { clamp, lerp, rng } = U, P = PAINT, TAU = Math.PI * 2;
const glow = P.glowStroke;

// ---------- 共用：侧面车身（朝右），原点 = 前后轮中点的地面，长约 300·s ----------
const CAR = [[-156, -24], [-160, -54], [-140, -68], [-74, -102], [26, -110], [92, -78], [148, -64], [160, -44], [157, -24]];   // 溜背轿跑式电车：车顶一路斜到车尾
const SUV = [[-156, -24], [-160, -72], [-146, -92], [-86, -118], [40, -122], [102, -86], [150, -72], [160, -46], [157, -24]];
const carPath = (x, y, s, kind = 0) => { const p = new Path2D(), pts = kind ? SUV : CAR; pts.forEach(([a, b], i) => i ? p.lineTo(x + a * s, y + b * s) : p.moveTo(x + a * s, y + b * s)); p.closePath(); return p; };
const winPath = (x, y, s, kind = 0) => { const p = new Path2D(); const pts = kind ? [[-128, -90], [-82, -112], [36, -116], [88, -88]] : [[-120, -70], [-70, -96], [22, -103], [80, -78]]; pts.forEach(([a, b], i) => i ? p.lineTo(x + a * s, y + b * s) : p.moveTo(x + a * s, y + b * s)); p.closePath(); return p; };
const wheels = (c, x, y, s, col, rim) => { for (const dx of [-95, 95]) { c.fillStyle = col; c.beginPath(); c.arc(x + dx * s, y - 20 * s, 27 * s, 0, TAU); c.fill(); if (rim) { c.fillStyle = rim; c.beginPath(); c.arc(x + dx * s, y - 20 * s, 12 * s, 0, TAU); c.fill(); } } };
// 车队：沿一条透视线从近（右下）到远（左上），越远越小
const queue = (n, near, far, s0, s1, seed = 3) => { const r = rng(seed), out = []; for (let i = 0; i < n; i++) { const k = i / (n - 1), e = Math.pow(k, 0.72); out.push({ x: lerp(near[0], far[0], e), y: lerp(near[1], far[1], e), s: lerp(s0, s1, e), kind: r() < 0.4 ? 1 : 0, ph: r() * 10 }); } return out; };

// =====================================================================================
// A · 赛博夜景
// =====================================================================================
const A = (() => {
  const C = { sky0: '#03070f', sky1: '#0a1a2c', cyan: '#3ee6ff', cyanD: '#0f6f86', orange: '#ff8a1f', red: '#ff3b3b', white: '#e8f6ff', asphalt: '#060a10' };
  const HOR = 560;
  const bg = () => P.cached('kfA_bg', W, H, g => {
    const sk = g.createLinearGradient(0, 0, 0, HOR); sk.addColorStop(0, C.sky0); sk.addColorStop(1, C.sky1); g.fillStyle = sk; g.fillRect(0, 0, W, HOR);
    const r = rng(11); for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(200,230,255,${0.15 + r() * 0.5})`; g.fillRect(r() * W, r() * HOR * 0.8, 1.6, 1.6); }
    // 远处城市天际线（冷青光晕）
    const cg = g.createRadialGradient(560, HOR, 10, 560, HOR, 700); cg.addColorStop(0, 'rgba(62,230,255,.28)'); cg.addColorStop(1, 'rgba(62,230,255,0)'); g.fillStyle = cg; g.fillRect(0, 0, W, HOR + 40);
    g.fillStyle = '#071322'; let x = 0; while (x < W) { const w = 30 + r() * 70, h = 30 + r() * 120 * (1 - Math.abs(x - 560) / 1400); g.fillRect(x, HOR - 40 - h, w, h + 40); for (let k = 0; k < h / 14; k++) if (r() < 0.35) { g.fillStyle = r() < 0.7 ? 'rgba(62,230,255,.55)' : 'rgba(255,170,80,.6)'; g.fillRect(x + 4 + r() * (w - 10), HOR - 36 - h + k * 14, 4, 3); g.fillStyle = '#071322'; } x += w + 4; }
    // 地面：沥青＋近处更亮的湿反光底
    const gg = g.createLinearGradient(0, HOR, 0, H); gg.addColorStop(0, '#0a1422'); gg.addColorStop(1, C.asphalt); g.fillStyle = gg; g.fillRect(0, HOR, W, H - HOR);
    // 高速护栏
    g.fillStyle = '#0d1b2b'; g.fillRect(0, HOR - 6, W, 10);
  });
  const Q = queue(8, [1110, 905], [230, 640], 0.95, 0.32, 7);
  function draw(c, t) {
    c.drawImage(bg(), 0, 0);
    // 高速车流光轨（在地平线上，白色朝左、红色朝右）
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let lane = 0; lane < 2; lane++) { const y = HOR - 14 + lane * 9, col = lane ? 'rgba(255,60,60,' : 'rgba(230,246,255,';
      for (let i = 0; i < 26; i++) { const sp = lane ? 320 : -380, x = ((i * 113 + t * sp) % (W + 400) + W + 400) % (W + 400) - 200, L = 60 + (i % 5) * 30;
        const lg = c.createLinearGradient(x, 0, x + (lane ? -L : L), 0); lg.addColorStop(0, col + '.9)'); lg.addColorStop(1, col + '0)'); c.strokeStyle = lg; c.lineWidth = 3; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (lane ? -L : L), y); c.stroke(); } }
    c.restore();
    // 地面透视车道线（青色，慢慢往近处流）
    c.save(); c.strokeStyle = 'rgba(62,230,255,.18)'; c.lineWidth = 2; const vp = [380, HOR - 10];
    for (let i = -4; i <= 8; i++) { c.beginPath(); c.moveTo(vp[0] + i * 6, vp[1]); c.lineTo(vp[0] + i * 340, H); c.stroke(); }
    for (let k = 0; k < 8; k++) { const q = ((k + t * 0.35) % 8) / 8, y = lerp(HOR, H, q * q); c.globalAlpha = 0.5 * q; c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); } c.restore();
    // 充电棚：黑色顶板＋底面 LED 灯带＋招牌
    const cx0 = 1240, cx1 = 1900, cy = 300;
    c.fillStyle = '#05090f'; c.beginPath(); c.moveTo(cx0 - 60, cy - 40); c.lineTo(cx1 + 40, cy - 70); c.lineTo(cx1 + 40, cy - 10); c.lineTo(cx0 - 60, cy + 16); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(cx0 - 60, cy + 16); c.lineTo(cx1 + 40, cy - 10); glow(c, C.cyan, 4, 24);
    // 灯带往下打的光
    c.save(); c.globalCompositeOperation = 'lighter'; const lb = c.createLinearGradient(0, cy, 0, 900); lb.addColorStop(0, 'rgba(62,230,255,.22)'); lb.addColorStop(1, 'rgba(62,230,255,0)'); c.fillStyle = lb; c.beginPath(); c.moveTo(cx0 - 60, cy + 16); c.lineTo(cx1 + 40, cy - 10); c.lineTo(cx1 + 160, 920); c.lineTo(cx0 - 200, 920); c.closePath(); c.fill(); c.restore();
    // 招牌「超充」＋闪电
    c.save(); c.font = '900 64px "PuHui-Black"'; c.fillStyle = C.white; c.shadowColor = C.cyan; c.shadowBlur = 26; c.fillText('超充', cx0 + 30, cy - 62); c.shadowBlur = 0; c.restore();
    c.save(); c.translate(cx0 - 16, cy - 108); c.fillStyle = C.orange; c.shadowColor = C.orange; c.shadowBlur = 18; c.beginPath(); [[14, 0], [-10, 34], [4, 34], [-6, 62], [22, 22], [8, 22], [16, 0]].forEach(([a, b], i) => i ? c.lineTo(a, b) : c.moveTo(a, b)); c.closePath(); c.fill(); c.restore();
    // 立柱与充电桩（3 根，屏幕青、状态环橙色呼吸）
    for (let i = 0; i < 3; i++) { const x = 1330 + i * 200, y0 = cy + 6 - i * 8, gy = 780 - i * 10;
      c.fillStyle = '#0a121c'; c.fillRect(x, y0, 26, gy - y0);
      const px = x + 60, ph = 210; c.fillStyle = '#0d1824'; c.beginPath(); c.roundRect(px, gy - ph, 58, ph, 10); c.fill();
      c.fillStyle = 'rgba(62,230,255,.85)'; c.shadowColor = C.cyan; c.shadowBlur = 16; c.fillRect(px + 10, gy - ph + 18, 38, 44); c.shadowBlur = 0;
      const br = 0.55 + 0.45 * Math.sin(t * 3 + i); c.beginPath(); c.arc(px + 29, gy - ph + 100, 11, 0, TAU); c.lineWidth = 4; glow(c, `rgba(255,138,31,${br})`, 4, 14);
      c.strokeStyle = '#1b2a3a'; c.lineWidth = 6; c.beginPath(); c.moveTo(px + 58, gy - ph + 120); c.quadraticCurveTo(px + 110, gy - 60, px + 70, gy - 30); c.stroke(); }
    // 湿地面上的竖向倒影：棚灯（青）
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 14; i++) { const x = 1200 + i * 52, gr = c.createLinearGradient(0, 860, 0, H); gr.addColorStop(0, 'rgba(62,230,255,.10)'); gr.addColorStop(1, 'rgba(62,230,255,0)'); c.fillStyle = gr; c.fillRect(x, 860, 10 + (i % 3) * 6, H - 860); }
    c.restore();
    // 车队（从远到近画）：电车，贯穿式尾灯带；最前面一辆停在桩前充电（线缆青色流光）
    const ev = (x, y, s, kind, hero) => {
      c.save(); c.globalAlpha = 0.22; c.translate(0, 2 * y); c.scale(1, -1); c.fillStyle = '#10202f'; c.fill(carPath(x, y, s, kind)); c.restore();   // 倒影
      c.fillStyle = hero ? '#0e1824' : '#0a121b'; c.fill(carPath(x, y, s, kind));
      c.save(); c.clip(carPath(x, y, s, kind)); const sh = c.createLinearGradient(0, y - 120 * s, 0, y); sh.addColorStop(0, 'rgba(62,230,255,.22)'); sh.addColorStop(0.5, 'rgba(62,230,255,0)'); c.fillStyle = sh; c.fillRect(x - 170 * s, y - 130 * s, 340 * s, 130 * s); c.restore();   // 顶部被棚灯打亮
      c.lineWidth = 1.6 * s + 0.6; c.strokeStyle = 'rgba(62,230,255,.6)'; c.stroke(carPath(x, y, s, kind));
      c.fillStyle = 'rgba(120,200,230,.12)'; c.fill(winPath(x, y, s, kind));
      wheels(c, x, y, s, '#04070b', '#1a2836');
      c.save(); c.globalCompositeOperation = 'lighter';
      c.fillStyle = C.red; c.shadowColor = C.red; c.shadowBlur = 18 * s + 4; c.fillRect(x - 160 * s, y - 58 * s, 30 * s, 5 * s); c.shadowBlur = 0;   // 贯穿尾灯（侧面看到的一截）
      c.fillStyle = C.white; c.shadowColor = C.white; c.shadowBlur = 14 * s; c.fillRect(x + 140 * s, y - 52 * s, 20 * s, 4 * s); c.shadowBlur = 0;   // 前灯带
      const rr = c.createRadialGradient(x - 160 * s, y + 4, 1, x - 160 * s, y + 4, 90 * s); rr.addColorStop(0, 'rgba(255,59,59,.28)'); rr.addColorStop(1, 'rgba(255,59,59,0)'); c.fillStyle = rr; c.fillRect(x - 260 * s, y - 20 * s, 200 * s, 70 * s);
      c.restore();
    };
    for (const q of [...Q].reverse()) ev(q.x, q.y, q.s, q.kind, false);
    // 主角车：停在第一根桩前，充电线青色流光
    const hx = 1520, hy = 930, hs = 1.25; ev(hx, hy, hs, 0, true);
    c.save(); c.lineWidth = 7; c.strokeStyle = '#13212f'; c.beginPath(); c.moveTo(1448, 640); c.bezierCurveTo(1500, 760, 1640, 760, 1690, hy - 70 * hs); c.stroke();
    c.setLineDash([18, 26]); c.lineDashOffset = -t * 120; c.lineWidth = 3; glow(c, C.cyan, 3, 14); c.setLineDash([]); c.restore();
    c.save(); c.font = '700 26px "PuHui-Bold"'; c.fillStyle = C.cyan; c.shadowColor = C.cyan; c.shadowBlur = 12; c.fillText('⚡ 充电中', hx - 80, hy - 190); c.restore();
    // HUD：四角框、左上数据、底部大字
    c.save(); c.strokeStyle = 'rgba(62,230,255,.7)'; c.lineWidth = 3; const m = 48, L = 60;
    for (const [x, y, dx, dy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]) { c.beginPath(); c.moveTo(x, y + dy * L); c.lineTo(x, y); c.lineTo(x + dx * L, y); c.stroke(); }
    c.font = '700 26px "PuHui-Bold"'; c.fillStyle = 'rgba(62,230,255,.85)'; c.fillText('国庆假期 · 流量峰值', 96, 120);
    c.font = '900 92px "PuHui-Black"'; c.fillStyle = C.white; c.shadowColor = C.cyan; c.shadowBlur = 20; c.fillText('1780', 92, 214); c.shadowBlur = 0;
    c.font = '700 36px "PuHui-Bold"'; c.fillStyle = C.white; c.fillText('万辆新能源车', 330, 210);
    c.font = '900 56px "PuHui-Black"'; c.fillStyle = C.orange; c.shadowColor = C.orange; c.shadowBlur = 16; c.fillText('×1.8', 96, 290); c.shadowBlur = 0;
    c.font = '700 26px "PuHui-Bold"'; c.fillStyle = 'rgba(232,246,255,.75)'; c.fillText('是日常的', 262, 284);
    // 条：日常 vs 国庆
    c.fillStyle = 'rgba(62,230,255,.25)'; c.fillRect(96, 312, 200, 10); c.fillStyle = C.orange; c.fillRect(96, 330, 360, 10);
    c.restore();
    // 扫描线
    c.save(); c.globalAlpha = 0.07; c.fillStyle = '#000'; for (let y = 0; y < H; y += 4) c.fillRect(0, y, W, 2); c.restore();
  }
  return { draw };
})();

// =====================================================================================
// B · 构成主义海报
// =====================================================================================
const B = (() => {
  const C = { paper: '#ebe1c6', red: '#c8231c', redD: '#8f1711', ink: '#151311', cream: '#f6efda' };
  const bg = () => P.cached('kfB_bg', W, H, g => {
    g.fillStyle = C.paper; g.fillRect(0, 0, W, H);
    const r = rng(5); for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(90,70,40,${r() * 0.06})`; g.fillRect(r() * W, r() * H, 2, 2); }
    // 斜红带（地面）
    g.fillStyle = C.red; g.beginPath(); g.moveTo(0, 820); g.lineTo(W, 520); g.lineTo(W, 760); g.lineTo(0, 1080); g.closePath(); g.fill();
    // 黑圆（「高峰」）
    g.fillStyle = C.ink; g.beginPath(); g.arc(1460, 300, 230, 0, TAU); g.fill();
    // 细线构件
    g.strokeStyle = C.ink; g.lineWidth = 6; g.beginPath(); g.moveTo(120, 140); g.lineTo(820, 140); g.stroke();
    g.lineWidth = 3; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(120, 180 + i * 18); g.lineTo(420 - i * 40, 180 + i * 18); g.stroke(); }
    g.fillStyle = C.red; g.fillRect(860, 110, 60, 60);
  });
  // 方块大字（用思源黑 Black 压扁＋旋转，模拟构成主义手绘方块字）
  const slab = (c, s, x, y, size, col, rot = 0, sx = 1) => { c.save(); c.translate(x, y); c.rotate(rot); c.scale(sx, 1); c.font = `900 ${size}px "PuHui-Black"`; c.fillStyle = col; c.fillText(s, 0, 0); c.restore(); };
  function draw(c, t) {
    c.drawImage(bg(), 0, 0);
    // 黑圆里白字「高峰」
    slab(c, '高峰', 1340, 340, 120, C.cream);
    // 红楔＝闪电，从左下刺入黑圆，母题：轻微往里推
    const k = 0.5 + 0.5 * Math.sin(t * 2.2), tip = [1310 + 20 * k, 300 + 8 * k];
    c.fillStyle = C.red; c.beginPath(); c.moveTo(980, 470); c.lineTo(tip[0], tip[1]); c.lineTo(1000, 410); c.closePath(); c.fill();
    c.strokeStyle = C.cream; c.lineWidth = 4; c.beginPath(); c.moveTo(1080, 420); c.lineTo(1040, 455); c.lineTo(1070, 452); c.lineTo(1030, 492); c.stroke();
    // 充电桩：粗黑几何柱＋红闪电（画在红带右端上）
    c.fillStyle = C.ink; c.fillRect(1640, 420, 120, 300); c.fillRect(1620, 700, 160, 30);
    c.fillStyle = C.cream; c.fillRect(1662, 450, 76, 60);
    c.fillStyle = C.red; c.beginPath(); [[1712, 540], [1680, 600], [1702, 600], [1690, 650], [1730, 584], [1708, 584], [1722, 540]].forEach(([a, b], i) => i ? c.lineTo(a, b) : c.moveTo(a, b)); c.closePath(); c.fill();
    // 黑剪影车队沿红带斜向排过去（越近越大），网点阴影
    const n = 7;
    for (let i = n - 1; i >= 0; i--) { const q = i / (n - 1), x = lerp(1450, 160, q), y = lerp(690, 1040, q) - 40, s = lerp(0.62, 1.15, q), kind = i % 3 === 1 ? 1 : 0, bob = Math.sin(t * 6 + i) * 1.5 * s;
      c.fillStyle = C.ink; c.fill(carPath(x, y + bob, s, kind)); wheels(c, x, y + bob, s, C.ink, C.red);
      c.fillStyle = C.cream; c.fill(winPath(x, y + bob, s, kind));
      c.save(); c.clip(carPath(x, y + bob, s, kind)); c.fillStyle = 'rgba(235,225,198,.18)'; for (let yy = y - 120 * s; yy < y; yy += 9 * s) for (let xx = x - 150 * s; xx < x + 150 * s; xx += 9 * s) { c.beginPath(); c.arc(xx, yy, 1.6 * s, 0, TAU); c.fill(); } c.restore(); }
    // 标语：竖排红黑大字＋小字
    slab(c, '一辆', 110, 400, 190, C.ink, -0.06, 0.92);
    slab(c, '一辆', 160, 590, 190, C.red, -0.06, 0.92);
    slab(c, '来！', 210, 780, 190, C.ink, -0.06, 0.92);
    c.save(); c.font = '700 34px "PuHui-Bold"'; c.fillStyle = C.ink; c.fillText('国庆高峰 · 新能源车 1780 万辆 · 日常的 1.8 倍', 120, 120); c.restore();
    // 旧纸颗粒
    c.drawImage(P.grain('kfB', 0.1, [60, 40, 20], 0.12), 0, 0);
  }
  return { draw };
})();

// =====================================================================================
// C · 新海诚黄昏
// =====================================================================================
const Cc = (() => {
  const HOR = 600;
  // 积雨云：一团圆的并集当体积；先铺背光的紫灰，再把同一组圆往太阳方向挪一点、裁在体积里铺受光的橙粉，最后一圈亮边；整体轻模糊，底部压平
  const cloud = (g, cx, cy, sc, seed, sun) => { const r = rng(seed), B = [];
    for (let i = 0; i < 70; i++) { const a = r() * Math.PI, d = Math.sqrt(r()); const x = cx + Math.cos(a) * 330 * sc * d * 1.3, y = cy - Math.sin(a) * 260 * sc * d * (0.6 + 0.4 * d) - r() * 40 * sc; B.push([x, Math.min(y, cy - 20 * sc), (34 + r() * 70) * sc * (1.2 - d * 0.5)]); }
    const mass = new Path2D(); for (const [x, y, rr] of B) { mass.moveTo(x + rr, y); mass.arc(x, y, rr, 0, TAU); }
    const base = new Path2D(); base.rect(cx - 520 * sc, cy - 400 * sc, 1040 * sc, 400 * sc);
    g.save(); g.filter = 'blur(3px)'; g.clip(base);
    g.fillStyle = '#6f6596'; g.fill(mass);
    const dx = (sun[0] - cx), dy = (sun[1] - cy), dl = Math.hypot(dx, dy) || 1, ox = dx / dl * 26 * sc, oy = dy / dl * 26 * sc - 10 * sc;
    g.save(); g.clip(mass); g.filter = 'blur(10px)';
    for (const [x, y, rr] of B) { const gr = g.createRadialGradient(x + ox, y + oy, rr * 0.1, x + ox, y + oy, rr * 1.05); gr.addColorStop(0, 'rgba(255,214,180,.95)'); gr.addColorStop(0.6, 'rgba(244,160,140,.55)'); gr.addColorStop(1, 'rgba(244,160,140,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x + ox, y + oy, rr * 1.05, 0, TAU); g.fill(); }
    const bot = g.createLinearGradient(0, cy - 120 * sc, 0, cy); bot.addColorStop(0, 'rgba(90,70,130,0)'); bot.addColorStop(1, 'rgba(70,55,110,.75)'); g.fillStyle = bot; g.fillRect(cx - 520 * sc, cy - 120 * sc, 1040 * sc, 120 * sc);
    g.restore(); g.restore(); };
  const bg = () => P.cached('kfC_bg', W, H, g => {
    const sk = g.createLinearGradient(0, 0, 0, HOR); sk.addColorStop(0, '#1e2f6b'); sk.addColorStop(0.45, '#5b5aa0'); sk.addColorStop(0.75, '#f08e7a'); sk.addColorStop(1, '#ffd29a'); g.fillStyle = sk; g.fillRect(0, 0, W, HOR);
    const SUN = [1180, 570]; cloud(g, 520, 470, 1.35, 4, SUN); cloud(g, 1560, 430, 0.95, 9, SUN); cloud(g, 1010, 520, 0.45, 12, SUN);
    // 太阳（地平线上偏右）＋光晕
    const sx = 1180, sy = HOR - 30; const sg = g.createRadialGradient(sx, sy, 10, sx, sy, 520); sg.addColorStop(0, 'rgba(255,248,220,1)'); sg.addColorStop(0.08, 'rgba(255,224,170,.95)'); sg.addColorStop(0.4, 'rgba(255,170,120,.35)'); sg.addColorStop(1, 'rgba(255,170,120,0)'); g.fillStyle = sg; g.fillRect(0, 0, W, HOR + 80);
    // 远山
    g.fillStyle = '#5c4a7a'; g.beginPath(); g.moveTo(0, HOR); [[160, HOR - 60], [360, HOR - 30], [560, HOR - 90], [760, HOR - 40], [980, HOR - 70], [1300, HOR - 30], [1600, HOR - 80], [1920, HOR - 40]].forEach(p => g.lineTo(...p)); g.lineTo(W, HOR); g.closePath(); g.fill();
    // 地面：暖色反光的沥青
    const gg = g.createLinearGradient(0, HOR, 0, H); gg.addColorStop(0, '#6a4a64'); gg.addColorStop(0.3, '#3a2c44'); gg.addColorStop(1, '#1a1426'); g.fillStyle = gg; g.fillRect(0, HOR, W, H - HOR);
  });
  const Q = queue(10, [1150, 930], [180, 660], 1.0, 0.3, 21);
  function draw(c, t) {
    c.drawImage(bg(), 0, 0);
    // 丁达尔光束（从太阳斜射，缓慢呼吸）
    c.save(); c.globalCompositeOperation = 'lighter'; const sx = 1180, sy = 570;
    c.filter = 'blur(14px)'; for (let i = 0; i < 5; i++) { const a = -2.35 - i * 0.17 + Math.sin(t * 0.3 + i) * 0.01, len = 1300, w = 0.04 + (i % 2) * 0.02;
      const gr = c.createLinearGradient(sx, sy, sx + Math.cos(a) * len, sy + Math.sin(a) * len); gr.addColorStop(0, 'rgba(255,220,170,.10)'); gr.addColorStop(1, 'rgba(255,220,170,0)'); c.fillStyle = gr;
      c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + Math.cos(a - w) * len, sy + Math.sin(a - w) * len); c.lineTo(sx + Math.cos(a + w) * len, sy + Math.sin(a + w) * len); c.closePath(); c.fill(); }
    c.filter = 'none'; c.restore();
    // 服务区充电棚（逆光剪影＋棚下暖灯）
    c.fillStyle = '#2a2038'; c.beginPath(); c.moveTo(1230, 330); c.lineTo(1920, 300); c.lineTo(1920, 352); c.lineTo(1230, 368); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,214,150,.9)'; c.fillRect(1240, 366, 680, 4);
    c.save(); c.globalCompositeOperation = 'lighter'; const lb = c.createLinearGradient(0, 368, 0, 900); lb.addColorStop(0, 'rgba(255,200,140,.2)'); lb.addColorStop(1, 'rgba(255,200,140,0)'); c.fillStyle = lb; c.filter = 'blur(18px)'; c.beginPath(); c.moveTo(1240, 368); c.lineTo(1920, 368); c.lineTo(1920, 900); c.lineTo(1120, 900); c.closePath(); c.fill(); c.filter = 'none'; c.restore();
    c.font = '900 52px "PuHui-Black"'; c.fillStyle = '#fff3dc'; c.fillText('超充站', 1290, 318);
    for (let i = 0; i < 3; i++) { const x = 1360 + i * 190; c.fillStyle = '#251c33'; c.fillRect(x, 368, 22, 480); c.beginPath(); c.roundRect(x + 50, 650, 54, 190, 8); c.fill(); c.fillStyle = 'rgba(130,230,255,.85)'; c.fillRect(x + 60, 668, 34, 38); }
    // 车队：逆光剪影＋受光边（橙）＋尾灯连成红线
    for (const q of [...Q].reverse()) { const { x, y, s, kind } = q;
      c.fillStyle = '#1d1629'; c.fill(carPath(x, y, s, kind));
      c.save(); c.clip(carPath(x, y, s, kind)); const rim = c.createLinearGradient(x + 60 * s, 0, x + 160 * s, 0); rim.addColorStop(0, 'rgba(255,170,110,0)'); rim.addColorStop(1, 'rgba(255,190,130,.75)'); c.fillStyle = rim; c.fillRect(x - 160 * s, y - 130 * s, 320 * s, 130 * s); c.restore();
      c.fillStyle = 'rgba(255,200,160,.18)'; c.fill(winPath(x, y, s, kind));
      wheels(c, x, y, s, '#120d1a');
      c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = '#ff4a3a'; c.shadowColor = '#ff4a3a'; c.shadowBlur = 22 * s + 4; c.fillRect(x - 152 * s, y - 60 * s, 14 * s, 8 * s); c.restore(); }
    // 光粒
    c.save(); c.globalCompositeOperation = 'lighter'; const r = rng(31);
    for (let i = 0; i < 70; i++) { const x = (r() * W + t * (10 + r() * 20)) % W, y = 200 + r() * 700 - (t * 8 * r()) % 60, rr = 1 + r() * 3; c.fillStyle = `rgba(255,236,200,${0.25 + 0.5 * Math.abs(Math.sin(t * 1.5 + i))})`; c.beginPath(); c.arc(x, y, rr, 0, TAU); c.fill(); }
    c.restore();
    // 一行字（电影字幕感，左下）
    c.save(); c.font = '700 44px "PuHui-Bold"'; c.fillStyle = '#fff3e4'; c.shadowColor = 'rgba(40,20,60,.6)'; c.shadowBlur = 12; c.fillText('国庆的高速上，再快的桩也得一辆一辆来。', 110, 980); c.restore();
  }
  return { draw };
})();

SCENES['kf_cyber'] = { draw: (c, lt, t) => A.draw(c, lt) };
SCENES['kf_poster'] = { draw: (c, lt, t) => B.draw(c, lt) };
SCENES['kf_dusk'] = { draw: (c, lt, t) => Cc.draw(c, lt) };
})();
