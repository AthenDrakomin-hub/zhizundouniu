# Tasks
- [x] Task 1: **引入全套音效管理器 (`AudioManager`)**：在 `src/App.tsx` 的发牌（`dealing_5`）、倒计时（`betting`）、揭晓（`playing`）及结算（`finished`）阶段，绑定对应的高潮音效接口（如心跳加速、发牌、硬币碰撞、牛牛通杀）。
- [x] Task 2: **重制搓牌与悬念感**：修改 `src/components/Card.tsx`。对于第五张底牌，不仅是点击即翻开，而是需要增加 `framer-motion` 的拖拽阻尼感（`drag` 属性）或逐渐清晰的 CSS `backdrop-filter: blur`，还原真实的赌场“慢慢看底牌”的心跳瞬间。
- [x] Task 3: **增加实体筹码飞行动效 (`ChipAnimation`)**：在 `App.tsx` 中编写一个在 `finished` 状态下触发的全局绝对定位动画。结算时，计算庄家与输家的相对屏幕坐标，用 `motion.div` 抛出多个金币节点并播放“哗啦”音效，实现商业棋牌最核心的“收钱/赔钱”爽感。
- [x] Task 4: **大牌震屏与爆分特写 (`BigWin`)**：在 `index.css` 中增加 `.animate-shake` 关键帧。在 `App.tsx` 中，若玩家（尤其是自己）结算牌型为牛牛（`bull >= 10`）或五小牛，则在 `canvas-confetti` 之余，使玩家对应的容器卡片触发震动并叠加 `#ffd700` 的内发光高亮（Mega Win）。
- [x] Task 5: **局内快捷互动与嘲讽 (Emotes System)**：在玩家头像处绑定 `onClick` 事件，弹出环状或并排的快捷表情菜单（🍺啤酒、💣炸弹、🌹玫瑰）。点击后，在房间内广播该表情动画（如炸弹飞到对方头像上爆炸），丰富社交变现闭环。

# Task Dependencies
- [Task 1] 是所有视听的基础，可以独立进行。
- [Task 2] (搓牌) 需配合 [Task 1] 的心跳音效。
- [Task 3] (筹码) 需配合 [Task 1] 的硬币音效。
- [Task 4] (大牌震屏) 可以在 [Task 3] 之后实现，作为终极高潮。
- [Task 5] (互动) 是独立的社交功能。