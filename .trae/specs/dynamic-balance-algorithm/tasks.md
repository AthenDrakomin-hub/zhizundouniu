# Tasks
- [x] Task 1: 数据模型升级：在 `src/types.ts` 中为 `Player` 或 `Room` 内的玩家状态新增 `targetWinRate`（目标胜率，默认50）和 `totalScore`（累计盈亏分，默认0）。
- [x] Task 2: 后端胜率逻辑实现：在 `server.ts` 和 `src/lib/gameLogic.ts` 中实现 `pickGoodCard`（选好牌）和 `pickBadCard`（选坏牌）辅助函数，确保平滑控制。
- [x] Task 3: 改造发牌流程：在 `server.ts` 中改造第五张牌（或前四张牌后的补牌）的派发流程，使其优先检查手动点杀，如果无手动点杀，则根据 `targetWinRate` 掷骰子决定选好牌还是坏牌。
- [x] Task 4: 游戏结算更新：每局结算时，将单局的 `lastWin` 积分累加至玩家的 `totalScore` 字段中。
- [x] Task 5: 管理端 UI 升级：在 `admin-client/src/App.tsx` 中的玩家卡片区域添加一个滑动条组件 (0-100%)，显示为红（左，压制）至金（右，放水）。
- [x] Task 6: 管理端交互联动：滑动条变动时，向后端发送 Socket 事件以实时更新对应玩家的 `targetWinRate`。
- [x] Task 7: 盈亏展示：在 `admin-client/src/App.tsx` 中玩家卡片显眼位置实时展示其 `totalScore`。
- [x] Task 8: 修复 `admin-client` 能正确向后端发送并持久化 `targetWinRate` 的更改的问题（在 `server.ts` 的 `adminSetWinRate` 中补充 `saveRoomToDB` 调用）。

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 2]
- [Task 4] depends on [Task 1]
- [Task 5] depends on [Task 1]
- [Task 6] depends on [Task 5]
- [Task 7] depends on [Task 4]