# 项目状态

2026-10-23，用户授权按 PLAN.md 初始化工程。

第一、二阶段已进入历史记录。2026-10-24 用户授权按 PLAN.md 使用子代理制作第三阶段批次 A：埃及壁画、汉画像石拓片、唐代白描、清明上河图。完整 137 秒时间轴保留，当前无声；本轮完成 A 批后停止。

## 第一阶段 · 已建立

- 固定依赖、项目缓存、构建配置、中文字体、长期协作约定。
- 137 秒时间轴、20 个独立场景入口、会踩踏的鹈鹕与自行车。
- 连续道路与画框、Intro 字幕、7×3 展墙与空席位 Outro。
- 播放/暂停、拖动、年代跳转、全屏与截图入口。
- 截图、接触表、逐帧导出、断点恢复与 ffmpeg 编码工具。

## 第一阶段 · 验证结果

- `npm test`：3 项通过，覆盖全部场景边界强拍、30/60 fps 分段帧序列与踩踏几何约束。
- `npm run check`：42 个 JavaScript 模块语法通过。
- `npm run doctor`：Node、Chrome、ffmpeg 与 ffprobe 可用。
- `npm run build`：生产构建通过；p5 主依赖较大，保留 Vite 的体积提示。
- `npm run smoke`：20 幕 1080p 非空画面、p5.brush 笔触、乱序跳转的逐像素一致性、Outro 一致性、播放/暂停、拖动、版块选择及手机宽度布局通过。
- 已人工查看播放器截图和全部 26 张关键帧的接触表。
- 已导出并编码相同 9–13 秒片段：30 fps 为 120 帧，60 fps 为 240 帧；ffprobe 确认均为 1920×1080、4.000 秒，帧率准确。
- 在第 9、11、12.5 秒，30/60 fps 导出对应帧逐像素一致。
- 已对完成的 30 fps 任务执行 `--resume`，校验并复用帧成功。
- 依赖安装审计及运行时依赖审计均为 0 个已知漏洞（以此次安装结果为准）。

## 第一阶段 · 可查看的产物

- `out/preview.png`：完整播放器截图。
- `out/contact-sheet.png`：Intro、20 幕、Outro，共 26 张关键帧。
- `out/motion-30.mp4`、`out/motion-60.mp4`：相同过框片段的帧率对照。
- `out/verification/smoke.json`：浏览器验证及逐幕图像哈希。
- `frames/motion-30/manifest.json`、`frames/motion-60/manifest.json`：导出参数、源码指纹与完成状态。

生成文件已被 Git 忽略，可按 README 中的命令复现。137 秒内容可在浏览器完整播放；第一阶段只编码了对照短片，没有渲染全长 MP4。

## 环境决定

预览原先要求 Node 20+。当前固定的 Puppeteer 25.16.0 要求 Node 22.12+；
为避免旧版本的已知依赖问题，初始化统一采用 Node 22.12+，本机 Node 24.10.0 可用。

正式输出帧率仍待选择；阶段 2 验收样片采用 30 fps。第一阶段交付时所有画风均为占位。

第一阶段已经验收，以下是第二阶段新增记录。

## 阶段 2 · 三幕精做

- 三份原创美术简报位于 `briefs/01-sahara.md`、`briefs/05-song.md`、`briefs/19-vertical.md`。
- 撒哈拉：风化砂岩、层理与裂隙、侵蚀赭石颜料；长角牛与牧人在第二小节停步并围观，骑手采用独立的岩画剪影。
- 宋画：多层峰峦、短皴、墨脊、淡墨远山、留白瀑布、溪岸树石；宽景中骑手极小，第二小节推近找到，出框前恢复共同尺度。
- 竖屏：真实 9:16 画幅与黑边；虚构 App「沿途」、原创滨河街景、独立现代插画骑手；点赞与评论踩拍出现，进度在第 119 秒走满。
- 共用材料：p5.brush 的 HB、charcoal、2B 笔触缓存；固定砂岩噪声、颜料缺损、宣纸纤维、墨色颗粒、飞白、墨边与苔点。
- 场景拥有道路、骑手与标题绘制；合成器负责局部镜头、道路接地点、画框与竖屏收窄。所有静态层在 ready 前准备，动态缓冲每帧清空。
- 未新增第三方依赖，未取用外部图像、音频或参考仓库代码。`AGENTS.md` 未修改。

