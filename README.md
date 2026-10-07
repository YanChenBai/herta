# 黑塔 Herta

用 NativeScript Vue 3 构建的 B站多直播间观看工具。使用 Vite+ 管理依赖、检查和测试，原生应用通过 `@nativescript/vite` 打包；样式使用 `@nativescript/tailwind` 和 Tailwind CSS v4。

主背景为纯黑，使用鸢尾紫、雾白和少量冷蓝作为点缀，边框使用低对比度中性灰。图标使用 Material Icons Rounded，字体及 Apache 2.0 许可保存在 `src/fonts`。顶部圆角图标来自 `App_Resources/Android/icon.png`，打包副本为 `src/assets/herta-icon.png`。

## 使用

```sh
vp install
vp run android
```

Android 需要 JDK、Android SDK，以及模拟器或连接的手机。运行 `vp run doctor:android` 检查环境。工具会读取已有 SDK 环境变量，也可识别 Windows 默认 SDK 目录与 PATH 中的 JDK，只对子进程配置环境。iOS 需要 macOS 和 Xcode，运行 `vp run ios`。

```sh
vp check
vp run typecheck
vp test
vp run bundle:android
vp run build:android
vp run test:android
```

`vp run ready` 顺序执行检查、Vue 类型检查、测试与 Android JS 打包。命令编排使用 `vite.config.ts` 中的 Vite+ tasks；原生 CLI 环境处理与平台参数适配使用 TypeScript，由 `@oxc-node/cli` 执行。

`bundle:android` 只生成原生 JavaScript 到 `.ns-vite-build`，不生成 APK，也不能代替设备测试。`build:android` 生成 APK。`vite.config.ts` 只配置 Vite+ 检查、测试和任务；`nativescript.vite.config.ts` 独立加载 NativeScript Vue 构建插件，由原生 CLI 与打包工具显式指定，避免影响 `vp` 的配置加载。NativeScript CLI 使用 pnpm，避免 npm 的 `EBADDEVENGINES`；原生 CLI 依赖的标准 Vite 入口通过 `nativescript` catalog 提供，检查、测试和任务仍由 Vite+ 管理。

`test:android` 依赖完整 Android 构建，需要已启动的模拟器或连接的测试设备。原生 instrumentation 测试生成本地音频，检查两路独立音量、分离 TextureView 后退到后台和关屏持续播放、统一暂停/恢复及单路释放。测试不需要 Cookie，也不请求 B站。

Android 打包图标使用 `App_Resources/Android/icon.png` 作为透明底图，资源已包含各分辨率的白底圆角图标和 Android 8+ 自适应图标。更换底图后，在 Windows PowerShell 运行 `./tools/generate-android-icons.ps1` 更新资源，再运行 `vp run build:android` 打包。

## 观看工作台

