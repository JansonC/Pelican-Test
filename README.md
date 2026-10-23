# 鹈鹕测试 · The Pelican Test

一只鹈鹕沿连续道路骑车，穿过画框，在二十个时代与画风之间旅行。所有画面用代码绘制，音频采用程序合成。

当前提供无声骨架预览。二十幕均明确标记为画风占位；正式美术与音乐依 [PLAN.md](PLAN.md) 分阶段制作。

## 环境与启动

- Node **22.12+**，推荐 24 LTS；当前固定版本的 Puppeteer 需要 Node 22.12+。
- Google Chrome；自定义安装位置通过 `CHROME_PATH` 指定。
- ffmpeg / ffprobe 需在 PATH 中；编码工具也支持 `FFMPEG_PATH`。
- npm 缓存在项目 `.cache/npm/`，无需写入用户全局缓存。

```powershell
npm ci
npm run doctor
npm run dev
```

打开 <http://127.0.0.1:5173>。空格播放/暂停，左右方向键前后移动半秒；底部进度条、年代按钮与下拉列表均可跳转。预览默认暂停。

```powershell
npm test
npm run check
npm run build
npm run smoke
```

`smoke` 启动无头 Chrome 验证 20 幕、中文字体、p5.brush 笔触、随机跳转的确定性、播放控制与移动端布局，并生成 `out/preview.png` 和 `out/verification/smoke.json`。导出工具自动启动并关闭临时开发服务器。

## 截图、接触表与视频

```powershell
npm run shot -- --time 3.5 --out out/intro.png
npm run sheet -- --out out/contact-sheet.png
npm run sheet -- --times "10.9,11,11.1,88.9,89,89.1,126.5,133,136.9" --cols 3 --out out/boundaries.png

npm run render -- --fps 30 --from 9 --to 13 --out frames/motion-30
npm run encode -- --frames frames/motion-30 --out out/motion-30.mp4
npm run render -- --fps 60 --from 9 --to 13 --out frames/motion-60
npm run encode -- --frames frames/motion-60 --out out/motion-60.mp4

npm run render -- --fps 30 --out frames/full-30
npm run encode -- --frames frames/full-30 --out out/pelican-silent.mp4
```

时间范围使用半开区间 `[from, to)`。`--from`、`--to` 的单位为秒，帧文件名使用全片绝对帧号。完整视频长 137 秒，对应 30 fps 的 4,110 帧或 60 fps 的 8,220 帧。

渲染中断后，以完全相同的参数添加 `--resume` 继续；工具会检查源码指纹、时间范围和帧率，避免混合不同版本画面。编码默认不覆盖已有视频，需要时显式传 `--overwrite`。可用 `--audio out/audio/mix.wav` 合成音轨；当前未制作音频。

预览与截图均通过 `window.pelican.renderAt(t)` 绘制，资源就绪以 `window.pelican.ready` 为准。`?t=32` 可以直接定位；`?export=1&t=32` 隐藏界面并固定为 1920×1080。

## 目录

```text
src/kit/       绘图、材质、固定随机数与 p5.brush 接入
src/beat/      节拍、时长、场景定位与帧时间
src/rig/       骨骼姿势、两段腿部求解与骨架绘制
src/scenes/    每幕一个文件，当前使用明确标注的占位绘制
src/main/      播放器、合成、道路、镜头、Intro 与 Outro
tools/         环境检查、截图、接触表、逐帧渲染、编码与浏览器验证
test/          时间边界、分段帧序列与踩踏约束验证
briefs/        场景美术简报
audio/         程序合成音频
docs/          接口说明、阶段状态
public/        原创静态资源及第三方许可文本
```

协作约定见 [AGENTS.md](AGENTS.md)，接口见 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)，进度与验证记录见 [docs/STATUS.md](docs/STATUS.md)。计划与实现步骤不放入 AGENTS.md。

## 来源与许可

本项目独立编写，没有 fork 或复制参考项目源码，没有使用其视频、封面、渲染帧、音频、美术简报或构图。制作方法参考 [《67：一部藝術史》](https://github.com/Tunai-0511/meme67-art-history)，相关文档阅读记录见 PLAN.md。

第三方代码、字体及许可文本见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。项目暂未选择自身源码与成片的对外发布许可；`private: true` 防止误发布 npm 包。
