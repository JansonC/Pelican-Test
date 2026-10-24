# 程序合成音频

本目录实现阶段 4 原创配乐《一条路的二十种回声》：120 BPM、D 小调主题、137 秒。
全部音色、人声和音效由加法合成、FM、谐波鼓膜模型与固定种子噪声生成，没有外部采样或新增依赖。

## 乐谱与配器

`score.js` 的 `MOTIF` 是贯穿二十幕的三小节主题；逐幕改变音域、音色、伴奏与留白。
主题按 D、F、A、G、E、D / F、A、C、A、G / F、E、G、D 展开，常规和声为 Dm7、B♭maj7、Cmaj7。
`ARRANGEMENTS` 记录二十幕配器，`createScore()` 产生所有音符、打击乐、拟音、提示音与同步标记。
Intro 有两拍弱起，第 1、3 秒为完整小节；第 3 秒字幕重音之后，第 5 秒主题进入岩画。

`instruments.js` 以谐波比例和独立包络区分弦、管、金属与合成人声；拨弦包含短促噪声激励。
呐喊第二小节加入下滑与音准偏移；影子通电、错转旋钮、跳坑、金币、1UP、消息、代码展开、快门、链条和车铃均原创合成。
像素幕将旋律和提示音分配到同一组双方波、三角波、LFSR 噪声通道，单通道不重叠，不接混响。
Outro 主题齐奏后渐弱，133.5 秒音乐归零；空席位停顿后，在 136.5 秒只响车铃，尾音在 137 秒内收束。

## 蒸汽波

`src/beat/events.js` 与画面共享变速、位置积分和四次半拍跳针。
先以高四个半音、`120 / (2 ** (-4 / 12))` ≈ 151.1905 BPM 合成源带：
FM 电钢琴的 Dm9／B♭maj7／Cmaj9、带轻微滑音的 FM 无品贝斯、FM 萨克斯、门限混响军鼓。
源带经 4.2 秒混响，使用精确 `2 ** (-4 / 12)` 速度回到目标音高与 120 BPM。
0–2 秒减速、2–4 秒保持、4–6 秒恢复；109–110 秒把半拍（0.25 秒）片段重复四次。
重采样包含约 0.5 Hz 轻微摇晃、低底噪，最后经过 4 kHz 低通。音画都读取同一套参数。

## 实时与离线

`engine.js` 在 Web Audio 中按乐谱调度程序生成的音符缓冲；画面跟随音频输出时钟。
首次播放通过 `synth-worker.js` 在后台线程准备音符，避免齐奏或跳转时阻塞画面。
实时调度保留 350 ms 前瞻，播放、暂停和跳转会重新建立调度，静音保留时间轴。
蒸汽波源带在首次播放时离线准备，之后直接复用；不下载音频。
同一套音色、增益、声像、混响和事件调度供 `OfflineAudioContext` 使用。
离线分段会先重建五秒历史，再按采样位置裁剪，恢复持续音与混响。
`wav.js` 输出 48 kHz、16-bit PCM、立体声 WAV，遇到非有限值或削波会拒绝导出。

```powershell
npm run audio:samples
npm run audio:render
npm run review:audio
npm run demo:stage4
```

- `out/audio/theme.wav`：12 秒主旋律短样，钢琴与弦乐各一次。
- `out/audio/vaporwave.wav`：6 秒蒸汽波变速与跳针短样。
- `out/audio/mix.wav`：137 秒完整配乐及音效。
- `out/audio/score.json`、`cues.json`：原创事件谱与采样位置。
- `out/audio/render-verification.json`：峰值、RMS、各幕动态与源码指纹。
- `out/audio/verification.json`：离线分段重建、瞬态位置、尾部静音、四声道与实时控制检查。
- `out/stage4/pelican-with-music.mp4`：完整有声 demo；`export-verification.json` 包含 AAC 解码后的音轨对齐结果。

视频默认 1080p、30 fps，支持 `--fps 60`、`--tag`、`--resume`、`--overwrite`。
已有完整视频可通过 `npm run demo:stage4 -- --verify-only` 重新验证与生成同步接触表。
恢复渲染要求指纹一致；源文件变化时先重新生成音频并验证，再选择新 tag。
