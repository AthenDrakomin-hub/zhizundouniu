# Tasks
- [ ] Task 1: **服务端扩展旁观者模式与防作弊 IP (`src/server/game.ts`)** - 在 `joinRoom` 逻辑中，当房间满员时，将新玩家以 `isSpectator: true` 身份推入 `room.spectators` 数组而不是拒绝加入；并记录 `socket.handshake.address` 作为 `player.ip`。
- [ ] Task 2: **服务端聊天广播与状态更新 (`src/server/game.ts`)** - 新增 `socket.on('chatMessage', (msg) => broadcast...)` 事件；并在 `roomUpdate` 中加入计算房间内同 IP 玩家的逻辑（如果在开发环境，可用 `user.id` 模拟同 IP），返回 `hasDuplicateIp: true` 标志。
- [ ] Task 3: **前端旁观者列表与警报 UI (`src/App.tsx`)** - 在游戏界面顶部增加醒目的“防伙牌预警”横幅（如果触发），并在界面边缘显示“旁观群众”的头像和人数。
- [ ] Task 4: **前端快捷语面板 (`src/App.tsx`)** - 在界面左下角或侧边栏新增一个半透明的聊天框组件，内置 4-5 条经典棋牌快捷语（如“快点吧”、“你的牌打得也太好了”），点击后在对应玩家的头像旁弹出气泡。

# Task Dependencies
- [Task 1] 与 [Task 2] 为服务端的底层改动，需要最先执行。
- [Task 3] 与 [Task 4] 是前端对新功能（旁观、聊天、同IP警告）的 UI 展示，在服务端改完后同时进行即可。