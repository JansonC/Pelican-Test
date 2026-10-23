# 绘制接口

## 时间

`src/beat/timeline.js` 是帧、播放器与音频共享的时间源，单位为秒。
`locate(t)` 区分 Intro、20 幕与 Outro。所有边界使用 `[start, end)`；
最终 `t=137` 返回 Outro 的最后状态。`beatAt(t)` 包含两拍弱起。

## 场景

`src/scenes/catalog.js` 存放稳定的 id、双语名、年代、时间范围和占位色票。
每幕文件导出 `scene` 与 `renderAt(ctx, frame)`：

```js
export function renderAt(ctx, { t, localT, pose }) {
  // ctx 已由主合成器放置到 1000×1000 局部空间。
  // t 是全片绝对秒数；localT 是本幕秒数；pose 是确定性的骨骼数据。
}
```

主合成器扩展画芯外的底材、画框与道路，处理 16:9 构图及镜头。
骨架预览中的骑手与道路由合成器统一绘制；正式画风接入时将骑手绘制委托给场景，
继续使用相同姿势数据和车轮接地点。

## 确定性与缓存

场景内不读取 `Date.now()`、`performance.now()`、p5 `frameCount` 或无种子的随机数。
纹理以固定种子提前生成。播放状态和墙钟只存在于 `src/main/index.js`；
最终帧仅取决于时间、已加载字体和固定资源。

皮影、像素、聊天的姿势时间按 10 Hz 量化；道路、世界位移与镜头仍由原始时间计算。
示波器等后续效果需要从 `t - offset` 重建历史采样，不能依赖累积上一帧。

## 浏览器与离线工具

浏览器主画布为 p5 WEBGL，二维合成在离屏画布完成，再映射到主画布。
p5.brush 的 WEBGL 笔触先通过独立适配器验证并缓存，避免动态帧间遗留状态。
导出程序等待字体和绘制模块准备完成，调用 `window.pelican.renderAt(t)`，
只截取 1920×1080 画布区域。`tools/render.mjs` 的 manifest 保存帧率、时间范围和源码指纹。

## 文件职责

- `PLAN.md`：创作要求、分阶段计划与验收范围。
- `docs/STATUS.md`：当前阶段、实际完成项与验证结果。
- `briefs/`：逐幕美术设计。
- `AGENTS.md`：稳定的仓库协作约定。
