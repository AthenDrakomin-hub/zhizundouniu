# Tasks
- [x] Task 1: 剥离管理控制台相关状态与组件。在 `src/App.tsx` 中删除 `isHostMenuOpen`, `setIsHostMenuOpen` 及其弹窗（即带有“管理后台”、“踢出”等逻辑的 Modal）。
- [x] Task 2: 剥离房间设置功能。删除 `isSettingsOpen`, `setIsSettingsOpen`，以及底部的 `<RoomSettingsModal />` 组件，同时删除左上角的齿轮按钮。
- [x] Task 3: 删除“添加机器人”按钮。在 `App.tsx` 中的“等待开局”区域，删除 `addBot` 相关按钮及逻辑。
- [x] Task 4: 清理大面板 UI 控件。删除右下角的“查看本场设置”和“房卡状态”的大型卡片，改为右上角简单的 `Info` 小图标（点击只显示纯文本规则）或直接移除。
- [x] Task 5: 优化全局背景与沉浸感。检查并移除 `src/App.tsx` 的包裹容器中的硬编码背景色（如 `bg-[#1c1c1e]`、`bg-slate-900/80`），让全局 `index.css` 的“发财红”渐变可以真正成为游戏大厅底色。
- [x] Task 6: 优化左上角和顶部信息。精简“当前局数”、“我的积分”样式，让其成为游戏抬头信息（如半透明深色带黄字的药丸状标签），而不是大块的 Dashboard 卡片。

# Task Dependencies
- [Task 1], [Task 2], [Task 3], [Task 4] can be done in parallel (they are all removals).
- [Task 5], [Task 6] depends on [Task 1] (UI cleanup after functional stripping).