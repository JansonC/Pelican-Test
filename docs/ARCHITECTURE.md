# 绘制接口

## 时间

`src/beat/timeline.js` 是帧、播放器与音频共享的时间源，单位为秒。
`locate(t)` 区分 Intro、20 幕与 Outro。所有边界使用 `[start, end)`；
最终 `t=137` 返回 Outro 的最后状态。`beatAt(t)` 包含两拍弱起。

## 场景

`src/scenes/catalog.js` 存放稳定的 id、双语名、年代、时间范围、色票和制作状态。
每幕文件导出 `scene` 与 `renderAt(ctx, frame)`：

```js
export function renderAt(ctx, { t, localT, pose }) {
  // ctx 已由主合成器放置到 1000×1000 局部空间。
  // t 是全片绝对秒数；localT 是本幕秒数；pose 是确定性的骨骼数据。
}
```

主合成器扩展画芯外的底材、画框与道路，处理 16:9 构图及镜头。尚未制作的幕继续使用默认道路和骑手。
正式场景导出 `finished = true`，自行绘制地材与道路，并可实现以下接口：

```js
export function prepare({ brush }) { /* 字体、笔触就绪后，缓存静态材料。 */ }
export function cameraAt(localT) { return { zoom: 1, riderScale: 1 }; }
export function renderRider(ctx, pose, { x, y, scale, t, localT }) { /* 独立风格造型。 */ }
export function renderTitle(ctx, { x, t, localT }) { /* 不随局部推镜缩放。 */ }
export function poseTimeAt(t, localT) { return t; } // 可选的角色时间映射
```

画芯仍为 1000×1000，底材可延展至 `x=-500…1500`。合成器提供共享骨骼，
在每个画框内绕轮胎接地点缩放场景和骑手；轮轴为 `ROAD_Y - 73 * riderScale`。
这使宋画先显出巨峰与微小旅人，再推近找到骑手。比例变化从整车入框后开始，
并在长喙到达出口前恢复共同尺度，避免画框两侧出现大小不一致的半辆自行车。
局部镜头不会移动画框或相邻场景。双语标题在画框裁剪内保持输出尺寸。

`poseTimeAt` 只映射传给共享骨骼的角色时间；埃及壁画的第二小节短暂停格后追上原时间，
世界位移、画框、标题和镜头仍使用原始时间。邻幕使用各自的姿态映射，出口前须回到共同相位。
`renderRider` 同时接收原始 `t`／`localT`，可用于飘带等非关节运动，不能从上次 `renderAt` 存取时间。
场景可导出 `TITLE_GLYPHS`（或已有的 `UI_GLYPHS`）列出新增画内文字，入口在资源 ready 前统一加载。

竖屏收窄在 `src/main/presentation.js` 中计算，稳定画幅为 562.5×1000（9:16），
两侧绘制不透明黑边；进出时平滑改变可见宽度和跟随锚点。竖屏场景的
`renderOverlay(ctx, { t })` 绘制屏幕坐标中的虚构界面，进度在绝对时间 119 秒达到 1。
收窄期间的骑手缩放同时应用于画框两侧的风格，轮轴、踏板和轮胎接地点连续。

## 确定性与缓存

场景内不读取 `Date.now()`、`performance.now()`、p5 `frameCount` 或无种子的随机数。
纹理以固定种子提前生成。用于图像的播放状态和墙钟只存在于 `src/main/index.js`；
最终帧仅取决于时间、已加载字体和固定资源。

`src/main/presentation.js` 提供纯函数 `outroCameraAt`、`outroCaptionAt` 与展墙布局。
结尾第一小节拉出到完整 7×3 展墙，第二、三小节推向空席位，第四小节停稳并显示第二句字幕；
镜头在最后三小节保持不动。发布会完整图像位于字幕带上方，最后一拍的骑手与车铃使用同一事件时间。
展墙高光时刻由场景目录的 `highlight` 指定，避免代码幕尚未展开完整就被截作定格。
代码幕的屏显 SVG 与骑手绘制使用相同的路径列表；动态脚踏和轮辐直接序列化共享姿势数据。

皮影、像素、聊天的姿势时间按 10 Hz 量化；道路、世界位移与镜头仍由原始时间计算。
示波器等后续效果需要从 `t - offset` 重建历史采样，不能依赖累积上一帧。

## 浏览器与离线工具