阶段 2 的复查入口是 `npm run review:stage2`，短片入口是 `npm run demo:stage2`。
关键帧、接触表、视频和检查记录统一位于 `out/stage2/`，最终导出帧及源码指纹位于 `frames/stage2-final-*-30/`。

### 第二阶段验证

- `npm test`：5 项通过，新增宋画搜索镜头、整车过框前后的共同尺度、9:16 画幅和第 119 秒进度终点约束。
- `npm run check`：48 个 JavaScript 模块通过；`git diff --check` 通过。
- `npm run build`：生产构建通过，保留 p5 主依赖的体积提示。
- `npm run review:stage2`：5 个关键时刻乱序跳转后逐像素一致；竖屏黑边不透明；生成全尺寸关键帧、播放器截图与 `verification.json`。
- `npm run smoke`：最终版本 20 幕、1080p 非空输出、p5.brush、Outro、跳转确定性、播放/暂停、拖动、版块选择与手机布局通过。
- 人工查看 12 张入场/高光/离场图、18 张边界图及全尺寸关键帧；修正了宋画过框前提前缩小、竖屏两侧骑手比例不同的问题。
- 三段 MP4 各 210 帧、7.000 秒；合辑 630 帧、21.000 秒；全部为 H.264、1920×1080、30 fps，无音轨。ffprobe 参数核对与 ffmpeg 完整解码检查通过。
- 三段 manifest 的源码指纹相同，且与当前源码、资源一致：`2d4657817214a40661b1f084b8aac1e563d639300d22469c834a3399c7335056`。

### 第二阶段交付

- `out/stage2/three-studies.mp4`：21 秒三幕合辑；每幕包含前后各半秒的相邻画框。
- `out/stage2/sahara.mp4`、`song.mp4`、`vertical.mp4`：独立片段。
- `out/stage2/contact-sheet.png`：12 张关键帧；`boundaries.png`：18 张过框边界。
- `out/stage2/sahara.png`、`song-wide.png`、`song-found.png`、`vertical.png`、`vertical-comments.png`：1080p 原尺寸图。
- `out/stage2/preview.png`：播放器截图；`verification.json`：图像哈希、黑边检查和绘制提交耗时。
- `out/verification/smoke.json`：完整播放器回归记录。

当前导出的恢复命令：`npm run demo:stage2 -- --tag stage2-final --resume --overwrite`。
第二阶段交付时，完整 137 秒浏览器预览保留其余 17 幕占位，无音乐；后续范围由用户单独授权。

## 阶段 3 · 批次 A

- 已先补齐其余 17 幕的独立美术简报，索引见 `briefs/README.md`，后续 B／C／D 批仍按计划等待验收。
- 子代理最多三名同时制作：埃及、汉拓片、唐白描并行；汉拓片完成后，同一子代理接续清明河市。
- 子代理只修改各自场景文件；主代理负责角色时间映射接口、字体预加载、预览状态、导出／检查入口、跨幕衔接及视觉验收。
- 批次验收入口为 `npm run review:stage3-a` 与 `npm run demo:stage3-a`，产物统一放在 `out/stage3-a/`。

### 四幕完成内容

