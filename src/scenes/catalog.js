const definitions = [
  ['sahara', '撒哈拉岩画', 'Saharan Rock Art', '约前 4000', '#d9bc8d', '#654c36', '#a15f3c'],
  ['egypt', '埃及壁画', 'Egyptian Wall Painting', '约前 1300', '#e2d0a3', '#514632', '#967045'],
  ['han', '汉画像石拓片', 'Han Stone Rubbing', '约 100', '#303b38', '#efe9d5', '#c5b689'],
  ['tang', '唐代白描', 'Tang Line Drawing', '约 750', '#f0eadc', '#414b44', '#a57b5d'],
  ['song', '宋代山水', 'Song Landscape', '约 1000', '#ebe5d2', '#41584d', '#83917d'],
  ['qingming', '清明上河图', 'Qingming Riverside', '约 1100', '#e9dfc7', '#59604b', '#aa8060'],
  ['maya', '玛雅抄本', 'Maya Codex', '约 1200', '#decba6', '#584b3a', '#a05c44'],
  ['mughal', '莫卧儿细密画', 'Mughal Miniature', '约 1600', '#d7dfc6', '#455c4c', '#a58242'],
  ['bada', '八大山人写意', 'Bada Shanren Ink', '约 1690', '#eeeade', '#3e4540', '#9b574d'],
  ['wayang', '爪哇皮影戏', 'Wayang Kulit', '约 1800', '#dfc591', '#574931', '#94643c'],
  ['ukiyo', '浮世绘', 'Ukiyo-e', '1830s', '#c9d8cd', '#395456', '#ab7251'],
  ['starry', '星月夜', 'Starry Night', '1889', '#293e54', '#e5dcb6', '#d3b05e'],
  ['scream', '呐喊', 'The Scream', '1893', '#bf866a', '#493f3d', '#e8c492'],
  ['nosferatu', '诺斯费拉图', 'Nosferatu', '1922', '#99998d', '#303b38', '#666b5a'],
  ['scope', '示波器矢量图', 'Oscilloscope Vector', '1950s', '#182b25', '#a6d5a6', '#76ad82'],
  ['pixel', '8-bit 像素游戏', '8-bit Cycling', '1980s', '#b8cbb5', '#364d48', '#bd985c'],
  ['chat', '早期聊天窗口', 'Early Chat Window', '2000s', '#cdd6d6', '#495c64', '#829baa'],
  ['vaporwave', '蒸汽波', 'Vaporwave', '2010s', '#d4bdcf', '#61556c', '#8f7da7'],
  ['vertical', '竖屏短视频', 'Vertical Short Video', '2020s', '#e0cbb7', '#524942', '#a56e58'],
  ['code', '代码美学', 'Code Aesthetics', '2020s · 大模型时代', '#283c3d', '#e6e6d4', '#92bcaa'],
];

export const SCENES = Object.freeze(definitions.map(([id, zh, en, era, paper, ink, accent], index) => Object.freeze({
  id, zh, en, era, index, number: index + 1, paper, ink, accent,
  start: 5 + index * 6, duration: 6, status: ['sahara', 'song', 'vertical'].includes(id) ? 'study' : 'placeholder',
  updateHz: ['wayang', 'pixel', 'chat'].includes(id) ? 10 : null,
})));
