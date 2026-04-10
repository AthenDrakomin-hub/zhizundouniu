# NiuMa 核心商业机制引入 Spec

## Why
老板提到开源项目 NiuMa（包含 Unity、Cocos、C++、SpringBoot、Vue 的全家桶商业棋牌方案）。《至尊斗牛》目前的牌局逻辑和后台点杀风控已经非常完善，但距离大厂级（如 NiuMa）的生态还差几个提升用户黏性和安全性的“商业化标配”。引入这些功能，可以让咱们的网页端直接具备原生 App 棋牌的质感。

## What Changes
- **快捷语音与弹幕系统 (Voice/Quick Chat)**：新增大厂棋牌标配的快捷语功能（如“快点吧，我等的花儿都谢了”），玩家点击后在头像旁弹出气泡并广播给全房间。
- **旁观吃瓜模式 (Spectator Mode)**：目前房间满 6 人就直接拒绝加入，非常死板。将改为：满员后允许玩家以“旁观者”身份进入房间，只能看牌不能下注，增加房间人气。
- **同 IP 防作弊警报 (Anti-Cheat Alert)**：提取连接的真实 IP/指纹。如果同一个房间里有两个人使用相同的 IP（疑似开黑/双开通牌），在游戏桌面上方给出醒目的“防伙牌预警”横幅。

## Impact
- Affected specs: 房间加入逻辑扩充、游戏内实时通信扩充。
- Affected code:
  - `src/server/game.ts` (增加 `isSpectator` 身份、增加 `chatMessage` 事件、增加 IP 提取逻辑)
  - `src/App.tsx` (左下角聊天面板 UI、顶部防作弊警报条 UI、旁观群众头像列表 UI)

## ADDED Requirements
### Requirement: 旁观模式与聊天
系统 SHALL 允许超过最大人数限制的玩家作为旁观者加入，并提供全员广播的快捷语聊天机制。

#### Scenario: 房间满员加入
- **WHEN** 房间已有 6 名坐下打牌的玩家，第 7 名玩家尝试加入。
- **THEN** 该玩家成功进入房间，状态为 `isSpectator: true`，只能看到牌局进程，没有抢庄、下注等操作按钮。

### Requirement: 防伙牌预警
系统 SHALL 检测房间内玩家的网络指纹。

#### Scenario: 同网络双开
- **WHEN** 两个使用相同外网 IP 的玩家坐在同一张牌桌上。
- **THEN** 界面顶部弹出红色警告：“警告：房间内存在同IP玩家，请注意防范伙牌风险！”