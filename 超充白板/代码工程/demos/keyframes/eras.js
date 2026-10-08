// 选风格用的三张关键帧：同一个画面「国庆高速服务区，一排车在超充桩前排队」，三种画风。
//   渲染 render.py --film demos/keyframes --solo kf_cyber --stills 1.5 --no-counter --out ...
window.PUNCH = 0;
window.SCENE_LIBS = ['demos/keyframes/frames.js'];
window.ERAS = [
  { id: 'kf_cyber', dur: 4 },
  { id: 'kf_poster', dur: 4, transition: { type: 'cut', dur: 0.01 } },
  { id: 'kf_dusk', dur: 4, transition: { type: 'cut', dur: 0.01 } },
];
