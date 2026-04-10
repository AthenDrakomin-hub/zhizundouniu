# 修复后台管理系统“胜率调节”与“点杀改牌”功能失效问题 Spec

## Why
在早先重构管理后台为全屏宽屏 Dashboard 布局时，前端页面的渲染逻辑与后端的 Socket.io 房间划分机制发生了变动。导致目前在管理后台中：
1. 拖动玩家卡片上的“胜率滑块”（targetWinRate）没有反应（拖动后会弹回原位）。
2. 点击玩家的第 5 张底牌尝试弹出并使用“硬核点杀改牌面板”（adminSetFifthCard）时，操作后 UI 不会更新，发牌无效。
这两个核心风控功能的失效，直接导致后台管理系统失去了“上帝之手”的实质控制权，成了纯展示的摆设。

## What Changes
- **修复胜率调节机制**：更新服务端 `game.ts` 中 `adminSetWinRate` 事件的广播逻辑。当服务端接收到胜率修改请求并更新内存后，需通过新的 `broadcastRoomUpdate(roomId)` 向当前房间的管理员下发最新状态，确保前端滑块能够正确双向绑定并实时渲染。
- **修复点杀改牌功能**：更新服务端 `game.ts` 中 `adminSetFifthCard` 事件的广播逻辑，将其废弃的 `io.to('admin').emit('adminState')` 替换为 `broadcastRoomUpdate(roomId)`，确保管理员选定暗牌后，前端控制台能立即渲染出带有“预设”标签的红/黑花色底牌。
- **前端补充胜率滑块 UI**：在重构后的 `admin-client/src/App.tsx` 玩家卡片中，重新加入并美化已被遗漏的 `targetWinRate` 滑块组件（带有从红到绿/金的渐变轨道），确保管理员能直观地为每个玩家单独设置胜率。

## Impact
- Affected specs: 后台风控逻辑、Socket 通信机制。
- Affected code:
  - `src/server/game.ts` (修复 `adminSetWinRate` 和 `adminSetFifthCard` 的事件广播目标)
  - `admin-client/src/App.tsx` (在玩家卡片中重新实装胜率控制滑块 UI)

## ADDED Requirements
### Requirement: 胜率与发牌的双向绑定
系统 SHALL 保证管理后台的控制指令能够得到服务端的实时响应与状态回传。

#### Scenario: 修改胜率
- **WHEN** 管理员在控制台中拖动某位玩家的胜率滑块（如从 50% 拖至 10%）
- **THEN** 滑块停留在 10%，且服务端成功将该玩家的 `targetWinRate` 记录为 10，触发下一局的自动杀猪盘。

#### Scenario: 点杀预设牌
- **WHEN** 管理员在控制台中点击某位玩家的“点此发牌”，并在弹出的面板中选择“♠A”
- **THEN** 该玩家的第 5 张底牌槽位立即显示为“♠A”并带有“预设”标签，且服务端成功从牌库中移除该牌并绑定给玩家。