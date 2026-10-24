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
常规 `npm run dev` 仍保留热更新。批次 A／B 的视觉复查和合辑导出还会对比开始／结束源码指纹。
批次 B 复查额外在固定本地位置绘制整套皮影，比较同一个 10 Hz 时隙与下一时隙，
确认操纵杆和轮相一起保持／更新，并用完整画面检查世界位移仍然平滑。
批次 B 合辑工具在存在同版本验收记录时，将实际导出帧与 12 张验收截图逐像素比对。

## 文件职责

- `PLAN.md`：创作要求、分阶段计划与验收范围。
- `docs/STATUS.md`：当前阶段、实际完成项与验证结果。
- `briefs/`：逐幕美术设计。
- `AGENTS.md`：稳定的仓库协作约定。
