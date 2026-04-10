# Tasks
- [ ] Task 1: **服务端 Socket 事件修复 (`src/server/game.ts`)** - 在 `adminSetWinRate` 和 `adminSetFifthCard` 两个监听事件中，将向客户端广播旧状态的 `io.to('admin').emit('adminState', ...)` 替换为最新的针对具体房间的 `broadcastRoomUpdate(roomId)`，解决前端拉取新状态后因“收不到事件”而导致 UI 锁死不更新的问题。
- [ ] Task 2: **客户端重新引入并美化胜率滑块 (`admin-client/src/App.tsx`)** - 在重构后的全屏 `Dashboard` 的每个玩家卡片内部（手牌区域下方或一侧），补充丢失的 `targetWinRate`（0-100%）胜率控制滑块 UI。滑块应符合暗黑/红金风格，低胜率偏红（杀猪），高胜率偏绿/金（放水）。
- [ ] Task 3: **确保“点杀”预设面板可交互 (`admin-client/src/App.tsx`)** - 测试并确认点击玩家的第 5 张暗牌槽位后，能够弹出（或已经在底部展示）花色/点数选择面板；点击其中一张牌后，该牌的图标和“预设”标签能立刻显示在卡片上，且通过 Task 1 的修复不会再失效弹回。

# Task Dependencies
- [Task 1] 是服务端的基础修复，必须首先执行，否则前端所有操作依然无效。
- [Task 2] 和 [Task 3] 是前端对新接口的回传响应及 UI 补充，在 Task 1 之后或并行于 [Task 1] 执行即可。