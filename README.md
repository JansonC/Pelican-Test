# 鹈鹕测试 · The Pelican Test

一只鹈鹕沿连续道路骑车，穿过画框，在二十个时代与画风之间旅行。所有画面用代码绘制，音频采用程序合成。

当前提供阶段 3 批次 A 的无声预览：新增埃及壁画、汉画像石拓片、唐代白描、清明上河图，连同阶段 2 的三幕共完成七幕美术，其余 13 幕保留标名占位。完整时间轴仍为 137 秒；后续批次与音乐依 [PLAN.md](PLAN.md) 分阶段制作。

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

三幕分别位于 5–11、29–35、113–119 秒。`?t=30.6` 可查看宋画宽景，`?t=32.15` 查看推近后的骑手。
阶段 2 的单独复查命令：

```powershell
npm run review:stage2
npm run sheet -- --times "5.5,7,7.8,10.5,29.5,30.6,32.15,34.5,113.5,115.8,116.5,118.5" --cols 4 --out out/stage2/contact-sheet.png
npm run demo:stage2
```

`review:stage2` 导出 5 张全尺寸关键帧和播放器截图，检查乱序跳转、9:16 黑边并记录绘制耗时。
`demo:stage2` 默认以 30 fps 导出三段各 7 秒、含相邻画框的无声 MP4，再合成
`out/stage2/three-studies.mp4`。这是阶段验收样片帧率；最终成片帧率仍可单独选择。
添加 `--resume` 可复用源码指纹一致的导出帧；`--overwrite` 可重编码已有样片。
源码改变后使用新的 `--tag`（例如 `--tag stage2-final`）保留旧帧并创建新导出目录。
该命令同时从导出帧生成三幕接触表和过框边界表；也可为 `sheet` 提供
`--frames frames/stage2-sahara-30,frames/stage2-song-30,frames/stage2-vertical-30`，
以现有逐帧文件制表。此模式要求采样时刻位于实际帧网格上。

阶段 3 批次 A 的四幕分别位于 11–17、17–23、23–29、35–41 秒。
17 幕独立美术简报已准备，场景继续按批次验收。批次 A 的复查与短片命令：

```powershell
npm run review:stage3-a
npm run demo:stage3-a
```

`review:stage3-a` 检查四幕各入场／高光／离场的乱序跳转确定性，输出 12 张全尺寸图、
接触表、24 张事件图的总表、6 个边界的前中后三帧、播放器截图及绘制提交耗时。
产物位于 `out/stage3-a/`。`?t=14`、`?t=20`、`?t=26`、`?t=38` 分别定位四幕高光。

`demo:stage3-a` 以 30 fps 导出四段各 7 秒的无声 MP4，包含前后各半秒的相邻画框；
合辑为 `out/stage3-a/batch-a.mp4`（28 秒），独立片段为 `egypt.mp4`、`han.mp4`、
`tang.mp4`、`qingming.mp4`。命令自动检查分辨率、帧数、片长并完整解码，记录于
`export-verification.json`，同时从实际导出帧生成 `contact-sheet.png`、四幕高光总览
`highlights.png` 和 `boundaries.png`。支持 `--fps 60`、`--tag`、`--resume`、`--overwrite`，
恢复时必须保持源码指纹一致；源码改变后用新的 tag 保留旧帧。

本轮导出帧位于 `frames/stage3-a-delivery-*-30/`，恢复与重编码命令：

```powershell
npm run demo:stage3-a -- --tag stage3-a-delivery --resume --overwrite
```

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
src/scenes/    每幕一个文件，7 幕正式美术与 13 幕标名占位
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
