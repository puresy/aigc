// 白板手绘解说（y3 RSA 型）「超充功率卷到新境界，高峰补能为什么还是慢」——口播约 111s，一整块大白板＋相机跟着口播走。
//   预览 index.html?film=demos/chaochong   渲染 render.py --film demos/chaochong --fps 30 --out 成片.mp4 --audio 口播.wav
// 段只是给 qa 分镜用的：所有段画的都是同一块白板（board.js 的 CC.shot），转场全是 same（相机运动本身就是转场）。
window.PUNCH = 0;
window.SCENE_LIBS = ['demos/chaochong/board.js'];
// 口播时间轴先同步读进来（段边界要用）
{ const x = new XMLHttpRequest(); x.open('GET', 'demos/chaochong/timing.js', false); x.send(); (0, eval)(x.responseText); }
// 段边界 = 每块板相机到位的时刻（board.js 的 BLOCKS 首句起点），和 board.js 里的 ARRIVE 一致
window.FILM_DURATION = 113.9;
(() => {
  const L = window.VO.lines, at = i => L[i].at;
  const FIRST = [0, 3, 5, 8, 11, 13, 15, 18, 23, 26, 30, 33, 36, 38];   // 每块板的首句（与 board.js 一致）
  const LATE = { 33: 0.35 };                                               // 与 board.js 的 late 一致（第 12 块晚到）
  const starts = [0, ...FIRST.slice(1).map(i => at(i) - 0.45 + (LATE[i] || 0)), 110.95];    // 相机开始移向这块板的时刻；最后一段 = 拉远看全图
  window.ERAS = starts.map((s, k) => ({ id: k < FIRST.length ? `cc_b${String(k + 1).padStart(2, '0')}` : 'cc_end',
    dur: (k + 1 < starts.length ? starts[k + 1] : window.FILM_DURATION) - s, ...(k ? { transition: { type: 'same', dur: 0.6 } } : {}) }));
})();
