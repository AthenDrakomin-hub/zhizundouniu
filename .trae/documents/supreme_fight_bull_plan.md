# 至尊斗牛 (Supreme Fight Bull) 完整实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 基于提供的产品设计方案，将现有单体《至尊斗牛》项目重构为“独立后台管理系统”+“高安全性游戏端”架构，实现0分起步、1%系统抽水、严格的第5张牌搓牌请求机制，以及带有智能提示的完整剩余牌库干预面板。

**Architecture:** 
- **游戏端 (Game Client)**: 移除现有的上帝视角UI。重构发牌流程，前置发放4张牌，第5张牌仅下发占位符，搓牌触发网络请求获取真实牌面，从根本上杜绝透视。
- **管理端 (Admin Client)**: 在根目录下新建一个完全独立的 Vite React 项目（如 `admin-client`），专门用于房主管理。包含常驻底部的52张牌池，支持点击玩家底牌后从牌池选牌，并带牌型智能预测高亮（如牛牛、炸弹）。
- **服务端 (Node.js)**: 剥离第5张牌的下发逻辑。增加管理员专属 Socket 命名空间或鉴权机制，提供剩余牌库同步、牌型预测计算及强制改牌接口。严格保证20局总结算积分+抽水=0。

**Tech Stack:** React, Tailwind CSS, Framer Motion, Socket.io, Node.js, Vite, TypeScript

---

### Task 1: 服务端发牌机制重构与安全升级

**Files:**
- Modify: `server.ts`
- Modify: `src/types.ts`
- Modify: `src/lib/gameLogic.ts`

- [ ] **Step 1: 修改房间状态和协议类型**
  在 `src/types.ts` 中，更新 `Room` 的 `status`，将原来直接发5张牌改为两阶段。增加 `remainingDeck` 字段以供管理端查询。
- [ ] **Step 2: 重构发牌流程 (发4张)**
  修改 `server.ts` 中的 `startPhase1`：仅从洗好的牌库中抽取4张牌发给玩家（`deck.splice(0, 4)`）。将剩余牌库保存在 `room.remainingDeck` 中。
- [ ] **Step 3: 实现搓牌请求接口**
  在 `server.ts` 中监听客户端的 `request_last_card` 事件。收到请求后，如果该玩家的第5张牌尚未确定，则从 `remainingDeck` 中随机抽取（或使用已被管理员改好的牌）并下发，记录到该玩家数据中。

### Task 2: 服务端管理端接口与智能辅助计算

**Files:**
- Modify: `server.ts`
- Modify: `src/lib/gameLogic.ts`

- [ ] **Step 1: 增加管理员身份认证**
  在 `server.ts` 中增加管理端专用事件（如 `adminLogin`），校验房卡钥匙。成功后标记该 socket 为管理员，并将房间的完整信息（含 `remainingDeck` 和各玩家隐藏的第5张牌预设）发送给管理员。
- [ ] **Step 2: 增加智能牌型预测辅助函数**
  在 `src/lib/gameLogic.ts` 增加 `getWinningCards(current4Cards, remainingDeck)` 函数，计算出剩余牌中能让该玩家凑出“牛牛”及以上牌型的卡牌列表，返回给管理端。
- [ ] **Step 3: 完善强制改牌逻辑**
  在 `server.ts` 中重构 `forceChangeCard`。接收管理员选定的 `newCard`，从 `remainingDeck` 中移除该牌，并放回原有的第5张牌（如果有预设的话）。将新的第5张牌暂存，当玩家搓牌时下发此牌。

### Task 3: 游戏端UI重构与搓牌联动

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/Card.tsx` (如果存在，否则在App中修改)

- [ ] **Step 1: 移除内置上帝视角**
  从 `src/App.tsx` 中彻底删除 `isGodModeOpen` 相关的抽屉UI代码及“管理后台”入口，确保客户端代码干净。
- [ ] **Step 2: 更新客户端发牌渲染**
  修改 `PlayerSeat` 的卡牌渲染逻辑：在发牌阶段只渲染4张明牌和1张背面占位符。
- [ ] **Step 3: 搓牌动作触发网络请求**
  修改搓牌交互（`onRub`）：当进度达到一定阈值（如0.5）且未请求过第5张牌时，向服务器 `socket.emit('request_last_card')`。接收到服务器返回后，再显示牌面。

### Task 4: 独立管理端项目初始化与基础布局

**Files:**
- Create: `admin-client/package.json`
- Create: `admin-client/vite.config.ts`
- Create: `admin-client/src/main.tsx`
- Create: `admin-client/src/App.tsx`
- Create: `admin-client/index.html`

- [ ] **Step 1: 初始化 admin-client 项目**
  在根目录创建 `admin-client` 文件夹，配置独立的 Vite React 项目。配置 `package.json` 包含 `socket.io-client`, `lucide-react`, `tailwindcss`。
- [ ] **Step 2: 连接服务端与身份验证**
  在 `admin-client/src/App.tsx` 中，实现输入房卡钥匙登录的界面，连接到主服务端的 socket。
- [ ] **Step 3: 构建基础上帝视角面板**
  实现上半部分：显示当前房间状态、总抽水积分、各个玩家（前4张明牌+第5张预设牌）以及积分变动。

### Task 5: 管理端剩余牌库与改牌交互

**Files:**
- Modify: `admin-client/src/App.tsx`

- [ ] **Step 1: 绘制底部52张常驻牌库**
  在界面底部实现4行13列的网格。根据服务端的 `remainingDeck` 状态，将已发出的牌设置为20%透明度且不可点击。
- [ ] **Step 2: 目标玩家选定交互**
  点击某位玩家的第5张底牌占位符时，该位置闪烁（进入改牌模式）。同时调用服务端的智能辅助数据，在底部牌库中高亮显示能凑成牛牛或炸弹的牌。
- [ ] **Step 3: 实时改牌提交**
  点击底部牌库中可选的牌，向服务端发送改牌指令。收到成功回调后，解除闪烁，界面提示“改牌成功”。

### Task 6: 财务结算与防伪战报完善

**Files:**
- Modify: `server.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: 严格零和博弈校验**
  检查 `server.ts` 中 `calculateScores` 逻辑，确保0分起步模式下，无论不够赔还是抽水，`Sum(玩家最终积分) + 系统总抽水 == 0`。不允许凭空产生或消失积分。
- [ ] **Step 2: 完善20局总结算防伪战报**
  在 `src/App.tsx` 的 `game_over` 状态中，确保荣誉排行（至尊之神、运气之王、慈善大使）逻辑正确。确保背景带有透明“至尊斗牛”Logo与时间戳的动态水印。