- 系统状态栏隐藏，画面允许延伸到挖孔与刘海区域，清除状态栏和 cutout 的额外页面边距，保留系统导航栏与键盘边距。窗口设置参考 [Android 显示挖孔](https://developer.android.com/develop/ui/views/layout/display-cutout) 和 [NativeScript 页面 insets](https://docs.nativescript.org/ui/page#androidoverflowedge)。应用控制栏显示时单独占用空间，避免遮挡播放区域。上下栏闲置 4.5 秒后带动画隐藏，点击画面切换显示，也可以使用顶部隐藏按钮。隐藏后画面使用释放的空间。
- 顶部最右侧提供添加房间，旁边提供旋转、全部刷新和隐藏控制栏，按钮统一为 32×32，Android 顶部图标使用居中的 20 DIP 原生矢量图形，统一线宽；底部提供房间、工作台、布局、混音台和 Cookie，工作台管理与画面布局为独立入口。
- 每套工作台独立保存房间列表、布局、播放区域、音量和弹幕开关，支持新建、重命名、删除、切换。切换释放旧工作台的播放资源，自动迁移旧版存档，至少保留一套。
- 添加支持长号、短号和 `live.bilibili.com` 链接。通过 `get_info` 获取真实房间号，再补充主播名称与头像；补充信息失败不阻止收藏房间。相同长号与短号不能重复收藏，同一房间不能同时放入多个区域。
- Android 系统分享面板支持选择「黑塔 Herta」，自动解析直播间链接并添加到当前工作台的「我的直播间」，打开房间抽屉，不自动播放。支持完整链接、移动端 `/h5/` 链接和 b23.tv 的 HTTP 跳转短链接，重复的长号与短号仅提示。普通视频分享不会添加；短链接解析失败时提示使用完整直播间链接。iOS 分享扩展尚未实现。
- 房间列表从右侧滑出，绿点表示直播中，灰点表示未开播。拖动左侧手柄到播放区域，松手后播放；取消手势不分配房间。列表其余部分可以滚动，也支持搜索、点选、移除与刷新。
- 提供二十四种布局，最多同时播放九个不同直播间：独享、自适应双窗、主次、四宫格、双窗主次、三联屏、一主三辅、固定左右双窗、固定上下双窗、反向双窗主次、反向主次、四联屏、反向一主三辅、一主四辅、六宫格、八宫格、九宫格、五窗拼图、七窗拼图、一主五辅、一主六辅、一主八辅、反向一主四辅与反向一主五辅。旧四槽位存档自动补全九个槽位，原有房间分配、音量与静音状态保留。自适应布局的预览和实际播放随横竖屏方向调整，固定双窗保持选定方向。缩小布局暂停隐藏区域，重新展开保留原分配。画面没有圆角、外边框和 padding，只有内部细分割线。
- 每个区域播放 AVC HLS，并提供文字弹幕悬浮层。选中区域的控制浮层为透明图标，包含静音、弹幕、关闭和独立刷新，不提供区域内音量滑杆。弹幕连接状态以顶部小圆点表示，点击可重试。
- 加载时显示原生旋转进度图标和连接／缓冲提示，取得播放地址后仍等待播放器真正就绪才隐藏。Android 播放中再次缓冲也会显示提示。连接失败、播放错误或连续缓冲超过 30 秒自动重试，单轮最多三次，等待 3、6、12 秒；稳定播放 30 秒后恢复重试额度。未开播不自动重试，手动刷新重置额度，切换房间、后台或卸载区域取消待执行的定时任务。全部刷新重新连接当前可见区域，保留房间、音量与开关。
- 混音台使用紧凑的头像、主播名、区域号、静音／独听图标与音量滑杆。列表固定高度，竖屏最高 300 DIP，横屏按屏幕高度缩小，超出独立滚动；全部静音和全部恢复固定在列表外。退到后台停止弹幕连接，回到前台重新连接，音频继续播放。
- 表单、工作台、布局与混音台使用内容自适应的居中弹层，长内容在屏幕可用高度内滚动，带淡入淡出和位移动画。背景为半透明黑色遮罩，不使用 blur。输入框字号统一为 14，减少内边距；未开播提示和重试图标在播放区域中居中排列。

## 后台播放

Android 使用原生 `PlaybackService` 持有各路 Media3 ExoPlayer，界面仅挂载 TextureView，并保持视频宽高比。Surface 消失时分离画面并保留音频，关闭区域、缩小布局或切换工作台时释放对应播放器。媒体前台服务提供常驻通知与统一播放、暂停、停止控制，复用应用图标作为通知大图与媒体封面，副标题显示“工作台名称 · N 个直播间”，切换／重命名工作台和增减播放通道时同步更新通知及媒体信息；统一处理音频焦点，并使用 Media3 网络唤醒模式维持播放所需的 CPU 和 Wi-Fi 锁。最后一路释放时停止服务。服务停止后界面可重新连接。

iOS 配置 `UIBackgroundModes: audio` 与播放音频会话，仍使用 AVPlayer 插件。iOS 构建和后台行为尚未在 macOS/设备验证。

后台播放遵循 [Android 媒体服务生命周期](https://developer.android.com/media/media3/session/background-playback)。系统强制停止应用、网络中断或设备厂商限制仍会中断播放，前台服务不能保证进程永远存活。

## Cookie 只获取

在 Cookie 面板填写 `https://名称:令牌@服务器` 和解密密码。只发起一次带 Bearer 认证的 GET 到 `api/:name`，兼容 `@viyuni/cookie-sync-client` 的服务器与 `v1` AES-256-GCM 格式。密码中的 URL 特殊字符需要百分号编码。

支持服务器返回加密字符串、JSON 字符串或 `{ "value": "加密内容" }`。客户端本地解密，得到的 Cookie 用于直播 API、播放器和弹幕认证。本次会话结束后需要重新获取。没有上传、写入服务端或自动轮询功能。

## 弹幕最小实现

直接连接 B站 WSS，包含 WBI 请求签名、认证、30 秒心跳、zlib 解包以及普通 `DANMU_MSG` 解析。解析字段参考 [bevent-relay 的 DANMU_MSG](https://github.com/viyuni/bevent-relay/blob/main/src/core/parsers/DANMU_MSG.ts)，兼容命令后缀。仅显示普通文字，最多保留 5 条，6.5 秒后消失；连接失败可以点状态重试。

不解析礼物、SC、表情图片，也不发送弹幕。协议协商使用 `protover: 2`，收到未协商的 Brotli 数据会提示解析失败。

## 验证边界

已验证代码检查、Vue 类型检查、32 个领域、播放器、手势和协议测试、Android 原生 JS 打包与完整 debug APK 构建。在 Pixel 3 API 30 模拟器中成功添加短号 `6`、播放真实 HLS 并连接弹幕，检查内容自适应的添加表单、空混音台与单路混音台，以及点击画面隐藏/显示和闲置隐藏。最新界面检查包含顶部按钮对齐、工作台与布局独立入口、右侧抽屉、短号 `3` 未开播时的居中刷新按钮、真实播放加载动画、混音台横屏固定列表滚动、独立音量和独听。模拟刘海屏复现了预留空间并验证窗口延伸到顶部和左侧，实际厂商设备仍需验证。原生 instrumentation 测试通过，覆盖两路本地音频、独立音量、后台关屏播放以及统一暂停/恢复。

分享解析测试覆盖完整链接、移动端链接、短链接跳转、循环与跳转次数限制，以及非直播间链接。已确认 APK 注册 Android `SEND text/plain` 分享入口；自动审批拦截 adb 模拟分享命令，冷启动与运行中分享需要从手机的系统分享面板进一步实测。b23.tv 真实分享短链接尚未在设备上验证。

真实直播验证只覆盖上述房间与当前网络环境，其他房间仍可能返回 `-352`，此时添加面板提供获取 Cookie 后重试的入口。厂商手机省电策略与 iOS 尚未验证，iOS 尚未构建。

多画面使用同一原生窗口中的 GridLayout。当前没有独立 OS 多窗口。平台参考 [NativeScript Vite](https://docs.nativescript.org/configuration/vite)、[Tailwind v4](https://docs.nativescript.org/plugins/tailwindcss)、[ListView](https://docs.nativescript.org/ui/list-view) 和 [多窗口文档](https://docs.nativescript.org/guide/multi-window)。