浏览器主画布为 p5 WEBGL，二维合成在离屏画布完成，再映射到主画布。
p5.brush 的 HB、charcoal 和 2B 笔触通过独立适配器渲染，读取为透明浓度遮罩，
在岩壁擦痕、地线、山石和墨脊中重复取样。`src/kit/materials.js` 提供固定噪声、
砂岩、宣纸、纤维、颜料侵蚀和笔触染色；`src/kit/ink.js` 提供墨线、晕染和苔点。
材料共享，具体山势、轮廓与皴法由场景负责。所有昂贵静态层在预览 ready 之前完成，
动态颜料缓冲区每帧清空重画，避免帧间遗留状态。Outro 缩略图从已准备好的场景产生。
导出程序等待字体和绘制模块准备完成，调用 `window.pelican.renderAt(t)`，
只截取 1920×1080 画布区域。`tools/render.mjs` 的 manifest 保存帧率、时间范围和源码指纹。
工具启动的临时 Vite 服务关闭热更新，避免资源就绪后被并行保存或依赖预构建重新导航。
逐帧 PNG 直接读取已提交的主画布，减少浏览器截图的等待；最终验收逐幕与实际页面截图做逐像素比对。
常规 `npm run dev` 仍保留热更新。批次 A／B 的视觉复查和合辑导出还会对比开始／结束源码指纹。
批次 B 复查额外在固定本地位置绘制整套皮影，比较同一个 10 Hz 时隙与下一时隙，
确认操纵杆和轮相一起保持／更新，并用完整画面检查世界位移仍然平滑。
批次 B／C／D 合辑工具在存在同版本验收记录时，将实际导出帧与验收截图逐像素比对。诺斯费拉图场景导出 `shadowOutlineAt(localT, pose)`，示波器导出 `scopeOutlineAt(localT, pose)`，合成器在 89 秒边界按同一姿态重建 14→15 通电轮廓；两幕都不依赖上一帧状态。

## 音频

`audio/score.js` 只包含数据与纯函数，和 Node 工具、浏览器都兼容；
`audio/instruments.js` 把事件转换为固定种子的单音 PCM；`audio/wav.js` 编码立体声 PCM16。
`audio/engine.js` 是浏览器 Web Audio 模块，实时和离线共用音符缓冲、路由与乐谱，不能导入 Node API。
Node 导出入口为 `tools/audio.mjs`，通过无头浏览器运行 `OfflineAudioContext`。

`src/beat/events.js` 管理音画同步点和蒸汽波速度、位置积分、半拍跳针；场景与音频共同读取。
事件包含绝对 `time`、`duration`、`end`、`instrument`、`midi`、`gain`、`pan`、`role`，
芯片事件另外指定四个独立且单声部的 `channel`。所有事件尾音受当前幕的 `end` 限制。
共享混响在像素幕与蒸汽波幕静音；蒸汽波使用预先合成、变速的独立湿声缓冲。
Outro 的音乐与混响一起淡出，最后车铃走独立通道。

播放状态留在 `src/main/index.js` 与传输对象中。画面读取音频输出时钟，
暂停清除前瞻调度和声源；跳转按目标位置重新调度持续音；静音不改变播放位置。
首次播放准备磁带缓冲，并由 `audio/synth-worker.js` 在后台线程合成单音；
音符缓冲按乐谱实时调度，避免重建齐奏时阻塞主线程或错过起音。
离线分段先从五秒前重建信号，再按整数采样裁切；验证工具与全长 WAV 对比误差。
源码指纹包含 `audio/*.js`，因此不能把旧版音乐与新版图像混合恢复导出。

## 最终交付

`tools/final-review.mjs` 验证全部关键画面、边界、题签、确定性及全屏／手机布局。
`tools/final-demo.mjs` 依序构建、复用或生成同指纹音轨与验收记录、完整渲染、编码与解码核对，
并通过 Vite 的生产预览实际验证字体、音色 Worker 和片尾停止。交付目录为 `out/final/`。
最终编码复用阶段 4 的音画相关性检查，所有版本默认保持 137 秒、1080p、30 fps 与 48 kHz 立体声。

## 文件职责

- `PLAN.md`：创作要求、分阶段计划与验收范围。
- `docs/STATUS.md`：当前阶段、实际完成项与验证结果。
- `briefs/`：逐幕美术设计。
- `AGENTS.md`：稳定的仓库协作约定。