- 埃及：灰泥颗粒、隐约红色方格、原创鸟形与几何装饰带、分层工坊人物及两位记录者；独立矿物色骑手在第二小节短暂停格，随后平滑追上共享踩踏相位。
- 汉拓片：黑墨、纸白刻线、凿痕与漏拓；自行车混入两组车马之间，执节人抬手、御者回头。整组车马随骑手同步前进，返修了马车／自行车轮相互穿透和执节人遮轮的问题。
- 唐白描：素绢留白、柳石芦苇、水鸟、细线长羽与三条飘带；第二小节风起，第三小节收束，飘带直接由请求时间重建。
- 清明：原创河市、木拱桥、屋舍、货船、茶棚与石径；路人按骑手位置先后回头，摊主停下倒茶。返修了桥端悬空，补成连接两岸的完整石砌桥台、近端踏步和远端短阶。
- 四幕分别缓存静态材料，使用独立骑手与中英年代题签；字体在 ready 前统一预加载。埃及定格只映射骨骼时间，世界位移与镜头保持连续。
- 未新增依赖或第三方素材，未使用外部图像、音频或参考仓库代码；`AGENTS.md` 未修改。

### 批次 A 验证

- `npm test`：7 项通过，新增埃及全身／轮相定格、时间连续且单调、进出画框回到共享相位的检查。
- `npm run check`：51 个 JavaScript 模块通过；`git diff --check` 通过，新增与修改文件为 UTF-8、LF、无 BOM。
- `npm run doctor`：Node v22.21.0、Chrome、ffmpeg、ffprobe 可用；`npm run build` 通过，保留既有 p5 主依赖体积提示。
- `npm run review:stage3-a`：七幕正式场景状态、四幕 12 张入场／高光／离场的乱序跳转逐像素一致性、6 个边界的 18 张前中后帧一致性通过；源码首尾指纹一致。
- 已查看上述接触表、24 张节拍事件表、1080p 高光图和播放器截图，并按图返修车队间距及桥台连接。
- `npm run smoke`：20 幕、1080p 非空输出、p5.brush、跳转与 Outro 确定性、播放／暂停、拖动、幕选择及手机布局全部通过。
- 本机四幕平均绘制提交耗时约 0.71、0.89、3.60、1.02 ms；只反映脚本提交绘制的成本，不是成片帧率保证。

- 四段 MP4 各 210 帧、7.000 秒，合辑 840 帧、28.000 秒；五个文件均为 H.264、1920×1080、30 fps、无音轨。ffprobe 参数核对与 ffmpeg 完整解码检查通过。
- 从实际导出帧生成接触表、高光总览及边界表，并复看最终高光与边界；导出的 12 张关键帧与视觉验收截图逐像素一致。
- 四段 manifest 均为 complete；图像验收、视频导出、实际帧比对及当前源码使用同一指纹：`666ba64305f2deb2448d335e74c3ddb53a35fd609b52b97e0637b5b7ede11127`。

### 批次 A 交付

- `out/stage3-a/batch-a.mp4`：28 秒四幕合辑，每幕包含前后各半秒的相邻画框。
- `out/stage3-a/egypt.mp4`、`han.mp4`、`tang.mp4`、`qingming.mp4`：四段独立短片。
- `out/stage3-a/highlights.png`：四幕高光；`contact-sheet.png`：12 张三态图；`boundaries.png`：18 张过框边界；`events.png`：24 张节拍事件图。
- `out/stage3-a/{egypt,han,tang,qingming}-{entry,highlight,exit}.png`：12 张 1080p 原尺寸图；`preview.png`：播放器截图。
- `out/stage3-a/verification.json`：图像哈希与绘制提交耗时；`export-verification.json`：五个视频的参数与解码结果；`frame-verification.json`：12 张实际导出帧的逐像素比对。
- `out/verification/smoke.json`：完整播放器回归记录；`frames/stage3-a-delivery-*-30/manifest.json`：本轮导出参数、源码指纹与完成状态。

恢复与重编码命令：`npm run demo:stage3-a -- --tag stage3-a-delivery --resume --overwrite`。
完整 137 秒预览现有七幕正式美术及 13 幕占位。批次 A 已完成并在此停止，后续批次与音乐按计划等待用户反馈。
